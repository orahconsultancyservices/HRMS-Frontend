import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, Clock, CheckCircle2, Coffee,
  Crown, Shield, ChevronDown, ChevronRight,
  BarChart2, Loader2, Calendar, TrendingUp,
  ArrowLeft, Hash, Briefcase, User, Activity,
  RefreshCw, Zap
} from 'lucide-react';
import type { Department } from '../../hooks/useOrganization';
import { attendanceApi, performanceApi } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = 'today' | 'week' | 'month';
type AttStatus = 'present' | 'done' | 'break' | 'leave' | 'absent';

// ─── Palettes (mirrors DepartmentCards) ──────────────────────────────────────
const PALETTES = [
  { header: 'bg-blue-600',    text: 'text-blue-700',    light: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500'    },
  { header: 'bg-violet-600',  text: 'text-violet-700',  light: 'bg-violet-50',  border: 'border-violet-200', dot: 'bg-violet-500'  },
  { header: 'bg-pink-600',    text: 'text-pink-700',    light: 'bg-pink-50',    border: 'border-pink-200',   dot: 'bg-pink-500'    },
  { header: 'bg-teal-600',    text: 'text-teal-700',    light: 'bg-teal-50',    border: 'border-teal-200',   dot: 'bg-teal-500'    },
  { header: 'bg-amber-600',   text: 'text-amber-700',   light: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-500'   },
  { header: 'bg-emerald-600', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-500' },
];
const pal = (i: number) => PALETTES[i % PALETTES.length];

// ─── Date helpers ─────────────────────────────────────────────────────────────
const fmtDate = (d: Date) => d.toISOString().split('T')[0];
const todayDate = () => fmtDate(new Date());
function weekRange() {
  const now = new Date();
  const dow = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startDate: fmtDate(start), endDate: fmtDate(end) };
}
function curMonthYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}
function fmtTime(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function curMonthLabel() {
  const d = new Date();
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
function weekLabel() {
  const { startDate, endDate } = weekRange();
  const s = new Date(startDate), e = new Date(endDate);
  return `${s.getDate()} ${MONTH_NAMES[s.getMonth()]} – ${e.getDate()} ${MONTH_NAMES[e.getMonth()]}`;
}

// ─── Attendance helpers ───────────────────────────────────────────────────────
function deriveStatus(rec: any): AttStatus {
  if (!rec) return 'absent';
  const s = (rec.status || '').toLowerCase();
  if (s.includes('leave')) return 'leave';
  if (rec.activeBreak || s === 'break') return 'break';
  if (rec.checkIn && !rec.checkOut) return 'present';
  if (rec.checkIn && rec.checkOut) return 'done';
  return 'absent';
}
const STATUS_CFG: Record<AttStatus, { label: string; dot: string; badge: string }> = {
  present: { label: 'Clocked In',  dot: 'bg-green-400 animate-pulse', badge: 'bg-green-100 text-green-700'   },
  done:    { label: 'Completed',   dot: 'bg-blue-400',                 badge: 'bg-blue-100 text-blue-700'     },
  break:   { label: 'On Break',    dot: 'bg-orange-400',               badge: 'bg-orange-100 text-orange-700' },
  leave:   { label: 'On Leave',    dot: 'bg-amber-400',                badge: 'bg-amber-100 text-amber-700'   },
  absent:  { label: 'Absent',      dot: 'bg-gray-300',                 badge: 'bg-gray-100 text-gray-500'     },
};

// ─── Small components ─────────────────────────────────────────────────────────
function MiniAvatar({ name, gradient = 'from-slate-400 to-slate-600' }: { name: string; gradient?: string }) {
  const init = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {init}
    </div>
  );
}

function PeriodSelector({ period, onChange, white }: { period: Period; onChange: (p: Period) => void; white?: boolean }) {
  const opts: { value: Period; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week',  label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];
  return (
    <div className={`inline-flex items-center gap-0.5 p-1 rounded-xl ${white ? 'bg-white/20' : 'bg-gray-100'}`}>
      {opts.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            period === o.value
              ? white
                ? 'bg-white text-gray-800 shadow'
                : 'bg-white shadow text-gray-800'
              : white
              ? 'text-white/70 hover:text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${color} text-center`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] font-medium opacity-80 mt-0.5">{label}</div>
    </div>
  );
}

// ─── Employee row (today / week / month) ──────────────────────────────────────
function EmpRow({
  emp, period, attMap, perfMap,
}: {
  emp: { id: number; name: string; position: string };
  period: Period;
  attMap: any;
  perfMap: any;
}) {
  if (period === 'today') {
    const rec = attMap[emp.id];
    const status = deriveStatus(rec);
    const cfg = STATUS_CFG[status];
    return (
      <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 group">
        <MiniAvatar name={emp.name} gradient="from-blue-400 to-indigo-500" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-800 truncate">{emp.name}</p>
          <p className="text-[10px] text-gray-400 truncate">{emp.position}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rec?.checkIn && (
            <span className="text-[10px] text-gray-400 hidden sm:block">
              <Clock className="w-2.5 h-2.5 inline mr-0.5" />
              {fmtTime(rec.checkIn)}
            </span>
          )}
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
      </div>
    );
  }

  // Week / Month aggregated view
  const stats = attMap[emp.id] as { present: number; leave: number; total: number } | undefined;
  const present = stats?.present ?? 0;
  const leave = stats?.leave ?? 0;
  const total = stats?.total ?? (period === 'week' ? 5 : new Date().getDate());
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  // Performance data for monthly
  const perf = perfMap[emp.id];
  const completionRate = perf?.completionRate ?? perf?.completion_rate ?? null;

  return (
    <div className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg hover:bg-gray-50">
      <MiniAvatar name={emp.name} gradient="from-blue-400 to-indigo-500" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">{emp.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{emp.position}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-right">
        <div>
          <p className="text-xs font-semibold text-gray-700">{present}<span className="text-gray-400 font-normal">/{total} days</span></p>
          {leave > 0 && <p className="text-[10px] text-amber-600">{leave} leave</p>}
          {/* Mini bar */}
          <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
            <div
              className={`h-1 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {period === 'month' && completionRate !== null && (
          <div className="text-center">
            <p className="text-xs font-bold text-violet-700">{Math.round(completionRate)}%</p>
            <p className="text-[10px] text-gray-400">KPI</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Team section ─────────────────────────────────────────────────────────────
function TeamSection({
  tl, period, expanded, onToggle, attMap, perfMap, paletteIdx,
}: {
  tl: Department['teamLeads'][0];
  period: Period;
  expanded: boolean;
  onToggle: () => void;
  attMap: any;
  perfMap: any;
  paletteIdx: number;
}) {
  const tlStatus = period === 'today' ? deriveStatus(attMap[tl.id]) : null;
  const tlCfg = tlStatus ? STATUS_CFG[tlStatus] : null;

  // Week/month: count present members
  let presentCount = 0;
  if (period !== 'today') {
    for (const emp of tl.employees) {
      const s = attMap[emp.id] as { present: number } | undefined;
      if (s && s.present > 0) presentCount++;
    }
  } else {
    for (const emp of tl.employees) {
      const s = deriveStatus(attMap[emp.id]);
      if (s === 'present' || s === 'done') presentCount++;
    }
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
        onClick={onToggle}
      >
        <MiniAvatar name={tl.name} gradient="from-violet-400 to-purple-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{tl.name}</p>
          <p className="text-xs text-gray-500">
            {tl.employees.length} member{tl.employees.length !== 1 ? 's' : ''}
            {period !== 'today' && ` · ${presentCount} attended`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* TL badge */}
          <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            <Shield className="w-2.5 h-2.5" />
            TL
          </span>
          {/* TL status (today only) */}
          {tlCfg && (
            <span className={`w-2 h-2 rounded-full ${tlCfg.dot}`} title={tlCfg.label} />
          )}
          {/* Present count (week/month) */}
          {period !== 'today' && tl.employees.length > 0 && (
            <span className="text-[10px] font-semibold text-gray-500">
              {Math.round((presentCount / Math.max(tl.employees.length, 1)) * 100)}%
            </span>
          )}
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white">
              {/* TL own row */}
              <div className="px-3 pt-2 pb-0">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                  <Shield className="w-3 h-3 text-red-500 shrink-0" />
                  <p className="text-xs font-semibold text-gray-700 flex-1 truncate">{tl.name} <span className="text-gray-400 font-normal">(Team Lead)</span></p>
                  {period === 'today' && tlCfg && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tlCfg.badge}`}>{tlCfg.label}</span>
                  )}
                  {period === 'today' && attMap[tl.id]?.checkIn && (
                    <span className="text-[10px] text-gray-400 hidden sm:block">
                      {fmtTime(attMap[tl.id].checkIn)}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2 space-y-0.5">
                {tl.employees.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">No members assigned to this team</p>
                )}
                {tl.employees.map(emp => (
                  <EmpRow
                    key={emp.id}
                    emp={emp}
                    period={period}
                    attMap={attMap}
                    perfMap={perfMap}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dept summary card (all-depts view) ───────────────────────────────────────
function DeptSummaryCard({
  dept, idx, onClick, period, attMap,
}: {
  dept: Department; idx: number; onClick: () => void; period: Period; attMap: any;
}) {
  const p = pal(idx);

  // Compute quick stats
  const allEmpIds = [
    ...dept.teamLeads.flatMap(tl => [tl.id, ...tl.employees.map(e => e.id)]),
    ...(dept.manager ? [dept.manager.id] : []),
  ];

  let present = 0, onLeave = 0;
  if (period === 'today') {
    for (const eid of allEmpIds) {
      const s = deriveStatus(attMap[eid]);
      if (s === 'present' || s === 'done' || s === 'break') present++;
      else if (s === 'leave') onLeave++;
    }
  } else {
    for (const eid of allEmpIds) {
      const s = attMap[eid] as { present: number } | undefined;
      if (s && s.present > 0) present++;
    }
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={onClick}
      className={`text-left rounded-2xl border ${p.border} overflow-hidden shadow-sm hover:shadow-md transition group bg-white`}
    >
      {/* Colored top bar */}
      <div className={`${p.header} px-4 py-3 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 opacity-90" />
            <span className="font-bold text-sm">{dept.name}</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
        </div>
        <div className="flex items-center gap-3 mt-1 text-white/70 text-[11px]">
          <span className="flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{dept.code}</span>
          <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{dept.employeeCount}</span>
          <span className="flex items-center gap-1"><Briefcase className="w-2.5 h-2.5" />{dept.teamLeads.length} teams</span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3">
        {dept.manager && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Crown className="w-3 h-3 text-amber-500" />
            <span className="truncate">{dept.manager.name}</span>
          </div>
        )}

        {period === 'today' ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-green-700">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {present} active
            </span>
            {onLeave > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {onLeave} on leave
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{present}</span>
            <span> of {allEmpIds.length} attended {period === 'week' ? 'this week' : 'this month'}</span>
          </div>
        )}

        {/* Team leads list */}
        <div className="mt-2 flex flex-wrap gap-1">
          {dept.teamLeads.slice(0, 3).map(tl => (
            <span key={tl.id} className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
              {tl.name.split(' ')[0]}
            </span>
          ))}
          {dept.teamLeads.length > 3 && (
            <span className="text-[10px] text-gray-400">+{dept.teamLeads.length - 3} more</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  departments: Department[];
  allEmployees: any[];
}

const OrgOverview: React.FC<Props> = ({ departments, allEmployees }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>('today');
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [showUnassigned, setShowUnassigned] = useState(false);

  const toggleTeam = (id: number) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedDept = useMemo(() => departments.find(d => d.id === selectedId) ?? null, [departments, selectedId]);
  const deptIdx = useMemo(() => departments.findIndex(d => d.id === selectedId), [departments, selectedId]);

  // Unassigned employees for selected dept
  const unassigned = useMemo(() => {
    if (!selectedDept) return [];
    const assignedIds = new Set(selectedDept.teamLeads.flatMap(tl => [tl.id, ...tl.employees.map(e => e.id)]));
    if (selectedDept.manager) assignedIds.add(selectedDept.manager.id);
    const deptName = selectedDept.name.toLowerCase();
    return allEmployees.filter(e =>
      !assignedIds.has(e.id) &&
      e.role !== 'manager' && e.role !== 'teamlead' &&
      (e.departmentId === selectedDept.id || (e.department || '').toLowerCase() === deptName) &&
      e.isActive !== false
    );
  }, [selectedDept, allEmployees]);

  // ─── Attendance query ──────────────────────────────────────────────────────
  const attQueryKey = useMemo(() => {
    if (period === 'today') return ['att-ov', 'today', todayDate()];
    if (period === 'week') { const r = weekRange(); return ['att-ov', 'week', r.startDate]; }
    const my = curMonthYear();
    return ['att-ov', 'month', my.month, my.year];
  }, [period]);

  const {
    data: attRaw,
    isLoading: attLoading,
    refetch: refetchAtt,
  } = useQuery({
    queryKey: attQueryKey,
    queryFn: () => {
      if (period === 'today') return attendanceApi.getAll({ date: todayDate() });
      if (period === 'week') return attendanceApi.getAll(weekRange());
      return attendanceApi.getAll(curMonthYear());
    },
    staleTime: period === 'today' ? 30_000 : 5 * 60_000,
    refetchInterval: period === 'today' ? 60_000 : false,
  });

  // ─── Performance query (monthly) ──────────────────────────────────────────
  const my = curMonthYear();
  const { data: perfRaw } = useQuery({
    queryKey: ['perf-ov', my.month, my.year],
    queryFn: () => performanceApi.getTeamPerformanceSummary({ month: my.month, year: my.year }),
    enabled: period === 'month',
    staleTime: 5 * 60_000,
  });

  // ─── Build attendance maps ─────────────────────────────────────────────────
  const attMap = useMemo(() => {
    const records: any[] = attRaw?.data ?? [];
    if (period === 'today') {
      const m: Record<number, any> = {};
      for (const r of records) {
        const eid = Number(r.empId ?? r.employeeId);
        if (eid) m[eid] = r;
      }
      return m;
    }
    const m: Record<number, { present: number; leave: number; total: number }> = {};
    for (const r of records) {
      const eid = Number(r.empId ?? r.employeeId);
      if (!eid) continue;
      if (!m[eid]) m[eid] = { present: 0, leave: 0, total: 0 };
      m[eid].total++;
      const s = (r.status || '').toLowerCase();
      if (s.includes('leave')) m[eid].leave++;
      else if (r.checkIn) m[eid].present++;
    }
    return m;
  }, [attRaw, period]);

  // ─── Performance map ───────────────────────────────────────────────────────
  const perfMap = useMemo(() => {
    // performanceApi returns a full AxiosResponse; actual payload is in .data.data
    const raw = perfRaw?.data?.data ?? perfRaw?.data ?? [];
    const records: any[] = Array.isArray(raw) ? raw : [];
    const m: Record<number, any> = {};
    for (const r of records) {
      const eid = Number(r.employeeId ?? r.empId);
      if (eid) m[eid] = r;
    }
    return m;
  }, [perfRaw]);

  // ─── Today global stats (all depts) ───────────────────────────────────────
  const todaySummary = useMemo(() => {
    if (period !== 'today') return null;
    const records: any[] = attRaw?.data ?? [];
    let present = 0, done = 0, onLeave = 0, onBreak = 0;
    for (const r of records) {
      const s = deriveStatus(r);
      if (s === 'present') present++;
      else if (s === 'done') done++;
      else if (s === 'leave') onLeave++;
      else if (s === 'break') onBreak++;
    }
    return { present, done, clocked: present + done, onLeave, onBreak };
  }, [attRaw, period]);

  // ─── Dept detail stats ─────────────────────────────────────────────────────
  const deptStats = useMemo(() => {
    if (!selectedDept) return null;
    const allIds = [
      ...selectedDept.teamLeads.flatMap(tl => [tl.id, ...tl.employees.map(e => e.id)]),
      ...(selectedDept.manager ? [selectedDept.manager.id] : []),
    ];
    if (period === 'today') {
      let present = 0, onLeave = 0, absent = 0, onBreak = 0;
      for (const eid of allIds) {
        const s = deriveStatus(attMap[eid]);
        if (s === 'present') present++;
        else if (s === 'done') present++;
        else if (s === 'break') onBreak++;
        else if (s === 'leave') onLeave++;
        else absent++;
      }
      return { present, onLeave, onBreak, absent, total: allIds.length };
    }
    let present = 0, onLeave = 0;
    for (const eid of allIds) {
      const s = attMap[eid] as { present: number; leave: number } | undefined;
      if (s) { present += s.present; onLeave += s.leave; }
    }
    return { present, onLeave, onBreak: 0, absent: 0, total: allIds.length };
  }, [selectedDept, attMap, period]);

  if (departments.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No departments to overview</p>
        <p className="text-sm text-gray-400 mt-1">Create departments in the Hierarchy tab first.</p>
      </div>
    );
  }

  const curPal = selectedId !== null ? pal(deptIdx) : null;

  return (
    <div className="flex gap-5 min-h-[540px]">
      {/* ── Left: Dept list ──────────────────────────────────────────────────── */}
      <div className="w-52 shrink-0 space-y-1 sticky top-0 self-start">
        <button
          onClick={() => setSelectedId(null)}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            selectedId === null
              ? 'bg-gray-900 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          All Departments
        </button>

        <div className="pt-2 pb-1 px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Departments
        </div>

        {departments.map((dept, i) => {
          const p = pal(i);
          const isSelected = selectedId === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => {
                setSelectedId(dept.id);
                setExpandedTeams(new Set());
                setShowUnassigned(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-2.5 border ${
                isSelected
                  ? `${p.light} ${p.border} ${p.text} font-semibold shadow-sm`
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? p.dot : 'bg-gray-300'}`} />
              <span className="truncate flex-1">{dept.name}</span>
              <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 font-semibold shrink-0">
                {dept.employeeCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Right: Content ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {selectedId === null ? (
            // ── All Departments Summary ──────────────────────────────────────
            <motion.div
              key="all"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Organisation Overview</h2>
                  <p className="text-xs text-gray-500">
                    {period === 'today' ? `Today, ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}` : period === 'week' ? weekLabel() : curMonthLabel()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {period === 'today' && (
                    <button
                      onClick={() => refetchAtt()}
                      disabled={attLoading}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-600"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${attLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  <PeriodSelector period={period} onChange={setPeriod} />
                </div>
              </div>

              {/* Today global stats */}
              {period === 'today' && todaySummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <StatPill label="Total Clocked" value={todaySummary.clocked} color="bg-green-100 text-green-800" />
                  <StatPill label="Currently In" value={todaySummary.present} color="bg-blue-100 text-blue-800" />
                  <StatPill label="On Leave" value={todaySummary.onLeave} color="bg-amber-100 text-amber-800" />
                  <StatPill label="On Break" value={todaySummary.onBreak} color="bg-orange-100 text-orange-800" />
                </div>
              )}

              {attLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading attendance data…
                </div>
              )}

              {/* Dept cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {departments.map((dept, i) => (
                  <DeptSummaryCard
                    key={dept.id}
                    dept={dept}
                    idx={i}
                    period={period}
                    attMap={attMap}
                    onClick={() => { setSelectedId(dept.id); setExpandedTeams(new Set()); }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            // ── Single Department Detail ──────────────────────────────────────
            <motion.div
              key={`dept-${selectedId}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back */}
              <button
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3 transition font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                All Departments
              </button>

              {/* Dept header */}
              {selectedDept && curPal && (
                <div className={`${curPal.header} rounded-2xl p-5 text-white mb-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 opacity-90" />
                        <h2 className="text-xl font-bold">{selectedDept.name}</h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-white/70 text-xs">
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{selectedDept.code}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{selectedDept.employeeCount} employees</span>
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{selectedDept.teamLeads.length} team{selectedDept.teamLeads.length !== 1 ? 's' : ''}</span>
                      </div>
                      {selectedDept.manager && (
                        <div className="mt-2 flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 w-fit text-xs font-medium">
                          <Crown className="w-3.5 h-3.5" />
                          {selectedDept.manager.name} · Manager
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {period === 'today' && (
                        <button
                          onClick={() => refetchAtt()}
                          disabled={attLoading}
                          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
                          title="Refresh"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${attLoading ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Period selector */}
                  <div className="mt-4">
                    <PeriodSelector period={period} onChange={setPeriod} white />
                  </div>

                  {/* Quick stats */}
                  {deptStats && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                      {period === 'today' ? (
                        <>
                          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                            <div className="text-xl font-bold">{deptStats.present}</div>
                            <div className="text-[10px] text-white/70 mt-0.5">Active</div>
                          </div>
                          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                            <div className="text-xl font-bold">{deptStats.onBreak}</div>
                            <div className="text-[10px] text-white/70 mt-0.5">On Break</div>
                          </div>
                          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                            <div className="text-xl font-bold">{deptStats.onLeave}</div>
                            <div className="text-[10px] text-white/70 mt-0.5">On Leave</div>
                          </div>
                          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                            <div className="text-xl font-bold">{deptStats.absent}</div>
                            <div className="text-[10px] text-white/70 mt-0.5">Absent</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                            <div className="text-xl font-bold">{deptStats.total}</div>
                            <div className="text-[10px] text-white/70 mt-0.5">Members</div>
                          </div>
                          <div className="bg-white/20 rounded-xl px-3 py-2 text-center col-span-2">
                            <div className="text-xl font-bold">{deptStats.present}</div>
                            <div className="text-[10px] text-white/70 mt-0.5">Attendances logged</div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Loading */}
              {attLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading {period} data…
                </div>
              )}

              {/* Period label */}
              <div className="flex items-center gap-2 mb-3">
                {period === 'week' && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Week: {weekLabel()}
                  </span>
                )}
                {period === 'month' && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {curMonthLabel()} · KPI % shown where available
                  </span>
                )}
                {period === 'today' && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-green-500" />
                    Live · refreshes every minute
                  </span>
                )}
              </div>

              {/* Teams */}
              <div className="space-y-2">
                {selectedDept?.teamLeads.length === 0 && unassigned.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    No teams or employees assigned to this department yet.
                  </div>
                )}

                {selectedDept?.teamLeads.map((tl) => (
                  <TeamSection
                    key={tl.id}
                    tl={tl}
                    period={period}
                    expanded={expandedTeams.has(tl.id)}
                    onToggle={() => toggleTeam(tl.id)}
                    attMap={attMap}
                    perfMap={perfMap}
                    paletteIdx={deptIdx}
                  />
                ))}

                {/* Unassigned */}
                {unassigned.length > 0 && (
                  <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowUnassigned(v => !v)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          Unassigned ({unassigned.length})
                        </p>
                        <p className="text-[10px] text-gray-400">Not under any team lead</p>
                      </div>
                      {showUnassigned
                        ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    <AnimatePresence>
                      {showUnassigned && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-2 space-y-0.5 bg-white">
                            {unassigned.map(emp => (
                              <EmpRow
                                key={emp.id}
                                emp={{
                                  id: emp.id,
                                  name: `${emp.firstName} ${emp.lastName}`,
                                  position: emp.position || 'Employee',
                                }}
                                period={period}
                                attMap={attMap}
                                perfMap={perfMap}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrgOverview;
