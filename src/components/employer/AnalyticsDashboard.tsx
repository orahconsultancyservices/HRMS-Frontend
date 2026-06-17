// src/components/employer/AnalyticsDashboard.tsx
// Comprehensive Performance & Analytics Dashboard — Admin View

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ComposedChart,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus,
  Users, Target, CheckCircle, AlertCircle, Clock,
  Building, Award, BarChart3, PieChart as PieIcon,
  Activity, Search, Calendar, Download,
  ChevronDown, Star, Zap, Flame, ArrowUpRight,
  Shield,
} from 'lucide-react';

import { useTasks } from '../../hooks/useTasks';
import { useEmployees } from '../../hooks/useEmployees';
import { useMonthlyPerformance } from '../../hooks/usePerformance';
import { taskApi } from '../../services/taskApi';
import { useQuery } from '@tanstack/react-query';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#EC4899', '#14B8A6', '#84CC16',
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const CATEGORY_COLORS: Record<string, string> = {
  applications: '#6366F1', interviews: '#8B5CF6', assessments: '#EC4899',
  calls: '#F59E0B', meetings: '#3B82F6', closures: '#10B981',
  screenings: '#14B8A6', submissions: '#F97316', placements: '#84CC16',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

const getGrade = (p: number) =>
  p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B+' : p >= 60 ? 'B' : p >= 40 ? 'C' : 'D';

const getGradeColor = (p: number) =>
  p >= 80  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
  p >= 60  ? 'text-blue-700 bg-blue-50 border-blue-200'          :
  p >= 40  ? 'text-amber-700 bg-amber-50 border-amber-200'       :
  'text-red-700 bg-red-50 border-red-200';

const getBarColor = (p: number) =>
  p >= 80  ? '#10B981' :
  p >= 60  ? '#3B82F6' :
  p >= 40  ? '#F59E0B' :
  '#EF4444';

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',     'from-fuchsia-500 to-purple-600',
];
const avatarGrad = (id: number) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];

// Custom tooltip for recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-bold text-gray-800 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold text-gray-900">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'departments' | 'employees' | 'tasks' | 'monthly';

interface KPICard {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color: string;
  trend?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ card }: { card: KPICard }) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-violet-50 text-violet-600',
    teal:   'bg-teal-50 text-teal-600',
  };
  return (
    <motion.div whileHover={{ y: -3 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[card.color]}`}>
          <card.icon className="w-5 h-5" />
        </div>
        {card.trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            card.trend > 0 ? 'bg-emerald-50 text-emerald-700' :
            card.trend < 0 ? 'bg-red-50 text-red-600' :
            'bg-gray-50 text-gray-500'
          }`}>
            {card.trend > 0 ? <TrendingUp className="w-3 h-3" /> : card.trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(card.trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{card.value}</p>
        <p className="text-sm font-semibold text-gray-500 mt-0.5">{card.label}</p>
        {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
      </div>
    </motion.div>
  );
}

function SectionCard({ title, icon: Icon, children, className = '' }: {
  title: string; icon: any; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface AnalyticsDashboardProps {
  currentUser?: {
    id: number;
    name: string;
    role: 'employer' | 'manager' | 'teamlead' | 'hr' | 'employee';
    department?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AnalyticsDashboard = ({ currentUser }: AnalyticsDashboardProps = {}) => {
  const now = new Date();
  const [activeTab, setActiveTab]             = useState<TabId>('overview');
  const [selectedMonth, setSelectedMonth]     = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear]       = useState(now.getFullYear());
  const [selectedEmpId, setSelectedEmpId]     = useState(0);
  const [empSearch, setEmpSearch]             = useState('');

  // ── Role detection (drives all scoping / UI customisation) ───────────────
  const isAdmin    = !currentUser || currentUser.role === 'employer';
  const isManager  = currentUser?.role === 'manager';
  const isTeamLead = currentUser?.role === 'teamlead';
  const isHR       = currentUser?.role === 'hr';

  // ── Data fetching ────────────────────────────────────────────────────────
  // Pass month/year so the backend returns only tasks whose deadline is in that period.
  // React Query uses the params as part of the cache key, so changing the selector
  // automatically triggers a fresh fetch.
  const { data: tasksRaw = [], isLoading: tasksLoading } = useTasks({ month: selectedMonth, year: selectedYear });
  const { data: rawEmp   = [], isLoading: empLoading   } = useEmployees();

  // Employee monthly history (last 6 snapshots)
  const { data: empHistory = [] } = useMonthlyPerformance(
    selectedEmpId, { limit: 6 }
  );

  // Company performance (monthly snapshots, if generated)
  const { data: companyPerfRaw = {} } = useQuery({
    queryKey: ['companyPerf', selectedYear, selectedMonth],
    queryFn: async () => {
      const r = await taskApi.getCompanyPerformance({ year: selectedYear, month: selectedMonth });
      return r.data || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  // Team performance (task-based)
  const { data: teamPerfRaw = [] } = useQuery({
    queryKey: ['teamPerf', selectedYear, selectedMonth],
    queryFn: async () => {
      const r = await taskApi.getTeamPerformance({ month: selectedMonth, year: selectedYear });
      return r.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Normalise + scope data ────────────────────────────────────────────────
  // All employees from the API (already dept-scoped by backend x-user header)
  const allEmployees: any[] = useMemo(() => Array.isArray(rawEmp) ? rawEmp : [], [rawEmp]);

  // Role-scoped employee list:
  //  • Team lead  → only direct reports (reportTo === currentUser.id)
  //  • Manager    → only their department
  //  • HR / Admin → everyone the backend returned
  const employees: any[] = useMemo(() => {
    if (isTeamLead && currentUser?.id) {
      return allEmployees.filter((e: any) => e.reportTo === currentUser.id);
    }
    if (isManager && currentUser?.department) {
      return allEmployees.filter((e: any) => e.department === currentUser.department);
    }
    return allEmployees;
  }, [allEmployees, isTeamLead, isManager, currentUser]);

  // Set of visible employee IDs used to scope tasks on the frontend
  const visibleEmpIds = useMemo(() => new Set(employees.map((e: any) => e.id)), [employees]);

  // Role-scoped + month-filtered task list:
  //  1. Client-side month/year guard (safety net on top of backend filter)
  //  2. For team leads: restrict to direct reports' tasks (+ their own tasks)
  //  3. For managers:  restrict to their department employees' tasks
  const tasks: any[] = useMemo(() => {
    const raw = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw as any)?.data || [];
    const monthFiltered = raw.filter((t: any) => {
      const dateStr = t.deadline || t.createdAt || '';
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
    });
    if (isTeamLead && currentUser?.id) {
      // Include tasks assigned TO a direct report OR directly TO the team lead
      return monthFiltered.filter((t: any) =>
        visibleEmpIds.has(t.assignedToId) || t.assignedToId === currentUser.id
      );
    }
    if (isManager) {
      return monthFiltered.filter((t: any) => visibleEmpIds.has(t.assignedToId));
    }
    return monthFiltered; // admin / HR — full dataset
  }, [tasksRaw, selectedMonth, selectedYear, isTeamLead, isManager, currentUser, visibleEmpIds]);
  const companyPerf: any = companyPerfRaw as any;
  const teamPerf: any[]  = Array.isArray(teamPerfRaw) ? teamPerfRaw : [];

  // ── Derived: aggregate by employee ───────────────────────────────────────
  const empPerfMap = useMemo(() => {
    const map: Record<number, { total: number; completed: number; overdue: number; active: number; achieved: number; target: number }> = {};
    tasks.forEach((t: any) => {
      const id = t.assignedToId;
      if (!map[id]) map[id] = { total: 0, completed: 0, overdue: 0, active: 0, achieved: 0, target: 0 };
      map[id].total++;
      if (t.status === 'completed') map[id].completed++;
      if (t.status === 'overdue')   map[id].overdue++;
      if (t.status === 'active')    map[id].active++;
      map[id].achieved += (t.achieved || 0);
      map[id].target   += (t.target   || 0);
    });
    return map;
  }, [tasks]);

  // ── Derived: aggregate by department ────────────────────────────────────
  const deptPerfMap = useMemo(() => {
    const map: Record<string, { total: number; completed: number; overdue: number; achieved: number; target: number; headCount: number }> = {};
    employees.forEach((emp: any) => {
      const dept = emp.department || 'Unknown';
      if (!map[dept]) map[dept] = { total: 0, completed: 0, overdue: 0, achieved: 0, target: 0, headCount: 0 };
      map[dept].headCount++;
      const ep = empPerfMap[emp.id];
      if (ep) {
        map[dept].total     += ep.total;
        map[dept].completed += ep.completed;
        map[dept].overdue   += ep.overdue;
        map[dept].achieved  += ep.achieved;
        map[dept].target    += ep.target;
      }
    });
    return map;
  }, [employees, empPerfMap]);

  // ── Derived: top / bottom performers ────────────────────────────────────
  const rankedEmployees = useMemo(() =>
    employees
      .map((emp: any) => {
        const ep = empPerfMap[emp.id];
        const achievement = ep ? pct(ep.achieved, ep.target) : 0;
        const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        return { ...emp, name, ep, achievement };
      })
      .filter((e: any) => e.ep && e.ep.total > 0)
      .sort((a: any, b: any) => b.achievement - a.achievement),
    [employees, empPerfMap]
  );

  const topPerformers    = rankedEmployees.slice(0, 10);
  const underPerformers  = rankedEmployees.filter((e: any) => e.achievement < 60);

  // ── Derived: task breakdown charts ──────────────────────────────────────
  const taskStatusData = useMemo(() => [
    { name: 'Completed', value: tasks.filter((t: any) => t.status === 'completed').length, color: '#10B981' },
    { name: 'Active',    value: tasks.filter((t: any) => t.status === 'active').length,    color: '#6366F1' },
    { name: 'Overdue',   value: tasks.filter((t: any) => t.status === 'overdue').length,   color: '#EF4444' },
  ], [tasks]);

  const taskTypeData = useMemo(() => (['daily','weekly','monthly'] as const).map(type => {
    const ts = tasks.filter((t: any) => t.type === type);
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      Total: ts.length,
      Completed: ts.filter((t: any) => t.status === 'completed').length,
      Overdue:   ts.filter((t: any) => t.status === 'overdue').length,
    };
  }), [tasks]);

  const taskCategoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    tasks.forEach((t: any) => { cats[t.category] = (cats[t.category] || 0) + 1; });
    return Object.entries(cats)
      .map(([cat, count]) => ({ name: cat, value: count, fill: CATEGORY_COLORS[cat] || '#6B7280' }))
      .sort((a, b) => b.value - a.value);
  }, [tasks]);

  // ── Derived: department chart data ───────────────────────────────────────
  const deptChartData = useMemo(() =>
    Object.entries(deptPerfMap)
      .map(([dept, d]) => ({
        name: dept.length > 12 ? dept.slice(0, 12) + '…' : dept,
        fullName: dept,
        Achievement: pct(d.achieved, d.target),
        Completion:  pct(d.completed, d.total),
        Target: d.target,
        Achieved: d.achieved,
        Tasks: d.total,
        Headcount: d.headCount,
      }))
      .sort((a, b) => b.Achievement - a.Achievement),
    [deptPerfMap]
  );

  // ── Derived: monthly trend data (last 6 months from snapshots) ───────────
  const monthlyTrendData = useMemo(() => {
    const hist = Array.isArray(empHistory) ? empHistory : [];
    return [...hist].reverse().map((rec: any) => ({
      name: `${MONTHS[(rec.month || 1) - 1].slice(0, 3)} ${rec.year || selectedYear}`,
      Achievement: Math.round(rec.achievementPercent || 0),
      Target: rec.totalTarget || 0,
      Achieved: rec.totalAchieved || 0,
    }));
  }, [empHistory, selectedYear]);

  // ── Derived: employee radar data ─────────────────────────────────────────
  const empRadarData = useMemo(() => {
    if (!selectedEmpId) return [];
    const empTasks = tasks.filter((t: any) => t.assignedToId === selectedEmpId);
    const cats = ['applications','interviews','calls','screenings','submissions','placements'];
    return cats.map(cat => {
      const catTasks = empTasks.filter((t: any) => t.category === cat);
      const achieved = catTasks.reduce((s: number, t: any) => s + (t.achieved || 0), 0);
      const target   = catTasks.reduce((s: number, t: any) => s + (t.target || 0), 0);
      return { subject: cat.charAt(0).toUpperCase() + cat.slice(1), value: pct(achieved, target), fullMark: 100 };
    }).filter(d => d.value > 0);
  }, [tasks, selectedEmpId]);

  // ── Derived: monthly snapshot table ─────────────────────────────────────
  const monthlyTableData = useMemo(() => {
    // Use company performance snapshot if available; otherwise derive from tasks
    if (companyPerf.departments?.length) {
      return companyPerf.departments.flatMap((dept: any) =>
        (dept.employees || []).map((emp: any) => ({ ...emp, department: dept.department }))
      );
    }
    return rankedEmployees.map((emp: any) => ({
      name: emp.name,
      department: emp.department,
      totalTasksAssigned: emp.ep?.total ?? 0,
      totalTasksCompleted: emp.ep?.completed ?? 0,
      totalTarget: emp.ep?.target ?? 0,
      totalAchieved: emp.ep?.achieved ?? 0,
      achievementPercent: emp.achievement,
    }));
  }, [companyPerf, rankedEmployees]);

  // ── Filtered employee list for selector ─────────────────────────────────
  const filteredEmployees = useMemo(() =>
    employees.filter((e: any) => {
      const n = (e.name || `${e.firstName||''} ${e.lastName||''}`.trim()).toLowerCase();
      return n.includes(empSearch.toLowerCase()) || (e.department||'').toLowerCase().includes(empSearch.toLowerCase());
    }),
    [employees, empSearch]
  );

  const selectedEmp = employees.find((e: any) => e.id === selectedEmpId);
  const selectedEmpPerf = selectedEmpId ? empPerfMap[selectedEmpId] : null;

  // ── Animation variants ───────────────────────────────────────────────────
  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  // Team leads manage a single team — department comparison tab is irrelevant for them
  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview',    label: 'Overview',    icon: Activity },
    ...(!isTeamLead ? [{ id: 'departments' as TabId, label: 'Departments', icon: Building }] : []),
    { id: 'employees',   label: isTeamLead ? 'My Team' : 'Employees', icon: Users },
    { id: 'tasks',       label: 'Task Analytics', icon: Target },
    { id: 'monthly',     label: 'Monthly Snapshot', icon: Calendar },
  ];

  const isLoading  = tasksLoading || empLoading;
  const hasNoData  = !tasksLoading && tasks.length === 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading analytics…</p>
      </div>
    );
  }

  // ── Global totals (for overview) ─────────────────────────────────────────
  const totalTarget   = tasks.reduce((s: number, t: any) => s + (t.target || 0), 0);
  const totalAchieved = tasks.reduce((s: number, t: any) => s + (t.achieved || 0), 0);
  const totalComplete = tasks.filter((t: any) => t.status === 'completed').length;
  const totalOverdue  = tasks.filter((t: any) => t.status === 'overdue').length;
  const overallAchPct = pct(totalAchieved, totalTarget);
  const completionRate = pct(totalComplete, tasks.length);

  const overviewCards: KPICard[] = [
    {
      label: isTeamLead ? 'Team Members' : 'Total Employees',
      value: employees.length,
      icon: Users, color: 'blue',
      sub: `${rankedEmployees.length} with active tasks`,
    },
    { label: 'Total Tasks',     value: tasks.length,        icon: Target,       color: 'purple', sub: `${totalComplete} completed` },
    { label: 'Achievement %',   value: `${overallAchPct}%`, icon: Award,        color: 'green',  sub: `${totalAchieved.toLocaleString()} / ${totalTarget.toLocaleString()} units` },
    { label: 'Completion Rate', value: `${completionRate}%`,icon: CheckCircle,  color: 'teal',   sub: `${totalComplete} of ${tasks.length} tasks done` },
    { label: 'Overdue Tasks',   value: totalOverdue,         icon: AlertCircle,  color: 'red',    sub: totalOverdue > 0 ? 'Needs attention' : 'All on track' },
    isTeamLead
      ? { label: 'Your Department', value: currentUser?.department || '—', icon: Building, color: 'amber', sub: 'Scope of your analytics' }
      : { label: 'Departments', value: Object.keys(deptPerfMap).length, icon: Building, color: 'amber', sub: `${deptChartData.length} active depts` },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6 pb-10">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isTeamLead ? 'bg-gradient-to-br from-teal-500 to-teal-600'   :
              isManager  ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
              isHR       ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
              'bg-gradient-to-br from-teal-500 to-emerald-600'
            }`}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {isTeamLead ? 'Team Analytics'       :
               isManager  ? 'Department Analytics' :
               isHR       ? 'HR Analytics'         :
               'Performance Analytics'}
            </h2>
            {currentUser && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                isTeamLead ? 'bg-teal-50 text-teal-700 border-teal-200'     :
                isManager  ? 'bg-amber-50 text-amber-700 border-amber-200'  :
                isHR       ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                {isTeamLead ? 'Team Lead' : isManager ? 'Manager' : isHR ? 'HR' : 'Admin'}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm ml-12">
            {isTeamLead
              ? `Analytics for your direct reports${currentUser?.department ? ` · ${currentUser.department}` : ''}`
              : isManager
              ? `Department analytics${currentUser?.department ? ` · ${currentUser.department}` : ''}`
              : isHR
              ? 'Company-wide analytics — Human Resources view'
              : 'Comprehensive performance monitoring — employees, teams, departments'}
          </p>
        </div>

        {/* Month / Year filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      {/* ── TAB NAV ─────────────────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ── Role scope banner ───────────────────────────────────────────── */}
      {currentUser && !isAdmin && (
        <motion.div variants={iv}
          className={`flex items-start gap-3 p-3 rounded-xl text-sm border ${
            isTeamLead ? 'bg-teal-50 border-teal-200 text-teal-800'       :
            isManager  ? 'bg-amber-50 border-amber-200 text-amber-800'    :
            'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            {isTeamLead && (
              <>
                <span className="font-bold">Team Lead scope</span> — showing analytics for your{' '}
                <span className="font-bold">{employees.length} direct report{employees.length !== 1 ? 's' : ''}</span>
                {currentUser.department ? ` in ${currentUser.department}` : ''}.
              </>
            )}
            {isManager && (
              <>
                <span className="font-bold">Manager scope</span> — showing analytics for{' '}
                <span className="font-bold">{currentUser.department || 'your department'}</span>
                {' '}({employees.length} employee{employees.length !== 1 ? 's' : ''}).
              </>
            )}
            {isHR && (
              <>
                <span className="font-bold">HR scope</span> — full company visibility across all departments and employees.
              </>
            )}
          </p>
        </motion.div>
      )}

      {/* ── No-data banner ──────────────────────────────────────────────── */}
      {hasNoData && (
        <motion.div variants={iv}
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              No task data for {MONTHS[selectedMonth - 1]} {selectedYear}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Tasks are filtered by their deadline date. Try a different month, or check that
              tasks with deadlines in this period have been created.
            </p>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-5">

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {overviewCards.map((card, i) => <StatCard key={i} card={card} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Department Achievement Bar */}
              <div className="lg:col-span-2">
                <SectionCard title="Department Achievement vs Completion" icon={BarChart3}>
                  {deptChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-300">
                      <p className="text-sm">No department data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={deptChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Achievement" name="Achievement %" fill="#10B981" radius={[4,4,0,0]} />
                        <Bar dataKey="Completion"  name="Completion %" fill="#6366F1" radius={[4,4,0,0]} />
                        <Line type="monotone" dataKey="Achievement" stroke="#F59E0B" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </SectionCard>
              </div>

              {/* Task Status Pie */}
              <SectionCard title="Task Status Distribution" icon={PieIcon}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={75}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {taskStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {taskStatusData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-gray-600 font-medium">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Top Performers + Underperformers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard title="Top Performers" icon={Star}>
                {topPerformers.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topPerformers.slice(0, 8).map((emp: any, i) => (
                      <div key={emp.id} className="flex items-center gap-3">
                        <span className={`text-xs font-black w-5 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-300'}`}>
                          #{i + 1}
                        </span>
                        <div className={`w-8 h-8 bg-gradient-to-br ${avatarGrad(emp.id)} rounded-lg flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">{initials(emp.name)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-800 truncate">{emp.name}</span>
                            <span className={`text-xs font-bold ml-2 px-1.5 py-0.5 rounded-md border ${getGradeColor(emp.achievement)}`}>{getGrade(emp.achievement)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(emp.achievement, 100)}%`, backgroundColor: getBarColor(emp.achievement) }} />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-12 text-right">{emp.achievement}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Needs Attention (< 60%)" icon={AlertCircle}>
                {underPerformers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <CheckCircle className="w-10 h-10 text-emerald-300 mb-2" />
                    <p className="text-gray-400 text-sm font-medium">All employees above 60% threshold</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {underPerformers.slice(0, 8).map((emp: any) => (
                      <div key={emp.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${avatarGrad(emp.id)} rounded-lg flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">{initials(emp.name)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <span className="text-xs font-semibold text-gray-800 block truncate">{emp.name}</span>
                              <span className="text-xs text-gray-400">{emp.department}</span>
                            </div>
                            <span className="text-xs font-bold text-red-600 ml-2">{emp.achievement}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${emp.achievement}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DEPARTMENTS TAB                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'departments' && (
          <motion.div key="departments" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-5">

            {/* Big bar — target vs achieved by department */}
            <SectionCard title="Target vs Achieved — Department Comparison" icon={BarChart3}>
              {deptChartData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-300 text-sm">No department task data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Target"   name="Total Target"   fill="#E2E8F0" radius={[4,4,0,0]} />
                    <Bar dataKey="Achieved" name="Total Achieved" fill="#10B981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Achievement % area chart */}
              <SectionCard title="Achievement % by Department" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={deptChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="achievGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Achievement" name="Achievement %" stroke="#10B981" strokeWidth={2} fill="url(#achievGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </SectionCard>

              {/* Department ranking table */}
              <SectionCard title="Department Rankings" icon={Award}>
                <div className="space-y-3">
                  {deptChartData.map((dept, i) => (
                    <div key={dept.fullName} className="flex items-center gap-3">
                      <span className={`text-xs font-black w-5 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-300'}`}>#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-800">{dept.fullName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{dept.Headcount} emp</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getGradeColor(dept.Achievement)}`}>
                              {dept.Achievement}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full" style={{ width: `${dept.Achievement}%`, backgroundColor: getBarColor(dept.Achievement) }} />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                          <span>{dept.Tasks} tasks · {dept.Completed} done</span>
                          <span>{dept.Achieved.toLocaleString()} / {dept.Target.toLocaleString()} units</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Department detail cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(deptPerfMap).map(([dept, d]) => {
                const achPct = pct(d.achieved, d.target);
                const compPct = pct(d.completed, d.total);
                return (
                  <motion.div key={dept} whileHover={{ y: -3 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-bold">{dept}</h4>
                          <p className="text-white/60 text-xs mt-0.5">{d.headCount} employees · {d.total} tasks</p>
                        </div>
                        <span className={`text-lg font-black px-3 py-1 rounded-xl ${getGradeColor(achPct)}`}>{getGrade(achPct)}</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500 font-medium">Achievement</span>
                          <span className="font-bold text-gray-700">{d.achieved.toLocaleString()} / {d.target.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full" style={{ width: `${achPct}%`, backgroundColor: getBarColor(achPct) }} />
                        </div>
                        <span className="text-xs text-gray-400">{achPct}% achieved</span>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                        {[
                          { label: 'Done', value: d.completed, color: 'text-emerald-600' },
                          { label: 'Active', value: d.total - d.completed - d.overdue, color: 'text-blue-600' },
                          { label: 'Overdue', value: d.overdue, color: 'text-red-500' },
                        ].map(s => (
                          <div key={s.label} className="py-2 text-center">
                            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* EMPLOYEES TAB                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'employees' && (
          <motion.div key="employees" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-5">

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
              {/* Employee selector panel */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Search employees…" value={empSearch}
                      onChange={e => setEmpSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-teal-400" />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-50">
                  {filteredEmployees.map((emp: any) => {
                    const n = emp.name || `${emp.firstName||''} ${emp.lastName||''}`.trim();
                    const ep = empPerfMap[emp.id];
                    const achPct = ep ? pct(ep.achieved, ep.target) : 0;
                    return (
                      <button key={emp.id} onClick={() => setSelectedEmpId(emp.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left cursor-pointer ${selectedEmpId === emp.id ? 'bg-teal-50' : ''}`}>
                        <div className={`w-9 h-9 bg-gradient-to-br ${avatarGrad(emp.id)} rounded-xl flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">{initials(n)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{n}</p>
                          <p className="text-xs text-gray-400 truncate">{emp.department}</p>
                        </div>
                        {ep && ep.total > 0 && (
                          <span className={`text-xs font-bold shrink-0 ${achPct >= 80 ? 'text-emerald-600' : achPct >= 60 ? 'text-blue-600' : achPct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                            {achPct}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Employee detail panel */}
              <div className="xl:col-span-3 space-y-5">
                {!selectedEmpId ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
                    <Users className="w-14 h-14 text-gray-200 mb-3" />
                    <p className="text-gray-500 font-semibold">Select an employee</p>
                    <p className="text-gray-400 text-sm mt-1">Pick an employee from the left to see their detailed analytics</p>
                  </div>
                ) : (
                  <>
                    {/* Employee header */}
                    {selectedEmp && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-14 h-14 bg-gradient-to-br ${avatarGrad(selectedEmpId)} rounded-2xl flex items-center justify-center`}>
                            <span className="text-white text-xl font-bold">
                              {initials(selectedEmp.name || `${selectedEmp.firstName||''}${selectedEmp.lastName||''}`)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {selectedEmp.name || `${selectedEmp.firstName||''} ${selectedEmp.lastName||''}`}
                            </h3>
                            <p className="text-gray-400 text-sm">{selectedEmp.department} · {selectedEmp.position}</p>
                            <p className="text-gray-400 text-xs">{selectedEmp.empId || selectedEmp.employeeId}</p>
                          </div>
                          {selectedEmpPerf && (
                            <div className={`ml-auto text-2xl font-black px-4 py-2 rounded-2xl border ${getGradeColor(pct(selectedEmpPerf.achieved, selectedEmpPerf.target))}`}>
                              {getGrade(pct(selectedEmpPerf.achieved, selectedEmpPerf.target))}
                            </div>
                          )}
                        </div>
                        {selectedEmpPerf && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { label: 'Tasks', value: selectedEmpPerf.total, color: 'text-gray-800' },
                              { label: 'Completed', value: selectedEmpPerf.completed, color: 'text-emerald-600' },
                              { label: 'Overdue', value: selectedEmpPerf.overdue, color: 'text-red-500' },
                              { label: 'Achievement', value: `${pct(selectedEmpPerf.achieved, selectedEmpPerf.target)}%`, color: 'text-teal-600' },
                            ].map(s => (
                              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-400">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* 6-month trend */}
                      <SectionCard title="6-Month Performance Trend" icon={TrendingUp}>
                        {monthlyTrendData.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                            <Activity className="w-8 h-8 mb-2" />
                            <p className="text-sm">No monthly snapshots yet</p>
                            <p className="text-xs mt-1">Generate snapshots in Lock Performance</p>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={monthlyTrendData}>
                              <defs>
                                <linearGradient id="empTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="Achievement" name="Achievement %" stroke="#6366F1" strokeWidth={2} fill="url(#empTrendGrad)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </SectionCard>

                      {/* Category radar */}
                      <SectionCard title="Performance by Category" icon={Activity}>
                        {empRadarData.length === 0 ? (
                          <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No category data</div>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <RadarChart data={empRadarData}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6B7280' }} />
                              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                              <Radar name="Achievement" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
                              <Tooltip />
                            </RadarChart>
                          </ResponsiveContainer>
                        )}
                      </SectionCard>
                    </div>

                    {/* Employee's tasks table */}
                    <SectionCard title="Task Breakdown" icon={Target}>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              {['Task','Type','Category','Target','Achieved','Status','Progress'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {tasks.filter((t: any) => t.assignedToId === selectedEmpId).length === 0 ? (
                              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-300 text-sm">No tasks assigned</td></tr>
                            ) : (
                              tasks.filter((t: any) => t.assignedToId === selectedEmpId).map((task: any) => {
                                const taskPct = pct(task.achieved, task.target);
                                return (
                                  <tr key={task.id} className="hover:bg-gray-50/60">
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{task.title}</td>
                                    <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg capitalize">{task.type}</span></td>
                                    <td className="px-4 py-3"><span className="text-xs capitalize text-gray-500">{task.category}</span></td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{task.target.toLocaleString()} {task.unit}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{(task.achieved || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        task.status === 'overdue'   ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                      }`}>{task.status}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                          <div className="h-1.5 rounded-full" style={{ width: `${Math.min(taskPct,100)}%`, backgroundColor: getBarColor(taskPct) }} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-600">{taskPct}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TASKS TAB                                                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'tasks' && (
          <motion.div key="tasks" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-5">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Task type grouped bar */}
              <div className="lg:col-span-2">
                <SectionCard title="Tasks by Type — Total / Completed / Overdue" icon={BarChart3}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={taskTypeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Total"     name="Total"     fill="#E2E8F0" radius={[4,4,0,0]} />
                      <Bar dataKey="Completed" name="Completed" fill="#10B981" radius={[4,4,0,0]} />
                      <Bar dataKey="Overdue"   name="Overdue"   fill="#EF4444" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
              </div>

              {/* Status donut */}
              <SectionCard title="Status Overview" icon={PieIcon}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={taskStatusData} cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {taskStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {taskStatusData.map(d => (
                    <div key={d.name} className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-gray-600 font-medium">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">{d.value}</span>
                        <span className="text-xs text-gray-400">({pct(d.value, tasks.length)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Category horizontal bar */}
            <SectionCard title="Tasks by Category" icon={Activity}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={taskCategoryData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Tasks" radius={[0,4,4,0]}>
                      {taskCategoryData.map((d, i) => <Cell key={i} fill={d.fill || CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {taskCategoryData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.fill || CHART_COLORS[i % CHART_COLORS.length] }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-700 capitalize">{d.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-gray-900">{d.value}</span>
                            <span className="text-xs text-gray-400">({pct(d.value, tasks.length)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full" style={{ width: `${pct(d.value, tasks.length)}%`, backgroundColor: d.fill || CHART_COLORS[i % CHART_COLORS.length] }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Priority distribution */}
            <SectionCard title="Task Priority Distribution" icon={Zap}>
              <div className="grid grid-cols-3 gap-4">
                {(['high','medium','low'] as const).map(priority => {
                  const count = tasks.filter((t: any) => t.priority === priority).length;
                  const p = pct(count, tasks.length);
                  const colors: Record<string,string> = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
                  const bgColors: Record<string,string> = { high: 'bg-red-50 border-red-200', medium: 'bg-amber-50 border-amber-200', low: 'bg-emerald-50 border-emerald-200' };
                  const txtColors: Record<string,string> = { high: 'text-red-700', medium: 'text-amber-700', low: 'text-emerald-700' };
                  return (
                    <div key={priority} className={`rounded-2xl border p-5 text-center ${bgColors[priority]}`}>
                      <p className={`text-3xl font-black ${txtColors[priority]}`}>{count}</p>
                      <p className={`text-sm font-bold capitalize mt-1 ${txtColors[priority]}`}>{priority}</p>
                      <p className={`text-xs mt-0.5 ${txtColors[priority]} opacity-70`}>{p}% of tasks</p>
                      <div className="w-full bg-white/60 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: `${p}%`, backgroundColor: colors[priority] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MONTHLY SNAPSHOT TAB                                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'monthly' && (
          <motion.div key="monthly" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-5">

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Employees Tracked', value: monthlyTableData.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
                { label: 'Avg Achievement', value: `${monthlyTableData.length > 0 ? Math.round(monthlyTableData.reduce((s: number, e: any) => s + (e.achievementPercent || 0), 0) / monthlyTableData.length) : 0}%`, icon: Award, color: 'bg-emerald-50 text-emerald-600' },
                { label: 'High Performers (≥80%)', value: monthlyTableData.filter((e: any) => (e.achievementPercent || 0) >= 80).length, icon: Star, color: 'bg-amber-50 text-amber-600' },
                { label: 'Needs Attention (<60%)', value: monthlyTableData.filter((e: any) => (e.achievementPercent || 0) < 60).length, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                    <card.icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{card.value}</p>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Achievement distribution bar */}
            <SectionCard title={`Employee Achievement Distribution — ${MONTHS[selectedMonth - 1]} ${selectedYear}`} icon={BarChart3}>
              {monthlyTableData.length === 0 ? (
                <p className="text-gray-300 text-sm text-center py-8">No data for this month</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={monthlyTableData.slice(0, 20).map((e: any) => ({
                      name: (e.name || '').split(' ')[0],
                      Achievement: Math.round(e.achievementPercent || 0),
                    }))}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Achievement" name="Achievement %" radius={[4,4,0,0]}>
                      {monthlyTableData.slice(0, 20).map((e: any, i: number) => (
                        <Cell key={i} fill={getBarColor(Math.round(e.achievementPercent || 0))} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* Full table */}
            <SectionCard title="Employee Performance Table" icon={Users}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#','Employee','Department','Tasks Assigned','Completed','Target','Achieved','Achievement','Grade'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthlyTableData.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-300 text-sm">No data available</td></tr>
                    ) : (
                      monthlyTableData
                        .slice()
                        .sort((a: any, b: any) => (b.achievementPercent || 0) - (a.achievementPercent || 0))
                        .map((emp: any, i: number) => {
                          const achPct = Math.round(emp.achievementPercent || 0);
                          return (
                            <tr key={i} className="hover:bg-gray-50/60 transition">
                              <td className="px-4 py-3">
                                <span className={`text-xs font-black ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-300'}`}>
                                  #{i + 1}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 bg-gradient-to-br ${avatarGrad(i)} rounded-lg flex items-center justify-center shrink-0`}>
                                    <span className="text-white text-xs font-bold">{initials(emp.name || '?')}</span>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-800">{emp.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{emp.department}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{emp.totalTasksAssigned ?? emp.total ?? 0}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{emp.totalTasksCompleted ?? emp.completed ?? 0}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{(emp.totalTarget ?? emp.target ?? 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-800">{(emp.totalAchieved ?? emp.achieved ?? 0).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div className="h-2 rounded-full" style={{ width: `${Math.min(achPct,100)}%`, backgroundColor: getBarColor(achPct) }} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-700">{achPct}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getGradeColor(achPct)}`}>
                                  {getGrade(achPct)}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
};

export default AnalyticsDashboard;
