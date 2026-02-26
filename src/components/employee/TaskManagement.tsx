// src/components/employee/TaskManagement.tsx
// COMPLETE IMPLEMENTATION - Employee-side Task Management with KPI tracking

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, CheckCircle, Clock, Calendar,
  Plus, Eye, Award, AlertCircle,
  Briefcase, Users, FileText, BarChart3, Search,
 Activity,
  MessageSquare,  X
} from 'lucide-react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,

} from 'recharts';

import { useEmployeeTasks, useSubmitTaskProgress } from '../../hooks/useTasks';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: string;
  target: number;
  achieved: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'overdue';
  assignedDate: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  assignedBy?: { id: number; firstName: string; lastName: string; employeeId: string };
  submissions?: Submission[];
}

interface Submission {
  id: number;
  taskId: number;
  employeeId: number;
  count: number;
  date: string;
  notes?: string;
  verified: boolean;
  verifiedAt?: string;
}

interface Employee {
  empId: string;
  name: string;
  id?: number;
}

interface TaskManagementProps {
  employee: Employee;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; gradient: string; bg: string }> = {
  applications:  { label: 'Applications',  icon: Briefcase,     gradient: 'from-blue-500 to-blue-600',   bg: 'bg-blue-50 text-blue-700' },
  interviews:    { label: 'Interviews',    icon: Users,          gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 text-purple-700' },
  assessments:   { label: 'Assessments',  icon: FileText,       gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 text-orange-700' },
  calls:         { label: 'Calls',        icon: Activity,       gradient: 'from-green-500 to-green-600',  bg: 'bg-green-50 text-green-700' },
  meetings:      { label: 'Meetings',     icon: Users,          gradient: 'from-teal-500 to-teal-600',    bg: 'bg-teal-50 text-teal-700' },
  closures:      { label: 'Closures',     icon: Award,          gradient: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50 text-yellow-700' },
  screenings:    { label: 'Screenings',   icon: Activity,       gradient: 'from-pink-500 to-pink-600',    bg: 'bg-pink-50 text-pink-700' },
  submissions:   { label: 'Submissions',  icon: Target,         gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 text-indigo-700' },
  placements:    { label: 'Placements',   icon: Award,          gradient: 'from-amber-500 to-amber-600',  bg: 'bg-amber-50 text-amber-700' },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

function getCatConfig(category: string) {
  return CATEGORY_CONFIG[category] || { label: category, icon: Target, gradient: 'from-gray-500 to-gray-600', bg: 'bg-gray-50 text-gray-700' };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysRemaining(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getProgress(task: Task) {
  return task.target > 0 ? Math.min((task.achieved / task.target) * 100, 100) : 0;
}

function needsProfileComment(task: Task): boolean {
  return !!(task.notes && task.notes.toLowerCase().includes('profile')) ||
    ['interviews', 'screenings', 'submissions', 'placements'].includes(task.category);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const TaskManagement = ({ employee }: TaskManagementProps) => {
  const { data: tasksRaw = [], isLoading, refetch } = useEmployeeTasks(employee.id || 0);
  const submitMutation = useSubmitTaskProgress();

  const tasks: Task[] = useMemo(() => {
    if (Array.isArray(tasksRaw)) return tasksRaw;
    if (tasksRaw && Array.isArray((tasksRaw as any).data)) return (tasksRaw as any).data;
    return [];
  }, [tasksRaw]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<'tasks' | 'history' | 'analytics'>('tasks');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [submissionForm, setSubmissionForm] = useState({ count: 0, notes: '', profileComment: '' });
  // const [expandedTask, setExpandedTask] = useState<number | null>(null);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalTasks     = tasks.length;
  const activeTasks    = tasks.filter(t => t.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks   = tasks.filter(t => t.status === 'overdue').length;
  const overallProgress = tasks.length > 0
    ? tasks.reduce((a, t) => a + getProgress(t), 0) / tasks.length : 0;

  // Group tasks by type for today's view
  const todayTasks = tasks.filter(t => t.type === 'daily' && t.status === 'active');
  // const weeklyTasks = tasks.filter(t => t.type === 'weekly' && t.status === 'active');
  // const monthlyTasks = tasks.filter(t => t.type === 'monthly' && t.status === 'active');

  // ── Filtered tasks ────────────────────────────────────────────────────────
  const filteredTasks = tasks.filter(task => {
    if (filterType !== 'all' && task.type !== filterType) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    const q = searchTerm.toLowerCase();
    if (q && !task.title.toLowerCase().includes(q)) return false;
    return true;
  });

  // ── Submission history (all submissions from all tasks) ───────────────────
  const allSubmissions = useMemo(() => {
    return tasks
      .flatMap(t => (t.submissions || []).map(s => ({ ...s, taskTitle: t.title, taskUnit: t.unit, taskCategory: t.category })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks]);

  // ── Analytics data ────────────────────────────────────────────────────────
  const analyticsData = useMemo(() => {
    const byCategory = tasks.reduce((acc: Record<string, { target: number; achieved: number }>, t) => {
      if (!acc[t.category]) acc[t.category] = { target: 0, achieved: 0 };
      acc[t.category].target += t.target;
      acc[t.category].achieved += t.achieved;
      return acc;
    }, {});

    const categoryChart = Object.entries(byCategory).map(([cat, val]) => ({
      name: getCatConfig(cat).label,
      target: val.target,
      achieved: val.achieved,
      rate: val.target > 0 ? Math.round((val.achieved / val.target) * 100) : 0
    }));

    const byType = ['daily', 'weekly', 'monthly'].map(type => {
      const typeTasks = tasks.filter(t => t.type === type);
      const avgProgress = typeTasks.length > 0
        ? typeTasks.reduce((a, t) => a + getProgress(t), 0) / typeTasks.length : 0;
      return { type, count: typeTasks.length, avgProgress: Math.round(avgProgress) };
    });

    return { categoryChart, byType };
  }, [tasks]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSubmitProgress = async () => {
    if (!selectedTask || submissionForm.count <= 0) {
      alert('Please enter a valid count (must be > 0)');
      return;
    }
    if (!employee.id) {
      alert('Employee ID not found');
      return;
    }
    if (needsProfileComment(selectedTask) && !submissionForm.notes.trim()) {
      alert('Please add a note about which profile/position this relates to (required for this task type)');
      return;
    }

    const combinedNotes = [
      submissionForm.profileComment && `Profile: ${submissionForm.profileComment}`,
      submissionForm.notes,
    ].filter(Boolean).join(' | ');

    try {
      await submitMutation.mutateAsync({
        taskId: selectedTask.id,
        data: {
          employeeId: employee.id,
          count: submissionForm.count,
          notes: combinedNotes || undefined,
        }
      });
      setShowSubmitModal(false);
      setSubmissionForm({ count: 0, notes: '', profileComment: '' });
      setSelectedTask(null);
      refetch();
      alert('Progress submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit progress');
    }
  };

  const openSubmitModal = (task: Task) => {
    setSelectedTask(task);
    setShowSubmitModal(true);
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  // ── Animation ─────────────────────────────────────────────────────────────
  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  if (isLoading) {
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
    <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Tasks</h2>
          <p className="text-gray-500 text-sm">Track your daily, weekly & monthly KPI targets</p>
        </div>
      </motion.div>

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',     value: totalTasks,                     color: 'bg-gray-50 text-gray-700 border-gray-200',     icon: Target },
          { label: 'Active',    value: activeTasks,                    color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Clock },
          { label: 'Completed', value: completedTasks,                  color: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle },
          { label: 'Overdue',   value: overdueTasks,                    color: 'bg-red-50 text-red-700 border-red-200',        icon: AlertCircle },
          { label: 'Progress',  value: `${overallProgress.toFixed(0)}%`, color: 'bg-orange-50 text-[#F5A42C] border-orange-200', icon: TrendingUp },
        ].map((card, i) => (
          <motion.div key={i} whileHover={{ y: -3 }} className={`${card.color} border rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold mt-0.5">{card.value}</p>
              </div>
              <card.icon className="w-5 h-5 opacity-50" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── View Tabs ────────────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { id: 'tasks', label: 'My Tasks', icon: Target },
          { id: 'history', label: 'Submission History', icon: Calendar },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeView === tab.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ─────────────────────── TASKS VIEW ────────────────────────────────── */}
      {activeView === 'tasks' && (
        <motion.div variants={iv} className="space-y-5">
          {/* Today's Quick View */}
          {todayTasks.length > 0 && (
            <div className="bg-gradient-to-r from-[#6B8DA2] to-[#7A9DB2] rounded-2xl p-5 text-white">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Today's Targets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayTasks.map(task => {
                  const prog = getProgress(task);
                  return (
                    <div key={task.id} className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{task.title}</span>
                        <span className="text-xs text-white/70">{task.achieved}/{task.target}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                        <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${prog}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/70">{prog.toFixed(0)}% done</span>
                        <button onClick={() => openSubmitModal(task)}
                          className="text-xs bg-white text-[#6B8DA2] font-semibold px-2.5 py-1 rounded-lg hover:bg-white/90 transition cursor-pointer">
                          + Submit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search tasks…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#6B8DA2]" />
              </div>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
                {(['all', 'daily', 'weekly', 'monthly'] as const).map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className={`px-3 py-2 transition cursor-pointer ${filterType === t ? 'bg-[#6B8DA2] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
                {(['all', 'active', 'completed', 'overdue'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-2 transition cursor-pointer ${filterStatus === s ? 'bg-[#F5A42C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredTasks.map((task, index) => {
                const catCfg   = getCatConfig(task.category);
                const progress = getProgress(task);
                const daysLeft = getDaysRemaining(task.deadline);
                const needsNote = needsProfileComment(task);
                const todaySubmitted = (task.submissions || [])
                  .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
                  .reduce((a, s) => a + s.count, 0);

                return (
                  <motion.div key={task.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.04 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${catCfg.gradient} p-4`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                            <catCfg.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white/75 text-xs uppercase">{task.type}</span>
                              <span className="text-white/50 text-xs">·</span>
                              <span className="text-white/75 text-xs">{catCfg.label}</span>
                            </div>
                            <h3 className="text-white font-semibold text-sm mt-0.5">{task.title}</h3>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {needsNote && (
                            <span className="bg-amber-400 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <MessageSquare className="w-3 h-3" /> Note req.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-3">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-semibold text-gray-700">{task.achieved}/{task.target} {task.unit}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-3 rounded-full bg-gradient-to-r ${catCfg.gradient} relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </motion.div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">{progress.toFixed(0)}%</span>
                          <span className={`text-xs font-medium ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </span>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Target</p>
                          <p className="font-bold text-gray-800 text-sm">{task.target}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Done</p>
                          <p className="font-bold text-green-600 text-sm">{task.achieved}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Left</p>
                          <p className="font-bold text-orange-500 text-sm">{Math.max(0, task.target - task.achieved)}</p>
                        </div>
                      </div>

                      {/* Today's submission indicator for daily tasks */}
                      {task.type === 'daily' && todaySubmitted > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="text-xs text-green-700 font-medium">Today: {todaySubmitted} {task.unit} submitted</span>
                        </div>
                      )}

                      {/* Status + Deadline */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(task.status)}`}>
                          {task.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {task.status === 'active' && <Clock className="w-3 h-3" />}
                          {task.status === 'overdue' && <AlertCircle className="w-3 h-3" />}
                          {task.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(task.deadline)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button onClick={() => openTaskDetails(task)}
                          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition cursor-pointer flex items-center justify-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {task.status !== 'completed' && (
                          <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => openSubmitModal(task)}
                            disabled={submitMutation.isPending}
                            className="flex-1 py-2 bg-gradient-to-r from-[#6B8DA2] to-[#7A9DB2] text-white rounded-lg text-xs font-semibold hover:shadow transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50">
                            <Plus className="w-3.5 h-3.5" /> Submit
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredTasks.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 mb-1">No Tasks Found</h3>
              <p className="text-gray-400 text-sm">No tasks match your current filters</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ─────────────────────── SUBMISSION HISTORY VIEW ───────────────────── */}
      {activeView === 'history' && (
        <motion.div variants={iv} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Submission History</h3>
              <span className="text-sm text-gray-400">{allSubmissions.length} total submissions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3">Date & Time</th>
                    <th className="px-5 py-3">Task</th>
                    <th className="px-5 py-3">Count</th>
                    <th className="px-5 py-3">Notes / Profile</th>
                    <th className="px-5 py-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allSubmissions.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">No submissions yet. Start submitting your daily progress!</td></tr>
                  ) : allSubmissions.map(sub => {
                    const catCfg = getCatConfig((sub as any).taskCategory || '');
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-700">{new Date(sub.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <p className="text-xs text-gray-400">{new Date(sub.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${catCfg.bg}`}>{catCfg.label}</span>
                            <span className="text-sm text-gray-700">{(sub as any).taskTitle}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm font-bold text-gray-800">{sub.count}</span>
                          <span className="text-xs text-gray-400 ml-1">{(sub as any).taskUnit}</span>
                        </td>
                        <td className="px-5 py-3 max-w-xs">
                          {sub.notes ? (
                            <p className="text-xs text-gray-600 truncate" title={sub.notes}>{sub.notes}</p>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          {sub.verified ? (
                            <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                              <CheckCircle className="w-4 h-4" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                              <Clock className="w-4 h-4" /> Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─────────────────────── ANALYTICS VIEW ────────────────────────────── */}
      {activeView === 'analytics' && (
        <motion.div variants={iv} className="space-y-5">
          {/* By Type */}
          <div className="grid grid-cols-3 gap-4">
            {analyticsData.byType.map(bt => (
              <div key={bt.type} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-600 capitalize mb-2">{bt.type} Tasks</h4>
                <p className="text-3xl font-bold text-gray-800">{bt.count}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Avg Progress</span>
                    <span className={`font-semibold ${bt.avgProgress >= 80 ? 'text-green-600' : bt.avgProgress >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {bt.avgProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${bt.avgProgress >= 80 ? 'bg-green-500' : bt.avgProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${bt.avgProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Category Performance Chart */}
          {analyticsData.categoryChart.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#6B8DA2]" /> Performance by Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.categoryChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }} />
                    <Legend />
                    <Bar dataKey="target" name="Target" fill="#6B8DA2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="achieved" name="Achieved" fill="#F5A42C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Task list with quick submit */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">All Tasks — Quick Submit</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {tasks.map(task => {
                const catCfg = getCatConfig(task.category);
                const prog = getProgress(task);
                return (
                  <div key={task.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 bg-gradient-to-br ${catCfg.gradient} rounded-lg flex items-center justify-center shrink-0`}>
                        <catCfg.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-800">{task.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>{task.status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full bg-gradient-to-r ${catCfg.gradient}`} style={{ width: `${prog}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">{task.achieved}/{task.target} {task.unit}</span>
                        </div>
                      </div>
                      {task.status !== 'completed' && (
                        <button onClick={() => openSubmitModal(task)}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#6B8DA2] to-[#7A9DB2] text-white rounded-lg text-xs font-medium hover:shadow transition cursor-pointer flex items-center gap-1 shrink-0">
                          <Plus className="w-3 h-3" /> Submit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">No tasks assigned yet</div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           SUBMIT MODAL
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSubmitModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-[#6B8DA2]" /> Submit Progress
                </h3>
                <button onClick={() => { setShowSubmitModal(false); setSubmissionForm({ count: 0, notes: '', profileComment: '' }); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Task info */}
                <div className={`p-4 bg-gradient-to-r ${getCatConfig(selectedTask.category).gradient} rounded-xl text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-xs uppercase">{selectedTask.type} · {getCatConfig(selectedTask.category).label}</p>
                      <p className="font-bold text-lg">{selectedTask.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{getProgress(selectedTask).toFixed(0)}%</p>
                      <p className="text-white/70 text-xs">{selectedTask.achieved}/{selectedTask.target}</p>
                    </div>
                  </div>
                </div>

                {/* Profile comment (for recruiter tasks) */}
                {needsProfileComment(selectedTask) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <label className="block text-sm font-semibold text-amber-800 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" /> Profile / Position (Required)
                    </label>
                    <input type="text" value={submissionForm.profileComment}
                      onChange={e => setSubmissionForm(f => ({ ...f, profileComment: e.target.value }))}
                      placeholder="e.g. Senior React Developer – ABC Corp (LinkedIn)"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:border-amber-400 bg-white" />
                    <p className="text-xs text-amber-600 mt-1">Specify which profile/position/company this relates to</p>
                  </div>
                )}

                {/* Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Count – {selectedTask.unit} completed today *
                  </label>
                  <input type="number" min="1"
                    value={submissionForm.count || ''}
                    onChange={e => setSubmissionForm(f => ({ ...f, count: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    placeholder="0" />
                  <p className="text-xs text-gray-400 mt-1">
                    Remaining: {Math.max(0, selectedTask.target - selectedTask.achieved)} {selectedTask.unit}
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
                  <textarea rows={2} value={submissionForm.notes}
                    onChange={e => setSubmissionForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any additional context…"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B8DA2]" />
                </div>

                {/* Live preview */}
                {submissionForm.count > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700 font-medium">New total:</span>
                      <span className="text-lg font-bold text-green-700">
                        {selectedTask.achieved + submissionForm.count} / {selectedTask.target} {selectedTask.unit}
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{
                        width: `${Math.min(((selectedTask.achieved + submissionForm.count) / selectedTask.target) * 100, 100)}%`
                      }} />
                    </div>
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleSubmitProgress} disabled={submitMutation.isPending || submissionForm.count <= 0}
                    className="flex-1 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitMutation.isPending ? (
                      <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Submitting…</>
                    ) : 'Submit Progress'}
                  </motion.button>
                  <button onClick={() => { setShowSubmitModal(false); setSubmissionForm({ count: 0, notes: '', profileComment: '' }); }}
                    className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════
           TASK DETAILS MODAL
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-800">Task Details</h3>
                <button onClick={() => setShowTaskDetails(false)} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {(() => {
                const catCfg = getCatConfig(selectedTask.category);
                const prog = getProgress(selectedTask);
                const subs = selectedTask.submissions || [];

                return (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${catCfg.gradient} p-5 rounded-xl`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <catCfg.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white/70 text-xs uppercase">{selectedTask.type} · {catCfg.label}</p>
                          <h4 className="text-white font-bold text-xl">{selectedTask.title}</h4>
                        </div>
                      </div>
                      {selectedTask.description && <p className="text-white/80 text-sm">{selectedTask.description}</p>}
                    </div>

                    {/* Progress */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Completion</span>
                        <span className="text-2xl font-bold text-[#6B8DA2]">{prog.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className={`h-4 rounded-full bg-gradient-to-r ${catCfg.gradient}`} style={{ width: `${prog}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                          { l: 'Target', v: selectedTask.target, c: 'text-gray-800' },
                          { l: 'Achieved', v: selectedTask.achieved, c: 'text-green-600' },
                          { l: 'Remaining', v: Math.max(0, selectedTask.target - selectedTask.achieved), c: 'text-orange-500' }
                        ].map(s => (
                          <div key={s.l} className="text-center bg-white rounded-xl p-3">
                            <p className="text-xs text-gray-400">{s.l}</p>
                            <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                            <p className="text-xs text-gray-400">{selectedTask.unit}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deadline & Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">Deadline</p>
                        <p className="font-bold text-gray-800">{formatDate(selectedTask.deadline)}</p>
                        <p className={`text-xs mt-0.5 ${getDaysRemaining(selectedTask.deadline) < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {getDaysRemaining(selectedTask.deadline) < 0
                            ? `${Math.abs(getDaysRemaining(selectedTask.deadline))} days overdue`
                            : `${getDaysRemaining(selectedTask.deadline)} days left`}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(selectedTask.status)}`}>
                          {selectedTask.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Assigned by */}
                    {selectedTask.assignedBy && (
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-blue-700">Assigned by</p>
                        <p className="text-sm font-medium text-blue-800 mt-0.5">
                          {selectedTask.assignedBy.firstName} {selectedTask.assignedBy.lastName}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedTask.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Instructions</p>
                        <p className="text-sm text-amber-700">{selectedTask.notes}</p>
                      </div>
                    )}

                    {/* Recent Submissions */}
                    {subs.length > 0 && (
                      <div className="bg-gray-50 rounded-xl overflow-hidden">
                        <p className="text-sm font-semibold text-gray-700 p-3 border-b border-gray-200">
                          Recent Submissions ({subs.length})
                        </p>
                        <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                          {subs.slice(0, 5).map(s => (
                            <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                {s.notes && <span className="text-xs text-gray-500 truncate max-w-[140px]">{s.notes}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-gray-800">{s.count} {selectedTask.unit}</span>
                                {s.verified
                                  ? <span className="text-xs text-green-600 font-medium">✓</span>
                                  : <span className="text-xs text-yellow-500">pending</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {selectedTask.status !== 'completed' && (
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => { setShowTaskDetails(false); openSubmitModal(selectedTask); }}
                          className="flex-1 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2">
                          <Plus className="w-5 h-5" /> Submit Progress
                        </motion.button>
                      )}
                      <button onClick={() => setShowTaskDetails(false)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer">
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default TaskManagement;