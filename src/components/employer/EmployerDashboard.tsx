// src/components/employer/EmployerDashboard.tsx
// Admin Dashboard — rich data, animated, fully navigable
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Check, FileText, Gift, Clock, TrendingUp, AlertCircle,
  ArrowRight, Building2, Target, Activity, Award, Coffee,
  UserCheck, UserX, Calendar, ChevronRight, Zap, RefreshCw,
  BarChart3, Shield, Bell, Star, Briefcase, LogIn, LogOut,
  CheckCircle, XCircle, Hourglass, ChevronUp, ChevronDown,
  Globe, Layers, UserPlus,
} from 'lucide-react';
import { employeeApi, leaveApi, attendanceApi, departmentApi } from '../../services/api';
import axios from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  pendingLeaves: number;
  thisMonthBirthdays: number;
  activeTasks: number;
  attendanceRate: number;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  birthday?: string;
  isActive: boolean;
}

interface LeaveRequest {
  id: string;
  empName: string;
  type: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  from: string;
  to: string;
  department?: string;
}

interface AttendanceRecord {
  employeeId: number;
  status: string;
  checkIn?: string;
  checkOut?: string;
  employee?: { firstName: string; lastName: string; department?: string };
}

interface Department {
  id: number;
  name: string;
  _count: { employees: number };
  designations: any[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const iv = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } };

const DEPT_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
  'from-red-500 to-rose-600',
  'from-green-500 to-emerald-600',
];

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// ─── Live Clock ────────────────────────────────────────────────────────────────

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── Animated Number ───────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 600;
    const steps = 20;
    const stepVal = value / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setDisplay(Math.min(Math.round(stepVal * step), value));
      if (step >= steps) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [value]);
  return <>{display}</>;
}

// ─── Mini Progress Ring ────────────────────────────────────────────────────────

function MiniRing({ pct, color, size = 48 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 100) / 100;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="3" strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const now = useLiveClock();

  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0, presentToday: 0, absentToday: 0,
    lateToday: 0, onLeaveToday: 0, pendingLeaves: 0,
    thisMonthBirthdays: 0, activeTasks: 0, attendanceRate: 0,
  });
  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [companyPerf, setCompanyPerf]   = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const month = new Date().getMonth() + 1;
      const year  = new Date().getFullYear();

      const [empRes, leaveRes, attRes, deptRes, perfRes] = await Promise.allSettled([
        employeeApi.getAll(),
        leaveApi.getAll(),
        attendanceApi.getAll({ date: today }),
        departmentApi.getAll(),
        axios.get(`/api/performance/company/performance?year=${year}&month=${month}`).catch(() => ({ data: { data: null } })),
      ]);

      // Employees
      let emps: any[] = [];
      if (empRes.status === 'fulfilled') {
        const raw = empRes.value?.data?.data || empRes.value?.data || [];
        emps = Array.isArray(raw) ? raw.filter((e: any) => e.isActive !== false) : [];
        setEmployees(emps.map((e: any) => ({
          id: e.id.toString(),
          name: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
          department: e.department || 'Unknown',
          position: e.position || '',
          birthday: e.birthday,
          isActive: e.isActive !== false,
        })));
      }

      // Leaves
      let leaves: LeaveRequest[] = [];
      if (leaveRes.status === 'fulfilled') {
        const raw = leaveRes.value?.data?.data || leaveRes.value?.data || [];
        if (Array.isArray(raw)) {
          leaves = raw.map((l: any) => ({
            id: l.id.toString(),
            empName: l.employee?.name || `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.trim() || 'Unknown',
            type: l.type || l.leaveType || 'Leave',
            days: l.days || l.numberOfDays || 1,
            status: l.status,
            from: l.from || l.startDate,
            to: l.to || l.endDate,
            department: l.employee?.department,
          }));
          setLeaveRequests(leaves);
        }
      }

      // Attendance
      let attRecords: AttendanceRecord[] = [];
      if (attRes.status === 'fulfilled') {
        const raw = attRes.value?.data?.data || attRes.value?.data || [];
        if (Array.isArray(raw)) {
          attRecords = raw;
          setAttendanceRecords(raw);
        }
      }

      // Departments
      if (deptRes.status === 'fulfilled') {
        const raw = deptRes.value?.data?.data || deptRes.value?.data || [];
        setDepartments(Array.isArray(raw) ? raw : []);
      }

      // Performance
      if (perfRes.status === 'fulfilled') {
        setCompanyPerf((perfRes.value as any)?.data?.data || null);
      }

      // Stats
      const present   = attRecords.filter(a => a.status === 'present').length;
      const late      = attRecords.filter(a => a.status === 'late').length;
      const onLeave   = attRecords.filter(a => a.status === 'on_leave').length;
      const absent    = Math.max(0, emps.length - present - late - onLeave);
      const pending   = leaves.filter(l => l.status === 'pending').length;
      const curMonth  = new Date().getMonth();
      const birthdays = emps.filter((e: any) => {
        if (!e.birthday) return false;
        return new Date(e.birthday).getMonth() === curMonth;
      }).length;
      const rate = emps.length > 0 ? Math.round(((present + late) / emps.length) * 100) : 0;

      setStats({
        totalEmployees: emps.length, presentToday: present, lateToday: late,
        absentToday: absent, onLeaveToday: onLeave, pendingLeaves: pending,
        thisMonthBirthdays: birthdays, activeTasks: 0, attendanceRate: rate,
      });
    } catch (e) {
      notify('Failed to refresh some data', false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const upcomingBirthdays = employees.filter(e => {
    if (!e.birthday) return false;
    const b = new Date(e.birthday);
    const today = new Date();
    const thisYear = new Date(today.getFullYear(), b.getMonth(), b.getDate());
    const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff <= 30;
  }).sort((a, b) => {
    const today = new Date();
    const da = new Date(today.getFullYear(), new Date(a.birthday!).getMonth(), new Date(a.birthday!).getDate());
    const db = new Date(today.getFullYear(), new Date(b.birthday!).getMonth(), new Date(b.birthday!).getDate());
    return da.getTime() - db.getTime();
  }).slice(0, 4);

  const deptDistribution = employees.reduce<Record<string, number>>((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {});
  const sortedDepts = Object.entries(deptDistribution).sort(([, a], [, b]) => b - a);

  const recentLeaves = leaveRequests.filter(l => l.status === 'pending').slice(0, 5);
  const topPerformers = companyPerf?.topPerformers?.slice(0, 4) || [];
  const deptBreakdown = companyPerf?.departmentBreakdown || [];

  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? 'Good Morning' : greetingHour < 17 ? 'Good Afternoon' : 'Good Evening';

  // ── Skeleton ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-gradient-to-r from-[#6B8DA2]/20 to-[#F5A42C]/20 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-64 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6 pb-10">

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg border-l-4 font-medium text-sm ${
              toast.ok ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Banner ── */}
      <motion.div variants={iv}
        className="relative bg-gradient-to-r from-[#4A6A82] via-[#6B8DA2] to-[#F5A42C] rounded-2xl p-6 overflow-hidden shadow-xl">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white rounded-full -translate-y-1/2" />
        </div>
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' })}
            </p>
            <h1 className="text-2xl lg:text-3xl font-black text-white">{greeting}, Admin! 👋</h1>
            <p className="text-white/80 mt-1 text-sm">Here's your company overview for today.</p>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2 text-white text-sm font-semibold">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                {stats.presentToday} Present
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2 text-white text-sm font-semibold">
                <Hourglass className="w-3.5 h-3.5" />
                {stats.pendingLeaves} Pending Leaves
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2 text-white text-sm font-semibold">
                <Gift className="w-3.5 h-3.5" />
                {stats.thisMonthBirthdays} Birthdays this month
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            {/* Live Clock */}
            <div className="text-right">
              <p className="text-4xl font-black text-white tabular-nums leading-none">
                {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })}
              </p>
              <p className="text-white/60 text-xs mt-1">EST / EDT</p>
            </div>
            <button onClick={() => fetchAll(true)} disabled={refreshing}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer backdrop-blur-sm">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        {/* Attendance rate strip */}
        <div className="relative mt-5 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-xs font-semibold">Today's Attendance Rate</span>
            <span className="text-white font-black">{stats.attendanceRate}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.attendanceRate}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-2 bg-white rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* ── 8 KPI Cards ── */}
      <motion.div variants={iv} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Employees', value: stats.totalEmployees, icon: Users,
            gradient: 'from-blue-500 to-indigo-600', ring: 'rgba(255,255,255,0.8)',
            sub: `${employees.filter(e => e.isActive).length} active`, route: '/employees',
          },
          {
            label: 'Present Today', value: stats.presentToday, icon: UserCheck,
            gradient: 'from-emerald-500 to-teal-600', ring: 'rgba(255,255,255,0.8)',
            sub: `${stats.attendanceRate}% rate`, route: '/attendance',
          },
          {
            label: 'Late Today', value: stats.lateToday, icon: Clock,
            gradient: 'from-amber-500 to-orange-500', ring: 'rgba(255,255,255,0.8)',
            sub: 'Checked in late', route: '/attendance',
          },
          {
            label: 'Absent', value: stats.absentToday, icon: UserX,
            gradient: 'from-red-500 to-rose-600', ring: 'rgba(255,255,255,0.8)',
            sub: 'No check-in', route: '/attendance',
          },
          {
            label: 'On Leave', value: stats.onLeaveToday, icon: Calendar,
            gradient: 'from-violet-500 to-purple-600', ring: 'rgba(255,255,255,0.8)',
            sub: 'Approved leaves', route: '/leaves',
          },
          {
            label: 'Pending Leaves', value: stats.pendingLeaves, icon: FileText,
            gradient: 'from-orange-500 to-red-500', ring: 'rgba(255,255,255,0.8)',
            sub: 'Awaiting approval', route: '/leaves',
          },
          {
            label: 'Birthdays', value: stats.thisMonthBirthdays, icon: Gift,
            gradient: 'from-pink-500 to-rose-500', ring: 'rgba(255,255,255,0.8)',
            sub: 'This month', route: '/birthdays',
          },
          {
            label: 'Departments', value: departments.length, icon: Building2,
            gradient: 'from-[#6B8DA2] to-[#4A6A82]', ring: 'rgba(255,255,255,0.8)',
            sub: `${sortedDepts.length} active`, route: '/organization',
          },
        ].map((card, i) => (
          <motion.div key={i}
            whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.14)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(card.route)}
            className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 cursor-pointer relative overflow-hidden shadow-sm`}>
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -right-1 -bottom-5 w-12 h-12 bg-white/10 rounded-full" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium mb-1">{card.label}</p>
                <p className="text-3xl font-black text-white tabular-nums">
                  <AnimatedNumber value={card.value} />
                </p>
                <p className="text-white/60 text-xs mt-1">{card.sub}</p>
              </div>
              <div className="relative">
                <MiniRing pct={card.value > 0 ? 75 : 0} color={card.ring} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <card.icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <div className="relative mt-2 flex items-center gap-1 text-white/70 text-[10px] font-semibold">
              <ArrowRight className="w-3 h-3" /> View Details
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col (2/3): Attendance + Leaves */}
        <div className="lg:col-span-2 space-y-5">

          {/* Attendance Breakdown */}
          <motion.div variants={iv} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="font-bold text-gray-800">Today's Attendance</h2>
              </div>
              <button onClick={() => navigate('/attendance')}
                className="flex items-center gap-1 text-xs text-[#6B8DA2] font-semibold hover:underline cursor-pointer">
                Full Report <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5">
              {/* Visual status bar */}
              <div className="flex rounded-xl overflow-hidden h-4 mb-4 gap-0.5">
                {stats.presentToday > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.presentToday / Math.max(stats.totalEmployees, 1)) * 100}%` }}
                    transition={{ duration: 0.9 }} title={`Present: ${stats.presentToday}`}
                    className="bg-emerald-500 h-full rounded-l-lg" />
                )}
                {stats.lateToday > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.lateToday / Math.max(stats.totalEmployees, 1)) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.1 }} title={`Late: ${stats.lateToday}`}
                    className="bg-amber-400 h-full" />
                )}
                {stats.onLeaveToday > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.onLeaveToday / Math.max(stats.totalEmployees, 1)) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.2 }} title={`On Leave: ${stats.onLeaveToday}`}
                    className="bg-violet-400 h-full" />
                )}
                {stats.absentToday > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.absentToday / Math.max(stats.totalEmployees, 1)) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.3 }} title={`Absent: ${stats.absentToday}`}
                    className="bg-red-400 h-full rounded-r-lg" />
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Present', count: stats.presentToday, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
                  { label: 'Late',    count: stats.lateToday,    icon: Clock,       color: 'bg-amber-50 text-amber-700 border-amber-100',   dot: 'bg-amber-400' },
                  { label: 'On Leave',count: stats.onLeaveToday, icon: Calendar,    color: 'bg-violet-50 text-violet-700 border-violet-100', dot: 'bg-violet-400' },
                  { label: 'Absent',  count: stats.absentToday,  icon: XCircle,     color: 'bg-red-50 text-red-700 border-red-100',          dot: 'bg-red-400' },
                ].map(s => (
                  <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl border ${s.color}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <div>
                      <p className="text-lg font-black">{s.count}</p>
                      <p className="text-xs opacity-70 font-medium">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent check-ins */}
              {attendanceRecords.filter(a => a.checkIn && (a.status === 'present' || a.status === 'late')).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Recent Check-ins</p>
                  <div className="space-y-2">
                    {attendanceRecords
                      .filter(a => a.checkIn)
                      .slice(0, 4)
                      .map((rec, i) => {
                        const name = rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : `Employee #${rec.employeeId}`;
                        return (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="w-7 h-7 bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] rounded-full flex items-center justify-center shrink-0">
                              <span className="text-white text-[10px] font-bold">{getInitials(name)}</span>
                            </div>
                            <span className="font-medium text-gray-700 flex-1 truncate">{name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${rec.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {rec.status}
                            </span>
                            <span className="text-xs text-gray-400 tabular-nums">
                              {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }) : '--'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Pending Leave Requests */}
          <motion.div variants={iv} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="font-bold text-gray-800">Pending Leave Requests</h2>
                {stats.pendingLeaves > 0 && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full animate-pulse">{stats.pendingLeaves}</span>
                )}
              </div>
              <button onClick={() => navigate('/leaves')}
                className="flex items-center gap-1 text-xs text-[#6B8DA2] font-semibold hover:underline cursor-pointer">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentLeaves.length === 0 ? (
                <div className="p-10 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">No pending leave requests</p>
                </div>
              ) : recentLeaves.map(leave => (
                <div key={leave.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{getInitials(leave.empName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{leave.empName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {leave.type} · {leave.days}d ·{' '}
                      {leave.from ? new Date(leave.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      {' – '}
                      {leave.to ? new Date(leave.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </p>
                  </div>
                  {leave.department && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">{leave.department}</span>
                  )}
                  <span className="shrink-0 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                    Pending
                  </span>
                </div>
              ))}
            </div>
            {leaveRequests.length > 5 && (
              <div className="p-3 border-t border-gray-50 text-center">
                <button onClick={() => navigate('/leaves')} className="text-xs text-[#6B8DA2] font-semibold hover:underline cursor-pointer">
                  See all {leaveRequests.length} requests →
                </button>
              </div>
            )}
          </motion.div>

          {/* Department Performance */}
          {deptBreakdown.length > 0 && (
            <motion.div variants={iv} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="font-bold text-gray-800">Department KPI Performance</h2>
                </div>
                <button onClick={() => navigate('/analytics')}
                  className="flex items-center gap-1 text-xs text-[#6B8DA2] font-semibold hover:underline cursor-pointer">
                  Analytics <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                {deptBreakdown.map((dept: any, i: number) => {
                  const pct = Math.min(Math.round(dept.avgAchievement || 0), 100);
                  const color = pct >= 80 ? 'from-emerald-500 to-teal-500' : pct >= 50 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500';
                  return (
                    <div key={dept.departmentId || i} className="flex items-center gap-4">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{dept.name}</p>
                        <p className="text-[10px] text-gray-400">{dept.employees} emp</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, delay: i * 0.05 }}
                              className={`h-2.5 rounded-full bg-gradient-to-r ${color}`} />
                          </div>
                          <span className={`text-xs font-bold w-8 text-right ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right col (1/3): Quick actions, Top performers, Birthdays */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <motion.div variants={iv} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-bold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'Manage Employees',  icon: Users,      route: '/employees',    color: 'from-blue-500 to-indigo-500' },
                { label: 'Attendance Report', icon: UserCheck,  route: '/attendance',   color: 'from-emerald-500 to-teal-500' },
                { label: 'Leave Requests',    icon: FileText,   route: '/leaves',       color: 'from-orange-500 to-red-500' },
                { label: 'Task Management',   icon: Target,     route: '/tasks',        color: 'from-violet-500 to-purple-500' },
                { label: 'KPI Analytics',     icon: BarChart3,  route: '/analytics',    color: 'from-cyan-500 to-blue-500' },
                { label: 'Sales Dashboard',   icon: TrendingUp, route: '/sales',        color: 'from-amber-500 to-orange-500' },
                { label: 'Organization',      icon: Building2,  route: '/organization', color: 'from-pink-500 to-rose-500' },
                { label: 'Birthdays',         icon: Gift,       route: '/birthdays',    color: 'from-fuchsia-500 to-pink-500' },
              ].map(action => (
                <motion.button key={action.route} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.route)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group">
                  <div className={`w-8 h-8 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-gray-700 text-left">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Top Performers */}
          {topPerformers.length > 0 && (
            <motion.div variants={iv} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 p-5 border-b border-gray-50">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-bold text-gray-800">Top Performers</h2>
              </div>
              <div className="p-4 space-y-3">
                {topPerformers.map((p: any, i: number) => {
                  const pct = Math.round(p.achievementPercent || 0);
                  const medals = ['🥇', '🥈', '🥉', '🏅'];
                  return (
                    <div key={p.employee?.id || i} className="flex items-center gap-3">
                      <span className="text-lg shrink-0">{medals[i] || '🏅'}</span>
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">
                          {getInitials(`${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.employee?.firstName} {p.employee?.lastName}</p>
                        <p className="text-[10px] text-gray-400 truncate">{p.employee?.position}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-sm font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Upcoming Birthdays */}
          {upcomingBirthdays.length > 0 && (
            <motion.div variants={iv} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-50 rounded-xl flex items-center justify-center">
                    <Gift className="w-4 h-4 text-pink-600" />
                  </div>
                  <h2 className="font-bold text-gray-800">Upcoming Birthdays</h2>
                </div>
                <button onClick={() => navigate('/birthdays')} className="text-xs text-[#6B8DA2] font-semibold hover:underline cursor-pointer">
                  All →
                </button>
              </div>
              <div className="p-4 space-y-3">
                {upcomingBirthdays.map(emp => {
                  const bday = new Date(emp.birthday!);
                  const thisYear = new Date(new Date().getFullYear(), bday.getMonth(), bday.getDate());
                  const diff = Math.ceil((thisYear.getTime() - new Date().setHours(0,0,0,0)) / 86400000);
                  return (
                    <div key={emp.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{getInitials(emp.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{emp.name}</p>
                        <p className="text-[10px] text-gray-400">{emp.department}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {diff === 0
                          ? <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">Today 🎂</span>
                          : diff === 1
                          ? <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Tomorrow</span>
                          : <span className="text-xs text-gray-400 font-medium">in {diff}d</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Department Headcount ── */}
      {sortedDepts.length > 0 && (
        <motion.div variants={iv} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                <Layers className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="font-bold text-gray-800">Department Headcount</h2>
            </div>
            <button onClick={() => navigate('/employees')} className="flex items-center gap-1 text-xs text-[#6B8DA2] font-semibold hover:underline cursor-pointer">
              View Employees <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedDepts.map(([dept, count], i) => {
              const pct = Math.round((count / Math.max(stats.totalEmployees, 1)) * 100);
              return (
                <motion.div key={dept} whileHover={{ y: -2 }} onClick={() => navigate('/employees')}
                  className="p-4 rounded-2xl border border-gray-100 hover:shadow-md transition cursor-pointer">
                  <div className={`w-8 h-8 bg-gradient-to-br ${DEPT_COLORS[i % DEPT_COLORS.length]} rounded-xl mb-3 flex items-center justify-center`}>
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-black text-gray-900 text-xl">{count}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5 truncate">{dept}</p>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.04 }}
                      className={`h-1.5 rounded-full bg-gradient-to-r ${DEPT_COLORS[i % DEPT_COLORS.length]}`} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{pct}% of total</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Company Performance Strip ── */}
      {companyPerf && (
        <motion.div variants={iv}
          className="bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] rounded-2xl p-5 shadow-xl relative overflow-hidden cursor-pointer"
          onClick={() => navigate('/analytics')}
          whileHover={{ scale: 1.01 }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
          </div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Company Performance · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              <p className="text-3xl font-black text-white">{Math.round(companyPerf.averageAchievement || 0)}% Average Achievement</p>
              <p className="text-white/70 text-sm mt-1">
                {companyPerf.totalAchieved?.toLocaleString()} achieved of {companyPerf.totalTarget?.toLocaleString()} target
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-center">
                <p className="text-2xl font-black text-white">{companyPerf.topPerformers?.length || 0}</p>
                <p className="text-white/70 text-xs">Top Performers</p>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">{companyPerf.underperformers?.length || 0}</p>
                <p className="text-white/70 text-xs">Need Attention</p>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">{companyPerf.departmentBreakdown?.length || departments.length}</p>
                <p className="text-white/70 text-xs">Departments</p>
              </div>
            </div>
          </div>
          <div className="relative flex items-center gap-2 mt-4 text-white/80 text-sm font-semibold">
            <BarChart3 className="w-4 h-4" />
            Click to view full analytics
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>
      )}

    </motion.div>
  );
};

export default EmployerDashboard;
