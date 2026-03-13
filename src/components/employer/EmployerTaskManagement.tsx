// src/components/employer/EmployerTaskManagement.tsx
// COMPLETE IMPLEMENTATION - Role-based KPI Task Management for Admin/Employer

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, CheckCircle, Clock, 
  Plus, Eye, Trash2, Search, Users as UsersIcon,
   RefreshCw, X, Loader2, Lock, AlertCircle, ChevronDown,
  ChevronUp, Award,
  Phone, DollarSign,  Activity, Shield,
  Bell, Zap,  Users2, Layers,
  LayoutDashboard, ListChecks, PieChart,
  CheckSquare, Info, MessageSquare,
  Send, History, BadgeCheck, ClipboardList,
  ClipboardCheck, BarChart2
} from 'lucide-react';
import { Briefcase as BriefcaseIcon, Users, FileText } from 'lucide-react';

// ─── hooks ──────────────────────────────────────────────────────────────────
import { useTasks, useCreateTask, useDeleteTask, useVerifySubmission, useDeleteSubmission } from '../../hooks/useTasks';
import { useEmployees } from '../../hooks/useEmployees';

// ─── types ──────────────────────────────────────────────────────────────────
import type { Task, TaskSubmission, CreateTaskData } from '../../services/taskApi';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Employee {
  id: number;
  empId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

interface TaskManagementProps {
  employees?: Employee[];
  currentUser: Employee;
}

// Monthly performance record (immutable after close)
interface MonthlyRecord {
  employeeId: number;
  year: number;
  month: number; // 1-12
  records: {
    taskId: number;
    title: string;
    category: string;
    type: string;
    target: number;
    achieved: number;
    pct: number;
    unit: string;
  }[];
  remarks: string;
  locked: boolean;
  lockedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGNATION-BASED KPI TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const DESIGNATION_KPI_TEMPLATES: Record<string, {
  label: string;
  department: string;
  color: string;
  icon: any;
  kpis: Array<{
    title: string;
    category: 'applications' | 'interviews' | 'assessments' | 'calls' | 'meetings' | 'closures' | 'screenings' | 'submissions' | 'placements';
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
    icon: BriefcaseIcon,
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
      { title: 'Applications Reviewed', category: 'applications', type: 'daily', target: 120, unit: 'applications', needsComment: true },
      { title: 'Interviews Scheduled', category: 'interviews', type: 'daily', target: 1, unit: 'interviews', needsComment: true },
      { title: 'Screening Calls', category: 'screenings', type: 'daily', target: 1, unit: 'calls', needsComment: true },
      { title: 'Client Submissions', category: 'submissions', type: 'daily', target: 1, unit: 'submissions', needsComment: true },
      { title: 'Interviews Conducted', category: 'interviews', type: 'weekly', target: 5, unit: 'interviews', needsComment: true },
      { title: 'Client Submissions', category: 'submissions', type: 'weekly', target: 5, unit: 'submissions', needsComment: true },
      { title: 'Screening Calls', category: 'screenings', type: 'weekly', target: 5, unit: 'calls', needsComment: true },
      { title: 'Placements', category: 'placements', type: 'monthly', target: 1, unit: 'placements', needsComment: true },
      { title: 'Screening Calls', category: 'screenings', type: 'monthly', target: 20, unit: 'calls', needsComment: true },
      { title: 'Interviews', category: 'interviews', type: 'monthly', target: 20, unit: 'interviews', needsComment: true },
      { title: 'Submissions', category: 'submissions', type: 'monthly', target: 20, unit: 'submissions', needsComment: true },
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
  'team_lead': {
    label: 'Team Lead',
    department: 'Management',
    color: '#10B981',
    icon: Shield,
    kpis: [
      { title: 'Team Reviews', category: 'assessments', type: 'weekly', target: 5, unit: 'reviews' },
      { title: 'One-on-Ones', category: 'meetings', type: 'weekly', target: 3, unit: 'meetings' },
      { title: 'Performance Reports', category: 'assessments', type: 'monthly', target: 1, unit: 'report' },
      { title: 'Recruitment Targets Achieved', category: 'placements', type: 'monthly', target: 5, unit: 'placements' },
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; gradient: string; bg: string }> = {
  applications:  { label: 'Applications',  icon: BriefcaseIcon, color: '#6366F1', gradient: 'from-indigo-500 to-indigo-600',   bg: 'bg-indigo-50' },
  interviews:    { label: 'Interviews',    icon: Users,          color: '#8B5CF6', gradient: 'from-violet-500 to-violet-600',   bg: 'bg-violet-50' },
  assessments:   { label: 'Assessments',  icon: FileText,       color: '#F97316', gradient: 'from-orange-500 to-orange-600',   bg: 'bg-orange-50' },
  calls:         { label: 'Calls',        icon: Phone,          color: '#10B981', gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
  meetings:      { label: 'Meetings',     icon: Users,          color: '#14B8A6', gradient: 'from-teal-500 to-teal-600',       bg: 'bg-teal-50' },
  closures:      { label: 'Closures',     icon: DollarSign,     color: '#F59E0B', gradient: 'from-amber-500 to-amber-600',     bg: 'bg-amber-50' },
  screenings:    { label: 'Screenings',   icon: Activity,       color: '#EC4899', gradient: 'from-pink-500 to-pink-600',       bg: 'bg-pink-50' },
  submissions:   { label: 'Submissions',  icon: Target,         color: '#6366F1', gradient: 'from-indigo-400 to-blue-500',     bg: 'bg-blue-50' },
  placements:    { label: 'Placements',   icon: Award,          color: '#D97706', gradient: 'from-amber-400 to-orange-500',    bg: 'bg-amber-50' },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'high':   return 'bg-red-100 text-red-700 border border-red-200';
    case 'medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'low':    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    default:       return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed': return 'bg-emerald-100 text-emerald-700';
    case 'overdue':   return 'bg-red-100 text-red-700';
    case 'active':    return 'bg-blue-100 text-blue-700';
    default:          return 'bg-gray-100 text-gray-600';
  }
}

function getProgressColor(pct: number) {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 70) return 'bg-blue-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

// function getProgressGradient(pct: number) {
//   if (pct >= 90) return 'from-emerald-400 to-emerald-600';
//   if (pct >= 70) return 'from-blue-400 to-blue-600';
//   if (pct >= 40) return 'from-amber-400 to-amber-600';
//   return 'from-red-400 to-red-600';
// }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysRemaining(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getProgressPct(task: Task) {
  return task.target > 0 ? Math.min((task.achieved / task.target) * 100, 100) : 0;
}

function getMonthName(month: number) {
  return new Date(2024, month - 1, 1).toLocaleString('default', { month: 'long' });
}

function normaliseEmployee(raw: any): Employee {
  return {
    id:         raw?.id,
    empId:      raw?.employeeId ?? raw?.empId ?? `EMP${raw?.id}`,
    name:       raw?.name ?? (`${raw?.firstName || ''} ${raw?.lastName || ''}`.trim() || 'Unknown'),
    email:      raw?.email ?? raw?.orgEmail ?? '',
    department: raw?.department ?? '',
    position:   raw?.position ?? '',
    avatar:     raw?.avatar,
    status:     raw?.isActive === false ? 'inactive' : 'active'
  };
}

function resolveAssignee(task: Task, fallbackList: Employee[]): Employee | undefined {
  if (task.assignedTo) {
    return {
      id:         task.assignedTo.id,
      empId:      task.assignedTo.employeeId,
      name:       `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim(),
      email:      task.assignedTo.email ?? '',
      department: task.assignedTo.department ?? '',
      position:   task.assignedTo.position ?? '',
      avatar:     task.assignedTo.avatar,
      status:     'active'
    };
  }
  return fallbackList.find(e => e.id === task.assignedToId);
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
];

function getAvatarGradient(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY FORM
// ─────────────────────────────────────────────────────────────────────────────

const emptyForm = (): CreateTaskData => ({
  title: '', description: '', type: 'daily', category: 'applications',
  target: 0, unit: '', deadline: '', priority: 'medium',
  assignedToId: 0, assignedById: 'ADMIN001', notes: '', recurring: false, recurrence: 'daily'
});

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// const StatCard = ({ label, value, icon: Icon, color, trend, sub }: {
//   label: string; value: number | string; icon: any; color: string; trend?: number; sub?: string;
// }) => {
//   const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
//     blue:   { bg: 'bg-white',  text: 'text-blue-600',    iconBg: 'bg-blue-50' },
//     green:  { bg: 'bg-white',  text: 'text-emerald-600', iconBg: 'bg-emerald-50' },
//     purple: { bg: 'bg-white',  text: 'text-violet-600',  iconBg: 'bg-violet-50' },
//     red:    { bg: 'bg-white',  text: 'text-red-600',     iconBg: 'bg-red-50' },
//     amber:  { bg: 'bg-white',  text: 'text-amber-600',   iconBg: 'bg-amber-50' },
//   };
//   const c = colors[color] || colors.blue;
//   return (
//     <motion.div whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
//       className={`${c.bg} border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm`}>
//       <div className={`${c.iconBg} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
//         <Icon className={`w-5 h-5 ${c.text}`} />
//       </div>
//       <div className="min-w-0 flex-1">
//         <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
//         <p className="text-2xl font-bold text-gray-800 mt-0.5 leading-none">{value}</p>
//         {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
//       </div>
//       {trend !== undefined && (
//         <div className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
//           {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
//           {Math.abs(trend)}%
//         </div>
//       )}
//     </motion.div>
//   );
// };

// const ProgressRing = ({ pct, size = 56 }: { pct: number; size?: number }) => {
//   const r = (size - 8) / 2;
//   const c = 2 * Math.PI * r;
//   const stroke = c - (pct / 100) * c;
//   const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
//   return (
//     <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
//       <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
//       <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
//         strokeDasharray={c} strokeDashoffset={stroke} strokeLinecap="round"
//         style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
//     </svg>
//   );
// };

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const EmployerTaskManagement = ({ currentUser }: TaskManagementProps) => {
  const { data: tasksRaw = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasks();
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();
  const verifyMutation     = useVerifySubmission();
  const deleteSubMutation  = useDeleteSubmission();
  const { data: rawEmployees = [], isLoading: employeesLoading } = useEmployees();

  const employees: Employee[] = useMemo(
    () => (Array.isArray(rawEmployees) ? rawEmployees : []).map(normaliseEmployee),
    [rawEmployees]
  );

  const tasks: Task[] = useMemo(() => {
    if (Array.isArray(tasksRaw)) return tasksRaw;
    if (tasksRaw && Array.isArray((tasksRaw as any).data)) return (tasksRaw as any).data;
    return [];
  }, [tasksRaw]);

  // ── UI State ─────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<'dashboard' | 'tasks' | 'employees' | 'designations' | 'history'>('dashboard');
  const [showCreateModal, setShowCreateModal]           = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal]   = useState(false);
  const [showTaskDetails, setShowTaskDetails]           = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showMonthlyLockModal, setShowMonthlyLockModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal]         = useState(false);
  const [selectedTask, setSelectedTask]                 = useState<Task | null>(null);
  const [selectedTaskSubmissions, setSelectedTaskSubmissions] = useState<TaskSubmission[]>([]);
  const [filterType, setFilterType]                     = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [filterStatus, setFilterStatus]                 = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [filterCategory, setFilterCategory]             = useState<string>('all');
  const [filterEmployee, setFilterEmployee]             = useState<string>('all');
  const [filterDept, setFilterDept]                     = useState<string>('all');
  const [searchTerm, setSearchTerm]                     = useState('');
  const [isRefreshing, setIsRefreshing]                 = useState(false);
  const [taskForm, setTaskForm]                         = useState<CreateTaskData>(emptyForm());
  const [selectedDesignation, setSelectedDesignation]   = useState<string>('');
  const [bulkAssignEmployeeId, setBulkAssignEmployeeId] = useState<number>(0);
  const [selectedKPIs, setSelectedKPIs]                 = useState<string[]>([]);
  const [bulkDeadline, setBulkDeadline]                 = useState('');
  const [isBulkLoading, setIsBulkLoading]               = useState(false);
  const [monthlyRecords, setMonthlyRecords]             = useState<MonthlyRecord[]>([]);
  const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState<number | null>(null);
  const [historyMonth, setHistoryMonth]                 = useState<number>(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear]                   = useState<number>(new Date().getFullYear());
  const [lockTarget, setLockTarget]                     = useState<{ empId: number; month: number; year: number } | null>(null);
  const [remarksTarget, setRemarksTarget]               = useState<{ empId: number; month: number; year: number; current: string } | null>(null);
  const [remarksText, setRemarksText]                   = useState('');
  const [expandedTaskId, setExpandedTaskId]             = useState<number | null>(null);
  const [taskView, setTaskView]                         = useState<'grid' | 'table'>('grid');

  // ── Derived Stats ─────────────────────────────────────────────────────────
  const totalTasks     = tasks.length;
  const activeTasks    = tasks.filter(t => t.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks   = tasks.filter(t => t.status === 'overdue').length;
  const allSubmissions = tasks.flatMap(t => t.submissions || []);
  const pendingSubs    = allSubmissions.filter(s => !s.verified).length;

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(depts);
  }, [employees]);

  // ── Employee Performance Map ──────────────────────────────────────────────
  const employeePerformance = useMemo(() => {
    const map: Record<number, {
      name: string; total: number; completed: number;
      progress: number; overdue: number; active: number;
      byCategory: Record<string, number>;
      byType: Record<string, { target: number; achieved: number }>;
    }> = {};
    tasks.forEach(t => {
      if (!map[t.assignedToId]) {
        const emp = resolveAssignee(t, employees);
        map[t.assignedToId] = {
          name: emp?.name || 'Unknown', total: 0, completed: 0,
          progress: 0, overdue: 0, active: 0, byCategory: {}, byType: {}
        };
      }
      const p = map[t.assignedToId];
      p.total++;
      if (t.status === 'completed') p.completed++;
      if (t.status === 'overdue')   p.overdue++;
      if (t.status === 'active')    p.active++;
      p.progress += getProgressPct(t);
      p.byCategory[t.category] = (p.byCategory[t.category] || 0) + 1;
      if (!p.byType[t.type]) p.byType[t.type] = { target: 0, achieved: 0 };
      p.byType[t.type].target   += t.target;
      p.byType[t.type].achieved += t.achieved;
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
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    if (filterEmployee !== 'all' && task.assignedToId.toString() !== filterEmployee) return false;
    if (filterDept !== 'all') {
      const emp = resolveAssignee(task, employees);
      if (emp?.department !== filterDept) return false;
    }
    const q = searchTerm.toLowerCase();
    if (q && !task.title.toLowerCase().includes(q) && !(task.description || '').toLowerCase().includes(q)) return false;
    return true;
  }), [tasks, filterType, filterStatus, filterCategory, filterEmployee, filterDept, searchTerm, employees]);

  // ── Top performers ────────────────────────────────────────────────────────
  // const topPerformers = useMemo(() =>
  //   Object.entries(employeePerformance)
  //     .sort((a, b) => b[1].progress - a[1].progress)
  //     .slice(0, 5),
  //   [employeePerformance]
  // );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.target || !taskForm.deadline || taskForm.assignedToId === 0) {
      alert('Please fill in all required fields.');
      return;
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
    if (!bulkAssignEmployeeId || !selectedDesignation || selectedKPIs.length === 0 || !bulkDeadline) {
      alert('Please fill all fields and select at least one KPI');
      return;
    }
    setIsBulkLoading(true);
    const template = DESIGNATION_KPI_TEMPLATES[selectedDesignation];
    const kpisToCreate = template.kpis.filter(k => selectedKPIs.includes(`${k.type}_${k.title}`));
    let created = 0, failed = 0;
    for (const kpi of kpisToCreate) {
      try {
        await createTaskMutation.mutateAsync({
          title: kpi.title,
          description: kpi.needsComment
            ? `[Profile comment required] ${kpi.title}`
            : `${kpi.title} for ${template.label}`,
          type: kpi.type, category: kpi.category, target: kpi.target, unit: kpi.unit,
          deadline: new Date(bulkDeadline + 'T00:00:00').toISOString(),
          priority: 'medium',
          assignedToId: Number(bulkAssignEmployeeId),
          assignedById: String(currentUser.id),
          notes: kpi.needsComment ? 'Please specify the profile/position in submission notes' : '',
          recurring: false,
        });
        created++;
      } catch { failed++; }
    }
    setIsBulkLoading(false);
    setShowBulkAssignModal(false);
    setSelectedKPIs([]);
    setBulkAssignEmployeeId(0);
    setBulkDeadline('');
    setSelectedDesignation('');
    alert(`Bulk assign complete: ${created} created${failed ? `, ${failed} failed` : ''}`);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleVerifySubmission = async (subId: number) => {
    try {
      await verifyMutation.mutateAsync({ submissionId: subId, verifiedBy: currentUser.id });
      setSelectedTaskSubmissions(prev =>
        prev.map(s => s.id === subId ? { ...s, verified: true } : s)
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to verify');
    }
  };

  const handleDeleteSubmission = async (subId: number) => {
    if (!confirm('Delete this submission?')) return;
    try {
      await deleteSubMutation.mutateAsync(subId);
      setSelectedTaskSubmissions(prev => prev.filter(s => s.id !== subId));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await refetchTasks(); } finally { setIsRefreshing(false); }
  };

  const handleLockMonth = (empId: number, month: number, year: number) => {
    setMonthlyRecords(prev => {
      const idx = prev.findIndex(r => r.employeeId === empId && r.month === month && r.year === year);
      if (idx === -1) {
        const empTasks = tasks.filter(t => t.assignedToId === empId);
        return [...prev, {
          employeeId: empId, year, month,
          records: empTasks.map(t => ({
            taskId: t.id, title: t.title, category: t.category,
            type: t.type, target: t.target, achieved: t.achieved,
            pct: getProgressPct(t), unit: t.unit
          })),
          remarks: '',
          locked: true,
          lockedAt: new Date().toISOString()
        }];
      }
      const updated = [...prev];
      updated[idx] = { ...updated[idx], locked: true, lockedAt: new Date().toISOString() };
      return updated;
    });
    setShowMonthlyLockModal(false);
    setLockTarget(null);
  };

  const handleSaveRemarks = () => {
    if (!remarksTarget) return;
    setMonthlyRecords(prev => {
      const idx = prev.findIndex(r =>
        r.employeeId === remarksTarget.empId &&
        r.month === remarksTarget.month &&
        r.year === remarksTarget.year
      );
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], remarks: remarksText };
      return updated;
    });
    setShowRemarksModal(false);
    setRemarksTarget(null);
  };

  const openSubmissionsModal = (task: Task) => {
    setSelectedTask(task);
    setSelectedTaskSubmissions(task.submissions || []);
    setShowSubmissionsModal(true);
  };

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.35 } } };

  if (tasksLoading && employeesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading task data…</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6 pb-10">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <motion.div variants={iv} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">KPI Task Management</h2>
          </div>
          <p className="text-gray-400 text-sm ml-10">Designation-based targets · Immutable history · Team performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => setShowBulkAssignModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition cursor-pointer">
            <Layers className="w-4 h-4" /> Bulk Assign KPIs
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition cursor-pointer">
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </motion.div>

      {/* ══ NAVIGATION TABS ═════════════════════════════════════════════════ */}
      <motion.div variants={iv} className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-fit backdrop-blur-sm">
        {([
          { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
          { id: 'tasks',        label: 'All Tasks',     icon: ListChecks },
          { id: 'employees',    label: 'Team',          icon: UsersIcon },
          { id: 'designations', label: 'Designations',  icon: Layers },
          { id: 'history',      label: 'History',       icon: History },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeView === tab.id
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ══ STATS ROW ═══════════════════════════════════════════════════════ */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Tasks',   value: totalTasks,     color: 'blue',   icon: Target,     sub: 'all time' },
          { label: 'Active',        value: activeTasks,    color: 'blue',   icon: Clock,      sub: 'in progress' },
          { label: 'Completed',     value: completedTasks, color: 'green',  icon: CheckCircle,sub: 'finished' },
          { label: 'Overdue',       value: overdueTasks,   color: 'red',    icon: AlertCircle,sub: 'needs attention' },
          { label: 'Pending Verify',value: pendingSubs,    color: 'amber',  icon: BadgeCheck, sub: 'submissions' },
          { label: 'Active Employees', value: employees.filter(e=>e.status==='active').length, color: 'purple', icon: Users2, sub: 'team members' },
        ].map((card, i) => (
          <motion.div key={i} whileHover={{ y: -2 }}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                card.color==='blue'   ? 'bg-blue-50' :
                card.color==='green'  ? 'bg-emerald-50' :
                card.color==='red'    ? 'bg-red-50' :
                card.color==='amber'  ? 'bg-amber-50' : 'bg-violet-50'}`}>
                <card.icon className={`w-4 h-4 ${
                  card.color==='blue'   ? 'text-blue-500' :
                  card.color==='green'  ? 'text-emerald-500' :
                  card.color==='red'    ? 'text-red-500' :
                  card.color==='amber'  ? 'text-amber-500' : 'text-violet-500'}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs font-medium text-gray-400 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
           DASHBOARD VIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'dashboard' && (
     <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">

          {/* Left: Team Progress */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-gray-800">Team Performance Overview</h3>
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                {Object.keys(employeePerformance).length} members
              </span>
            </div>
            <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(employeePerformance).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <UsersIcon className="w-10 h-10 mb-2" />
                  <p className="text-sm">No task data yet</p>
                </div>
              ) : Object.entries(employeePerformance)
                  .sort((a, b) => b[1].progress - a[1].progress)
                  .map(([empId, perf]) => {
                    const emp = employees.find(e => e.id === parseInt(empId));
                    const pct = Math.min(perf.progress, 100);
                    return (
                      <div key={empId} className="flex items-center gap-4">
                        <div className={`w-9 h-9 bg-gradient-to-br ${getAvatarGradient(parseInt(empId))} rounded-xl flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">{getInitials(perf.name)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-gray-800 truncate block">{perf.name}</span>
                              <span className="text-xs text-gray-400">{emp?.position || emp?.department || ''}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              <span className="text-xs text-gray-400">{perf.completed}/{perf.total} done</span>
                              <span className={`text-sm font-bold ${pct>=80?'text-emerald-600':pct>=50?'text-amber-600':'text-red-500'}`}>
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.1 }}
                              className={`h-2 rounded-full ${getProgressColor(pct)}`}
                            />
                          </div>
                        </div>
                        {perf.overdue > 0 && (
                          <div className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg shrink-0">
                            <AlertCircle className="w-3 h-3" /> {perf.overdue}
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Category Breakdown */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-gray-800">Category Breakdown</h3>
              </div>
              <div className="space-y-2.5">
                {Object.entries(
                  tasks.reduce((acc: Record<string, number>, t) => {
                    acc[t.category] = (acc[t.category] || 0) + 1;
                    return acc;
                  }, {})
                ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, count]) => {
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
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6 }}
                            className={`h-1.5 rounded-full bg-gradient-to-r ${cfg.gradient}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {tasks.length === 0 && <p className="text-gray-300 text-sm text-center py-6">No tasks yet</p>}
              </div>
            </div>

            {/* Pending Verifications */}
            {pendingSubs > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-amber-800">Action Required</h3>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  <span className="font-bold text-amber-900 text-lg">{pendingSubs}</span> submissions awaiting verification
                </p>
                <button onClick={() => setActiveView('tasks')}
                  className="w-full py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition cursor-pointer">
                  Review Submissions →
                </button>
              </div>
            )}
          </div>

          {/* Recent Tasks Quick View */}
          <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-800">Recent Tasks</h3>
              </div>
              <button onClick={() => setActiveView('tasks')}
                className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer">
                View all →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    {['Task', 'Assignee', 'Type', 'Progress', 'Deadline', 'Status', ''].map(h => (
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
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                              <p className="text-xs text-gray-400">{catCfg?.label}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 bg-gradient-to-br ${getAvatarGradient(task.assignedToId)} rounded-full flex items-center justify-center`}>
                              <span className="text-white text-xs font-bold">{assignee?.name ? getInitials(assignee.name) : '?'}</span>
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{assignee?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 capitalize">{task.type}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
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
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => openSubmissionsModal(task)}
                            className="p-1.5 hover:bg-indigo-50 rounded-lg transition cursor-pointer">
                            <Eye className="w-4 h-4 text-indigo-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {tasks.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-300 text-sm">No tasks found. Create your first task!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TASKS VIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'tasks' && (
        <motion.div key="tasks" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input type="text" placeholder="Search tasks…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition" />
              </div>
              {[
                { label: 'Type', value: filterType, setter: setFilterType as any, options: [['all','All Types'],['daily','Daily'],['weekly','Weekly'],['monthly','Monthly']] },
                { label: 'Status', value: filterStatus, setter: setFilterStatus as any, options: [['all','All Status'],['active','Active'],['completed','Completed'],['overdue','Overdue']] },
                { label: 'Category', value: filterCategory, setter: setFilterCategory, options: [['all','All Categories'], ...Object.entries(CATEGORY_CONFIG).map(([k,v]) => [k, v.label])] },
                { label: 'Employee', value: filterEmployee, setter: setFilterEmployee, options: [['all','All Employees'], ...employees.filter(e=>e.status==='active').map(e=>[e.id.toString(), e.name])] },
                { label: 'Department', value: filterDept, setter: setFilterDept, options: [['all','All Depts'], ...departments.map(d=>[d,d])] },
              ].map(f => (
                <select key={f.label} value={f.value} onChange={e => f.setter(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white cursor-pointer text-gray-600">
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 ml-auto">
                <button onClick={() => setTaskView('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${taskView==='grid'?'bg-white shadow-sm text-indigo-600':'text-gray-400'}`}>
                  <Layers className="w-4 h-4" />
                </button>
                <button onClick={() => setTaskView('table')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${taskView==='table'?'bg-white shadow-sm text-indigo-600':'text-gray-400'}`}>
                  <BarChart2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">{filteredTasks.length} tasks</span>
              {(filterType!=='all'||filterStatus!=='all'||filterCategory!=='all'||filterEmployee!=='all'||filterDept!=='all'||searchTerm) && (
                <button onClick={() => { setFilterType('all'); setFilterStatus('all'); setFilterCategory('all'); setFilterEmployee('all'); setFilterDept('all'); setSearchTerm(''); }}
                  className="text-xs text-indigo-500 hover:underline cursor-pointer">Clear filters</button>
              )}
            </div>
          </div>

          {/* Grid View */}
          {taskView === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredTasks.map((task, index) => {
                  const pct      = getProgressPct(task);
                  const daysLeft = getDaysRemaining(task.deadline);
                  const assignee = resolveAssignee(task, employees);
                  const catCfg   = CATEGORY_CONFIG[task.category] || { label: task.category, gradient: 'from-gray-500 to-gray-600', icon: Target, color: '#6B7280', bg: 'bg-gray-50' };
                  const isExpanded = expandedTaskId === task.id;

                  return (
                    <motion.div key={task.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.03 }}
                      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

                      {/* Top color strip + header */}
                      <div className={`bg-gradient-to-r ${catCfg.gradient} p-4 relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white rounded-full" />
                          <div className="absolute -right-2 -bottom-4 w-12 h-12 bg-white rounded-full" />
                        </div>
                        <div className="relative flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                              <catCfg.icon className="w-4.5 h-4.5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-white/70 text-xs capitalize">{task.type}</span>
                                <span className="text-white/40 text-xs">·</span>
                                <span className="text-white/70 text-xs">{catCfg.label}</span>
                              </div>
                              <h3 className="text-white font-bold text-sm mt-0.5 leading-snug">{task.title}</h3>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border shrink-0 ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col gap-3 flex-1">
                        {/* Assignee */}
                        <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                          <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(task.assignedToId)} rounded-full flex items-center justify-center shrink-0`}>
                            <span className="text-white text-xs font-bold">{assignee?.name ? getInitials(assignee.name) : '?'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{assignee?.name ?? 'Unassigned'}</p>
                            <p className="text-xs text-gray-400 truncate">{assignee?.position || assignee?.department || 'N/A'}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-semibold capitalize shrink-0 ${getStatusBadge(task.status)}`}>
                            {task.status}
                          </span>
                        </div>

                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-400 font-medium">Progress</span>
                            <span className="font-bold text-gray-700">{task.achieved}/{task.target} <span className="font-normal text-gray-400">{task.unit}</span></span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8 }}
                              className={`h-2 rounded-full bg-gradient-to-r ${catCfg.gradient}`}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-400">{pct.toFixed(0)}% complete</span>
                            <span className={`text-xs font-semibold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                            </span>
                          </div>
                        </div>

                        {/* Expanded notes */}
                        <AnimatePresence>
                          {isExpanded && task.description && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="bg-gray-50 rounded-xl p-3 overflow-hidden">
                              <p className="text-xs text-gray-500">{task.description}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex gap-2 mt-auto">
                          <button onClick={() => { setSelectedTask(task); setShowTaskDetails(true); }}
                            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition cursor-pointer flex items-center justify-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                          <button onClick={() => openSubmissionsModal(task)}
                            className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer flex items-center justify-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5" /> Verify
                          </button>
                          <button onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                            className="py-2 px-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition cursor-pointer">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleDeleteTask(task.id)} disabled={deleteTaskMutation.isPending}
                            className="py-2 px-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition cursor-pointer disabled:opacity-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Table View */}
          {taskView === 'table' && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Task', 'Assignee', 'Type / Category', 'Progress', 'Target', 'Deadline', 'Priority', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTasks.map(task => {
                      const pct = getProgressPct(task);
                      const assignee = resolveAssignee(task, employees);
                      const catCfg = CATEGORY_CONFIG[task.category] || { label: task.category, gradient: 'from-gray-400 to-gray-500', icon: Target };
                      const daysLeft = getDaysRemaining(task.deadline);
                      return (
                        <tr key={task.id} className="hover:bg-gray-50/60 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 bg-gradient-to-br ${catCfg.gradient} rounded-lg flex items-center justify-center shrink-0`}>
                                <catCfg.icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <p className="text-sm font-semibold text-gray-800 max-w-[180px] truncate">{task.title}</p>
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
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium text-gray-600 capitalize bg-gray-100 rounded px-2 py-0.5 w-fit">{task.type}</span>
                              <span className="text-xs text-gray-400">{catCfg.label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className={`h-2 rounded-full ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-700">{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-700">{task.target} {task.unit}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-medium ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                              {formatDate(task.deadline)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(task.status)}`}>{task.status}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setSelectedTask(task); setShowTaskDetails(true); }}
                                className="p-1.5 hover:bg-indigo-50 rounded-lg transition cursor-pointer text-indigo-500">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => openSubmissionsModal(task)}
                                className="p-1.5 hover:bg-emerald-50 rounded-lg transition cursor-pointer text-emerald-600">
                                <CheckSquare className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} disabled={deleteTaskMutation.isPending}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition cursor-pointer text-red-400 disabled:opacity-50">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTasks.length === 0 && (
                      <tr><td colSpan={9} className="px-5 py-12 text-center">
                        <Target className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">No tasks match your filters</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           EMPLOYEES / TEAM VIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'employees' && (
       <motion.div key="tasks" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
          {/* Department filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 font-medemployeesium">Filter by dept:</span>
            {['all', ...departments].map(dept => (
              <button key={dept} onClick={() => setFilterDept(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  filterDept === dept ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}>
                {dept === 'all' ? 'All Depts' : dept}
              </button>
            ))}
          </div>

          {/* Employee Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(employeePerformance)
              .filter(([empId]) => {
                if (filterDept === 'all') return true;
                const emp = employees.find(e => e.id === parseInt(empId));
                return emp?.department === filterDept;
              })
              .map(([empId, perf]) => {
                const emp = employees.find(e => e.id === parseInt(empId));
                const pct = Math.min(perf.progress, 100);
                const grade = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
                const gradeColor = pct >= 75 ? 'text-emerald-700 bg-emerald-50' : pct >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
                const record = monthlyRecords.find(r => r.employeeId === parseInt(empId) && r.month === historyMonth && r.year === historyYear);

                return (
                  <motion.div key={empId} whileHover={{ y: -3 }}
                    className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-5 flex items-start gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${getAvatarGradient(parseInt(empId))} rounded-2xl flex items-center justify-center shrink-0`}>
                        <span className="text-white text-lg font-bold">{getInitials(perf.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-800">{perf.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{emp?.empId} · {emp?.position || emp?.department}</p>
                          </div>
                          <span className={`text-lg font-black px-3 py-1 rounded-xl ${gradeColor}`}>{grade}</span>
                        </div>
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">Overall Progress</span>
                            <span className="text-xs font-bold text-gray-700">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8 }}
                              className={`h-2.5 rounded-full ${getProgressColor(pct)}`} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
                      {[
                        { label: 'Total', value: perf.total, color: 'text-gray-800' },
                        { label: 'Done', value: perf.completed, color: 'text-emerald-600' },
                        { label: 'Active', value: perf.active, color: 'text-blue-600' },
                        { label: 'Overdue', value: perf.overdue, color: perf.overdue > 0 ? 'text-red-600' : 'text-gray-400' },
                      ].map(s => (
                        <div key={s.label} className="p-3 text-center">
                          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="p-3 border-t border-gray-50 flex gap-2">
                      <button onClick={() => { setFilterEmployee(empId); setActiveView('tasks'); }}
                        className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer flex items-center justify-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" /> View Tasks
                      </button>
                      {!record?.locked ? (
                        <button onClick={() => { setLockTarget({ empId: parseInt(empId), month: historyMonth, year: historyYear }); setShowMonthlyLockModal(true); }}
                          className="flex-1 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold hover:bg-amber-100 transition cursor-pointer flex items-center justify-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Lock Month
                        </button>
                      ) : (
                        <div className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5" /> Month Locked
                        </div>
                      )}
                      <button onClick={() => { setSelectedHistoryEmployee(parseInt(empId)); setActiveView('history'); }}
                        className="py-2 px-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition cursor-pointer">
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            {Object.keys(employeePerformance).length === 0 && (
              <div className="col-span-3 bg-white border border-gray-100 rounded-2xl p-12 text-center">
                <UsersIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No employees with tasks yet</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           DESIGNATIONS VIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'designations' && (
        <motion.div key="designations" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(DESIGNATION_KPI_TEMPLATES).map(([key, tmpl]) => (
              <div key={key} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tmpl.color + '20' }}>
                    <tmpl.icon className="w-5 h-5" style={{ color: tmpl.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{tmpl.label}</h3>
                    <p className="text-xs text-gray-400">{tmpl.department} · {tmpl.kpis.length} KPIs</p>
                  </div>
                  <button onClick={() => { setSelectedDesignation(key); setShowBulkAssignModal(true); }}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                    style={{ backgroundColor: tmpl.color }}>
                    <Plus className="w-3.5 h-3.5" /> Assign
                  </button>
                </div>
                <div className="p-4">
                  {['daily', 'weekly', 'monthly'].map(type => {
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
                                <div>
                                  <span className="text-xs font-semibold text-gray-700">{kpi.title}</span>
                                  {kpi.needsComment && (
                                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">note req.</span>
                                  )}
                                </div>
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

      {/* ══════════════════════════════════════════════════════════════════════
           HISTORY VIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'history' && (
      <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
          {/* Filters */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Employee</label>
              <select value={selectedHistoryEmployee ?? ''}
                onChange={e => setSelectedHistoryEmployee(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 cursor-pointer">
                <option value="">All Employees</option>
                {employees.filter(e => e.status === 'active').map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Month</label>
              <select value={historyMonth} onChange={e => setHistoryMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 cursor-pointer">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{getMonthName(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Year</label>
              <select value={historyYear} onChange={e => setHistoryYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 cursor-pointer">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
              <Lock className="w-3.5 h-3.5" />
              Locked records are read-only and cannot be modified
            </div>
          </div>

          {/* Records */}
          {Object.entries(employeePerformance)
            .filter(([empId]) => !selectedHistoryEmployee || parseInt(empId) === selectedHistoryEmployee)
            .map(([empId, perf]) => {
              const record = monthlyRecords.find(r =>
                r.employeeId === parseInt(empId) && r.month === historyMonth && r.year === historyYear
              );
              const empTasks = tasks.filter(t => t.assignedToId === parseInt(empId));
              const emp = employees.find(e => e.id === parseInt(empId));

              return (
                <div key={empId} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center gap-4">
                    <div className={`w-11 h-11 bg-gradient-to-br ${getAvatarGradient(parseInt(empId))} rounded-xl flex items-center justify-center`}>
                      <span className="text-white font-bold">{getInitials(perf.name)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{perf.name}</p>
                      <p className="text-xs text-gray-400">{emp?.position} · {emp?.department}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {record?.locked ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <Lock className="w-3.5 h-3.5" /> Locked {record.lockedAt ? formatDate(record.lockedAt) : ''}
                        </span>
                      ) : (
                        <button onClick={() => { setLockTarget({ empId: parseInt(empId), month: historyMonth, year: historyYear }); setShowMonthlyLockModal(true); }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition cursor-pointer">
                          <Lock className="w-3.5 h-3.5" /> Lock Month
                        </button>
                      )}
                      <button
                        disabled={record?.locked}
                        onClick={() => {
                          setRemarksTarget({ empId: parseInt(empId), month: historyMonth, year: historyYear, current: record?.remarks || '' });
                          setRemarksText(record?.remarks || '');
                          setShowRemarksModal(true);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {record?.remarks ? 'Edit Remarks' : 'Add Remarks'}
                      </button>
                    </div>
                  </div>

                  {record?.remarks && (
                    <div className="mx-5 mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-indigo-700 mb-1">Team Lead Remarks</p>
                      <p className="text-sm text-indigo-800">{record.remarks}</p>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['KPI / Task', 'Type', 'Target', 'Achieved', 'Achievement %', 'Status'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(record?.locked ? record.records : empTasks.map(t => ({
                          taskId: t.id, title: t.title, category: t.category,
                          type: t.type, target: t.target, achieved: t.achieved,
                          pct: getProgressPct(t), unit: t.unit
                        }))).map(r => {
                          const catCfg = CATEGORY_CONFIG[r.category];
                          const pct = r.pct ?? (r.target > 0 ? Math.min((r.achieved / r.target) * 100, 100) : 0);
                          return (
                            <tr key={r.taskId} className={`${record?.locked ? 'bg-gray-50/30' : ''} hover:bg-gray-50/60 transition`}>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  {catCfg && (
                                    <div className={`w-7 h-7 bg-gradient-to-br ${catCfg.gradient} rounded-lg flex items-center justify-center`}>
                                      <catCfg.icon className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-gray-700">{r.title}</span>
                                  {record?.locked && <Lock className="w-3 h-3 text-gray-300 ml-1" />}
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-xs capitalize font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{r.type}</span>
                              </td>
                              <td className="px-5 py-3.5 text-sm font-medium text-gray-700">{r.target.toLocaleString()} {r.unit}</td>
                              <td className="px-5 py-3.5 text-sm font-bold text-gray-800">{r.achieved.toLocaleString()} {r.unit}</td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div className={`h-2 rounded-full ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className={`text-xs font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct.toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  pct >= 100 ? 'bg-emerald-100 text-emerald-700' :
                                  pct >= 70  ? 'bg-blue-100 text-blue-700' :
                                  pct >= 40  ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {pct >= 100 ? 'Achieved' : pct >= 70 ? 'On Track' : pct >= 40 ? 'At Risk' : 'Behind'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {empTasks.length === 0 && !record?.locked && (
                          <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-300 text-sm">No tasks for this period</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           MODALS
         ════════════════════════════════════════════════════════════════════ */}

      {/* BULK ASSIGN MODAL */}
      <AnimatePresence>
        {showBulkAssignModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Layers className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Bulk Assign KPIs</h3>
                    <p className="text-xs text-gray-400">Assign designation-based targets to employee</p>
                  </div>
                </div>
                <button onClick={() => setShowBulkAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Employee */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Select Employee *</label>
                  <select value={bulkAssignEmployeeId} onChange={e => setBulkAssignEmployeeId(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white cursor-pointer">
                    <option value={0}>— Select employee —</option>
                    {employees.filter(e => e.status === 'active').sort((a, b) => a.name.localeCompare(b.name)).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.empId}) — {emp.position}</option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Designation / Role *</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(DESIGNATION_KPI_TEMPLATES).map(([key, tmpl]) => (
                      <button key={key} onClick={() => { setSelectedDesignation(key); setSelectedKPIs([]); }}
                        className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
                          selectedDesignation === key
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}>
                        <div className="flex items-center gap-2.5 mb-1">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tmpl.color + '20' }}>
                            <tmpl.icon className="w-4 h-4" style={{ color: tmpl.color }} />
                          </div>
                          <p className="font-semibold text-sm text-gray-800">{tmpl.label}</p>
                        </div>
                        <p className="text-xs text-gray-400 ml-10">{tmpl.department} · {tmpl.kpis.length} KPIs available</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Deadline *</label>
                  <input type="date" value={bulkDeadline} onChange={e => setBulkDeadline(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white" />
                </div>

                {/* KPI Selection */}
                {selectedDesignation && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Select KPIs *</label>
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => setSelectedKPIs(DESIGNATION_KPI_TEMPLATES[selectedDesignation].kpis.map(k => `${k.type}_${k.title}`))}
                          className="text-indigo-600 hover:underline cursor-pointer font-medium">Select All</button>
                        <span className="text-gray-300">·</span>
                        <button onClick={() => setSelectedKPIs([])} className="text-gray-400 hover:underline cursor-pointer">Clear</button>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      {['daily', 'weekly', 'monthly'].map(type => {
                        const kpisOfType = DESIGNATION_KPI_TEMPLATES[selectedDesignation].kpis.filter(k => k.type === type);
                        if (kpisOfType.length === 0) return null;
                        return (
                          <div key={type}>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{type}</p>
                            </div>
                            {kpisOfType.map(kpi => {
                              const kpiKey = `${kpi.type}_${kpi.title}`;
                              const checked = selectedKPIs.includes(kpiKey);
                              return (
                                <label key={kpiKey} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition border-b border-gray-50 last:border-0 ${checked ? 'bg-indigo-50/50' : ''}`}>
                                  <input type="checkbox" checked={checked}
                                    onChange={e => {
                                      if (e.target.checked) setSelectedKPIs(prev => [...prev, kpiKey]);
                                      else setSelectedKPIs(prev => prev.filter(k => k !== kpiKey));
                                    }}
                                    className="accent-indigo-500 w-4 h-4 rounded" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-700">{kpi.title}</span>
                                    {kpi.needsComment && (
                                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-medium">profile note req.</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400 font-medium shrink-0">{kpi.target.toLocaleString()} {kpi.unit}</span>
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
                <button onClick={handleBulkAssign} disabled={isBulkLoading || selectedKPIs.length === 0 || !bulkAssignEmployeeId || !bulkDeadline}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {isBulkLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</> : `Assign ${selectedKPIs.length} KPIs`}
                </button>
                <button onClick={() => setShowBulkAssignModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">
                  Cancel
                </button>
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
              exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Create Custom Task</h3>
                    <p className="text-xs text-gray-400">Assign a specific KPI task to an employee</p>
                  </div>
                </div>
                <button onClick={() => { setShowCreateModal(false); setTaskForm(emptyForm()); }} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Task Title *</label>
                  <input type="text" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Daily Applications Sourced"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Description</label>
                  <textarea rows={2} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Task description and instructions…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Type *</label>
                    <select value={taskForm.type} onChange={e => setTaskForm(f => ({ ...f, type: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 cursor-pointer">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Category *</label>
                    <select value={taskForm.category} onChange={e => setTaskForm(f => ({ ...f, category: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 cursor-pointer">
                      {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Target *</label>
                    <input type="number" min={1} value={taskForm.target || ''}
                      onChange={e => setTaskForm(f => ({ ...f, target: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Unit *</label>
                    <input type="text" value={taskForm.unit} onChange={e => setTaskForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder="e.g. applications, calls, deals"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Deadline *</label>
                    <input type="date" value={taskForm.deadline} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Priority</label>
                    <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 cursor-pointer">
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 cursor-pointer">
                    <option value={0}>— Select employee —</option>
                    {employees.filter(e => e.status === 'active').sort((a, b) => a.name.localeCompare(b.name)).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.empId}) — {emp.position}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Notes / Instructions</label>
                  <textarea rows={2} value={taskForm.notes || ''} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional instructions for the employee…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition resize-none" />
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button onClick={handleCreateTask} disabled={createTaskMutation.isPending}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {createTaskMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Send className="w-4 h-4" /> Create Task</>}
                </button>
                <button onClick={() => { setShowCreateModal(false); setTaskForm(emptyForm()); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TASK DETAILS MODAL */}
      <AnimatePresence>
        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
              {(() => {
                const catCfg = CATEGORY_CONFIG[selectedTask.category] || { label: selectedTask.category, gradient: 'from-gray-500 to-gray-600', icon: Target };
                const assignee = resolveAssignee(selectedTask, employees);
                const pct = getProgressPct(selectedTask);
                const daysLeft = getDaysRemaining(selectedTask.deadline);
                return (
                  <>
                    {/* Colored header */}
                    <div className={`bg-gradient-to-br ${catCfg.gradient} p-6 relative overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full" />
                        <div className="absolute -right-4 bottom-0 w-20 h-20 bg-white rounded-full" />
                      </div>
                      <button onClick={() => setShowTaskDetails(false)}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center cursor-pointer transition">
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <div className="relative flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                          <catCfg.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white/70 text-xs uppercase tracking-wide">{selectedTask.type} · {catCfg.label}</p>
                          <h3 className="text-white font-bold text-xl leading-snug">{selectedTask.title}</h3>
                        </div>
                      </div>
                      {selectedTask.description && <p className="relative text-white/75 text-sm">{selectedTask.description}</p>}
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Assignee */}
                      {assignee && (
                        <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl">
                          <div className={`w-11 h-11 bg-gradient-to-br ${getAvatarGradient(selectedTask.assignedToId)} rounded-xl flex items-center justify-center`}>
                            <span className="text-white font-bold">{getInitials(assignee.name)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800">{assignee.name}</p>
                            <p className="text-xs text-gray-400">{assignee.empId} · {assignee.position} · {assignee.department}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-xl text-xs font-bold capitalize ${getStatusBadge(selectedTask.status)}`}>
                            {selectedTask.status}
                          </span>
                        </div>
                      )}

                      {/* Progress Big Display */}
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-500">Progress</span>
                          <span className={`text-3xl font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                            className={`h-3 rounded-full ${getProgressColor(pct)}`} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Target',    val: selectedTask.target,                                color: 'text-gray-800' },
                            { label: 'Achieved',  val: selectedTask.achieved,                             color: 'text-emerald-600' },
                            { label: 'Remaining', val: Math.max(0, selectedTask.target - selectedTask.achieved), color: 'text-orange-500' },
                          ].map(s => (
                            <div key={s.label} className="text-center p-3 bg-white rounded-xl shadow-sm">
                              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                              <p className={`text-2xl font-black ${s.color}`}>{s.val.toLocaleString()}</p>
                              <p className="text-xs text-gray-400">{selectedTask.unit}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-2xl p-4">
                          <p className="text-xs text-gray-400 mb-1">Deadline</p>
                          <p className="font-bold text-gray-800">{formatDate(selectedTask.deadline)}</p>
                          <p className={`text-xs mt-1 font-medium ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4">
                          <p className="text-xs text-gray-400 mb-1">Priority</p>
                          <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold capitalize ${getPriorityBadge(selectedTask.priority)}`}>
                            {selectedTask.priority}
                          </span>
                        </div>
                      </div>

                      {selectedTask.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                          <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Notes</p>
                          <p className="text-sm text-amber-700">{selectedTask.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-1">
                        <button onClick={() => { setShowTaskDetails(false); openSubmissionsModal(selectedTask); }}
                          className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2">
                          <ClipboardCheck className="w-4 h-4" /> View Submissions
                        </button>
                        <button onClick={() => setShowTaskDetails(false)}
                          className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">Close</button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMISSIONS MODAL */}
      <AnimatePresence>
        {showSubmissionsModal && selectedTask && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Task Submissions</h3>
                    <p className="text-sm text-gray-400">{selectedTask.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold border border-amber-200">
                      {selectedTaskSubmissions.filter(s => !s.verified).length} pending
                    </span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200">
                      {selectedTaskSubmissions.filter(s => s.verified).length} verified
                    </span>
                  </div>
                  <button onClick={() => setShowSubmissionsModal(false)} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-100">
                    <tr>
                      {['Date', 'Employee', 'Count', 'Profile / Notes', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedTaskSubmissions.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-12 text-center">
                        <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No submissions yet</p>
                      </td></tr>
                    ) : selectedTaskSubmissions.map(sub => {
                      const emp = employees.find(e => e.id === sub.employeeId);
                      return (
                        <tr key={sub.id} className="hover:bg-gray-50/60 transition">
                          <td className="px-5 py-4 text-sm text-gray-600 font-medium">{formatDate(sub.date)}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(sub.employeeId || 0)} rounded-full flex items-center justify-center`}>
                                <span className="text-white text-xs font-bold">{emp?.name ? getInitials(emp.name) : '?'}</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-800">{emp?.name ?? 'Unknown'}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-lg font-black text-gray-900">{sub.count}</span>
                            <span className="text-xs text-gray-400 ml-1">{selectedTask.unit}</span>
                          </td>
                          <td className="px-5 py-4">
                            {sub.notes ? (
                              <div className="max-w-xs">
                                <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100" title={sub.notes}>
                                  {sub.notes.length > 80 ? sub.notes.slice(0, 80) + '…' : sub.notes}
                                </p>
                              </div>
                            ) : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-xl text-xs font-semibold ${
                              sub.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {sub.verified ? <><BadgeCheck className="w-3.5 h-3.5" /> Verified</> : <><Clock className="w-3.5 h-3.5" /> Pending</>}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {!sub.verified && (
                                <button onClick={() => handleVerifySubmission(sub.id)} disabled={verifyMutation.isPending}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition cursor-pointer text-xs font-semibold disabled:opacity-50">
                                  <CheckCircle className="w-3.5 h-3.5" /> Verify
                                </button>
                              )}
                              <button onClick={() => handleDeleteSubmission(sub.id)} disabled={deleteSubMutation.isPending}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition cursor-pointer text-xs font-semibold disabled:opacity-50">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button onClick={() => setShowSubmissionsModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MONTHLY LOCK CONFIRM MODAL */}
      <AnimatePresence>
        {showMonthlyLockModal && lockTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Lock Monthly Records</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-sm text-amber-800 font-medium mb-1">
                  You are about to lock performance records for <strong>{getMonthName(lockTarget.month)} {lockTarget.year}</strong>
                </p>
                <p className="text-xs text-amber-700">
                  Once locked, these records become read-only. No further edits, task updates, or submission changes will affect the locked snapshot. This is permanent.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleLockMonth(lockTarget.empId, lockTarget.month, lockTarget.year)}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" /> Lock Now
                </button>
                <button onClick={() => { setShowMonthlyLockModal(false); setLockTarget(null); }}
                  className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REMARKS MODAL */}
      <AnimatePresence>
        {showRemarksModal && remarksTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Team Lead Remarks</h3>
                  <p className="text-sm text-gray-400">{getMonthName(remarksTarget.month)} {remarksTarget.year}</p>
                </div>
              </div>
              <textarea
                value={remarksText}
                onChange={e => setRemarksText(e.target.value)}
                rows={5}
                placeholder="Add your feedback, observations, or performance notes for this employee's month…"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={handleSaveRemarks}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Save Remarks
                </button>
                <button onClick={() => { setShowRemarksModal(false); setRemarksTarget(null); }}
                  className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default EmployerTaskManagement;