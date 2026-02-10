// src/components/employer/EmployerTaskManagement.tsx - INTEGRATED WITH API

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, CheckCircle, Clock, Calendar,
  Plus, Eye, Trash2,
  Search,
  Users as UsersIcon,
  UserCircle,
  RefreshCw, X, Loader2
} from 'lucide-react';
import { Briefcase, Users, FileText, BarChart3 } from 'lucide-react';

// ─── hooks ──────────────────────────────────────────────────────────────────
import {
  useTasks,
  useCreateTask,
  useDeleteTask,
  useVerifySubmission,
  useDeleteSubmission
} from '../../hooks/useTasks';

import { useEmployees } from '../../hooks/useEmployees'; // ← pulls REAL employees

// ─── types ──────────────────────────────────────────────────────────────────
import type {
  Task,
  TaskSubmission,
  CreateTaskData
} from '../../services/Taskapi';

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Normalised employee shape used everywhere inside this component. */
interface Employee {
  id: number;
  empId: string;         // e.g. "EMP001"
  name: string;          // "FirstName LastName"
  email: string;
  department: string;
  position: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

interface TaskManagementProps {
  /** kept for backward-compat but no longer the source of truth */
  employees?: Employee[];
  currentUser: Employee;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS (pure, outside the component)
// ─────────────────────────────────────────────────────────────────────────────

function getTaskIcon(category: string) {
  switch (category) {
    case 'applications': return Briefcase;
    case 'interviews':   return Users;
    case 'assessments':  return FileText;
    default:             return Target;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':   return 'bg-red-100 text-red-700 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low':    return 'bg-green-100 text-green-700 border-green-200';
    default:       return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700';
    case 'overdue':   return 'bg-red-100 text-red-700';
    case 'active':    return 'bg-blue-100 text-blue-700';
    default:          return 'bg-gray-100 text-gray-700';
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'applications': return 'from-blue-500 to-blue-600';
    case 'interviews':   return 'from-purple-500 to-purple-600';
    case 'assessments':  return 'from-orange-500 to-orange-600';
    default:             return 'from-gray-500 to-gray-600';
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function getDaysRemaining(deadline: string) {
  const diff = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

function getProgressPercentage(task: Task) {
  return task.target > 0 ? Math.min((task.achieved / task.target) * 100, 100) : 0;
}

/**
 * Converts a raw API employee record (firstName / lastName) into our
 * normalised Employee shape. Works whether the source is the DB or demo data.
 */
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

/** Resolve the employee who is assigned to a task, using task.assignedTo when present. */
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const EmployerTaskManagement = ({ currentUser }: TaskManagementProps) => {

  // ── API: tasks ───────────────────────────────────────────────────────────
  const { data: tasksRaw = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasks();
  const createTaskMutation   = useCreateTask();
  const deleteTaskMutation   = useDeleteTask();
  const verifyMutation       = useVerifySubmission();
  const deleteSubMutation    = useDeleteSubmission();

  // ── API: employees (the REAL list from the database) ────────────────────
  const { data: rawEmployees = [], isLoading: employeesLoading } = useEmployees();

  // Normalise once whenever the raw list changes
  const employees: Employee[] = useMemo(
    () => (Array.isArray(rawEmployees) ? rawEmployees : []).map(normaliseEmployee),
    [rawEmployees]
  );

  // Normalise tasks (the hook may return { data: [...] } or [...] depending on version)
  const tasks: Task[] = useMemo(() => {
    if (Array.isArray(tasksRaw)) return tasksRaw;
    if (tasksRaw && Array.isArray((tasksRaw as any).data)) return (tasksRaw as any).data;
    return [];
  }, [tasksRaw]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal]             = useState(false);
  const [showTaskDetails, setShowTaskDetails]             = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal]   = useState(false);
  const [selectedTask, setSelectedTask]                   = useState<Task | null>(null);
  const [selectedTaskSubmissions, setSelectedTaskSubmissions] = useState<TaskSubmission[]>([]);

  const [filterType,   setFilterType]   = useState<'all'|'daily'|'weekly'|'monthly'>('all');
  const [filterStatus, setFilterStatus] = useState<'all'|'active'|'completed'|'overdue'>('all');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Create-task form ─────────────────────────────────────────────────────
const emptyForm = (): CreateTaskData => ({
  title: '', 
  description: '', 
  type: 'daily', 
  category: 'applications',
  target: 0, // 
  unit: '', 
  deadline: '', 
  priority: 'medium',
  assignedToId: 0, 
  assignedById: 'ADMIN001', 
  notes: '', 
  recurring: false, 
  recurrence: 'daily'
});
  const [taskForm, setTaskForm] = useState<CreateTaskData>(emptyForm);

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalTasks      = tasks.length;
  const activeTasks     = tasks.filter(t => t.status === 'active').length;
  const allSubmissions  = tasks.flatMap(t => t.submissions || []);
  const totalSubs       = allSubmissions.length;
  const pendingSubs     = allSubmissions.filter(s => !s.verified).length;
  const teamProgress    = tasks.length
    ? tasks.reduce((a, t) => a + (t.achieved / (t.target || 1)) * 100, 0) / tasks.length
    : 0;

  // ── Filtered task list ───────────────────────────────────────────────────
  const filteredTasks = tasks.filter(task => {
    if (filterType   !== 'all' && task.type   !== filterType)   return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    const q = searchTerm.toLowerCase();
    if (q && !task.title.toLowerCase().includes(q) && !task.description.toLowerCase().includes(q)) return false;
    return true;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

const handleCreateTask = async () => {
  if (!taskForm.title || !taskForm.target || !taskForm.deadline || taskForm.assignedToId === 0) {
    alert('Please fill in all required fields (Title, Target, Deadline, Assign To).');
    return;
  }
  
  // Create properly formatted data
  const taskData = {
    ...taskForm,
    // Ensure target is a positive number
    target: Math.max(1, taskForm.target),
    // Format date properly for Prisma (ISO string with time)
    deadline: new Date(taskForm.deadline + 'T00:00:00').toISOString(),
    // Ensure IDs are numbers
    assignedToId: Number(taskForm.assignedToId),
    assignedById: Number(currentUser.id), 
    // Ensure other numeric fields
    
  };
  
  console.log('🔍 Creating task with formatted data:', taskData);
  
  try {
    await createTaskMutation.mutateAsync(taskData);
    setShowCreateModal(false);
    setTaskForm(emptyForm());
    alert('Task created successfully!');
  } catch (err: any) {
    console.error('❌ Error creating task:', err);
    console.error('❌ Error response:', err.response?.data);
    alert(err?.response?.data?.message || 'Failed to create task');
  }
};

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      alert('Task deleted.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleVerifySubmission = async (subId: number) => {
    try {
      await verifyMutation.mutateAsync({ submissionId: subId, verifiedBy: currentUser.id });
      setSelectedTaskSubmissions(prev =>
        prev.map(s => s.id === subId ? { ...s, verified: true, verifiedBy: currentUser.id } : s)
      );
      alert('Submission verified!');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to verify');
    }
  };

  const handleDeleteSubmission = async (subId: number) => {
    if (!confirm('Delete this submission?')) return;
    try {
      await deleteSubMutation.mutateAsync(subId);
      setSelectedTaskSubmissions(prev => prev.filter(s => s.id !== subId));
      alert('Submission deleted.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete submission');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await refetchTasks(); } finally { setIsRefreshing(false); }
  };

  // ── Open modals ──────────────────────────────────────────────────────────

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const openSubmissionsModal = (task: Task) => {
    setSelectedTask(task);
    setSelectedTaskSubmissions(task.submissions || []);
    setShowSubmissionsModal(true);
  };

  // ── Framer variants ──────────────────────────────────────────────────────
  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden:  { y: 20, opacity: 0 },
    visible: { y: 0,  opacity: 1 }
  };

  // ── Custom recharts tooltip ──────────────────────────────────────────────
  // (kept for future chart use)

  // ── Loading guard ────────────────────────────────────────────────────────
  if (tasksLoading && employeesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-[#6B8DA2]" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Task Management</h2>
          <p className="text-gray-500">Create, assign, and track tasks for your employees</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleRefresh} disabled={isRefreshing}
            className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#F5A42C] to-[#F5B53C] text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Task
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stats Cards ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks',      value: totalTasks,  sub: `Active: ${activeTasks}`,           color: 'blue',  icon: Target },
          { label: 'Active Employees', value: new Set(tasks.map(t => t.assignedToId)).size, sub: 'With assigned tasks', color: 'green', icon: UsersIcon },
          { label: 'Submissions',      value: totalSubs,   sub: `Pending: ${pendingSubs}`,          color: 'purple', icon: CheckCircle },
          { label: 'Team Progress',    value: `${teamProgress.toFixed(0)}%`, sub: 'Overall completion', color: 'orange', icon: TrendingUp }
        ].map((card, i) => {
          const Icon = card.icon;
          const colours: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
            blue:   { bg: 'from-blue-50 to-blue-100',     border: 'border-blue-500',   text: 'text-blue-600',   iconBg: 'from-blue-500 to-blue-600'   },
            green:  { bg: 'from-green-50 to-green-100',   border: 'border-green-500',  text: 'text-green-600',  iconBg: 'from-green-500 to-green-600'  },
            purple: { bg: 'from-purple-50 to-purple-100', border: 'border-purple-500', text: 'text-purple-600', iconBg: 'from-purple-500 to-purple-600' },
            orange: { bg: 'from-orange-50 to-orange-100', border: 'border-[#F5A42C]',  text: 'text-[#F5A42C]',  iconBg: 'from-[#F5A42C] to-[#F5B53C]'  }
          };
          const c = colours[card.color];
          return (
            <motion.div key={i} whileHover={{ y: -5 }} className={`bg-gradient-to-br ${c.bg} ${c.border} border-l-4 rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{card.label}</p>
                  <p className={`text-3xl font-bold ${c.text} mt-1`}>{card.value}</p>
                  <p className="text-gray-500 text-xs mt-1">{card.sub}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${c.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text" placeholder="Search tasks…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2]"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
              {(['all','daily','weekly','monthly'] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`px-4 py-2 cursor-pointer transition text-sm ${filterType === t ? 'bg-[#6B8DA2] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
              {(['all','active','completed','overdue'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 cursor-pointer transition text-sm ${filterStatus === s ? 'bg-[#F5A42C] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Task Cards Grid ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTasks.map((task, index) => {
            const Icon       = getTaskIcon(task.category);
            const progress   = getProgressPercentage(task);
            const daysLeft   = getDaysRemaining(task.deadline);
            const assignee   = resolveAssignee(task, employees);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
              >
                {/* card header */}
                <div className={`bg-gradient-to-r ${getCategoryColor(task.category)} p-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-white/80 text-xs font-medium uppercase tracking-wider">{task.type}</span>
                        <h3 className="text-white font-semibold text-sm mt-0.5">{task.title}</h3>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                  </div>
                </div>

                {/* card body */}
                <div className="p-4 space-y-4 flex-1 flex flex-col">
                  {/* assignee chip */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-9 h-9 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shrink-0">
                      {assignee?.avatar
                        ? <img src={assignee.avatar} alt={assignee.name} className="w-8 h-8 rounded-full object-cover" />
                        : <span className="text-sm font-semibold text-gray-600">{assignee?.name?.[0] ?? '?'}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{assignee?.name ?? 'Unassigned'}</p>
                      <p className="text-xs text-gray-500 truncate">{assignee?.position || 'N/A'} • {assignee?.department || 'N/A'}</p>
                    </div>
                  </div>

                  {/* progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-bold text-gray-800">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${getCategoryColor(task.category)} rounded-full`}
                      />
                    </div>
                  </div>

                  {/* target / achieved */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Target</p>
                      <p className="text-lg font-bold text-gray-800">{task.target}</p>
                      <p className="text-xs text-gray-400">{task.unit}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Achieved</p>
                      <p className="text-lg font-bold text-green-600">{task.achieved}</p>
                      <p className="text-xs text-gray-400">{task.unit}</p>
                    </div>
                  </div>

                  {/* deadline */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Deadline</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">{formatDate(task.deadline)}</p>
                      <p className={`text-xs ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                      </p>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-2 pt-auto mt-auto">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => openTaskDetails(task)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition cursor-pointer flex items-center justify-center gap-1 text-sm">
                      <Eye className="w-3.5 h-3.5" /> View
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => openSubmissionsModal(task)}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-[#F5A42C] to-[#F5B53C] text-white rounded-lg font-medium hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1 text-sm">
                      <CheckCircle className="w-3.5 h-3.5" /> Verify
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteTask(task.id)} disabled={deleteTaskMutation.isPending}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition cursor-pointer disabled:opacity-50 flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {filteredTasks.length === 0 && !tasksLoading && (
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Tasks Found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'No tasks match your filters. Try adjusting your search criteria.'
              : 'No tasks have been created yet.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setFilterType('all'); setFilterStatus('all'); setSearchTerm(''); }}
                className="px-6 py-2 bg-gradient-to-r from-[#6B8DA2] to-[#7A9DB2] text-white rounded-xl font-medium hover:shadow-lg transition cursor-pointer">
                Clear Filters
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-[#F5A42C] to-[#F5B53C] text-white rounded-xl font-medium hover:shadow-lg transition cursor-pointer">
              Create First Task
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           MODALS
         ════════════════════════════════════════════════════════════════════ */}

      {/* ── CREATE TASK MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* modal header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-[#6B8DA2]" /> Create New Task
                </h3>
                <button onClick={() => { setShowCreateModal(false); setTaskForm(emptyForm()); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">Task Title *</label>
                  <input type="text" value={taskForm.title}
                    onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Enter task title…"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">Description</label>
                  <textarea rows={3} value={taskForm.description}
                    onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Enter task description…"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                  />
                </div>

                {/* Type + Category row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">Task Type *</label>
                    <select value={taskForm.type}
                      onChange={e => setTaskForm(f => ({ ...f, type: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">Category *</label>
                    <select value={taskForm.category}
                      onChange={e => setTaskForm(f => ({ ...f, category: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white">
                      <option value="applications">Applications</option>
                      <option value="interviews">Interviews</option>
                      <option value="assessments">Assessments</option>
                    </select>
                  </div>
                </div>

                {/* Target + Unit row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">Target *</label>
                    <input type="number" min={1} value={taskForm.target || ''}
                      onChange={e => setTaskForm(f => ({ ...f, target: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. 10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">Unit *</label>
                    <input type="text" value={taskForm.unit}
                      onChange={e => setTaskForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder="e.g. applications"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    />
                  </div>
                </div>

                {/* Deadline + Priority row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">Deadline *</label>
                    <input type="date" value={taskForm.deadline}
                      onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">Priority</label>
                    <select value={taskForm.priority}
                      onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* ── ASSIGN TO (real employees from API) ────────────────── */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">
                    Assign To * {employeesLoading && <Loader2 className="inline w-4 h-4 animate-spin text-[#6B8DA2]" />}
                  </label>

                  {employeesLoading ? (
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm">
                      Loading employees…
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="w-full px-4 py-3 border border-red-200 rounded-xl bg-red-50 text-red-600 text-sm">
                      No employees found in the database. Please add employees first.
                    </div>
                  ) : (
                    <select
                      value={taskForm.assignedToId}
                      onChange={e => setTaskForm(f => ({ ...f, assignedToId: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 bg-white"
                    >
                      <option value={0}>— Select an employee —</option>
                      {employees
                        .filter(e => e.status === 'active')
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.empId}) — {emp.position}, {emp.department}
                          </option>
                        ))
                      }
                    </select>
                  )}

                  {/* Live preview of selected employee */}
                  {taskForm.assignedToId !== 0 && (() => {
                    const picked = employees.find(e => e.id === taskForm.assignedToId);
                    if (!picked) return null;
                    return (
                      <div className="mt-2 flex items-center gap-3 p-3 bg-[#6B8DA2]/5 border border-[#6B8DA2]/20 rounded-lg">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#6B8DA2] to-[#7A9DB2] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-semibold">{picked.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{picked.name}</p>
                          <p className="text-xs text-gray-500">{picked.empId} • {picked.position} • {picked.department}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Recurring toggle */}
                <div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="recurring" checked={taskForm.recurring}
                      onChange={e => setTaskForm(f => ({ ...f, recurring: e.target.checked }))}
                      className="w-4 h-4 accent-[#6B8DA2] rounded"
                    />
                    <label htmlFor="recurring" className="text-gray-700 font-medium cursor-pointer">Recurring Task</label>
                  </div>
                  {taskForm.recurring && (
                    <div className="mt-3">
                      <label className="block text-gray-700 font-medium mb-1.5">Recurrence</label>
                      <select value={taskForm.recurrence}
                        onChange={e => setTaskForm(f => ({ ...f, recurrence: e.target.value as any }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">Additional Notes</label>
                  <textarea rows={2} value={taskForm.notes || ''}
                    onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any extra instructions…"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                  />
                </div>

                {/* Submit row */}
                <div className="flex gap-3 pt-2">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleCreateTask} disabled={createTaskMutation.isPending}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                    {createTaskMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                      : 'Create Task'
                    }
                  </motion.button>
                  <button onClick={() => { setShowCreateModal(false); setTaskForm(emptyForm()); }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TASK DETAILS MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-[#6B8DA2]" /> Task Details
                </h3>
                <button onClick={() => setShowTaskDetails(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-5">
                {/* gradient header */}
                <div className={`bg-gradient-to-r ${getCategoryColor(selectedTask.category)} p-5 rounded-xl`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {(() => { const I = getTaskIcon(selectedTask.category); return (
                        <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <I className="w-6 h-6 text-white" />
                        </div>
                      );})()}
                      <div>
                        <span className="text-white/75 text-xs font-medium uppercase tracking-wider">
                          {selectedTask.type} · {selectedTask.category}
                        </span>
                        <h4 className="text-white font-bold text-lg mt-0.5">{selectedTask.title}</h4>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority.toUpperCase()}
                    </span>
                  </div>
                  {selectedTask.description && <p className="text-white/85 text-sm">{selectedTask.description}</p>}
                </div>

                {/* assignee */}
                {(() => {
                  const a = resolveAssignee(selectedTask, employees);
                  return (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-[#6B8DA2]" /> Assigned Employee
                      </h5>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shrink-0">
                          {a?.avatar
                            ? <img src={a.avatar} alt={a.name} className="w-12 h-12 rounded-full object-cover" />
                            : <span className="text-xl font-semibold text-gray-600">{a?.name?.[0] ?? '?'}</span>
                          }
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{a?.name ?? 'Unassigned'}</p>
                          <p className="text-sm text-gray-500">{a?.position || 'N/A'} · {a?.department || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{a?.empId || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* progress overview */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#6B8DA2]" /> Progress
                  </h5>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Completion</span>
                    <span className="text-2xl font-bold text-[#6B8DA2]">{getProgressPercentage(selectedTask).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${getProgressPercentage(selectedTask)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${getCategoryColor(selectedTask.category)} rounded-full`}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Target',    value: selectedTask.target,                        color: 'text-gray-800' },
                      { label: 'Achieved',  value: selectedTask.achieved,                      color: 'text-green-600' },
                      { label: 'Remaining', value: selectedTask.target - selectedTask.achieved, color: 'text-orange-600' }
                    ].map(s => (
                      <div key={s.label} className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400">{selectedTask.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* timeline row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium text-gray-700">Assigned</span></div>
                    <p className="text-lg font-bold text-gray-900">{formatDate(selectedTask.assignedDate)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium text-gray-700">Deadline</span></div>
                    <p className="text-lg font-bold text-gray-900">{formatDate(selectedTask.deadline)}</p>
                    <p className={`text-xs mt-0.5 ${getDaysRemaining(selectedTask.deadline) < 0 ? 'text-red-600' : getDaysRemaining(selectedTask.deadline) <= 3 ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {getDaysRemaining(selectedTask.deadline) < 0
                        ? `${Math.abs(getDaysRemaining(selectedTask.deadline))} days overdue`
                        : `${getDaysRemaining(selectedTask.deadline)} days remaining`}
                    </p>
                  </div>
                </div>

                {/* status badge */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="text-gray-700 font-medium text-sm">Status</span>
                  <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status.toUpperCase()}
                  </span>
                </div>

                {/* action buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => { setShowTaskDetails(false); openSubmissionsModal(selectedTask); }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#F5A42C] to-[#F5B53C] text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> View Submissions
                  </motion.button>
                  <button onClick={() => setShowTaskDetails(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SUBMISSIONS MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showSubmissionsModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-[#6B8DA2]" /> Submissions — {selectedTask.title}
                </h3>
                <button onClick={() => setShowSubmissionsModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Employee</th>
                        <th className="px-5 py-3">Count</th>
                        <th className="px-5 py-3">Notes</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedTaskSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-gray-400">No submissions yet</td>
                        </tr>
                      ) : selectedTaskSubmissions.map(sub => {
                        const emp = employees.find(e => e.id === sub.employeeId);
                        return (
                          <tr key={sub.id} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-3 text-sm text-gray-700">{formatDate(sub.date)}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-gray-600">{emp?.name?.[0] ?? '?'}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{emp?.name ?? 'Unknown'}</p>
                                  <p className="text-xs text-gray-400">{emp?.position ?? ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm font-semibold text-gray-800">{sub.count} <span className="font-normal text-gray-400">{selectedTask.unit}</span></td>
                            <td className="px-5 py-3 text-sm text-gray-500 max-w-xs truncate">{sub.notes || '—'}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${sub.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {sub.verified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                {!sub.verified && (
                                  <button onClick={() => handleVerifySubmission(sub.id)} disabled={verifyMutation.isPending}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition cursor-pointer disabled:opacity-50 text-xs font-medium">
                                    Verify
                                  </button>
                                )}
                                <button onClick={() => handleDeleteSubmission(sub.id)} disabled={deleteSubMutation.isPending}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition cursor-pointer disabled:opacity-50 text-xs font-medium">
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end mt-5">
                <button onClick={() => setShowSubmissionsModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default EmployerTaskManagement;