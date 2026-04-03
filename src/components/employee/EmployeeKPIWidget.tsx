// src/components/employee/EmployeeKPIWidget.tsx
// Reworked: accurate Today/Weekly/Monthly tabs, Log Progress modal, clean layout

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, CheckCircle2, Clock, AlertCircle,
  BarChart3, ChevronDown, ChevronUp, Zap, Plus, X,
  Calendar, Award, Activity, Flame,
} from 'lucide-react';
import { taskApi } from '../../services/taskApi';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Submission {
  id?: number;
  count: number;
  date: string;
  notes?: string;
  profileComment?: string;
}

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
  isLocked?: boolean;
  submissions?: Submission[];
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

const todayISO = () => new Date().toISOString().split('T')[0];

/** Sum of submission counts on a given ISO date for one task */
const submittedOnDate = (task: Task, dateStr: string): number =>
  (task.submissions || [])
    .filter(s => s.date.startsWith(dateStr))
    .reduce((s, sub) => s + sub.count, 0);

/** Sum of all submissions this week (Mon–Sun) */
const submittedThisWeek = (task: Task): number => {
  const now  = new Date();
  const day  = now.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1 - day); // days to Monday
  const mon  = new Date(now); mon.setDate(now.getDate() + diff); mon.setHours(0,0,0,0);
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6);    sun.setHours(23,59,59,999);
  return (task.submissions || [])
    .filter(s => { const d = new Date(s.date); return d >= mon && d <= sun; })
    .reduce((s, sub) => s + sub.count, 0);
};

const pctOf = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

const progressColor = (pct: number) => {
  if (pct >= 100) return { bar: 'from-emerald-400 to-green-500',  text: 'text-emerald-600', ring: 'border-emerald-400', badge: 'bg-emerald-50 text-emerald-700' };
  if (pct >= 70)  return { bar: 'from-[#6B8DA2] to-[#4e7388]',   text: 'text-[#6B8DA2]',   ring: 'border-[#6B8DA2]',   badge: 'bg-blue-50 text-[#6B8DA2]'   };
  if (pct >= 40)  return { bar: 'from-[#F5A42C] to-[#d98a18]',   text: 'text-[#F5A42C]',   ring: 'border-[#F5A42C]',   badge: 'bg-amber-50 text-amber-700'  };
  return            { bar: 'from-red-400 to-rose-500',            text: 'text-red-500',      ring: 'border-red-400',     badge: 'bg-red-50 text-red-600'      };
};

const statusDot = (status: string) => {
  if (status === 'completed') return 'bg-emerald-400';
  if (status === 'overdue')   return 'bg-red-400';
  return 'bg-[#6B8DA2]';
};

const priorityChip = (p: string) => {
  if (p === 'high')   return 'bg-red-50 text-red-600 border border-red-200';
  if (p === 'medium') return 'bg-amber-50 text-amber-600 border border-amber-200';
  return 'bg-gray-50 text-gray-500 border border-gray-200';
};

const typeLabel: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
const typeIcon: Record<string, React.ReactNode> = {
  daily:   <Flame   className="w-3.5 h-3.5" />,
  weekly:  <Calendar className="w-3.5 h-3.5" />,
  monthly: <Award   className="w-3.5 h-3.5" />,
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

const Bar = ({ pct, color, thin }: { pct: number; color: string; thin?: boolean }) => (
  <div className={`w-full ${thin ? 'h-1.5' : 'h-2.5'} bg-gray-100 rounded-full overflow-hidden`}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(pct, 100)}%` }}
      transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`h-full rounded-full bg-gradient-to-r ${color}`}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// RADIAL RING (small summary circle)
// ─────────────────────────────────────────────────────────────────────────────

const Ring = ({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 100) / 100;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="currentColor" strokeWidth="4"
        strokeLinecap="round"
        className={color}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LOG PROGRESS MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface LogModalProps {
  task: Task;
  employeeId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const LogProgressModal = ({ task, employeeId, onClose, onSuccess }: LogModalProps) => {
  const [count, setCount]     = useState('');
  const [notes, setNotes]     = useState('');
  const [profile, setProfile] = useState('');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const submit = async () => {
    const n = parseInt(count);
    if (!n || n <= 0) { setErr('Enter a valid count greater than 0'); return; }
    setSaving(true); setErr('');
    try {
      await taskApi.submitProgress(task.id, {
        employeeId,
        count: n,
        notes: notes.trim() || undefined,
        profileComment: profile.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to submit. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const remainingToday = task.type === 'daily'
    ? Math.max(0, task.target - submittedOnDate(task, todayISO()))
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Log Progress</p>
              <h3 className="text-white font-bold text-lg leading-tight">{task.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full capitalize">
                  {task.type}
                </span>
                <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full capitalize">
                  {task.category}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress snapshot */}
        <div className="px-5 pt-4 pb-2">
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span className="font-medium">Current Progress</span>
              <span>{task.achieved} / {task.target} {task.unit}</span>
            </div>
            <Bar pct={pctOf(task.achieved, task.target)} color={progressColor(pctOf(task.achieved, task.target)).bar} />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-gray-400">{pctOf(task.achieved, task.target)}% complete</span>
              {remainingToday !== null && (
                <span className="text-xs text-[#6B8DA2] font-medium">
                  {remainingToday > 0 ? `${remainingToday} remaining today` : '✓ Todays target met!'}
                </span>
              )}
            </div>
          </div>

          {/* Count input */}
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Count to log <span className="text-gray-400 font-normal">({task.unit})</span>
            </label>
            <input
              type="number"
              min="1"
              value={count}
              onChange={e => { setCount(e.target.value); setErr(''); }}
              placeholder={`e.g. ${Math.ceil(task.target / 5)}`}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 transition"
            />
          </div>

          {/* Notes */}
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about this progress…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 transition resize-none"
            />
          </div>

          {/* Profile comment (recruitment context) */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Profile/Position detail <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={profile}
              onChange={e => setProfile(e.target.value)}
              placeholder="e.g. Applied: Senior Dev @ ABC Corp – LinkedIn"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 transition"
            />
          </div>

          {err && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{err}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</>
                : <><Plus className="w-4 h-4" />Log Progress</>}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="h-4" />
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TASK CARD
// ─────────────────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  achieved: number;
  tab: 'today' | 'weekly' | 'monthly';
  onLog: (task: Task) => void;
}

const TaskCard = ({ task, achieved, tab, onLog }: TaskCardProps) => {
  const [open, setOpen] = useState(false);
  const pct    = pctOf(achieved, task.target);
  const colors = progressColor(pct);
  const locked = task.isLocked || task.status === 'completed';

  // Today's submissions for daily tasks
  const todaySubs = (task.submissions || []).filter(s => s.date.startsWith(todayISO()));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden transition-colors ${
        locked ? 'border-gray-100 bg-gray-50/40' : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(task.status)}`} />

        {/* Info + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`text-sm font-semibold ${locked ? 'text-gray-400' : 'text-gray-800'} truncate`}>
              {task.title}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${priorityChip(task.priority)}`}>
              {task.priority}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
              {task.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Bar pct={pct} color={colors.bar} thin />
            </div>
            <span className={`text-xs font-bold w-8 text-right ${colors.text}`}>{pct}%</span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {achieved}/{task.target} {task.unit}
            </span>
          </div>
        </div>

        {/* Right side: log button + expand */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!locked && (
            <button
              onClick={() => onLog(task)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#6B8DA2]/10 text-[#6B8DA2] rounded-lg text-xs font-semibold hover:bg-[#6B8DA2]/20 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Log
            </button>
          )}
          {locked && task.status === 'completed' && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          )}
          <button
            onClick={() => setOpen(o => !o)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-gray-50 bg-gray-50/50 space-y-3">
              {/* Bigger bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{achieved} / {task.target} {task.unit}</span>
                </div>
                <Bar pct={pct} color={colors.bar} />
              </div>

              {/* Meta */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <p className="text-gray-400 mb-0.5">Type</p>
                  <p className="font-semibold text-gray-700 capitalize flex items-center gap-1">
                    {typeIcon[task.type]} {typeLabel[task.type]}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <p className="text-gray-400 mb-0.5">Deadline</p>
                  <p className="font-semibold text-gray-700">
                    {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <p className="text-gray-400 mb-0.5">Status</p>
                  <p className={`font-semibold capitalize ${
                    task.status === 'completed' ? 'text-emerald-600'
                    : task.status === 'overdue' ? 'text-red-500'
                    : 'text-[#6B8DA2]'
                  }`}>{task.status}</p>
                </div>
              </div>

              {task.description && (
                <p className="text-xs text-gray-500 bg-white rounded-lg p-2.5 border border-gray-100 leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Today's submissions (daily tab only) */}
              {tab === 'today' && todaySubs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Today's submissions</p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {todaySubs.map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 text-xs">
                        <span className="text-gray-400">
                          {new Date(s.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                        <span className="font-semibold text-[#6B8DA2]">+{s.count} {task.unit}</span>
                        {s.notes && <span className="text-gray-400 truncate max-w-[120px] ml-2">{s.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All-time recent submissions (other tabs) */}
              {tab !== 'today' && task.submissions && task.submissions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Recent submissions</p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {task.submissions.slice(0, 6).map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 text-xs">
                        <span className="text-gray-400">
                          {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="font-semibold text-[#6B8DA2]">+{s.count} {task.unit}</span>
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
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER (per task-type group)
// ─────────────────────────────────────────────────────────────────────────────

const SectionHeader = ({
  icon, label, achieved, target, count,
}: {
  icon: React.ReactNode; label: string;
  achieved: number; target: number; count: number;
}) => {
  const pct    = pctOf(achieved, target);
  const colors = progressColor(pct);
  return (
    <div className="flex items-center gap-3 mb-2 mt-1">
      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${colors.badge}`}>
        {icon} {label}
      </div>
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-gray-400">{count} task{count !== 1 ? 's' : ''}</span>
      <span className={`text-xs font-bold ${colors.text}`}>{pct}%</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const EmployeeKPIWidget = ({ employee }: EmployeeKPIWidgetProps) => {
  const [allTasks, setAllTasks]   = useState<Task[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [logTask, setLogTask]     = useState<Task | null>(null);

  const employeeId = employee.id
    ? Number(employee.id)
    : parseInt(employee.empId) || 1;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await taskApi.getByEmployee(employeeId);
      const tasks: Task[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
      setAllTasks(tasks);
    } catch {
      setError('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const today    = todayISO();
  const dailyT   = allTasks.filter(t => t.type === 'daily');
  const weeklyT  = allTasks.filter(t => t.type === 'weekly');
  const monthlyT = allTasks.filter(t => t.type === 'monthly');

  // Helper: task is "done" when completed OR deadline has passed — use task.achieved as truth
  const isFinalTask = (t: Task) =>
    t.status === 'completed' || new Date(t.deadline) < new Date();

  // TODAY tab: final tasks → task.achieved (DB truth); active tasks → today's subs only
  const dailyTodayAch  = dailyT.reduce((s, t) =>
    s + (isFinalTask(t) ? t.achieved : submittedOnDate(t, today)), 0);
  const dailyTotalTgt  = dailyT.reduce((s, t) => s + t.target, 0);
  const dailyPct       = pctOf(dailyTodayAch, dailyTotalTgt);

  // WEEKLY tab: final tasks → task.achieved; active tasks → this-week subs only
  const weeklyAch      = weeklyT.reduce((s, t) =>
    s + (isFinalTask(t) ? t.achieved : submittedThisWeek(t)), 0);
  const weeklyTgt      = weeklyT.reduce((s, t) => s + t.target, 0);
  const weeklyPct      = pctOf(weeklyAch, weeklyTgt);

  // MONTHLY tab: achieved = task.achieved (cumulative)
  const monthlyAch     = monthlyT.reduce((s, t) => s + t.achieved, 0);
  const monthlyTgt     = monthlyT.reduce((s, t) => s + t.target, 0);
  const monthlyPct     = pctOf(monthlyAch, monthlyTgt);

  // Overall (all types)
  const overallTgt     = allTasks.reduce((s, t) => s + t.target, 0);
  const overallAch     = allTasks.reduce((s, t) => s + t.achieved, 0);
  const overallPct     = pctOf(overallAch, overallTgt);
  const completedCount = allTasks.filter(t => t.status === 'completed').length;
  const overdueCount   = allTasks.filter(t => t.status === 'overdue').length;

  const tabs = [
    { key: 'today'   as const, label: "Today",    pct: dailyPct,   count: dailyT.length,   icon: <Flame    className="w-3.5 h-3.5" /> },
    { key: 'weekly'  as const, label: "Weekly",   pct: weeklyPct,  count: weeklyT.length,  icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: 'monthly' as const, label: "Monthly",  pct: monthlyPct, count: monthlyT.length, icon: <Award    className="w-3.5 h-3.5" /> },
  ];

  // Tasks and achieved counts per active tab
  const tabTasks: Task[] = {
    today:   dailyT,
    weekly:  weeklyT,
    monthly: monthlyT,
  }[activeTab];

  // Per-task achieved count for the active tab — uses same isFinalTask rule as aggregates
  const tabAchievedFn = (task: Task): number => {
    if (isFinalTask(task)) return task.achieved;  // DB total is authoritative for done tasks
    if (activeTab === 'today')  return submittedOnDate(task, today);
    if (activeTab === 'weekly') return submittedThisWeek(task);
    return task.achieved;
  };

  const tabTgt = { today: dailyTotalTgt, weekly: weeklyTgt, monthly: monthlyTgt }[activeTab];
  const tabAch = { today: dailyTodayAch, weekly: weeklyAch, monthly: monthlyAch }[activeTab];
  const tabPct = { today: dailyPct,      weekly: weeklyPct, monthly: monthlyPct }[activeTab];
  const tabColors = progressColor(tabPct);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3 animate-pulse">
        <div className="h-5 w-40 bg-gray-100 rounded" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 text-center">
        <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
        <p className="text-sm text-red-500 font-medium">{error}</p>
        <button
          onClick={load}
          className="mt-3 text-xs text-[#6B8DA2] underline cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* ── Summary strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Overall ring card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Ring pct={overallPct} color={progressColor(overallPct).text} />
              <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${progressColor(overallPct).text}`}>
                {overallPct}%
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Overall MTD</p>
              <p className="text-xl font-black text-gray-800">{overallAch}</p>
              <p className="text-xs text-gray-400">of {overallTgt}</p>
            </div>
          </div>

          {/* Today */}
          <div className={`rounded-2xl border shadow-sm p-4 ${progressColor(dailyPct).badge} border-opacity-30`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5" />
              <p className="text-xs font-semibold opacity-70">Today's Daily</p>
            </div>
            <p className="text-2xl font-black">{dailyPct}%</p>
            <p className="text-xs opacity-60">{dailyTodayAch} / {dailyTotalTgt} · {dailyT.length} tasks</p>
          </div>

          {/* Completed */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs font-semibold text-emerald-700 opacity-70">Completed</p>
            </div>
            <p className="text-2xl font-black text-emerald-700">{completedCount}</p>
            <p className="text-xs text-emerald-600 opacity-70">of {allTasks.length} tasks</p>
          </div>

          {/* Overdue */}
          <div className={`rounded-2xl border shadow-sm p-4 ${overdueCount > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className={`w-3.5 h-3.5 ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              <p className={`text-xs font-semibold opacity-70 ${overdueCount > 0 ? 'text-red-700' : 'text-gray-600'}`}>Overdue</p>
            </div>
            <p className={`text-2xl font-black ${overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{overdueCount}</p>
            <p className={`text-xs opacity-70 ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {overdueCount > 0 ? 'Need attention' : 'All good!'}
            </p>
          </div>
        </div>

        {/* ── Main KPI card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-6 pt-5 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#6B8DA2]" />
                <h3 className="font-bold text-gray-800">KPI Tracker</h3>
              </div>
              <button
                onClick={load}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer transition"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? progressColor(tab.pct).badge
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {tab.pct}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress summary banner */}
          <div className="px-6 pt-4 pb-2">
            <div className={`rounded-xl p-4 ${tabColors.badge}`}>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className={`text-xs font-semibold opacity-70 ${tabColors.text}`}>
                    {activeTab === 'today'   ? "Today's Daily Progress" :
                     activeTab === 'weekly'  ? "This Week's Progress" :
                                              "Month-to-Date Progress"}
                  </p>
                  <p className={`text-3xl font-black mt-0.5 ${tabColors.text}`}>{tabPct}%</p>
                </div>
                <p className={`text-xs opacity-60 ${tabColors.text}`}>
                  {tabAch} / {tabTgt} {tabTasks[0]?.unit || ''}
                </p>
              </div>
              <Bar pct={tabPct} color={tabColors.bar} />
            </div>
          </div>

          {/* Task list */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-6 pb-6 pt-2 space-y-2"
            >
              {tabTasks.length === 0 ? (
                <div className="text-center py-10">
                  <Target className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    No {activeTab === 'today' ? 'daily' : activeTab} tasks assigned
                  </p>
                </div>
              ) : (
                tabTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    achieved={tabAchievedFn(task)}
                    tab={activeTab}
                    onLog={setLogTask}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Category breakdown ─────────────────────────────────────────── */}
        {allTasks.length > 0 && (() => {
          const breakdown: Record<string, { achieved: number; target: number }> = {};
          allTasks.forEach(t => {
            if (!breakdown[t.category]) breakdown[t.category] = { achieved: 0, target: 0 };
            breakdown[t.category].achieved += t.achieved;
            breakdown[t.category].target   += t.target;
          });
          const entries = Object.entries(breakdown).sort((a, b) => pctOf(b[1].achieved, b[1].target) - pctOf(a[1].achieved, a[1].target));
          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#6B8DA2]" />
                <h4 className="font-bold text-gray-800 text-sm">Category Breakdown</h4>
                <span className="text-xs text-gray-400 ml-auto">Month-to-date</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entries.map(([cat, data]) => {
                  const pct    = pctOf(data.achieved, data.target);
                  const colors = progressColor(pct);
                  return (
                    <div key={cat} className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700 capitalize">{cat}</span>
                        <span className={`text-xs font-bold ${colors.text}`}>{pct}%</span>
                      </div>
                      <Bar pct={pct} color={colors.bar} thin />
                      <p className="text-[10px] text-gray-400 mt-1">{data.achieved} / {data.target}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}
      </motion.div>

      {/* ── Log Progress Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {logTask && (
          <LogProgressModal
            key={logTask.id}
            task={logTask}
            employeeId={employeeId}
            onClose={() => setLogTask(null)}
            onSuccess={load}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EmployeeKPIWidget;