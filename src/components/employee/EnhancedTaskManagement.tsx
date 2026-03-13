// src/components/employee/EnhancedTaskManagement.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, Calendar, CheckCircle,
  Clock, AlertCircle, Plus, BarChart3, X, Loader2,
  Briefcase, Phone, Activity, DollarSign,
  Users as UsersIcon, Award
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

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
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  submissions: Array<{
    id: number;
    count: number;
    date: string;
    notes?: string;
    profileComment?: string;
  }>;
}

interface Employee {
  id: number;
  empId: string;
  name: string;
  department?: string;
  position?: string;
}

interface EnhancedTaskManagementProps {
  employee: Employee;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; gradient: string }> = {
  applications: { label: 'Applications', icon: Briefcase,  gradient: 'from-indigo-500 to-indigo-600' },
  interviews:   { label: 'Interviews',   icon: UsersIcon,  gradient: 'from-violet-500 to-violet-600' },
  assessments:  { label: 'Assessments', icon: Activity,   gradient: 'from-orange-500 to-orange-600' },
  calls:        { label: 'Calls',        icon: Phone,      gradient: 'from-emerald-500 to-emerald-600' },
  meetings:     { label: 'Meetings',     icon: UsersIcon,  gradient: 'from-teal-500 to-teal-600' },
  closures:     { label: 'Closures',     icon: DollarSign, gradient: 'from-amber-500 to-amber-600' },
  screenings:   { label: 'Screenings',  icon: Activity,   gradient: 'from-pink-500 to-pink-600' },
  submissions:  { label: 'Submissions', icon: Target,     gradient: 'from-indigo-400 to-blue-500' },
  placements:   { label: 'Placements',  icon: Award,      gradient: 'from-amber-400 to-orange-500' },
};

function getProgressPct(task: Task) {
  return task.target > 0 ? Math.min((task.achieved / task.target) * 100, 100) : 0;
}
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
function getDaysRemaining(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.35 } } };

export default function EnhancedTaskManagement({ employee }: EnhancedTaskManagementProps) {
  const [selectedTask, setSelectedTask]     = useState<Task | null>(null);
  const [showModal, setShowModal]           = useState(false);
  const [activityData, setActivityData]     = useState({ actual: '', notes: '', profileComment: '' });
  const [filterType, setFilterType]         = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [filterStatus, setFilterStatus]     = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [toast, setToast]                   = useState<{ msg: string; ok: boolean } | null>(null);
  const queryClient = useQueryClient();

  const notify = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: rawTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['employee-tasks', employee.id, filterType, filterStatus],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filterType !== 'all') p.append('type', filterType);
      if (filterStatus !== 'all') p.append('status', filterStatus);
      const res = await axios.get(`/api/tasks/employee/${employee.id}?${p}`);
      return res.data.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => (await axios.post('/api/performance/daily-activities', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-tasks'] });
      notify('Activity submitted!', true);
      setShowModal(false);
      setActivityData({ actual: '', notes: '', profileComment: '' });
      setSelectedTask(null);
    },
    onError: (e: any) => notify(e.response?.data?.message || 'Failed to submit', false)
  });

  const tasks = rawTasks as Task[];
  const filtered = tasks.filter(t =>
    (filterType === 'all' || t.type === filterType) &&
    (filterStatus === 'all' || t.status === filterStatus)
  );

  const stats = {
    total: filtered.length,
    active: filtered.filter(t => t.status === 'active').length,
    completed: filtered.filter(t => t.status === 'completed').length,
    overdue: filtered.filter(t => t.status === 'overdue').length,
    rate: filtered.length
      ? Math.round((filtered.reduce((s, t) => s + t.achieved, 0) /
          Math.max(filtered.reduce((s, t) => s + t.target, 0), 1)) * 100)
      : 0
  };

  const handleSubmit = () => {
    if (!selectedTask || !activityData.actual) { notify('Enter actual count', false); return; }
    submitMutation.mutate({
      employeeId: employee.id,
      date: new Date().toISOString().split('T')[0],
      taskId: selectedTask.id,
      metricName: selectedTask.title,
      actual: parseInt(activityData.actual),
      notes: activityData.notes || undefined,
      profileComment: activityData.profileComment || undefined
    });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
      <p className="text-gray-400 text-sm font-medium">Loading your tasks…</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6 pb-10">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border-l-4 ${
              toast.ok ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
            <span className="font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={iv} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">My Tasks</h2>
          </div>
          <p className="text-gray-400 text-sm ml-10">{employee.name} · {employee.department || 'N/A'}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks',     value: stats.total,       color: 'blue',   icon: Target },
          { label: 'Active',          value: stats.active,      color: 'amber',  icon: Clock },
          { label: 'Completed',       value: stats.completed,   color: 'green',  icon: CheckCircle },
          { label: 'Completion Rate', value: `${stats.rate}%`,  color: 'purple', icon: TrendingUp },
        ].map((c, i) => (
          <motion.div key={i} whileHover={{ y: -2 }} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
              c.color === 'blue' ? 'bg-blue-50' : c.color === 'amber' ? 'bg-amber-50' :
              c.color === 'green' ? 'bg-emerald-50' : 'bg-violet-50'}`}>
              <c.icon className={`w-4 h-4 ${
                c.color === 'blue' ? 'text-blue-500' : c.color === 'amber' ? 'text-amber-500' :
                c.color === 'green' ? 'text-emerald-500' : 'text-violet-500'}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs font-medium text-gray-400 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={iv} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-semibold text-gray-700">Filter Tasks</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Type:</span>
            {(['all', 'daily', 'weekly', 'monthly'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
                  filterType === t ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Status:</span>
            {(['all', 'active', 'completed', 'overdue'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
                  filterStatus === s ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} tasks</p>
      </motion.div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="col-span-full bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <Target className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">No tasks match your filters</p>
            </div>
          ) : filtered.map((task, idx) => {
            const pct     = getProgressPct(task);
            const days    = getDaysRemaining(task.deadline);
            const cat     = CATEGORY_CONFIG[task.category] || { label: task.category, gradient: 'from-gray-500 to-gray-600', icon: Target };
            const CatIcon = cat.icon;
            return (
              <motion.div key={task.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03 }}
                whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

                <div className={`bg-gradient-to-r ${cat.gradient} p-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <CatIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/70 text-xs capitalize">{task.type}</span>
                          <span className="text-white/40 text-xs">·</span>
                          <span className="text-white/70 text-xs">{cat.label}</span>
                        </div>
                        <h3 className="text-white font-bold text-sm mt-0.5">{task.title}</h3>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold shrink-0 ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  {task.description && <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>}

                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(task.status)}`}>{task.status}</span>
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className={`font-medium ${days < 0 ? 'text-red-500' : days <= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-400 font-medium">Progress</span>
                      <span className="font-bold text-gray-700">{task.achieved}/{task.target} <span className="font-normal text-gray-400">{task.unit}</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                        className={`h-2 rounded-full bg-gradient-to-r ${cat.gradient}`} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% complete</p>
                  </div>

                  {task.submissions?.[0]?.profileComment && (
                    <div className="p-2.5 bg-blue-50 rounded-xl text-xs">
                      <p className="font-semibold text-blue-800 mb-0.5">Profile Details:</p>
                      <p className="text-blue-700 line-clamp-2">{task.submissions[0].profileComment}</p>
                    </div>
                  )}

                  {task.status === 'overdue' && (
                    <div className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2.5 py-1.5 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5" /> Overdue
                    </div>
                  )}

                  {task.status === 'active' && (
                    <button onClick={() => { setSelectedTask(task); setShowModal(true); }}
                      className="mt-auto w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl text-xs font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Update Progress
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Activity Modal */}
      <AnimatePresence>
        {showModal && selectedTask && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Update Activity</h3>
                    <p className="text-xs text-gray-400">{selectedTask.title}</p>
                  </div>
                </div>
                <button onClick={() => { setShowModal(false); setSelectedTask(null); setActivityData({ actual: '', notes: '', profileComment: '' }); }}
                  className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-3.5 bg-gray-50 rounded-xl text-sm">
                  <p className="text-gray-600">Target: <span className="font-semibold text-gray-800">{selectedTask.target} {selectedTask.unit}</span></p>
                  <p className="text-gray-600 mt-0.5">Current: <span className="font-semibold text-gray-800">{selectedTask.achieved} {selectedTask.unit}</span></p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Actual Count *</label>
                  <input type="number" min="0" value={activityData.actual}
                    onChange={e => setActivityData(p => ({ ...p, actual: e.target.value }))}
                    placeholder="Enter actual count"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Notes</label>
                  <textarea rows={3} value={activityData.notes}
                    onChange={e => setActivityData(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Add any notes about this activity"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition resize-none" />
                </div>
                {(selectedTask.category === 'submissions' || selectedTask.category === 'applications') && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Profile / Position Details</label>
                    <textarea rows={2} value={activityData.profileComment}
                      onChange={e => setActivityData(p => ({ ...p, profileComment: e.target.value }))}
                      placeholder="e.g., Applied for: Senior Dev @ ABC Corp – LinkedIn"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition resize-none" />
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button onClick={handleSubmit} disabled={submitMutation.isPending}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Activity'}
                </button>
                <button onClick={() => { setShowModal(false); setSelectedTask(null); setActivityData({ actual: '', notes: '', profileComment: '' }); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}