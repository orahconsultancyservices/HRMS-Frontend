// src/components/teamlead/TeamLeadDashboard.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingUp, Target, AlertCircle,
  CheckCircle, Clock, Eye, Edit,
  BarChart3, Calendar, Award, X, Loader2,
  ArrowRight, Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useTeamPerformanceSummary } from '../../hooks/usePerformance';

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  position: string;
  avatar: string;
  designation?: { name: string };
}

interface Task {
  id: number;
  title: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: string;
  target: number;
  achieved: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  assignedTo: TeamMember;
  submissions: Array<{ id: number; count: number; date: string; notes?: string }>;
}

interface TeamLeadDashboardProps {
  currentUser: {
    id: number;
    empId: string;
    name: string;
    email: string;
    department: string;
    position: string;
  };
}

function getProgressPct(task: Task) {
  return task.target > 0 ? Math.min((task.achieved / task.target) * 100, 100) : 0;
}
function getPerfColor(rate: number) {
  return rate >= 90 ? 'text-emerald-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600';
}

const typeColors: Record<string, string> = {
  daily: 'bg-blue-100 text-blue-700', weekly: 'bg-emerald-100 text-emerald-700', monthly: 'bg-violet-100 text-violet-700',
};
const statusColors: Record<string, string> = {
  active: 'bg-amber-100 text-amber-700', completed: 'bg-emerald-100 text-emerald-700', overdue: 'bg-red-100 text-red-700',
};
const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700',
};

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.35 } } };

export default function TeamLeadDashboard({ currentUser }: TeamLeadDashboardProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'tasks' | 'performance'>('overview');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({ newTarget: '', reason: '' });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const queryClient = useQueryClient();

  const notify = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: teamPerformance, isLoading: perfLoading } = useQuery({
    queryKey: ['team-performance', currentUser.id],
    queryFn: async () => {
      const now = new Date();
      const res = await axios.get(
        `/api/performance/team/performance-summary?teamLeadId=${currentUser.id}&year=${now.getFullYear()}&month=${now.getMonth() + 1}`
      );
      return res.data.data;
    }
  });

  const { data: teamTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['team-tasks', currentUser.id],
    queryFn: async () => {
      const res = await axios.get(`/api/task-assignment/team/tasks?teamLeadId=${currentUser.id}`);
      return res.data.data;
    }
  });

  const adjustTargetMutation = useMutation({
    mutationFn: async (data: any) => (await axios.put(`/api/task-assignment/tasks/${data.taskId}/adjust-target`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-performance'] });
      notify('Task target adjusted successfully!', true);
      setShowAdjustModal(false);
      setAdjustmentData({ newTarget: '', reason: '' });
      setSelectedTask(null);
    },
    onError: (e: any) => notify(e.response?.data?.message || 'Failed to adjust target', false)
  });

  const teamStats = (teamPerformance as any)?.summary || {
    totalMembers: 0, averageAchievement: 0, underperformers: []
  };
  const taskStats = (teamTasks as any)?.stats || { activeTasks: 0 };

  if (perfLoading || tasksLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
      <p className="text-gray-400 text-sm font-medium">Loading team data...</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6 pb-10">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border-l-4 ${toast.ok ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
            <span className="font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={iv} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Team Lead Dashboard</h2>
          </div>
          <p className="text-gray-400 text-sm ml-10">{currentUser.department} · {currentUser.name}</p>
        </div>
      </motion.div>

      <motion.div variants={iv} className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
        {([
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'tasks', label: 'Tasks', icon: Target },
          { id: 'performance', label: 'Performance', icon: Award },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setSelectedView(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${selectedView === tab.id ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </motion.div>

      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Team Members', value: teamStats.totalMembers, color: 'blue', icon: Users },
          { label: 'Avg Achievement', value: `${Math.round(teamStats.averageAchievement)}%`, color: 'green', icon: TrendingUp },
          { label: 'Active Tasks', value: taskStats.activeTasks, color: 'amber', icon: Clock },
          { label: 'Underperformers', value: teamStats.underperformers.length, color: 'red', icon: AlertCircle },
        ].map((c, i) => (
          <motion.div key={i} whileHover={{ y: -2 }} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c.color === 'blue' ? 'bg-blue-50' : c.color === 'green' ? 'bg-emerald-50' : c.color === 'amber' ? 'bg-amber-50' : 'bg-red-50'}`}>
              <c.icon className={`w-4 h-4 ${c.color === 'blue' ? 'text-blue-500' : c.color === 'green' ? 'text-emerald-500' : c.color === 'amber' ? 'text-amber-500' : 'text-red-500'}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs font-medium text-gray-400 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {selectedView === 'overview' && (
        <motion.div variants={iv} className="space-y-5">

          {/* ── Conversion Ratios (recruitment funnel metrics) ── */}
          {(() => {
            const allTasks: Task[] = (teamTasks as any)?.tasks ?? [];
            // Sum achieved per category across all team tasks
            const catTotals: Record<string, number> = {};
            allTasks.forEach(t => {
              catTotals[t.category] = (catTotals[t.category] || 0) + t.achieved;
            });
            const screenings   = catTotals['screenings']   || 0;
            const interviews   = catTotals['interviews']   || 0;
            const submissions  = catTotals['submissions']  || 0;
            const placements   = catTotals['placements']   || 0;
            const applications = catTotals['applications'] || 0;

            const safe = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
            const ratios = [
              { label: 'Apps → Screenings',    from: applications, to: screenings,  pct: safe(screenings, applications)  },
              { label: 'Screenings → Interviews', from: screenings, to: interviews, pct: safe(interviews, screenings)    },
              { label: 'Interviews → Submissions', from: interviews, to: submissions, pct: safe(submissions, interviews)  },
              { label: 'Submissions → Placements', from: submissions, to: placements, pct: safe(placements, submissions)  },
            ].filter(r => r.from > 0 || r.to > 0);

            if (ratios.length === 0) return null;

            return (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 p-5 border-b border-gray-50">
                  <Filter className="w-5 h-5 text-violet-500" />
                  <h3 className="font-bold text-gray-800">Team Conversion Ratios</h3>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Cumulative (all tasks)</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Applications', value: applications, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                      { label: 'Screenings',   value: screenings,   color: 'bg-pink-50 text-pink-700 border-pink-100'       },
                      { label: 'Interviews',   value: interviews,   color: 'bg-violet-50 text-violet-700 border-violet-100' },
                      { label: 'Placements',   value: placements,   color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                    ].map(s => (
                      <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                        <p className="text-2xl font-black">{s.value.toLocaleString()}</p>
                        <p className="text-xs font-semibold opacity-70 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {ratios.map(r => (
                      <div key={r.label} className="flex items-center gap-3">
                        <p className="text-xs text-gray-500 w-44 shrink-0">{r.label}</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(r.pct, 100)}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-2 rounded-full ${r.pct >= 60 ? 'bg-emerald-500' : r.pct >= 30 ? 'bg-amber-500' : 'bg-red-400'}`}
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-gray-500">{r.from}</span>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <span className="text-xs font-bold text-gray-700">{r.to}</span>
                          <span className={`text-xs font-black ml-1 ${r.pct >= 60 ? 'text-emerald-600' : r.pct >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                            {r.pct}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <Users className="w-5 h-5 text-teal-500" />
              <h3 className="font-bold text-gray-800">Team Performance</h3>
            </div>
            <div className="p-5 space-y-3">
              {(teamPerformance as any)?.performances?.slice(0, 5).map((perf: any) => (
                <div key={perf.employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {perf.employee.firstName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{perf.employee.firstName} {perf.employee.lastName}</p>
                      <p className="text-xs text-gray-400">{perf.employee.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getPerfColor(perf.achievementPercent)}`}>{Math.round(perf.achievementPercent)}%</p>
                    <p className="text-xs text-gray-400">{perf.totalAchieved}/{perf.totalTarget}</p>
                  </div>
                </div>
              ))}
              {!(teamPerformance as any)?.performances?.length && (
                <div className="text-center py-8 text-gray-300">
                  <Users className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No performance data yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-gray-800">Underperformers</h3>
            </div>
            <div className="p-5">
              {teamStats.underperformers.length === 0 ? (
                <div className="text-center py-8 text-emerald-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-medium text-sm">No underperformers this month!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamStats.underperformers.map((member: any) => (
                    <div key={member.employee.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{member.employee.firstName} {member.employee.lastName}</p>
                          <p className="text-xs text-gray-400">{member.employee.position}</p>
                        </div>
                      </div>
                      <p className="font-bold text-red-600">{Math.round(member.achievementPercent)}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>{/* end grid cols-1 lg:cols-2 */}
        </motion.div>
      )}

      {selectedView === 'tasks' && (
        <motion.div variants={iv} className="space-y-4">
          {!(teamTasks as any)?.tasks?.length && (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <Target className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">No team tasks found</p>
            </div>
          )}
          {(teamTasks as any)?.tasks?.map((task: Task) => {
            const pct = getProgressPct(task);
            return (
              <motion.div key={task.id} whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.07)' }}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-800">{task.title}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${typeColors[task.type]}`}>{task.type}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${statusColors[task.status]}`}>{task.status}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 flex-wrap">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                      <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" />{task.target} {task.unit}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{task.achieved} {task.unit}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-700">{Math.round(pct)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                          className={`h-2 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                      </div>
                    </div>
                    {task.submissions?.length > 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        <p className="font-medium mb-1">Recent Activity:</p>
                        {task.submissions.slice(0, 3).map(s => (
                          <div key={s.id} className="flex justify-between">
                            <span>+{s.count} {task.unit}</span>
                            <span>{new Date(s.date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                      <Eye className="w-4 h-4 text-teal-500" />
                    </button>
                    {task.status === 'active' && (
                      <button onClick={() => { setSelectedTask(task); setShowAdjustModal(true); }}
                        className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {selectedView === 'performance' && (
        <motion.div variants={iv} className="space-y-4">
          {(teamPerformance as any)?.performances?.map((perf: any) => (
            <motion.div key={perf.employee.id} whileHover={{ y: -2 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {perf.employee.firstName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{perf.employee.firstName} {perf.employee.lastName}</h3>
                      <p className="text-xs text-gray-400">{perf.employee.position} · {perf.employee.department}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    {[
                      { label: 'Total Tasks', value: perf.totalTasksAssigned, color: 'text-gray-800' },
                      { label: 'Completed', value: perf.totalTasksCompleted, color: 'text-emerald-600' },
                      { label: 'Target', value: perf.totalTarget, color: 'text-gray-800' },
                      { label: 'Achieved', value: perf.totalAchieved, color: 'text-teal-600' },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-xs text-gray-400">{s.label}</p>
                        <p className={`font-semibold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Achievement Rate</span>
                      <span className={`font-bold ${getPerfColor(perf.achievementPercent)}`}>{Math.round(perf.achievementPercent)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(perf.achievementPercent, 100)}%` }} transition={{ duration: 0.8 }}
                        className={`h-2 rounded-full ${perf.achievementPercent >= 80 ? 'bg-emerald-500' : perf.achievementPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                  </div>
                  {perf.trendVsLastMonth && (
                    <div className="flex items-center gap-2 text-xs mt-2">
                      <TrendingUp className={`w-4 h-4 ${perf.trendVsLastMonth === 'up' ? 'text-emerald-500' : perf.trendVsLastMonth === 'down' ? 'text-red-500' : 'text-gray-400'}`} />
                      <span className="text-gray-500">
                        {perf.trendVsLastMonth === 'up' ? 'Improving' : perf.trendVsLastMonth === 'down' ? 'Declining' : 'Stable'}
                        {perf.percentageChange && ` (${perf.percentageChange > 0 ? '+' : ''}${perf.percentageChange.toFixed(1)}%)`}
                      </span>
                    </div>
                  )}
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer ml-4 shrink-0">
                  <Eye className="w-4 h-4 text-teal-500" />
                </button>
              </div>
            </motion.div>
          ))}
          {!(teamPerformance as any)?.performances?.length && (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <Award className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">No performance data available</p>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showAdjustModal && selectedTask && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Edit className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Adjust Task Target</h3>
                    <p className="text-xs text-gray-400">{selectedTask.title}</p>
                  </div>
                </div>
                <button onClick={() => { setShowAdjustModal(false); setSelectedTask(null); setAdjustmentData({ newTarget: '', reason: '' }); }}
                  className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3.5 bg-gray-50 rounded-xl text-sm space-y-1">
                  <p className="text-gray-600">Assigned to: <span className="font-semibold text-gray-800">{selectedTask.assignedTo.firstName} {selectedTask.assignedTo.lastName}</span></p>
                  <p className="text-gray-600">Current target: <span className="font-semibold text-gray-800">{selectedTask.target} {selectedTask.unit}</span></p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">New Target *</label>
                  <input type="number" min="1" value={adjustmentData.newTarget}
                    onChange={e => setAdjustmentData(p => ({ ...p, newTarget: e.target.value }))}
                    placeholder="Enter new target"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition" />
                  <p className="text-xs text-gray-400 mt-1">Can only adjust within ±20% of default target</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Reason for Adjustment *</label>
                  <textarea rows={3} value={adjustmentData.reason}
                    onChange={e => setAdjustmentData(p => ({ ...p, reason: e.target.value }))}
                    placeholder="Explain why this adjustment is necessary"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition resize-none" />
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button onClick={() => {
                  if (!selectedTask || !adjustmentData.newTarget || !adjustmentData.reason) {
                    notify('Please provide new target and reason', false); return;
                  }
                  adjustTargetMutation.mutate({ taskId: selectedTask.id, newTarget: parseInt(adjustmentData.newTarget), adjustedBy: currentUser.id, reason: adjustmentData.reason });
                }} disabled={adjustTargetMutation.isPending}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {adjustTargetMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Adjusting...</> : 'Adjust Target'}
                </button>
                <button onClick={() => { setShowAdjustModal(false); setSelectedTask(null); setAdjustmentData({ newTarget: '', reason: '' }); }}
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