// src/components/teamlead/TargetAdjustment.tsx
// Team Lead Target Adjustment UI — ±20% Target Modification with Reason

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, ChevronUp, ChevronDown, Check,
  X, AlertCircle, Search, RefreshCw, Users,
  TrendingUp, TrendingDown, Minus, Info, Target,
  Edit3, Clock, CheckCircle
} from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useEmployees } from '../../hooks/useEmployees';
import { taskApi } from '../../services/taskApi';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface TargetAdjustmentProps {
  currentUser: {
    id: number;
    name: string;
    role: 'teamlead';
  };
}

interface AdjustmentForm {
  taskId: number;
  adjustment: number;   // -20 to +20 (percentage)
  reason: string;
  newTarget: number;
}

// Task fields from the backend (originalTarget, adjustedDate, adjustedBy come from DB)
interface AdjustedTask {
  id: number;
  title: string;
  type: string;
  category: string;
  target: number;
  originalTarget?: number;   // set when a target has been adjusted
  adjustedDate?: string;
  adjustedBy?: number;
  assignedToId: number;
  unit: string;
  achieved: number;
  status: string;
  isLocked: boolean;
  submissions?: any[];
  notes?: string;
}

const ADJUSTMENT_REASONS = [
  'Employee exceeded baseline performance',
  'Market conditions changed',
  'Resource constraints identified',
  'Seasonal demand adjustment',
  'Employee new to role',
  'Exceptional performance last period',
  'Project scope change',
  'Team capacity reduction',
  'Custom reason…',
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getAdjustmentColor = (pct: number) => {
  if (pct > 0)  return { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: TrendingUp };
  if (pct < 0)  return { text: 'text-red-600',     bg: 'bg-red-50 border-red-200',         icon: TrendingDown };
  return             { text: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200',       icon: Minus };
};

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

// ─────────────────────────────────────────────────────────────────────────────
// ADJUSTMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────

const AdjustModal = ({
  task, empName, onClose, onSave
}: {
  task: any; empName: string;
  onClose: () => void;
  onSave: (form: AdjustmentForm) => Promise<void>;
}) => {
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState(ADJUSTMENT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const effectiveReason = reason === 'Custom reason…' ? customReason : reason;
  const newTarget = Math.round(task.target * (1 + adjustment / 100));
  const delta = newTarget - task.target;
  const { text, bg, icon: DirIcon } = getAdjustmentColor(adjustment);

  const handleSave = async () => {
    if (!effectiveReason.trim()) { setError('Please provide a reason for the adjustment.'); return; }
    if (adjustment === 0) { setError('Please set a non-zero adjustment percentage.'); return; }
    setIsSaving(true);
    setError('');
    try {
      await onSave({ taskId: task.id, adjustment, reason: effectiveReason, newTarget });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save adjustment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SlidersHorizontal className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">Adjust Target</h3>
              </div>
              <p className="text-white/70 text-xs">{task.title} · {empName}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl cursor-pointer">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Current target info */}
          <div className="flex gap-4">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 font-medium mb-1">Current Target</p>
              <p className="text-2xl font-black text-gray-800">{task.target.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{task.unit}</p>
            </div>
            <div className={`flex-1 border rounded-xl p-4 text-center ${bg}`}>
              <p className={`text-xs font-medium mb-1 ${text}`}>New Target</p>
              <p className={`text-2xl font-black ${text}`}>{newTarget.toLocaleString()}</p>
              <p className={`text-xs ${text} opacity-70`}>
                {delta > 0 ? `+${delta}` : delta} {task.unit}
              </p>
            </div>
          </div>

          {/* Adjustment slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-gray-700">Adjustment %</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdjustment(p => clamp(p - 5, -20, 20))}
                  className="w-8 h-8 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center justify-center hover:bg-red-100 transition cursor-pointer font-bold text-sm"
                >−5</button>
                <div className={`w-20 text-center py-1.5 rounded-xl border font-black text-lg ${bg} ${text}`}>
                  {adjustment > 0 ? `+${adjustment}` : adjustment}%
                </div>
                <button
                  onClick={() => setAdjustment(p => clamp(p + 5, -20, 20))}
                  className="w-8 h-8 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition cursor-pointer font-bold text-sm"
                >+5</button>
              </div>
            </div>

            <input
              type="range" min={-20} max={20} step={1}
              value={adjustment}
              onChange={e => setAdjustment(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>−20% (decrease)</span>
              <span>0</span>
              <span>+20% (increase)</span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-2">
            {[-20, -10, -5, 0, 5, 10, 20].map(v => (
              <button key={v} onClick={() => setAdjustment(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  adjustment === v
                    ? v > 0 ? 'bg-emerald-500 text-white border-emerald-500'
                    : v < 0 ? 'bg-red-500 text-white border-red-500'
                    : 'bg-gray-700 text-white border-gray-700'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                {v > 0 ? `+${v}%` : `${v}%`}
              </button>
            ))}
          </div>

          {/* Reason select */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Reason for Adjustment *</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-400 cursor-pointer"
            >
              {ADJUSTMENT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {reason === 'Custom reason…' && (
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Explain the reason for this adjustment…"
                rows={3}
                className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-teal-400"
              />
            )}
          </div>

          {/* Authority note */}
          <div className="flex items-start gap-2 p-3 bg-teal-50 border border-teal-100 rounded-xl">
            <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
            <p className="text-xs text-teal-700">
              As Team Lead, you can adjust targets within ±20% of the original value.
              Adjustments beyond this range require employer approval. This will be logged for audit.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving || adjustment === 0}
              className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving
                ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><Check className="w-4 h-4" /> Save Adjustment</>}
            </motion.button>
            <button onClick={onClose}
              className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const TargetAdjustment = ({ currentUser }: TargetAdjustmentProps) => {
  const { data: tasksRaw = [], isLoading, refetch } = useTasks();
  const { data: rawEmployees = [] } = useEmployees();

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [adjustedTasks, setAdjustedTasks] = useState<Record<number, { newTarget: number; reason: string; adjustment: number }>>({});

  // Build a set of team-member IDs (employees whose reportTo points to this team lead)
  const teamMemberIds = useMemo(() => {
    const raw = Array.isArray(rawEmployees) ? rawEmployees : [];
    return new Set(
      raw
        .filter((e: any) => e.reportTo === currentUser.id)
        .map((e: any) => e.id)
    );
  }, [rawEmployees, currentUser.id]);

  const tasks: any[] = useMemo(() => {
    const raw = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw as any)?.data || [];
    // Show tasks assigned TO a team member OR assigned BY this team lead
    return raw.filter((t: any) =>
      teamMemberIds.has(t.assignedToId) || t.assignedById === currentUser.id
    );
  }, [tasksRaw, currentUser.id, teamMemberIds]);

  const employeeMap = useMemo(() => {
    const raw = Array.isArray(rawEmployees) ? rawEmployees : [];
    const map: Record<number, string> = {};
    raw.forEach((e: any) => {
      map[e.id] = e.name ?? `${e.firstName || ''} ${e.lastName || ''}`.trim();
    });
    return map;
  }, [rawEmployees]);

  const filteredTasks = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return tasks.filter(t => {
      if (!searchTerm) return true;
      const empName = employeeMap[t.assignedToId] ?? '';
      return t.title.toLowerCase().includes(lower) || empName.toLowerCase().includes(lower);
    });
  }, [tasks, searchTerm, employeeMap]);

  const handleSaveAdjustment = async (form: AdjustmentForm) => {
    // Call the real backend: PUT /api/task-assignment/tasks/:taskId/adjust-target
    await taskApi.adjustTarget(
      form.taskId,
      form.newTarget,
      currentUser.id,
      form.reason
    );
    // Optimistic UI update so the table reflects the new target immediately
    setAdjustedTasks(prev => ({
      ...prev,
      [form.taskId]: { newTarget: form.newTarget, reason: form.reason, adjustment: form.adjustment }
    }));
    setSelectedTask(null);
    setSuccessMsg(`Target adjusted to ${form.newTarget.toLocaleString()} (${form.adjustment > 0 ? '+' : ''}${form.adjustment}%)`);
    setTimeout(() => setSuccessMsg(''), 4000);
    // Refresh task list so the updated target is fetched from DB
    refetch();
  };

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-14 h-14 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6 pb-10">

      {/* Header */}
      <motion.div variants={iv} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Target Adjustment</h2>
          </div>
          <p className="text-gray-400 text-sm ml-12">Modify task targets within ±20% · Logged for audit</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-800">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authority note */}
      <motion.div variants={iv}
        className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
        <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-teal-800">Team Lead Authority</p>
          <p className="text-xs text-teal-700 mt-0.5">
            You can adjust targets for your team members within a ±20% band. Every adjustment
            requires a documented reason and is permanently logged in the audit trail.
            Adjustments beyond ±20% need employer approval.
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={iv} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search tasks or employees…" value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white" />
      </motion.div>

      {/* Tasks table */}
      <motion.div variants={iv} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-500" /> Your Team's Tasks
          </h3>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
            {filteredTasks.length} tasks
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No tasks found for your team</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Task', 'Employee', 'Current Target', 'Achieved', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTasks.map(task => {
                  const adjusted = adjustedTasks[task.id];
                  const currentTarget = adjusted?.newTarget ?? task.target;
                  const pct = currentTarget > 0 ? Math.round((task.achieved / currentTarget) * 100) : 0;
                  const empName = employeeMap[task.assignedToId] ?? `Employee #${task.assignedToId}`;
                  const isLocked = task.isLocked;

                  return (
                    <tr key={task.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                        <p className="text-xs text-gray-400 capitalize">{task.type} · {task.category}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {empName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{empName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <span className="text-sm font-bold text-gray-800">
                            {currentTarget.toLocaleString()} {task.unit}
                          </span>
                          {adjusted && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {adjusted.adjustment > 0
                                ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                                : <TrendingDown className="w-3 h-3 text-red-500" />}
                              <span className={`text-xs font-semibold ${adjusted.adjustment > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {adjusted.adjustment > 0 ? '+' : ''}{adjusted.adjustment}% adjusted
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <span className="text-sm font-bold text-gray-700">{task.achieved?.toLocaleString() ?? 0}</span>
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className="h-1.5 rounded-full"
                              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }} />
                          </div>
                          <span className="text-xs text-gray-400">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isLocked ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg w-fit">
                            <Clock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-lg capitalize w-fit flex items-center gap-1 ${
                            task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            task.status === 'overdue'   ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {task.status}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedTask(task)}
                          disabled={isLocked}
                          className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-xs font-semibold hover:bg-teal-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {adjusted ? 'Re-adjust' : 'Adjust'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Adjustment history — combines session adjustments + DB-persisted ones */}
      {(() => {
        // DB-persisted: tasks that have originalTarget set (already been adjusted)
        const dbAdjusted = tasks.filter((t: any) => t.originalTarget != null && t.originalTarget !== t.target);
        // Session adjustments not yet in DB list (freshly done this session)
        const sessionOnly = Object.entries(adjustedTasks).filter(([taskId]) =>
          !dbAdjusted.find(t => t.id === parseInt(taskId))
        );
        const hasHistory = dbAdjusted.length > 0 || sessionOnly.length > 0;
        if (!hasHistory) return null;
        return (
          <motion.div variants={iv} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" /> Adjustment Audit Log
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Persisted adjustments are pulled from the database. Reason is stored in task notes.</p>
            </div>
            <div className="divide-y divide-gray-50">
              {/* DB-persisted entries */}
              {dbAdjusted.map((task: any) => {
                const empName = employeeMap[task.assignedToId] ?? `Employee #${task.assignedToId}`;
                const adjPct = task.originalTarget > 0
                  ? Math.round(((task.target - task.originalTarget) / task.originalTarget) * 100)
                  : 0;
                const { text, bg } = getAdjustmentColor(adjPct);
                return (
                  <div key={task.id} className="p-4 flex items-center gap-4">
                    <div className={`px-2.5 py-1 rounded-lg text-sm font-black border ${bg} ${text}`}>
                      {adjPct > 0 ? '+' : ''}{adjPct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                      <p className="text-xs text-gray-400">
                        {empName} · {task.originalTarget} → {task.target} {task.unit}
                        {task.adjustedDate ? ` · ${new Date(task.adjustedDate).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-teal-600 font-semibold bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg">Saved</span>
                  </div>
                );
              })}
              {/* Session-only entries (just done, not yet in DB list from tasks query) */}
              {sessionOnly.map(([taskId, adj]) => {
                const task = tasks.find(t => t.id === parseInt(taskId));
                const empName = task ? (employeeMap[task.assignedToId] ?? `Employee #${task.assignedToId}`) : 'Unknown';
                const { text, bg } = getAdjustmentColor(adj.adjustment);
                return (
                  <div key={taskId} className="p-4 flex items-center gap-4">
                    <div className={`px-2.5 py-1 rounded-lg text-sm font-black border ${bg} ${text}`}>
                      {adj.adjustment > 0 ? '+' : ''}{adj.adjustment}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{task?.title ?? `Task #${taskId}`}</p>
                      <p className="text-xs text-gray-400">{empName} · New target: {adj.newTarget.toLocaleString()} {task?.unit}</p>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">This session</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* Adjust Modal */}
      <AnimatePresence>
        {selectedTask && (
          <AdjustModal
            task={selectedTask}
            empName={employeeMap[selectedTask.assignedToId] ?? `Employee #${selectedTask.assignedToId}`}
            onClose={() => setSelectedTask(null)}
            onSave={handleSaveAdjustment}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default TargetAdjustment;