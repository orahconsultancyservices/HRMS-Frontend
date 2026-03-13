// src/components/employee/EmployeeKPIWidget.tsx
// Today's Targets + Progress Bars + Month-to-Date Performance

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, CheckCircle2, Clock, AlertCircle, BarChart3, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { taskApi } from '../../services/taskApi';

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
  priority: 'low' | 'medium' | 'high';
  submissions?: { count: number; date: string }[];
}

interface EmployeeStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: string;
  totalSubmissions: number;
  categoryBreakdown: Record<string, { target: number; achieved: number; count: number }>;
  tasks: Task[];
}

interface EmployeeKPIWidgetProps {
  employee: {
    id?: number;
    empId: string;
    name: string;
    employeeId?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getProgressColor = (pct: number) => {
  if (pct >= 100) return { bar: 'from-green-400 to-emerald-500', text: 'text-green-600', bg: 'bg-green-50' };
  if (pct >= 70)  return { bar: 'from-[#6B8DA2] to-[#5a7a8e]',  text: 'text-[#6B8DA2]', bg: 'bg-blue-50' };
  if (pct >= 40)  return { bar: 'from-[#F5A42C] to-[#e8921a]',  text: 'text-[#F5A42C]', bg: 'bg-yellow-50' };
  return { bar: 'from-red-400 to-red-500', text: 'text-red-500', bg: 'bg-red-50' };
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':   return 'bg-red-100 text-red-600 border border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-600 border border-yellow-200';
    default:       return 'bg-gray-100 text-gray-500 border border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'overdue':   return <AlertCircle  className="w-4 h-4 text-red-500" />;
    default:          return <Clock        className="w-4 h-4 text-[#6B8DA2]" />;
  }
};

const todayISOStr = () => new Date().toISOString().split('T')[0];

const taskAchievedToday = (task: Task): number => {
  const today = todayISOStr();
  return (task.submissions || [])
    .filter(s => s.date.startsWith(today))
    .reduce((sum, s) => sum + s.count, 0);
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const AnimatedProgressBar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(pct, 100)}%` }}
      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      className={`h-full rounded-full bg-gradient-to-r ${color}`}
    />
  </div>
);

const StatCard = ({
  label, value, sub, icon, gradient,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; gradient: string;
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`rounded-xl p-4 ${gradient} flex items-start gap-3`}
  >
    <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const EmployeeKPIWidget = ({ employee }: EmployeeKPIWidgetProps) => {
  const [stats, setStats]               = useState<EmployeeStats | null>(null);
  const [allTasks, setAllTasks]         = useState<Task[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [activeTab, setActiveTab]       = useState<'today' | 'mtd'>('today');

  // resolve numeric DB id
  const employeeId = employee.id
    ? employee.id
    : parseInt(employee.empId) || 1;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, tasksRes] = await Promise.all([
          taskApi.getEmployeeStats(employeeId),
          taskApi.getByEmployee(employeeId),
        ]);

        if (statsRes?.data) setStats(statsRes.data);
        if (tasksRes?.data) setAllTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      } catch (err) {
        console.error('Error loading KPI data:', err);
        setError('Failed to load KPI data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [employeeId]);

  // ── Derived sets ────────────────────────────────────────────────────────────
  const today     = todayISOStr();
  const todayTasks = allTasks.filter(t => t.type === 'daily');
  const mtdTasks   = allTasks.filter(t => t.type === 'monthly');

  // overall daily completion today
  const todayTotalTarget   = todayTasks.reduce((s, t) => s + t.target, 0);
  const todayTotalAchieved = todayTasks.reduce((s, t) => s + taskAchievedToday(t), 0);
  const todayOverallPct    = todayTotalTarget > 0
    ? Math.round((todayTotalAchieved / todayTotalTarget) * 100)
    : 0;

  // MTD overall
  const mtdTotalTarget   = allTasks.reduce((s, t) => s + t.target, 0);
  const mtdTotalAchieved = allTasks.reduce((s, t) => s + t.achieved, 0);
  const mtdPct           = mtdTotalTarget > 0
    ? Math.round((mtdTotalAchieved / mtdTotalTarget) * 100)
    : 0;

  const overallColors = getProgressColor(activeTab === 'today' ? todayOverallPct : mtdPct);

  // ── Variants ────────────────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-4"
    >
      {/* ── Header summary row ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Today's Tasks"
          value={todayTasks.length}
          sub={`${todayTasks.filter(t => taskAchievedToday(t) >= t.target).length} completed`}
          icon={<Target className="w-4 h-4 text-[#6B8DA2]" />}
          gradient="bg-gradient-to-br from-blue-50 to-[#6B8DA2]/10 text-[#6B8DA2]"
        />
        <StatCard
          label="Today's Progress"
          value={`${todayOverallPct}%`}
          sub={`${todayTotalAchieved} / ${todayTotalTarget}`}
          icon={<Zap className="w-4 h-4 text-[#F5A42C]" />}
          gradient="bg-gradient-to-br from-yellow-50 to-[#F5A42C]/10 text-[#F5A42C]"
        />
        <StatCard
          label="MTD Achievement"
          value={`${mtdPct}%`}
          sub={`${mtdTotalAchieved} / ${mtdTotalTarget}`}
          icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
          gradient="bg-gradient-to-br from-purple-50 to-purple-100/60 text-purple-600"
        />
        <StatCard
          label="Total Completed"
          value={stats?.completedTasks ?? 0}
          sub={`of ${stats?.totalTasks ?? 0} tasks`}
          icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
          gradient="bg-gradient-to-br from-green-50 to-emerald-100/60 text-green-600"
        />
      </motion.div>

      {/* ── Main card ───────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Card header with tabs */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6B8DA2]" />
            <h3 className="font-semibold text-gray-800 text-lg">KPI Tracker</h3>
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['today', 'mtd'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-[#6B8DA2] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'today' ? "Today's Targets" : 'Month-to-Date'}
              </button>
            ))}
          </div>
        </div>

        {/* Overall progress banner */}
        <div className={`mx-6 mt-5 mb-4 rounded-xl p-4 ${overallColors.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${overallColors.text}`}>
              {activeTab === 'today' ? "Today's Overall Progress" : 'Month-to-Date Achievement'}
            </span>
            <span className={`text-2xl font-bold ${overallColors.text}`}>
              {activeTab === 'today' ? todayOverallPct : mtdPct}%
            </span>
          </div>
          <AnimatedProgressBar
            pct={activeTab === 'today' ? todayOverallPct : mtdPct}
            color={overallColors.bar}
          />
          <p className="text-xs text-gray-500 mt-1.5">
            {activeTab === 'today'
              ? `${todayTotalAchieved} achieved out of ${todayTotalTarget} target today`
              : `${mtdTotalAchieved} achieved out of ${mtdTotalTarget} total target this month`}
          </p>
        </div>

        {/* Task list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-6 space-y-3"
          >
            {(activeTab === 'today' ? todayTasks : allTasks).length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {activeTab === 'today'
                    ? 'No daily tasks assigned for today'
                    : 'No tasks found for this month'}
                </p>
              </div>
            ) : (
              (activeTab === 'today' ? todayTasks : allTasks).map(task => {
                const achieved = activeTab === 'today'
                  ? taskAchievedToday(task)
                  : task.achieved;
                const pct = task.target > 0
                  ? Math.round((achieved / task.target) * 100)
                  : 0;
                const colors   = getProgressColor(pct);
                const isExpanded = expandedTaskId === task.id;

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors"
                  >
                    {/* Row */}
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3"
                    >
                      {/* status icon */}
                      <div className="flex-shrink-0">{getStatusIcon(task.status)}</div>

                      {/* title + category */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {task.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                            {task.category}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPriorityBadge(task.priority)} capitalize`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* inline progress */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(pct, 100)}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${colors.text} w-10 text-right`}>
                            {pct}%
                          </span>
                          <span className="text-xs text-gray-400">
                            {achieved}/{task.target} {task.unit}
                          </span>
                        </div>
                      </div>

                      {/* chevron */}
                      <div className="flex-shrink-0 text-gray-400">
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-gray-50 bg-gray-50/50 space-y-3">
                            {/* Bigger progress bar */}
                            <div>
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{achieved} / {task.target} {task.unit}</span>
                              </div>
                              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(pct, 100)}%` }}
                                  transition={{ duration: 0.8 }}
                                  className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                                />
                              </div>
                            </div>

                            {/* Meta grid */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-white rounded-lg p-2 border border-gray-100">
                                <p className="text-gray-400">Type</p>
                                <p className="font-semibold text-gray-700 capitalize mt-0.5">{task.type}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-100">
                                <p className="text-gray-400">Deadline</p>
                                <p className="font-semibold text-gray-700 mt-0.5">
                                  {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-100">
                                <p className="text-gray-400">Status</p>
                                <p className={`font-semibold mt-0.5 capitalize ${
                                  task.status === 'completed' ? 'text-green-600'
                                  : task.status === 'overdue' ? 'text-red-500'
                                  : 'text-[#6B8DA2]'
                                }`}>{task.status}</p>
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-xs text-gray-500 bg-white rounded-lg p-2 border border-gray-100">
                                {task.description}
                              </p>
                            )}

                            {/* Recent submissions */}
                            {task.submissions && task.submissions.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Recent submissions</p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {task.submissions.slice(0, 5).map((sub, i) => (
                                    <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-2 py-1 border border-gray-100">
                                      <span className="text-gray-500">
                                        {new Date(sub.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                      <span className="font-medium text-[#6B8DA2]">+{sub.count} {task.unit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Category breakdown (MTD only) ───────────────────────────────────── */}
      {activeTab === 'mtd' && stats?.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#6B8DA2]" />
            <h4 className="font-semibold text-gray-800">Category Breakdown</h4>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown).map(([cat, data]) => {
              const pct    = data.target > 0 ? Math.round((data.achieved / data.target) * 100) : 0;
              const colors = getProgressColor(pct);
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 capitalize font-medium">{cat}</span>
                    <span className={`font-semibold ${colors.text}`}>
                      {data.achieved} / {data.target} ({pct}%)
                    </span>
                  </div>
                  <AnimatedProgressBar pct={pct} color={colors.bar} />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmployeeKPIWidget;