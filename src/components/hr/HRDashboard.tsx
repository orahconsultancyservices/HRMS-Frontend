import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, UserX, UserPlus, Clock, Calendar,
  FileText, TrendingUp, Building2, Activity
} from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi, leaveApi } from '../../services/api';
import { useCurrentUser } from '../../hooks/useAuth';

const DEPT_COLORS: Record<string, string> = {
  'Sales Department':      'bg-blue-500',
  'Resume Department':     'bg-violet-500',
  'Marketing Department':  'bg-pink-500',
  'Technical Department':  'bg-teal-500',
};
const DEPT_FALLBACK = 'bg-slate-500';

export default function HRDashboard() {
  const { data: user } = useCurrentUser();
  const { data: employees = [] } = useEmployees();

  const today = new Date().toISOString().split('T')[0];

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-today-hr'],
    queryFn: () => attendanceApi.getAll({ date: today }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: leavesData } = useQuery({
    queryKey: ['leaves-hr'],
    queryFn: () => leaveApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  const stats = useMemo(() => {
    const active = employees.filter(e => e.isActive !== false);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = active.filter(e => e.joinDate && new Date(e.joinDate) >= thisMonth);

    const todayRecords: any[] = attendanceData?.data ?? [];
    const presentToday = todayRecords.filter(
      r => r.status === 'present' || r.status === 'late' || r.checkIn
    ).length;

    const allLeaves: any[] = leavesData?.data ?? [];
    const pendingLeaves = allLeaves.filter(l => l.status === 'pending').length;
    const onLeaveToday = allLeaves.filter(l => {
      if (l.status !== 'approved') return false;
      const from = l.from ? new Date(l.from).toISOString().split('T')[0] : null;
      const to = l.to ? new Date(l.to).toISOString().split('T')[0] : null;
      return from && to && today >= from && today <= to;
    }).length;

    return {
      total: active.length,
      presentToday,
      onLeaveToday,
      newThisMonth: newThisMonth.length,
      pendingLeaves,
    };
  }, [employees, attendanceData, leavesData, today]);

  const deptBreakdown = useMemo(() => {
    const active = employees.filter(e => e.isActive !== false);
    const map: Record<string, number> = {};
    for (const e of active) {
      const dept = e.department || 'Unassigned';
      map[dept] = (map[dept] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [employees]);

  const recentHires = useMemo(() =>
    [...employees]
      .filter(e => e.isActive !== false && e.joinDate)
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
      .slice(0, 6),
  [employees]);

  const statCards = [
    {
      label: 'Total Employees',
      value: stats.total,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Present Today',
      value: stats.presentToday,
      icon: UserCheck,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'On Leave Today',
      value: stats.onLeaveToday,
      icon: UserX,
      color: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: 'New This Month',
      value: stats.newThisMonth,
      icon: UserPlus,
      color: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      label: 'Pending Leaves',
      value: stats.pendingLeaves,
      icon: FileText,
      color: 'from-rose-500 to-rose-600',
      bg: 'bg-rose-50',
      textColor: 'text-rose-600',
    },
  ];

  const firstName = user?.name?.split(' ')[0] ?? 'HR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {firstName}</h1>
            <p className="text-green-100 mt-1 text-sm">
              HR Portal &nbsp;·&nbsp;{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl">
            <Activity className="w-4 h-4 text-green-100" />
            <span className="text-sm font-medium text-green-50">People Operations</span>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3"
          >
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-gray-800">Department Headcount</h2>
          </div>
          <div className="space-y-3">
            {deptBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No employee data</p>
            ) : (
              deptBreakdown.map(([dept, count]) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                const color = DEPT_COLORS[dept] ?? DEPT_FALLBACK;
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium truncate max-w-[180px]">{dept}</span>
                      <span className="text-gray-500 shrink-0">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Recent Hires */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-gray-800">Recent Hires</h2>
          </div>
          <div className="space-y-3">
            {recentHires.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No employees yet</p>
            ) : (
              recentHires.map(emp => (
                <div key={emp.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {emp.avatar || (emp.firstName?.[0] ?? '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{emp.position} · {emp.department}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(emp.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { icon: Users, label: 'Manage Employees', desc: 'Add, edit, or remove staff records', color: 'text-blue-500', bg: 'bg-blue-50' },
          { icon: Clock, label: 'Track Attendance', desc: 'Monitor clock-ins, clock-outs & breaks', color: 'text-teal-500', bg: 'bg-teal-50' },
          { icon: Calendar, label: 'Leave Management', desc: 'Review and approve leave requests', color: 'text-violet-500', bg: 'bg-violet-50' },
        ].map((item, i) => (
          <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
