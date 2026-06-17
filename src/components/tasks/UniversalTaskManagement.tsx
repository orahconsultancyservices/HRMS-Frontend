// src/components/tasks/UniversalTaskManagement.tsx
// ONE component for ALL roles: employer, manager, teamlead, employee
// Department/team visibility is enforced based on role + accessPermissions

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, CheckCircle, Clock,
  Plus, Eye, Trash2, Search, Users,
  RefreshCw, X, Loader2, AlertCircle, ChevronDown, ChevronUp,
  Award, Activity, Briefcase, DollarSign, Phone,
  LayoutDashboard, ListChecks,
  BadgeCheck, ClipboardList, ClipboardCheck,
  Layers, Send, Zap, CheckSquare,
  Users2, PieChart, Bell, Shield, Building
} from 'lucide-react';

import { useTasks, useCreateTask, useDeleteTask, useVerifySubmission, useDeleteSubmission, useSubmitTaskProgress } from '../../hooks/useTasks';
import { useEmployees } from '../../hooks/useEmployees';
import type { Task, TaskSubmission, CreateTaskData } from '../../services/taskApi';
import { getUserAccessibleDepartments, userCanAccessDepartment } from '../../hooks/useAuth';
import type { User, AccessPermission } from '../../hooks/useAuth';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface EmpShape {
  id: number;
  empId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

interface UniversalTaskManagementProps {
  currentUser: User & {
    status?: 'active';
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI TEMPLATES (shared, same as before)
// ─────────────────────────────────────────────────────────────────────────────

const DESIGNATION_KPI_TEMPLATES: Record<string, {
  label: string;
  department: string;
  color: string;
  icon: any;
  kpis: Array<{
    title: string;
    category: string;
    type: 'daily' | 'weekly' | 'monthly';
    target: number;
    unit: string;
    needsComment?: boolean;
  }>;
}> = {
  'application_recruiter': {
    label: 'Application Recruiter',
    department: 'Marketing',
    color: '#6366F1',
    icon: Briefcase,
    kpis: [
      { title: 'Applications Sourced', category: 'applications', type: 'daily', target: 120, unit: 'applications' },
      { title: 'Recruiters Contacted', category: 'calls', type: 'daily', target: 30, unit: 'contacts' },
      { title: 'Applications Sourced', category: 'applications', type: 'weekly', target: 600, unit: 'applications' },
      { title: 'Recruiter Outreach', category: 'calls', type: 'weekly', target: 150, unit: 'contacts' },
      { title: 'Applications Sourced', category: 'applications', type: 'monthly', target: 2500, unit: 'applications' },
      { title: 'Recruiter Reach Outs', category: 'calls', type: 'monthly', target: 650, unit: 'contacts' },
    ]
  },
  'recruiter': {
    label: 'Recruiter (Delivery)',
    department: 'Marketing',
    color: '#8B5CF6',
    icon: Users,
    kpis: [
      // Daily KPIs
      { title: 'Applications Reviewed',  category: 'applications', type: 'daily',   target: 120, unit: 'applications',  needsComment: true },
      { title: 'Interviews Scheduled',   category: 'interviews',   type: 'daily',   target: 1,   unit: 'interviews',    needsComment: true },
      { title: 'Screening Calls',        category: 'screenings',   type: 'daily',   target: 1,   unit: 'calls',         needsComment: true },
      { title: 'Client Submissions',     category: 'submissions',  type: 'daily',   target: 1,   unit: 'submissions',   needsComment: true },
      // Weekly KPIs
      { title: 'Interviews Conducted',   category: 'interviews',   type: 'weekly',  target: 5,   unit: 'interviews',    needsComment: true },
      { title: 'Client Submissions',     category: 'submissions',  type: 'weekly',  target: 5,   unit: 'submissions',   needsComment: true },
      { title: 'Screening Calls',        category: 'screenings',   type: 'weekly',  target: 5,   unit: 'calls',         needsComment: true },
      // Monthly KPIs (previously missing — now added per requirements)
      { title: 'Screening Calls',        category: 'screenings',   type: 'monthly', target: 20,  unit: 'calls',         needsComment: true },
      { title: 'Interviews Conducted',   category: 'interviews',   type: 'monthly', target: 20,  unit: 'interviews',    needsComment: true },
      { title: 'Client Submissions',     category: 'submissions',  type: 'monthly', target: 20,  unit: 'submissions',   needsComment: true },
      { title: 'Placements',             category: 'placements',   type: 'monthly', target: 1,   unit: 'placements',    needsComment: true },
    ]
  },
  'sales_executive': {
    label: 'Sales Executive',
    department: 'Sales',
    color: '#F59E0B',
    icon: DollarSign,
    kpis: [
      { title: 'Leads Generated', category: 'applications', type: 'daily', target: 12, unit: 'leads' },
      { title: 'Calls Made', category: 'calls', type: 'daily', target: 50, unit: 'calls' },
      { title: 'Qualified Leads', category: 'applications', type: 'weekly', target: 40, unit: 'leads' },
      { title: 'Demos / Meetings', category: 'meetings', type: 'weekly', target: 6, unit: 'meetings' },
      { title: 'Revenue Target', category: 'closures', type: 'monthly', target: 100000, unit: 'INR' },
      { title: 'Closures', category: 'closures', type: 'monthly', target: 5, unit: 'deals' },
    ]
  },
  'resume_specialist': {
    label: 'Resume Specialist',
    department: 'Resume',
    color: '#10B981',
    icon: ClipboardList,
    kpis: [
      { title: 'Resumes Reviewed', category: 'screenings', type: 'daily', target: 20, unit: 'resumes' },
      { title: 'Resumes Updated', category: 'submissions', type: 'daily', target: 10, unit: 'resumes' },
      { title: 'Client Feedback Processed', category: 'meetings', type: 'weekly', target: 15, unit: 'feedbacks' },
    ]
  },
  'technical_lead': {
    label: 'Technical Lead',
    department: 'Technical',
    color: '#3B82F6',
    icon: Activity,
    kpis: [
      { title: 'Code Reviews', category: 'assessments', type: 'daily', target: 5, unit: 'reviews' },
      { title: 'Tasks Completed', category: 'closures', type: 'weekly', target: 10, unit: 'tasks' },
      { title: 'Sprint Goals Met', category: 'closures', type: 'monthly', target: 4, unit: 'sprints' },
    ]
  }
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; gradient: string; bg: string }> = {
  applications:  { label: 'Applications', icon: Briefcase,     color: '#6366F1', gradient: 'from-indigo-500 to-indigo-600',   bg: 'bg-indigo-50' },
  interviews:    { label: 'Interviews',   icon: Users,         color: '#8B5CF6', gradient: 'from-violet-500 to-violet-600',   bg: 'bg-violet-50' },
  assessments:   { label: 'Assessments', icon: ClipboardList, color: '#F97316', gradient: 'from-orange-500 to-orange-600',   bg: 'bg-orange-50' },
  calls:         { label: 'Calls',        icon: Phone,         color: '#10B981', gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
  meetings:      { label: 'Meetings',     icon: Users,         color: '#14B8A6', gradient: 'from-teal-500 to-teal-600',       bg: 'bg-teal-50' },
  closures:      { label: 'Closures',     icon: DollarSign,   color: '#F59E0B', gradient: 'from-amber-500 to-amber-600',     bg: 'bg-amber-50' },
  screenings:    { label: 'Screenings',  icon: Activity,      color: '#EC4899', gradient: 'from-pink-500 to-pink-600',       bg: 'bg-pink-50' },
  submissions:   { label: 'Submissions', icon: Target,        color: '#6366F1', gradient: 'from-indigo-400 to-blue-500',     bg: 'bg-blue-50' },
  placements:    { label: 'Placements',  icon: Award,         color: '#D97706', gradient: 'from-amber-400 to-orange-500',    bg: 'bg-amber-50' },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getPriorityBadge(p: string) {
  return p === 'high' ? 'bg-red-100 text-red-700 border border-red-200'
    : p === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200'
    : 'bg-emerald-100 text-emerald-700 border border-emerald-200';
}
function getStatusBadge(s: string) {
  return s === 'completed' ? 'bg-emerald-100 text-emerald-700'
    : s === 'overdue' ? 'bg-red-100 text-red-700'
    : 'bg-blue-100 text-blue-700';
}
function getProgressPct(task: Task) {
  return task.target > 0 ? Math.min((task.achieved / task.target) * 100, 100) : 0;
}
function getDaysRemaining(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function normaliseEmployee(raw: any): EmpShape {
  return {
    id: raw?.id,
    empId: raw?.employeeId ?? raw?.empId ?? `EMP${raw?.id}`,
    name: raw?.name ?? (`${raw?.firstName || ''} ${raw?.lastName || ''}`.trim() || 'Unknown'),
    email: raw?.email ?? raw?.orgEmail ?? '',
    department: raw?.department ?? '',
    position: raw?.position ?? '',
    avatar: raw?.avatar,
    status: raw?.isActive === false ? 'inactive' : 'active'
  };
}
function resolveAssignee(task: Task, list: EmpShape[]): EmpShape | undefined {
  if (task.assignedTo) {
    return {
      id: task.assignedTo.id,
      empId: task.assignedTo.employeeId,
      name: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim(),
      email: task.assignedTo.email ?? '',
      department: task.assignedTo.department ?? '',
      position: task.assignedTo.position ?? '',
      avatar: task.assignedTo.avatar,
      status: 'active'
    };
  }
  return list.find(e => e.id === task.assignedToId);
}
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
const AVATAR_COLORS = [
  'from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600', 'from-fuchsia-500 to-purple-600',
];
function getAvatarGradient(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function emptyForm(): CreateTaskData {
  return {
    title: '', description: '', type: 'daily', category: 'applications',
    target: 0, unit: '', deadline: '', priority: 'medium',
    assignedToId: 0, assignedById: 'TL001', notes: '', recurring: false, recurrence: 'daily'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE BADGE
// ─────────────────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg = role === 'employer' ? { label: 'Admin', cls: 'bg-purple-100 text-purple-700 border-purple-200' }
    : role === 'manager' ? { label: 'Manager', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
    : role === 'teamlead' ? { label: 'Team Lead', cls: 'bg-red-100 text-red-700 border-red-200' }
    : { label: 'Employee', cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const UniversalTaskManagement = ({ currentUser }: UniversalTaskManagementProps) => {
  const { data: tasksRaw = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasks();
  const createTaskMutation    = useCreateTask();
  const deleteTaskMutation    = useDeleteTask();
  const verifyMutation        = useVerifySubmission();
  const deleteSubMutation     = useDeleteSubmission();
  const submitProgressMutation = useSubmitTaskProgress();
  const { data: rawEmployees = [], isLoading: employeesLoading } = useEmployees();

  const isAdmin    = currentUser.role === 'employer';
  const isManager  = currentUser.role === 'manager';
  const isTeamLead = currentUser.role === 'teamlead';
  const isEmployee = currentUser.role === 'employee';

  // All departments this user can see
  const allDepts = useMemo(() => {
    const depts = [...new Set((Array.isArray(rawEmployees) ? rawEmployees : []).map((e: any) => e.department).filter(Boolean))];
    return depts;
  }, [rawEmployees]);

  const accessibleDepts = useMemo(
    () => getUserAccessibleDepartments(currentUser, allDepts),
    [currentUser, allDepts]
  );

  const employees: EmpShape[] = useMemo(
    () => (Array.isArray(rawEmployees) ? rawEmployees : []).map(normaliseEmployee),
    [rawEmployees]
  );

  // Employees this user can assign tasks to
  const assignableEmployees: EmpShape[] = useMemo(() => {
    if (isAdmin) return employees.filter(e => e.status === 'active');
    if (isManager) {
      // Manager: all active employees in accessible departments
      return employees.filter(e =>
        e.status === 'active' &&
        e.id !== currentUser.id &&
        accessibleDepts.includes(e.department)
      );
    }
    if (isTeamLead) {
      // Team lead: only direct reports (reportTo === currentUser.id) OR same-dept non-lead employees
      // plus anyone in permitted departments/teams
      return employees.filter(e =>
        e.status === 'active' &&
        e.id !== currentUser.id &&
        (
          accessibleDepts.includes(e.department) &&
          !e.position?.toLowerCase().includes('manager') &&
          !e.position?.toLowerCase().includes('team lead')
        )
      );
    }
    return []; // employees can't assign
  }, [employees, currentUser, accessibleDepts, isAdmin, isManager, isTeamLead]);

  // Tasks this user can see
  const tasks: Task[] = useMemo(() => {
    const raw = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw as any)?.data || [];
    if (isAdmin) return raw;
    if (isEmployee) return raw.filter((t: Task) => t.assignedToId === currentUser.id);

    const assignableIds = new Set(assignableEmployees.map(e => e.id));
    // Include tasks:
    //  1. assigned TO one of this user's reportees
    //  2. assigned BY this user (self-created tasks for others)
    //  3. assigned TO this user directly (e.g. admin assigned a task to the team lead)
    return raw.filter((t: Task) =>
      assignableIds.has(t.assignedToId) ||
      t.assignedById === currentUser.id ||
      t.assignedToId === currentUser.id
    );
  }, [tasksRaw, assignableEmployees, currentUser, isAdmin, isEmployee]);

  // Tasks assigned directly TO this user (team lead's own work)
  const myTasks: Task[] = useMemo(
    () => tasks.filter(t => t.assignedToId === currentUser.id),
    [tasks, currentUser.id]
  );

  // ── UI State ─────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<'dashboard' | 'tasks' | 'team' | 'assign' | 'mytasks'>(
    isEmployee ? 'tasks' : 'dashboard'
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal]     = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask]       = useState<Task | null>(null);
  const [selectedTaskSubmissions, setSelectedTaskSubmissions] = useState<TaskSubmission[]>([]);
  const [filterType, setFilterType]           = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [filterStatus, setFilterStatus]       = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [filterEmployee, setFilterEmployee]   = useState<string>('all');
  const [filterDept, setFilterDept]           = useState<string>('all');
  const [searchTerm, setSearchTerm]           = useState('');
  const [isRefreshing, setIsRefreshing]       = useState(false);
  const [taskForm, setTaskForm]               = useState<CreateTaskData>(emptyForm());
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [bulkEmployeeId, setBulkEmployeeId]   = useState(0);
  const [selectedKPIs, setSelectedKPIs]       = useState<string[]>([]);
  const [bulkDeadline, setBulkDeadline]       = useState('');
  const [isBulkLoading, setIsBulkLoading]     = useState(false);
  const [expandedTaskId, setExpandedTaskId]   = useState<number | null>(null);
  // ── Submit-progress modal (team lead submitting their own tasks) ──────────
  const [showSubmitModal, setShowSubmitModal]   = useState(false);
  const [submitTask, setSubmitTask]             = useState<Task | null>(null);
  const [submitCount, setSubmitCount]           = useState('');
  const [submitNotes, setSubmitNotes]           = useState('');
  const [submitProfile, setSubmitProfile]       = useState('');
  const [submitError, setSubmitError]           = useState('');

  // ── Derived Stats ─────────────────────────────────────────────────────────
  const totalTasks     = tasks.length;
  const activeTasks    = tasks.filter(t => t.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks   = tasks.filter(t => t.status === 'overdue').length;
  const allSubmissions = tasks.flatMap(t => t.submissions || []);
  const pendingSubs    = allSubmissions.filter(s => !s.verified).length;

  // ── Employee Performance Map ──────────────────────────────────────────────
  const employeePerformance = useMemo(() => {
    const map: Record<number, { name: string; dept: string; total: number; completed: number; progress: number; overdue: number; active: number }> = {};
    tasks.forEach(t => {
      if (!map[t.assignedToId]) {
        const emp = resolveAssignee(t, employees);
        map[t.assignedToId] = { name: emp?.name || 'Unknown', dept: emp?.department || '', total: 0, completed: 0, progress: 0, overdue: 0, active: 0 };
      }
      const p = map[t.assignedToId];
      p.total++;
      if (t.status === 'completed') p.completed++;
      if (t.status === 'overdue')   p.overdue++;
      if (t.status === 'active')    p.active++;
      p.progress += getProgressPct(t);
    });
    Object.keys(map).forEach(id => {
      const n = parseInt(id);
      if (map[n].total > 0) map[n].progress = map[n].progress / map[n].total;
    });
    return map;
  }, [tasks, employees]);

  // ── Filtered Tasks ────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (filterType !== 'all' && task.type !== filterType) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterEmployee !== 'all' && task.assignedToId.toString() !== filterEmployee) return false;
    if (filterDept !== 'all') {
      const assignee = resolveAssignee(task, employees);
      if (assignee?.department !== filterDept) return false;
    }
    const q = searchTerm.toLowerCase();
    if (q && !task.title.toLowerCase().includes(q)) return false;
    return true;
  }), [tasks, filterType, filterStatus, filterEmployee, filterDept, searchTerm, employees]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.target || !taskForm.deadline || taskForm.assignedToId === 0) {
      alert('Please fill in all required fields.'); return;
    }
    if (!isAdmin) {
      const isAssignable = assignableEmployees.some(m => m.id === Number(taskForm.assignedToId));
      if (!isAssignable) { alert('You can only assign tasks to employees in your accessible departments.'); return; }
    }
    try {
      await createTaskMutation.mutateAsync({
        ...taskForm,
        target: Math.max(1, taskForm.target),
        deadline: new Date(taskForm.deadline + 'T00:00:00').toISOString(),
        assignedToId: Number(taskForm.assignedToId),
        assignedById: String(currentUser.id),
      });
      setShowCreateModal(false);
      setTaskForm(emptyForm());
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create task');
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkEmployeeId || !selectedDesignation || selectedKPIs.length === 0 || !bulkDeadline) {
      alert('Please fill all fields and select at least one KPI'); return;
    }
    if (!isAdmin) {
      const isAssignable = assignableEmployees.some(m => m.id === bulkEmployeeId);
      if (!isAssignable) { alert('You can only assign tasks to employees in your accessible departments.'); return; }
    }
    setIsBulkLoading(true);
    const template = DESIGNATION_KPI_TEMPLATES[selectedDesignation];
    const kpisToCreate = template.kpis.filter(k => selectedKPIs.includes(`${k.type}_${k.title}`));
    let created = 0, failed = 0;
    for (const kpi of kpisToCreate) {
      try {
        await createTaskMutation.mutateAsync({
          title: kpi.title,
          description: kpi.needsComment ? `[Profile comment required] ${kpi.title}` : kpi.title,
          type: kpi.type, category: kpi.category as any, target: kpi.target, unit: kpi.unit,
          deadline: new Date(bulkDeadline + 'T00:00:00').toISOString(),
          priority: 'medium',
          assignedToId: Number(bulkEmployeeId),
          assignedById: String(currentUser.id),
          notes: kpi.needsComment ? 'Please specify the profile/position in submission notes' : '',
          recurring: false,
        });
        created++;
      } catch { failed++; }
    }
    setIsBulkLoading(false);
    setShowBulkModal(false);
    setSelectedKPIs([]); setBulkEmployeeId(0); setBulkDeadline(''); setSelectedDesignation('');
    alert(`Done: ${created} KPIs assigned${failed ? `, ${failed} failed` : ''}`);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;
    try { await deleteTaskMutation.mutateAsync(taskId); }
    catch (err: any) { alert(err?.response?.data?.message || 'Failed to delete task'); }
  };

  const handleVerifySubmission = async (subId: number) => {
    try {
      await verifyMutation.mutateAsync({ submissionId: subId, verifiedBy: currentUser.id });
      setSelectedTaskSubmissions(prev => prev.map(s => s.id === subId ? { ...s, verified: true } : s));
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed to verify'); }
  };

  const handleDeleteSubmission = async (subId: number) => {
    if (!confirm('Delete this submission?')) return;
    try {
      await deleteSubMutation.mutateAsync(subId);
      setSelectedTaskSubmissions(prev => prev.filter(s => s.id !== subId));
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed to delete'); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await refetchTasks(); } finally { setIsRefreshing(false); }
  };

  const openSubmitModal = (task: Task) => {
    setSubmitTask(task);
    setSubmitCount('');
    setSubmitNotes('');
    setSubmitProfile('');
    setSubmitError('');
    setShowSubmitModal(true);
  };

  const handleSubmitProgress = async () => {
    if (!submitTask) return;
    const n = parseInt(submitCount);
    if (!n || n <= 0) { setSubmitError('Enter a valid count greater than 0'); return; }
    setSubmitError('');
    try {
      await submitProgressMutation.mutateAsync({
        taskId: submitTask.id,
        data: {
          employeeId: currentUser.id,
          count: n,
          notes: submitNotes.trim() || undefined,
          profileComment: submitProfile.trim() || undefined,
        }
      });
      setShowSubmitModal(false);
      setSubmitTask(null);
      setSubmitCount('');
      setSubmitNotes('');
      setSubmitProfile('');
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Failed to submit. Try again.');
    }
  };

  const openSubmissionsModal = (task: Task) => {
    setSelectedTask(task);
    setSelectedTaskSubmissions(task.submissions || []);
    setShowSubmissionsModal(true);
  };

  const isHR      = currentUser.role === 'hr';
  const canAssign = !isEmployee;
  const canVerify = !isEmployee;
  // Only admin and manager can delete — backend enforces same rule.
  // HR and team leads see no delete button.
  const canDelete = (isAdmin || isManager) && !isHR;

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.35 } } };

  if (tasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading tasks…</p>
      </div>
    );
  }

  // ── Available nav tabs based on role ──────────────────────────────────────
  const navTabs = [
    ...(isEmployee ? [] : [{ id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard }]),
    { id: 'tasks' as const, label: isEmployee ? 'My Tasks' : 'All Tasks', icon: ListChecks },
    // Team leads get a personal "My Tasks" tab to submit progress on tasks admin assigned to them
    ...(isTeamLead ? [{ id: 'mytasks' as const, label: `My Tasks${myTasks.length > 0 ? ` (${myTasks.length})` : ''}`, icon: ClipboardCheck }] : []),
    ...(!isEmployee ? [{ id: 'team' as const, label: isAdmin ? 'All Teams' : 'My Team', icon: Users2 }] : []),
    ...(!isEmployee ? [{ id: 'assign' as const, label: 'Assign', icon: Layers }] : []),
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6 pb-10">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">KPI Task Management</h2>
            <RoleBadge role={currentUser.role} />
          </div>
          <p className="text-gray-400 text-sm ml-10">
            {currentUser.department && `${currentUser.department} · `}
            {accessibleDepts.length > 1 && `+${accessibleDepts.length - 1} more dept${accessibleDepts.length > 2 ? 's' : ''} · `}
            {assignableEmployees.length} assignable employee{assignableEmployees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canAssign && (
            <>
              <button onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition cursor-pointer">
                <Layers className="w-4 h-4" /> Bulk Assign
              </button>
              <button onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl hover:shadow-lg transition cursor-pointer">
                <Plus className="w-4 h-4" /> Assign Task
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* ── ROLE NOTICE ───────────────────────────────────────────────────── */}
      {!isEmployee && (
        <motion.div variants={iv}
          className={`flex items-center gap-3 p-3 rounded-xl text-sm border ${
            isAdmin   ? 'bg-purple-50 border-purple-200 text-purple-800' :
            isManager ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-teal-50 border-teal-200 text-teal-800'
          }`}>
          <Shield className="w-4 h-4 shrink-0" />
          <p>
            {isAdmin && 'Admin view — you can see and manage all tasks across all departments.'}
            {isManager && `Manager view — you can see all tasks in: ${accessibleDepts.join(', ')}.`}
            {isTeamLead && `Team Lead view — you can assign & verify tasks for: ${accessibleDepts.join(', ')}.`}
          </p>
        </motion.div>
      )}

      {/* ── NAVIGATION TABS ───────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
        {navTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeView === tab.id ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ── STATS ROW ─────────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Tasks',    value: totalTasks,     color: 'blue',   icon: Target },
          { label: 'Active',         value: activeTasks,    color: 'blue',   icon: Clock },
          { label: 'Completed',      value: completedTasks, color: 'green',  icon: CheckCircle },
          { label: 'Overdue',        value: overdueTasks,   color: 'red',    icon: AlertCircle },
          { label: 'Pending Verify', value: pendingSubs,    color: 'amber',  icon: BadgeCheck },
          { label: 'Accessible Depts', value: accessibleDepts.length, color: 'purple', icon: Building },
        ].map((card, i) => (
          <motion.div key={i} whileHover={{ y: -2 }} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                card.color === 'blue' ? 'bg-blue-50' : card.color === 'green' ? 'bg-emerald-50' :
                card.color === 'red' ? 'bg-red-50' : card.color === 'amber' ? 'bg-amber-50' : 'bg-violet-50'}`}>
                <card.icon className={`w-4 h-4 ${
                  card.color === 'blue' ? 'text-blue-500' : card.color === 'green' ? 'text-emerald-500' :
                  card.color === 'red' ? 'text-red-500' : card.color === 'amber' ? 'text-amber-500' : 'text-violet-500'}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs font-medium text-gray-400 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ══ DASHBOARD VIEW ══════════════════════════════════════════════════ */}
      {activeView === 'dashboard' && (
        <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Team Performance by department */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-500" />
                <h3 className="font-bold text-gray-800">Team Performance</h3>
              </div>
              {isAdmin && (
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white cursor-pointer">
                  <option value="all">All Departments</option>
                  {accessibleDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
            <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
              {assignableEmployees.filter(e =>
                filterDept === 'all' || e.department === filterDept
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Users className="w-10 h-10 mb-2" />
                  <p className="text-sm">No team members</p>
                </div>
              ) : assignableEmployees
                .filter(e => filterDept === 'all' || e.department === filterDept)
                .map(emp => {
                  const perf = employeePerformance[emp.id];
                  const pct = perf ? Math.min(perf.progress, 100) : 0;
                  return (
                    <div key={emp.id} className="flex items-center gap-4">
                      <div className={`w-9 h-9 bg-gradient-to-br ${getAvatarGradient(emp.id)} rounded-xl flex items-center justify-center shrink-0`}>
                        <span className="text-white text-xs font-bold">{getInitials(emp.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <span className="text-sm font-semibold text-gray-800 block">{emp.name}</span>
                            <span className="text-xs text-gray-400">{emp.department} · {emp.position}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="text-xs text-gray-400">{perf?.completed ?? 0}/{perf?.total ?? 0}</span>
                            <span className={`text-sm font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                            className={`h-2 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {pendingSubs > 0 && canVerify && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-amber-800">Action Required</h3>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  <span className="font-bold text-amber-900 text-lg">{pendingSubs}</span> submissions await verification
                </p>
                <button onClick={() => setActiveView('tasks')}
                  className="w-full py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition cursor-pointer">
                  Review Now →
                </button>
              </div>
            )}

            {/* Accessible Departments */}
            {accessibleDepts.length > 1 && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-gray-800">Accessible Departments</h3>
                </div>
                <div className="space-y-2">
                  {accessibleDepts.map(dept => {
                    const isOwn = dept === currentUser.department;
                    const perm = (currentUser.accessPermissions || []).find(
                      p => p.targetType === 'department' && p.targetName === dept
                    );
                    return (
                      <div key={dept} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{dept}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isOwn ? 'bg-purple-100 text-purple-700' :
                          perm?.accessLevel === 'manage' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isOwn ? 'Own' : perm?.accessLevel === 'manage' ? 'Manage' : 'View'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category breakdown */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-teal-500" />
                <h3 className="font-bold text-gray-800">Category Breakdown</h3>
              </div>
              <div className="space-y-2.5">
                {Object.entries(
                  tasks.reduce((acc: Record<string, number>, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {})
                ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, count]) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  if (!cfg) return null;
                  const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className={`w-7 h-7 bg-gradient-to-br ${cfg.gradient} rounded-lg flex items-center justify-center shrink-0`}>
                        <cfg.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">{cfg.label}</span>
                          <span className="text-xs font-bold text-gray-700">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-1.5 rounded-full bg-gradient-to-r ${cfg.gradient}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {tasks.length === 0 && <p className="text-gray-300 text-sm text-center py-4">No tasks yet</p>}
              </div>
            </div>
          </div>

          {/* Recent tasks table */}
          <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-800">Recent Tasks</h3>
              </div>
              <button onClick={() => setActiveView('tasks')} className="text-xs text-teal-600 font-medium hover:underline cursor-pointer">View all →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    {['Task', 'Assignee', 'Dept', 'Type', 'Progress', 'Deadline', 'Status', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.slice(0, 6).map(task => {
                    const pct = getProgressPct(task);
                    const assignee = resolveAssignee(task, employees);
                    const catCfg = CATEGORY_CONFIG[task.category];
                    const daysLeft = getDaysRemaining(task.deadline);
                    return (
                      <tr key={task.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {catCfg && (
                              <div className={`w-8 h-8 bg-gradient-to-br ${catCfg.gradient} rounded-lg flex items-center justify-center shrink-0`}>
                                <catCfg.icon className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 bg-gradient-to-br ${getAvatarGradient(task.assignedToId)} rounded-full flex items-center justify-center`}>
                              <span className="text-white text-xs font-bold">{assignee?.name ? getInitials(assignee.name) : '?'}</span>
                            </div>
                            <span className="text-sm text-gray-700">{assignee?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{assignee?.department || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 capitalize">{task.type}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-medium ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(task.status)}`}>{task.status}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {canVerify && (
                            <button onClick={() => openSubmissionsModal(task)} className="p-1.5 hover:bg-teal-50 rounded-lg transition cursor-pointer">
                              <Eye className="w-4 h-4 text-teal-500" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {tasks.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-300 text-sm">No tasks yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══ TASKS VIEW ══════════════════════════════════════════════════════ */}
      {activeView === 'tasks' && (
        <motion.div key="tasks" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input type="text" placeholder="Search tasks…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition" />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer text-gray-600">
                {[['all','All Types'],['daily','Daily'],['weekly','Weekly'],['monthly','Monthly']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer text-gray-600">
                {[['all','All Status'],['active','Active'],['completed','Completed'],['overdue','Overdue']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {(isAdmin || isManager) && accessibleDepts.length > 1 && (
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer text-gray-600">
                  <option value="all">All Departments</option>
                  {accessibleDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
              {!isEmployee && (
                <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer text-gray-600">
                  <option value="all">All Members</option>
                  {assignableEmployees.map(e => (
                    <option key={e.id} value={e.id.toString()}>{e.name} ({e.department})</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">{filteredTasks.length} tasks</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            <AnimatePresence>
              {filteredTasks.map((task, index) => {
                const pct      = getProgressPct(task);
                const daysLeft = getDaysRemaining(task.deadline);
                const assignee = resolveAssignee(task, employees);
                const catCfg   = CATEGORY_CONFIG[task.category] || { label: task.category, gradient: 'from-gray-500 to-gray-600', icon: Target, color: '#6B7280', bg: 'bg-gray-50' };

                return (
                  <motion.div key={task.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className={`bg-gradient-to-r ${catCfg.gradient} p-3`}>
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                            <catCfg.icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-white/70 text-[10px] capitalize">{task.type}</span>
                              <span className="text-white/40 text-[10px]">·</span>
                              <span className="text-white/70 text-[10px]">{catCfg.label}</span>
                            </div>
                            <h3 className="text-white font-bold text-xs mt-0.5 leading-snug line-clamp-2">{task.title}</h3>
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className={`w-6 h-6 bg-gradient-to-br ${getAvatarGradient(task.assignedToId)} rounded-full flex items-center justify-center shrink-0`}>
                          <span className="text-white text-[10px] font-bold">{assignee?.name ? getInitials(assignee.name) : '?'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{assignee?.name ?? 'Unassigned'}</p>
                          <p className="text-[10px] text-gray-400 truncate">{assignee?.department}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-semibold capitalize shrink-0 ${getStatusBadge(task.status)}`}>{task.status}</span>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400 font-medium">Progress</span>
                          <span className="font-bold text-gray-700">{task.achieved}/{task.target} <span className="font-normal text-gray-400">{task.unit}</span></span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                            className={`h-1.5 rounded-full bg-gradient-to-r ${catCfg.gradient}`} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-400">{pct.toFixed(0)}%</span>
                          <span className={`text-[10px] font-semibold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1.5 mt-auto">
                        <button onClick={() => { setSelectedTask(task); setShowTaskDetails(true); }}
                          className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-semibold hover:bg-gray-200 transition cursor-pointer flex items-center justify-center gap-1">
                          <Eye className="w-3 h-3" /> Details
                        </button>
                        {canVerify && (
                          <button onClick={() => openSubmissionsModal(task)}
                            className="flex-1 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-[10px] font-semibold hover:bg-teal-100 transition cursor-pointer flex items-center justify-center gap-1">
                            <CheckSquare className="w-3 h-3" /> {isEmployee ? 'View' : 'Verify'}
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDeleteTask(task.id)} disabled={deleteTaskMutation.isPending}
                            className="py-1.5 px-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition cursor-pointer disabled:opacity-50">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredTasks.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <Target className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">No tasks match your filters</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ══ TEAM VIEW ═══════════════════════════════════════════════════════ */}
      {activeView === 'team' && (
        <motion.div key="team" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-4">
          {/* Department filter for admin/manager */}
          {(isAdmin || isManager) && accessibleDepts.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {['all', ...accessibleDepts].map(dept => (
                <button key={dept} onClick={() => setFilterDept(dept === 'all' ? 'all' : dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    (dept === 'all' && filterDept === 'all') || filterDept === dept
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}>
                  {dept === 'all' ? 'All Departments' : dept}
                </button>
              ))}
            </div>
          )}

          {assignableEmployees.filter(e => filterDept === 'all' || e.department === filterDept).length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">No team members</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {assignableEmployees
                .filter(e => filterDept === 'all' || e.department === filterDept)
                .map(emp => {
                  const perf = employeePerformance[emp.id];
                  const pct = perf ? Math.min(perf.progress, 100) : 0;
                  const grade = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
                  const gradeColor = pct >= 75 ? 'text-emerald-700 bg-emerald-50' : pct >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
                  return (
                    <motion.div key={emp.id} whileHover={{ y: -3 }} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-5 flex items-start gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${getAvatarGradient(emp.id)} rounded-2xl flex items-center justify-center shrink-0`}>
                          <span className="text-white text-lg font-bold">{getInitials(emp.name)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-gray-800">{emp.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{emp.empId} · {emp.position}</p>
                              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full mt-1 inline-block">{emp.department}</span>
                            </div>
                            <span className={`text-lg font-black px-3 py-1 rounded-xl ${gradeColor}`}>{grade}</span>
                          </div>
                          <div className="mt-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">Progress</span>
                              <span className="text-xs font-bold text-gray-700">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                className={`h-2.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
                        {[
                          { label: 'Total', value: perf?.total ?? 0, color: 'text-gray-800' },
                          { label: 'Done', value: perf?.completed ?? 0, color: 'text-emerald-600' },
                          { label: 'Active', value: perf?.active ?? 0, color: 'text-blue-600' },
                          { label: 'Overdue', value: perf?.overdue ?? 0, color: (perf?.overdue ?? 0) > 0 ? 'text-red-600' : 'text-gray-400' },
                        ].map(s => (
                          <div key={s.label} className="p-3 text-center">
                            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-gray-50 flex gap-2">
                        <button onClick={() => { setFilterEmployee(emp.id.toString()); setActiveView('tasks'); }}
                          className="flex-1 py-2 bg-teal-50 text-teal-700 rounded-xl text-xs font-semibold hover:bg-teal-100 transition cursor-pointer flex items-center justify-center gap-1">
                          <ListChecks className="w-3.5 h-3.5" /> View Tasks
                        </button>
                        {canAssign && (
                          <button onClick={() => { setBulkEmployeeId(emp.id); setActiveView('assign'); }}
                            className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer flex items-center justify-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Assign KPIs
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </motion.div>
      )}

      {/* ══ ASSIGN VIEW ═════════════════════════════════════════════════════ */}
      {activeView === 'assign' && (
        <motion.div key="assign" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(DESIGNATION_KPI_TEMPLATES)
              .filter(([, tmpl]) => isAdmin || accessibleDepts.includes(tmpl.department))
              .map(([key, tmpl]) => (
                <div key={key} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tmpl.color + '20' }}>
                      <tmpl.icon className="w-5 h-5" style={{ color: tmpl.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{tmpl.label}</h3>
                      <p className="text-xs text-gray-400">{tmpl.department} · {tmpl.kpis.length} KPIs</p>
                    </div>
                    <button onClick={() => { setSelectedDesignation(key); setShowBulkModal(true); }}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                      style={{ backgroundColor: tmpl.color }}>
                      <Plus className="w-3.5 h-3.5" /> Assign
                    </button>
                  </div>
                  <div className="p-4">
                    {(['daily', 'weekly', 'monthly'] as const).map(type => {
                      const kpisOfType = tmpl.kpis.filter(k => k.type === type);
                      if (kpisOfType.length === 0) return null;
                      return (
                        <div key={type} className="mb-3 last:mb-0">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{type}</p>
                          <div className="space-y-1.5">
                            {kpisOfType.map(kpi => (
                              <div key={kpi.title} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 bg-gradient-to-br ${CATEGORY_CONFIG[kpi.category]?.gradient || 'from-gray-400 to-gray-500'} rounded-lg flex items-center justify-center`}>
                                    {(() => { const Ic = CATEGORY_CONFIG[kpi.category]?.icon || Target; return <Ic className="w-3 h-3 text-white" />; })()}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">{kpi.title}</span>
                                  {kpi.needsComment && <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">note req.</span>}
                                </div>
                                <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                                  {kpi.target.toLocaleString()} {kpi.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* ══ MY TASKS VIEW (Team Lead submits their own assigned tasks) ═════ */}
      {activeView === 'mytasks' && (
        <motion.div key="mytasks" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">

          {/* Banner */}
          <div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
            <ClipboardCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-teal-800">Your Assigned Tasks</p>
              <p className="text-xs text-teal-700 mt-0.5">
                These tasks were assigned to you by an admin or manager. Log your progress using the Submit button on each card.
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total',     value: myTasks.length,                                        color: 'blue',  icon: Target },
              { label: 'Active',    value: myTasks.filter(t => t.status === 'active').length,     color: 'blue',  icon: Clock },
              { label: 'Completed', value: myTasks.filter(t => t.status === 'completed').length,  color: 'green', icon: CheckCircle },
              { label: 'Overdue',   value: myTasks.filter(t => t.status === 'overdue').length,    color: 'red',   icon: AlertCircle },
            ].map((card, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                  card.color === 'blue' ? 'bg-blue-50' : card.color === 'green' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <card.icon className={`w-4 h-4 ${
                    card.color === 'blue' ? 'text-blue-500' : card.color === 'green' ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs font-medium text-gray-400 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Task cards */}
          {myTasks.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center">
              <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-sm">No tasks assigned to you yet</p>
              <p className="text-gray-400 text-xs mt-1">When an admin assigns tasks directly to you, they'll appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <AnimatePresence>
                {myTasks.map((task, index) => {
                  const pct      = getProgressPct(task);
                  const daysLeft = getDaysRemaining(task.deadline);
                  const catCfg   = CATEGORY_CONFIG[task.category] || { label: task.category, gradient: 'from-gray-500 to-gray-600', icon: Target, color: '#6B7280', bg: 'bg-gray-50' };
                  const isLocked = task.isLocked;
                  const subCount = (task.submissions || []).length;

                  return (
                    <motion.div key={task.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.04 }}
                      whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

                      {/* Card header */}
                      <div className={`bg-gradient-to-r ${catCfg.gradient} p-3`}>
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                              <catCfg.icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-white/70 text-[10px] capitalize">{task.type}</span>
                                <span className="text-white/40 text-[10px]">·</span>
                                <span className="text-white/70 text-[10px]">{catCfg.label}</span>
                              </div>
                              <h3 className="text-white font-bold text-xs mt-0.5 leading-snug line-clamp-2">{task.title}</h3>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                            {isLocked && (
                              <span className="px-1.5 py-0.5 bg-white/20 text-white/80 rounded text-[10px] font-medium flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> Locked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-3 flex flex-col gap-2 flex-1">
                        {/* Assigned by */}
                        {task.assignedBy && (
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-gray-50 rounded-lg px-2 py-1.5">
                            <Shield className="w-3 h-3 shrink-0" />
                            <span className="truncate">By <span className="font-semibold text-gray-600">{task.assignedBy.firstName} {task.assignedBy.lastName}</span></span>
                          </div>
                        )}

                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-gray-400 font-medium">Progress</span>
                            <span className="font-bold text-gray-700">{task.achieved}/{task.target} <span className="font-normal text-gray-400">{task.unit}</span></span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                              className={`h-1.5 rounded-full bg-gradient-to-r ${catCfg.gradient}`} />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className={`text-[10px] font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct.toFixed(0)}%</span>
                            <span className={`text-[10px] font-semibold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                            </span>
                          </div>
                        </div>

                        {/* Submission count badge */}
                        {subCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-2 py-1">
                            <ClipboardCheck className="w-3 h-3" />
                            <span>{subCount} submission{subCount !== 1 ? 's' : ''}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-1.5 mt-auto">
                          <button
                            onClick={() => openSubmitModal(task)}
                            disabled={isLocked || task.status === 'completed'}
                            className="flex-1 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-lg text-[10px] font-semibold hover:shadow-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            {task.status === 'completed' ? 'Completed' : isLocked ? 'Locked' : 'Submit'}
                          </button>
                          <button
                            onClick={() => openSubmissionsModal(task)}
                            className="px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition cursor-pointer flex items-center justify-center"
                            title="View submissions"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* ════════════════ MODALS ════════════════════════════════════════════ */}

      {/* BULK ASSIGN MODAL */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Layers className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Bulk Assign KPIs</h3>
                    <p className="text-xs text-gray-400">Assign designation-based targets</p>
                  </div>
                </div>
                <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Employee */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Select Employee *</label>
                  <select value={bulkEmployeeId} onChange={e => setBulkEmployeeId(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white cursor-pointer">
                    <option value={0}>— Select employee —</option>
                    {assignableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.empId}) — {emp.department} · {emp.position}</option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Designation / Role *</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(DESIGNATION_KPI_TEMPLATES)
                      .filter(([, tmpl]) => isAdmin || accessibleDepts.includes(tmpl.department))
                      .map(([key, tmpl]) => (
                        <button key={key} onClick={() => { setSelectedDesignation(key); setSelectedKPIs([]); }}
                          className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
                            selectedDesignation === key ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}>
                          <div className="flex items-center gap-2.5 mb-1">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tmpl.color + '20' }}>
                              <tmpl.icon className="w-4 h-4" style={{ color: tmpl.color }} />
                            </div>
                            <p className="font-semibold text-sm text-gray-800">{tmpl.label}</p>
                          </div>
                          <p className="text-xs text-gray-400 ml-10">{tmpl.department} · {tmpl.kpis.length} KPIs</p>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Deadline *</label>
                  <input type="date" value={bulkDeadline} onChange={e => setBulkDeadline(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white" />
                </div>

                {/* KPI Selection */}
                {selectedDesignation && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Select KPIs *</label>
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => setSelectedKPIs(DESIGNATION_KPI_TEMPLATES[selectedDesignation].kpis.map(k => `${k.type}_${k.title}`))}
                          className="text-teal-600 hover:underline cursor-pointer font-medium">Select All</button>
                        <span className="text-gray-300">·</span>
                        <button onClick={() => setSelectedKPIs([])} className="text-gray-400 hover:underline cursor-pointer">Clear</button>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      {(['daily', 'weekly', 'monthly'] as const).map(type => {
                        const kpisOfType = DESIGNATION_KPI_TEMPLATES[selectedDesignation].kpis.filter(k => k.type === type);
                        if (!kpisOfType.length) return null;
                        return (
                          <div key={type}>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{type}</p>
                            </div>
                            {kpisOfType.map(kpi => {
                              const kpiKey = `${kpi.type}_${kpi.title}`;
                              const checked = selectedKPIs.includes(kpiKey);
                              return (
                                <label key={kpiKey} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${checked ? 'bg-teal-50/50' : ''}`}>
                                  <input type="checkbox" checked={checked}
                                    onChange={e => {
                                      if (e.target.checked) setSelectedKPIs(prev => [...prev, kpiKey]);
                                      else setSelectedKPIs(prev => prev.filter(k => k !== kpiKey));
                                    }} className="accent-teal-500 w-4 h-4" />
                                  <span className="text-sm font-medium text-gray-700">{kpi.title}</span>
                                  {kpi.needsComment && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-medium ml-1">note req.</span>}
                                  <span className="text-xs text-gray-400 font-medium ml-auto shrink-0">{kpi.target.toLocaleString()} {kpi.unit}</span>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{selectedKPIs.length} KPIs selected</p>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button onClick={handleBulkAssign}
                  disabled={isBulkLoading || selectedKPIs.length === 0 || !bulkEmployeeId || !bulkDeadline}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {isBulkLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</> : `Assign ${selectedKPIs.length} KPIs`}
                </button>
                <button onClick={() => setShowBulkModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE TASK MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-600" /> Assign Custom Task
                </h3>
                <button onClick={() => { setShowCreateModal(false); setTaskForm(emptyForm()); }} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Task Title *</label>
                  <input type="text" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Daily Applications Sourced"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Description</label>
                  <textarea rows={2} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Type *</label>
                    <select value={taskForm.type} onChange={e => setTaskForm(f => ({ ...f, type: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Category *</label>
                    <select value={taskForm.category} onChange={e => setTaskForm(f => ({ ...f, category: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer">
                      {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Target *</label>
                    <input type="number" min={1} value={taskForm.target || ''}
                      onChange={e => setTaskForm(f => ({ ...f, target: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Unit *</label>
                    <input type="text" value={taskForm.unit} onChange={e => setTaskForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder="e.g. applications, calls"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Deadline *</label>
                    <input type="date" value={taskForm.deadline} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Priority</label>
                    <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Assign To * {employeesLoading && <Loader2 className="inline w-3.5 h-3.5 animate-spin ml-1" />}
                  </label>
                  <select value={taskForm.assignedToId} onChange={e => setTaskForm(f => ({ ...f, assignedToId: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer">
                    <option value={0}>— Select employee —</option>
                    {assignableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.empId}) — {emp.department} · {emp.position}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Notes</label>
                  <textarea rows={2} value={taskForm.notes || ''} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition resize-none" />
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button onClick={handleCreateTask} disabled={createTaskMutation.isPending}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {createTaskMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Send className="w-4 h-4" /> Assign Task</>}
                </button>
                <button onClick={() => { setShowCreateModal(false); setTaskForm(emptyForm()); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMISSIONS MODAL */}
      <AnimatePresence>
        {showSubmissionsModal && selectedTask && (() => {
          const catCfg = CATEGORY_CONFIG[selectedTask.category] || { label: selectedTask.category, gradient: 'from-gray-500 to-gray-600', icon: Target, color: '#6B7280', bg: 'bg-gray-50' };
          const sortedSubs = [...selectedTaskSubmissions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          const pendingCount  = sortedSubs.filter(s => !s.verified).length;
          const verifiedCount = sortedSubs.filter(s =>  s.verified).length;
          const totalCount    = sortedSubs.reduce((sum, s) => sum + s.count, 0);

          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              >
                {/* ── Header ───────────────────────────────────────────────── */}
                <div className={`bg-gradient-to-r ${catCfg.gradient} px-5 pt-5 pb-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">
                        Task Submissions
                      </p>
                      <h3 className="text-white font-bold text-lg leading-tight truncate">
                        {selectedTask.title}
                      </h3>
                      <p className="text-white/70 text-xs mt-0.5">
                        {selectedTask.type} · {catCfg.label} · target {selectedTask.target} {selectedTask.unit}
                      </p>
                    </div>
                    <button onClick={() => setShowSubmissionsModal(false)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition cursor-pointer shrink-0">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Summary pills */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="px-3 py-1 bg-white/20 text-white rounded-xl text-xs font-semibold">
                      {sortedSubs.length} submission{sortedSubs.length !== 1 ? 's' : ''}
                    </span>
                    <span className="px-3 py-1 bg-white/20 text-white rounded-xl text-xs font-semibold">
                      {totalCount} {selectedTask.unit} total
                    </span>
                    {pendingCount > 0 && (
                      <span className="px-3 py-1 bg-amber-400/30 text-white rounded-xl text-xs font-semibold">
                        {pendingCount} pending
                      </span>
                    )}
                    {verifiedCount > 0 && (
                      <span className="px-3 py-1 bg-emerald-400/30 text-white rounded-xl text-xs font-semibold">
                        {verifiedCount} verified
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Body ─────────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sortedSubs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                      <ClipboardList className="w-12 h-12 mb-3" />
                      <p className="text-sm font-medium text-gray-400">No submissions yet</p>
                      <p className="text-xs text-gray-300 mt-1">Submissions will appear here once the assignee logs progress.</p>
                    </div>
                  ) : sortedSubs.map((sub, idx) => {
                    // Prefer the embedded employee object; fall back to the employees list
                    const empName = sub.employee
                      ? `${sub.employee.firstName} ${sub.employee.lastName}`
                      : (employees.find(e => e.id === sub.employeeId)?.name ?? 'Unknown');
                    const empCode = sub.employee?.employeeId
                      ?? employees.find(e => e.id === sub.employeeId)?.empId
                      ?? `#${sub.employeeId}`;
                    const empDept = employees.find(e => e.id === sub.employeeId)?.department ?? '';

                    return (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`rounded-2xl border p-4 transition ${
                          sub.verified
                            ? 'bg-emerald-50/60 border-emerald-100'
                            : 'bg-white border-gray-100 shadow-sm'
                        }`}
                      >
                        {/* Row 1: avatar + name + date + status badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient(sub.employeeId || 0)} rounded-xl flex items-center justify-center shrink-0`}>
                              <span className="text-white text-sm font-bold">
                                {getInitials(empName)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">{empName}</p>
                              <p className="text-xs text-gray-400">
                                {empCode}{empDept ? ` · ${empDept}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                              sub.verified
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {sub.verified
                                ? <><BadgeCheck className="w-3.5 h-3.5" /> Verified</>
                                : <><Clock className="w-3.5 h-3.5" /> Pending</>}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(sub.date)}</span>
                          </div>
                        </div>

                        {/* Row 2: count pill + notes + profileComment */}
                        <div className="mt-3 space-y-2">
                          {/* Count */}
                          <div className="flex items-center gap-2">
                            <span className={`bg-gradient-to-r ${catCfg.gradient} text-white text-sm font-black px-3 py-1 rounded-xl`}>
                              +{sub.count} {selectedTask.unit}
                            </span>
                          </div>

                          {/* Notes */}
                          {sub.notes && (
                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                              <p className="text-xs font-semibold text-gray-500 mb-0.5">Notes</p>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                {sub.notes}
                              </p>
                            </div>
                          )}

                          {/* Profile / Position detail (from TL submissions) */}
                          {sub.profileComment && (
                            <div className="bg-indigo-50 rounded-xl px-3 py-2 border border-indigo-100">
                              <p className="text-xs font-semibold text-indigo-500 mb-0.5">Profile / Position detail</p>
                              <p className="text-sm text-indigo-700 leading-relaxed whitespace-pre-wrap break-words">
                                {sub.profileComment}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Row 3: verification details + action buttons */}
                        {(sub.verified || canVerify) && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                            {sub.verified && sub.verifiedAt && (
                              <p className="text-xs text-gray-400">
                                Verified {formatDate(sub.verifiedAt)}
                              </p>
                            )}
                            {!sub.verified && <span />}

                            {canVerify && (
                              <div className="flex items-center gap-2">
                                {!sub.verified && (
                                  <button
                                    onClick={() => handleVerifySubmission(sub.id)}
                                    disabled={verifyMutation.isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition cursor-pointer text-xs font-semibold disabled:opacity-50"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Verify
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteSubmission(sub.id)}
                                    disabled={deleteSubMutation.isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition cursor-pointer text-xs font-semibold disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── Footer ───────────────────────────────────────────────── */}
                <div className="p-4 border-t border-gray-100 flex justify-end">
                  <button onClick={() => setShowSubmissionsModal(false)}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ══ TASK DETAILS MODAL ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showTaskDetails && selectedTask && (() => {
          const t = selectedTask;
          const catCfg = CATEGORY_CONFIG[t.category] || { label: t.category, gradient: 'from-gray-500 to-gray-600', icon: Target, color: '#6B7280', bg: 'bg-gray-50' };
          const CatIcon = catCfg.icon;
          const pct = t.target > 0 ? Math.min(Math.round((t.achieved / t.target) * 100), 100) : 0;
          const deadline = new Date(t.deadline);
          const now = new Date();
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
          const assignedTo = t.assignedTo
            ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
            : employees.find(e => e.id === t.assignedToId)?.name ?? 'Unknown';
          const assignedBy = t.assignedBy
            ? `${t.assignedBy.firstName} ${t.assignedBy.lastName}`
            : employees.find(e => e.id === t.assignedById)?.name ?? 'Unknown';
          const statusColors: Record<string, string> = {
            active:    'bg-blue-100 text-blue-700',
            completed: 'bg-emerald-100 text-emerald-700',
            overdue:   'bg-red-100 text-red-700',
          };
          const priorityColors: Record<string, string> = {
            high:   'bg-red-50 text-red-600 border-red-200',
            medium: 'bg-amber-50 text-amber-600 border-amber-200',
            low:    'bg-green-50 text-green-600 border-green-200',
          };
          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              >
                {/* Coloured header */}
                <div className={`bg-gradient-to-r ${catCfg.gradient} p-5`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <CatIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">{catCfg.label} · {t.type}</p>
                        <h3 className="text-white font-bold text-lg leading-tight">{t.title}</h3>
                        {t.description && <p className="text-white/80 text-sm mt-1 leading-snug">{t.description}</p>}
                      </div>
                    </div>
                    <button onClick={() => setShowTaskDetails(false)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition cursor-pointer shrink-0">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                  {/* Status + Priority row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${priorityColors[t.priority] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {t.priority} priority
                    </span>
                    {t.isLocked && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">🔒 Locked</span>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-700">Progress</span>
                      <span className="font-bold text-gray-900">{t.achieved} / {t.target} <span className="text-gray-400 font-normal">{t.unit}</span></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-3 rounded-full bg-gradient-to-r ${catCfg.gradient}`}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs text-gray-500">{pct}% complete</span>
                      <span className={`text-xs font-semibold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Deadline',    value: formatDate(t.deadline) },
                      { label: 'Type',        value: t.type.charAt(0).toUpperCase() + t.type.slice(1) },
                      { label: 'Assigned To', value: assignedTo },
                      { label: 'Assigned By', value: assignedBy },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {t.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
                      <p className="text-sm text-amber-800 leading-relaxed">{t.notes}</p>
                    </div>
                  )}

                  {/* Submission history */}
                  {(t.submissions?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-gray-400" />
                        Submission History <span className="text-gray-400 font-normal">({t.submissions!.length})</span>
                      </h4>
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {[...t.submissions!].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sub => (
                          <div key={sub.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(sub.employeeId ?? 0)} rounded-full flex items-center justify-center shrink-0`}>
                              <span className="text-white text-xs font-bold">
                                {employees.find(e => e.id === sub.employeeId)?.name?.split(' ').map((n: string) => n[0]).join('') ?? '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {employees.find(e => e.id === sub.employeeId)?.name ?? 'Unknown'}
                                </p>
                                <span className="text-xs text-gray-400 shrink-0">{formatDate(sub.date)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-gray-700">+{sub.count} {t.unit}</span>
                                {sub.notes && <span className="text-xs text-gray-400 truncate max-w-[180px]">· {sub.notes}</span>}
                                <span className={`ml-auto shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${sub.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {sub.verified ? '✓ Verified' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex gap-3">
                  {canVerify && (
                    <button
                      onClick={() => { setShowTaskDetails(false); openSubmissionsModal(t); }}
                      className="flex-1 py-2.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-sm font-semibold hover:bg-teal-100 transition cursor-pointer flex items-center justify-center gap-1.5">
                      <CheckSquare className="w-4 h-4" /> {isEmployee ? 'View Submissions' : 'Verify Submissions'}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => { setShowTaskDetails(false); handleDeleteTask(t.id); }}
                      className="py-2.5 px-4 bg-red-50 text-red-500 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition cursor-pointer flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                  <button onClick={() => setShowTaskDetails(false)}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* SUBMIT PROGRESS MODAL (Team Lead's own tasks) */}
      <AnimatePresence>
        {showSubmitModal && submitTask && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${CATEGORY_CONFIG[submitTask.category]?.gradient || 'from-teal-500 to-emerald-600'} p-5`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Log Progress</p>
                    <h3 className="text-white font-bold text-lg leading-tight">{submitTask.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full capitalize">{submitTask.type}</span>
                      <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full capitalize">{submitTask.category}</span>
                    </div>
                  </div>
                  <button onClick={() => setShowSubmitModal(false)} className="p-1.5 hover:bg-white/10 rounded-xl cursor-pointer">
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Current progress snapshot */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span className="font-semibold">Current Progress</span>
                    <span>{submitTask.achieved} / {submitTask.target} {submitTask.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${CATEGORY_CONFIG[submitTask.category]?.gradient || 'from-teal-500 to-emerald-600'}`}
                      style={{ width: `${Math.min(getProgressPct(submitTask), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-gray-400">{getProgressPct(submitTask).toFixed(0)}% complete</span>
                    <span className="text-xs text-gray-400">{Math.max(0, submitTask.target - submitTask.achieved)} remaining</span>
                  </div>
                </div>

                {/* Count */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Count to log <span className="text-gray-400 font-normal">({submitTask.unit})</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={submitCount}
                    onChange={e => { setSubmitCount(e.target.value); setSubmitError(''); }}
                    placeholder={`e.g. ${Math.max(1, Math.ceil(submitTask.target / 5))}`}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={submitNotes}
                    onChange={e => setSubmitNotes(e.target.value)}
                    placeholder="Any notes about this progress…"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition resize-none"
                  />
                </div>

                {/* Profile comment (recruitment context) */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Profile / Position detail <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={submitProfile}
                    onChange={e => setSubmitProfile(e.target.value)}
                    placeholder="e.g. Applied: Senior Dev @ ABC Corp – LinkedIn"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition"
                  />
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">{submitError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitProgress}
                    disabled={submitProgressMutation.isPending}
                    className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitProgressMutation.isPending
                      ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Submitting…</>
                      : <><Send className="w-4 h-4" /> Submit Progress</>}
                  </button>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default UniversalTaskManagement;