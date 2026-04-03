// src/components/management/PerformanceLocking.tsx
// Month-End Performance Locking System — Admin UI
// FIXED: Fetches real lock status from DB on mount/month change; handles 400 "already locked" gracefully

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, CheckCircle, Clock,
  Calendar, Users, TrendingUp, Shield,
  ChevronDown, ChevronUp, RefreshCw, Eye,
  BarChart3, AlertTriangle,
} from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { useTasks } from '../../hooks/useTasks';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface LockRecord {
  employeeId: number;
  year: number;
  month: number;
  locked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  achievement: number;
  totalTarget: number;
  totalAchieved: number;
  tasks: Array<{
    id: number;
    title: string;
    type: string;
    category: string;
    target: number;
    achieved: number;
    status: string;
  }>;
  remarks?: string;
  // DB record id when it exists
  perfRecordId?: number;
}

interface PerformanceLockingProps {
  currentUser: {
    id: number;
    name: string;
    role: 'employer';
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const getGrade = (pct: number) => {
  if (pct >= 90) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (pct >= 75) return { grade: 'A',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (pct >= 60) return { grade: 'B',  color: 'text-blue-600   bg-blue-50   border-blue-200'   };
  if (pct >= 40) return { grade: 'C',  color: 'text-amber-600  bg-amber-50  border-amber-200'  };
  return           { grade: 'D',  color: 'text-red-600    bg-red-50    border-red-200'    };
};

const statusBadge = (status: string) => {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'overdue')   return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const PerformanceLocking = ({ currentUser }: PerformanceLockingProps) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());

  // lockRecords is the single source of truth for UI state.
  // It is populated from DB on mount/month-change and updated optimistically on lock.
  const [lockRecords, setLockRecords]     = useState<Record<string, LockRecord>>({});
  const [isFetchingLocks, setIsFetchingLocks] = useState(false);

  const [expandedEmpId, setExpandedEmpId] = useState<number | null>(null);
  const [confirmLock, setConfirmLock]     = useState<{ empId: number; name: string } | null>(null);
  const [confirmUnlockAll, setConfirmUnlockAll] = useState(false);
  const [bulkLocking, setBulkLocking]     = useState(false);
  const [filter, setFilter]               = useState<'all' | 'locked' | 'unlocked'>('all');
  const [searchTerm, setSearchTerm]       = useState('');
  const [isRefreshing, setIsRefreshing]   = useState(false);
  const [lockingEmpId, setLockingEmpId]   = useState<number | null>(null);

  const { data: rawEmployees = [], refetch: refetchEmployees } = useEmployees();
  const { data: tasksRaw = [], refetch: refetchTasks }         = useTasks();

  const employees = useMemo(() => {
    const raw = Array.isArray(rawEmployees) ? rawEmployees : [];
    return raw
      .map((e: any) => ({
        id:         e.id,
        name:       e.name ?? `${e.firstName || ''} ${e.lastName || ''}`.trim(),
        empId:      e.employeeId ?? e.empId ?? `EMP${e.id}`,
        department: e.department ?? '',
        position:   e.position   ?? '',
        isActive:   e.isActive !== false,
      }))
      .filter((e: any) => e.isActive);
  }, [rawEmployees]);

  const allTasks: any[] = useMemo(() => {
    const raw = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw as any)?.data ?? [];
    return raw;
  }, [tasksRaw]);

  // ── Build per-employee performance snapshot from tasks ───────────────────
  const performanceByEmp = useMemo(() => {
    const map: Record<number, { totalTarget: number; totalAchieved: number; tasks: any[] }> = {};
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end   = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    allTasks.forEach((t: any) => {
      const dl = new Date(t.deadline);
      if (dl < start || dl > end) return;
      if (!map[t.assignedToId]) map[t.assignedToId] = { totalTarget: 0, totalAchieved: 0, tasks: [] };
      map[t.assignedToId].totalTarget   += t.target;
      map[t.assignedToId].totalAchieved += t.achieved;
      map[t.assignedToId].tasks.push(t);
    });
    return map;
  }, [allTasks, selectedMonth, selectedYear]);

  // ── Fetch lock status from DB for all employees for the selected month ───
  const fetchLockStatuses = useCallback(async (empList: typeof employees) => {
    if (empList.length === 0) return;
    setIsFetchingLocks(true);
    try {
      const results = await Promise.allSettled(
        empList.map(emp =>
          api.get(`/performance/employees/${emp.id}/monthly-performance`, {
            params: { year: selectedYear, month: selectedMonth }
          })
        )
      );

      setLockRecords(prev => {
        const next = { ...prev };
        results.forEach((result, idx) => {
          const emp = empList[idx];
          const key = `${emp.id}_${selectedYear}_${selectedMonth}`;
          const perf = performanceByEmp[emp.id] ?? { totalTarget: 0, totalAchieved: 0, tasks: [] };
          const achievement = perf.totalTarget > 0 ? (perf.totalAchieved / perf.totalTarget) * 100 : 0;

          if (result.status === 'fulfilled') {
            const records = result.value?.data?.data ?? result.value?.data ?? [];
            const perfRecord = Array.isArray(records) ? records[0] : records;

            if (perfRecord) {
              // DB record exists — use its lock status as ground truth
              next[key] = {
                employeeId:   emp.id,
                year:         selectedYear,
                month:        selectedMonth,
                locked:       perfRecord.isLocked ?? false,
                lockedAt:     perfRecord.lockedAt ?? undefined,
                lockedBy:     perfRecord.locker
                                ? `${perfRecord.locker.firstName ?? ''} ${perfRecord.locker.lastName ?? ''}`.trim()
                                : undefined,
                achievement:  perfRecord.achievementPercent ?? achievement,
                totalTarget:  perfRecord.totalTarget  ?? perf.totalTarget,
                totalAchieved:perfRecord.totalAchieved ?? perf.totalAchieved,
                tasks:        perf.tasks,
                remarks:      perfRecord.teamLeadRemarks ?? undefined,
                perfRecordId: perfRecord.id,
              };
            } else {
              // No DB record yet — not locked, derive from tasks
              next[key] = {
                employeeId: emp.id, year: selectedYear, month: selectedMonth,
                locked: false, achievement, ...perf, perfRecordId: undefined,
              };
            }
          }
          // On fetch error just leave whatever is already in state (or nothing)
        });
        return next;
      });
    } finally {
      setIsFetchingLocks(false);
    }
  }, [selectedYear, selectedMonth, performanceByEmp]);

  // Re-fetch whenever employees or month/year changes
  useEffect(() => {
    if (employees.length > 0) {
      fetchLockStatuses(employees);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.length, selectedMonth, selectedYear]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getRecord = useCallback((empId: number): LockRecord => {
    const key = `${empId}_${selectedYear}_${selectedMonth}`;
    if (lockRecords[key]) return lockRecords[key];
    const perf = performanceByEmp[empId] ?? { totalTarget: 0, totalAchieved: 0, tasks: [] };
    const achievement = perf.totalTarget > 0 ? (perf.totalAchieved / perf.totalTarget) * 100 : 0;
    return {
      employeeId: empId, year: selectedYear, month: selectedMonth,
      locked: false, achievement, ...perf,
    };
  }, [lockRecords, selectedYear, selectedMonth, performanceByEmp]);

  // ── Lock a single employee ────────────────────────────────────────────────
  const handleLock = async (empId: number) => {
    setLockingEmpId(empId);
    setConfirmLock(null);

    const key = `${empId}_${selectedYear}_${selectedMonth}`;
    let perfRecordId = lockRecords[key]?.perfRecordId;

    // Step 1: generate snapshot — 400 "already exists" is fine, just continue
    try {
      await api.post('/performance/monthly-performance/generate', {
        employeeId: empId,
        year: selectedYear,
        month: selectedMonth,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '';
      if (!msg.toLowerCase().includes('already exists')) {
        console.error('Snapshot generation failed unexpectedly:', err);
        setLockingEmpId(null);
        return;
      }
      // "already exists" is expected — fall through
    }

    // Step 2: fetch the record ID if we don't have it yet
    if (!perfRecordId) {
      try {
        const res = await api.get(`/performance/employees/${empId}/monthly-performance`, {
          params: { year: selectedYear, month: selectedMonth }
        });
        const records = res.data?.data ?? res.data ?? [];
        perfRecordId = Array.isArray(records) ? records[0]?.id : records?.id;
      } catch (err) {
        console.error('Failed to fetch performance record ID:', err);
        setLockingEmpId(null);
        return;
      }
    }

    if (!perfRecordId) {
      console.error('No performance record ID found after generate');
      setLockingEmpId(null);
      return;
    }

    // Step 3: lock — 400 "already locked" is fine, treat as success
    try {
      await api.put(`/performance/monthly-performance/${perfRecordId}/lock`, {
        lockedBy: currentUser.id,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '';
      if (!msg.toLowerCase().includes('already locked')) {
        console.error('Lock failed:', err);
        setLockingEmpId(null);
        return;
      }
      // "already locked" — still update UI to show locked state
    }

    // Step 4: update local state to reflect locked
    setLockRecords(prev => ({
      ...prev,
      [key]: {
        ...getRecord(empId),
        locked: true,
        lockedAt: new Date().toISOString(),
        lockedBy: currentUser.name,
        perfRecordId,
      },
    }));

    setLockingEmpId(null);
  };

  // ── Bulk lock ─────────────────────────────────────────────────────────────
  const handleBulkLock = async () => {
    setBulkLocking(true);
    const unlockedEmps = employees.filter(emp => !getRecord(emp.id).locked);

    await Promise.allSettled(unlockedEmps.map(emp => handleLock(emp.id)));

    setBulkLocking(false);
    setConfirmUnlockAll(false);
  };

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchEmployees(), refetchTasks()]);
    await fetchLockStatuses(employees);
    setIsRefreshing(false);
  };

  // ── Filtered employees ────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const rec = getRecord(emp.id);
      if (filter === 'locked' && !rec.locked) return false;
      if (filter === 'unlocked' && rec.locked) return false;
      if (searchTerm && !emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !emp.department.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, filter, searchTerm, lockRecords, selectedMonth, selectedYear, performanceByEmp]);

  const lockedCount   = employees.filter(e => getRecord(e.id).locked).length;
  const unlockedCount = employees.length - lockedCount;
  const avgAchievement = employees.length > 0
    ? employees.reduce((s, e) => s + getRecord(e.id).achievement, 0) / employees.length
    : 0;

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6 pb-10">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Performance Locking</h2>
          </div>
          <p className="text-gray-400 text-sm ml-12">Month-end data immutability · Locked records are read-only forever</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleRefresh} disabled={isRefreshing || isFetchingLocks}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isRefreshing || isFetchingLocks ? 'animate-spin' : ''}`} />
            {isFetchingLocks ? 'Loading…' : 'Refresh'}
          </button>
          {unlockedCount > 0 && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setConfirmUnlockAll(true)} disabled={bulkLocking || isFetchingLocks}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50">
              <Shield className="w-4 h-4" />
              Lock All ({unlockedCount})
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── WARNING BANNER ─────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-rose-800">Important: Locking is Permanent</p>
          <p className="text-xs text-rose-700 mt-0.5">
            Once a month is locked, no further task updates, submissions, or edits can affect the performance snapshot.
            This creates an immutable audit trail. Only lock at month-end after all data is verified.
          </p>
        </div>
      </motion.div>

      {/* ── FILTERS ────────────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select value={selectedMonth} onChange={e => { setSelectedMonth(parseInt(e.target.value)); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-rose-400 cursor-pointer">
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => { setSelectedYear(parseInt(e.target.value)); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-rose-400 cursor-pointer">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <input type="text" placeholder="Search employee or department…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 flex-1 min-w-[200px]" />

          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            {([['all','All'], ['locked','Locked'], ['unlocked','Unlocked']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filter === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── SUMMARY STATS ──────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: employees.length,      icon: Users,         color: 'from-blue-500 to-cyan-600' },
          { label: 'Locked',          value: lockedCount,           icon: Lock,          color: 'from-emerald-500 to-teal-600' },
          { label: 'Pending Lock',    value: unlockedCount,         icon: Clock,         color: 'from-amber-500 to-orange-600' },
          { label: 'Avg Achievement', value: `${avgAchievement.toFixed(0)}%`, icon: TrendingUp, color: 'from-rose-500 to-pink-600' },
        ].map((card, i) => (
          <motion.div key={i} whileHover={{ y: -2 }}
            className={`bg-gradient-to-br ${card.color} p-5 rounded-2xl shadow-sm relative overflow-hidden`}>
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <card.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-3xl font-black text-white">{card.value}</p>
              <p className="text-white/70 text-xs mt-1 font-medium">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── EMPLOYEE TABLE ─────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-500" />
            {MONTHS[selectedMonth - 1]} {selectedYear} — Performance Records
          </h3>
          <div className="flex items-center gap-2">
            {isFetchingLocks && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <RefreshCw className="w-3 h-3 animate-spin" /> Loading lock status…
              </span>
            )}
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              {filteredEmployees.length} employees
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No employees match your filters</p>
            </div>
          ) : filteredEmployees.map(emp => {
            const rec       = getRecord(emp.id);
            const pct       = Math.round(rec.achievement);
            const { grade, color: gradeColor } = getGrade(pct);
            const isExpanded   = expandedEmpId === emp.id;
            const isLocking    = lockingEmpId === emp.id;

            return (
              <div key={emp.id} className={rec.locked ? 'bg-gray-50/50' : ''}>
                <div className="p-5 flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    rec.locked ? 'bg-gray-200' : 'bg-gradient-to-br from-rose-400 to-pink-500'
                  }`}>
                    <span className={`font-bold text-sm ${rec.locked ? 'text-gray-500' : 'text-white'}`}>
                      {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-bold text-gray-800">{emp.name}</p>
                      <span className="text-xs text-gray-400">{emp.empId}</span>
                      {rec.locked && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          <Lock className="w-2.5 h-2.5" /> Locked
                          {rec.lockedAt && ` · ${new Date(rec.lockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                          {rec.lockedBy && ` · by ${rec.lockedBy}`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{emp.department} · {emp.position}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 max-w-xs bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full" style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'
                        }} />
                      </div>
                      <span className="text-xs font-bold text-gray-600">{pct}%</span>
                      <span className="text-xs text-gray-400">
                        {rec.totalAchieved.toLocaleString()} / {rec.totalTarget.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Grade */}
                  <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-lg ${gradeColor}`}>
                    {grade}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpandedEmpId(isExpanded ? null : emp.id)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer text-gray-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isLocking ? (
                      // Spinner while locking this employee
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-400 border border-gray-200 rounded-xl text-xs font-semibold">
                        <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                        Locking…
                      </div>
                    ) : !rec.locked ? (
                      <button onClick={() => setConfirmLock({ empId: emp.id, name: emp.name })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition cursor-pointer">
                        <Lock className="w-3.5 h-3.5" /> Lock
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Locked
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded task details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100">
                      <div className="p-5 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gray-400" />
                            Task Breakdown — {MONTHS[selectedMonth - 1]} {selectedYear}
                          </p>
                          {rec.locked && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <Shield className="w-3 h-3" />
                              Immutable snapshot — locked{rec.lockedBy ? ` by ${rec.lockedBy}` : ''}
                              {rec.lockedAt ? ` on ${new Date(rec.lockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                            </div>
                          )}
                        </div>

                        {rec.tasks.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">No tasks in this period</p>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  {['Task', 'Type', 'Target', 'Achieved', '%', 'Status'].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {rec.tasks.map((t: any) => {
                                  const tPct = t.target > 0 ? Math.round((t.achieved / t.target) * 100) : 0;
                                  return (
                                    <tr key={t.id} className="hover:bg-gray-50/50">
                                      <td className="px-4 py-2.5">
                                        <p className="text-sm font-medium text-gray-700">{t.title}</p>
                                        <p className="text-xs text-gray-400 capitalize">{t.category}</p>
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <span className="text-xs capitalize font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{t.type}</span>
                                      </td>
                                      <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{t.target}</td>
                                      <td className="px-4 py-2.5 text-sm font-bold text-gray-800">{t.achieved}</td>
                                      <td className="px-4 py-2.5">
                                        <span className={`text-xs font-bold ${tPct >= 80 ? 'text-emerald-600' : tPct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                          {tPct}%
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(t.status)}`}>{t.status}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {rec.remarks && (
                          <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                            <p className="text-xs font-bold text-indigo-700 mb-1">Team Lead Remarks</p>
                            <p className="text-sm text-indigo-800">{rec.remarks}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ════════════ LOCK CONFIRM MODAL ════════════════════════════════════ */}
      <AnimatePresence>
        {confirmLock && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Lock Performance Record</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5">
                <p className="text-sm text-rose-800 font-medium">
                  Locking <strong>{confirmLock.name}</strong>'s performance for{' '}
                  <strong>{MONTHS[selectedMonth - 1]} {selectedYear}</strong>
                </p>
                <p className="text-xs text-rose-700 mt-2">
                  After locking, this record becomes read-only. No task updates or submission changes will
                  affect this snapshot. This is permanent.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleLock(confirmLock.empId)}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" /> Lock Now
                </button>
                <button onClick={() => setConfirmLock(null)}
                  className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════ BULK LOCK CONFIRM MODAL ══════════════════════════════ */}
      <AnimatePresence>
        {confirmUnlockAll && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Lock All Performance Records</h3>
                  <p className="text-sm text-gray-400">Bulk month-end close</p>
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5">
                <p className="text-sm text-rose-800 font-medium">
                  You are about to lock performance for ALL {unlockedCount} unlocked employees
                  for <strong>{MONTHS[selectedMonth - 1]} {selectedYear}</strong>.
                </p>
                <p className="text-xs text-rose-700 mt-2">
                  This is a permanent, irreversible action. Ensure all task data has been reviewed and verified
                  before proceeding.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleBulkLock} disabled={bulkLocking}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {bulkLocking ? (
                    <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Locking…</>
                  ) : <><Shield className="w-4 h-4" /> Lock All {unlockedCount} Records</>}
                </button>
                <button onClick={() => setConfirmUnlockAll(false)}
                  className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default PerformanceLocking;