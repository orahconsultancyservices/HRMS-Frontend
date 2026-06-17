// src/components/employer/AdminDashboard.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, Target, TrendingUp,
  Plus, Edit, Eye, Lock,
  BarChart3, Award, Briefcase, AlertTriangle,
  X, Loader2, CheckCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { departmentApi } from '../../services/api';

interface DefaultKPI {
  id: number;
  metricName: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: string;
  defaultTarget: number;
  unit: string;
  targetMin?: number;
  targetMax?: number;
  description?: string;
  isActive: boolean;
}

interface Designation {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  description?: string;
  isActive: boolean;
  defaultKPIs: DefaultKPI[];
  _count: { employees: number };
}

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  designations: Designation[];
  _count: { employees: number };
}

interface AdminDashboardProps {
  currentUser: {
    id: number;
    empId: string;
    name: string;
    email: string;
    department: string;
    position: string;
  };
}

const typeColors: Record<string, string> = {
  daily:   'bg-blue-100 text-blue-800',
  weekly:  'bg-green-100 text-green-800',
  monthly: 'bg-purple-100 text-purple-800',
};

function getPerformanceColor(rate: number) {
  return rate >= 90 ? 'text-emerald-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600';
}

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.35 } } };

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'departments' | 'designations' | 'performance'>('overview');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<Designation | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const queryClient = useQueryClient();

  const notify = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: departments = [], isLoading: deptLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await departmentApi.getAll();
      return res?.data ?? [];
    }
  });

  const { data: companyPerformance, isLoading: perfLoading } = useQuery({
    queryKey: ['company-performance', selectedMonth.year, selectedMonth.month],
    queryFn: async () => {
      const res = await axios.get(`/api/performance/company/performance?year=${selectedMonth.year}&month=${selectedMonth.month}`);
      return res.data.data;
    }
  });

  const lockMonthMutation = useMutation({
    mutationFn: async (data: any) => (await axios.put('/api/performance/monthly-performance/bulk-lock', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-performance'] });
      notify('Month locked successfully!', true);
      setShowLockModal(false);
    },
    onError: (e: any) => notify(e.response?.data?.message || 'Failed to lock month', false)
  });

  const generateSnapshotsMutation = useMutation({
    mutationFn: async (data: any) => (await axios.post('/api/performance/monthly-performance/bulk-generate', data)).data,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['company-performance'] });
      notify(res.message || `Snapshots generated for ${selectedMonth.month}/${selectedMonth.year}`, true);
    },
    onError: (e: any) => notify(e.response?.data?.message || 'Failed to generate snapshots', false)
  });

  const depts = departments as Department[];
  const totalStats = {
    departments: depts.length,
    designations: depts.reduce((s, d) => s + d.designations.length, 0),
    employees: depts.reduce((s, d) => s + d._count.employees, 0),
    avgAchievement: (companyPerformance as any)?.averageAchievement || 0
  };

  if (deptLoading || perfLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
      <p className="text-gray-400 text-sm font-medium">Loading admin data…</p>
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
          </div>
          <p className="text-gray-400 text-sm ml-10">Company-wide management & analytics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => generateSnapshotsMutation.mutate({ year: selectedMonth.year, month: selectedMonth.month })}
            disabled={generateSnapshotsMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition cursor-pointer disabled:opacity-50">
            {generateSnapshotsMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><TrendingUp className="w-4 h-4" /> Generate Snapshots</>}
          </button>
          <button onClick={() => setShowLockModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition cursor-pointer">
            <Lock className="w-4 h-4" /> Lock Month
          </button>
        </div>
      </motion.div>

      {/* Month Selector */}
      <motion.div variants={iv} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Month</label>
            <select value={selectedMonth.month}
              onChange={e => setSelectedMonth(p => ({ ...p, month: parseInt(e.target.value) }))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400 cursor-pointer">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleDateString('en-US', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Year</label>
            <select value={selectedMonth.year}
              onChange={e => setSelectedMonth(p => ({ ...p, year: parseInt(e.target.value) }))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400 cursor-pointer">
              {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Nav Tabs */}
      <motion.div variants={iv} className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
        {([
          { id: 'overview',      label: 'Overview',      icon: BarChart3 },
          { id: 'departments',   label: 'Departments',   icon: Building2 },
          { id: 'designations',  label: 'Designations',  icon: Briefcase },
          { id: 'performance',   label: 'Performance',   icon: Award },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setSelectedView(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selectedView === tab.id ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Departments',    value: totalStats.departments,                    color: 'blue',   icon: Building2 },
          { label: 'Designations',   value: totalStats.designations,                   color: 'green',  icon: Briefcase },
          { label: 'Employees',      value: totalStats.employees,                      color: 'purple', icon: Users },
          { label: 'Avg Achievement',value: `${Math.round(totalStats.avgAchievement)}%`, color: 'amber',  icon: TrendingUp },
        ].map((c, i) => (
          <motion.div key={i} whileHover={{ y: -2 }} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
              c.color === 'blue' ? 'bg-blue-50' : c.color === 'green' ? 'bg-emerald-50' :
              c.color === 'purple' ? 'bg-violet-50' : 'bg-amber-50'}`}>
              <c.icon className={`w-4 h-4 ${
                c.color === 'blue' ? 'text-blue-500' : c.color === 'green' ? 'text-emerald-500' :
                c.color === 'purple' ? 'text-violet-500' : 'text-amber-500'}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs font-medium text-gray-400 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── OVERVIEW ── */}
      {selectedView === 'overview' && (
        <motion.div variants={iv} className="space-y-5">
          {/* Department performance */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-800">Department Performance</h3>
            </div>
            <div className="p-5 space-y-4">
              {(companyPerformance as any)?.departmentBreakdown?.map((dept: any) => (
                <div key={dept.departmentId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-800">{dept.name}</h4>
                      <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-lg">{dept.employees} employees</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                      <div><p className="text-xs text-gray-400">Target</p><p className="font-semibold">{dept.totalTarget}</p></div>
                      <div><p className="text-xs text-gray-400">Achieved</p><p className="font-semibold">{dept.totalAchieved}</p></div>
                      <div><p className="text-xs text-gray-400">Rate</p><p className={`font-semibold ${getPerformanceColor(dept.avgAchievement)}`}>{Math.round(dept.avgAchievement)}%</p></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(dept.avgAchievement, 100)}%` }} transition={{ duration: 0.8 }}
                        className={`h-2 rounded-full ${dept.avgAchievement >= 80 ? 'bg-emerald-500' : dept.avgAchievement >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                  </div>
                  <button onClick={() => setSelectedDepartment(depts.find(d => d.name === dept.name) || null)}
                    className="p-2 hover:bg-white rounded-lg transition cursor-pointer shrink-0">
                    <Eye className="w-4 h-4 text-blue-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Top + Under performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 p-5 border-b border-gray-50">
                <Award className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-gray-800">Top Performers</h3>
              </div>
              <div className="p-5 space-y-3">
                {(companyPerformance as any)?.topPerformers?.slice(0, 5).map((p: any, idx: number) => (
                  <div key={p.employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-bold text-emerald-700">{idx + 1}</div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{p.employee.firstName} {p.employee.lastName}</p>
                        <p className="text-xs text-gray-400">{p.employee.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{Math.round(p.achievementPercent)}%</p>
                      <p className="text-xs text-gray-400">{p.totalAchieved}/{p.totalTarget}</p>
                    </div>
                  </div>
                ))}
                {!(companyPerformance as any)?.topPerformers?.length && (
                  <div className="text-center py-8 text-gray-300">
                    <Award className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm">No data yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 p-5 border-b border-gray-50">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-gray-800">Underperformers</h3>
              </div>
              <div className="p-5 space-y-3">
                {!(companyPerformance as any)?.underperformers?.length ? (
                  <div className="text-center py-8 text-emerald-600">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm font-medium">No underperformers this month!</p>
                  </div>
                ) : (companyPerformance as any)?.underperformers?.slice(0, 5).map((p: any) => (
                  <div key={p.employee.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{p.employee.firstName} {p.employee.lastName}</p>
                        <p className="text-xs text-gray-400">{p.employee.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{Math.round(p.achievementPercent)}%</p>
                      <p className="text-xs text-gray-400">{p.totalAchieved}/{p.totalTarget}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── DEPARTMENTS ── */}
      {selectedView === 'departments' && (
        <motion.div variants={iv} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-800">Departments Management</h3>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:shadow-lg transition cursor-pointer">
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>
          <div className="p-5 space-y-4">
            {depts.map(dept => (
              <motion.div key={dept.id} whileHover={{ y: -2 }}
                className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800">{dept.name}</h4>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">{dept.code}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${dept.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {dept.description && <p className="text-sm text-gray-500 mb-2">{dept.description}</p>}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {dept.designations.length} designations</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {dept._count.employees} employees</span>
                    </div>
                    {dept.designations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {dept.designations.slice(0, 5).map(d => (
                          <span key={d.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs border border-gray-200">{d.name}</span>
                        ))}
                        {dept.designations.length > 5 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-xs border border-gray-200">+{dept.designations.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => setSelectedDepartment(dept)} className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                      <Eye className="w-4 h-4 text-blue-500" />
                    </button>
                    <button onClick={() => setSelectedDepartment(dept)} className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── DESIGNATIONS ── */}
      {selectedView === 'designations' && (
        <motion.div variants={iv} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-500" />
              <h3 className="font-bold text-gray-800">Designations & KPIs</h3>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl hover:shadow-lg transition cursor-pointer">
              <Plus className="w-4 h-4" /> Add Designation
            </button>
          </div>
          <div className="p-5 space-y-4">
            {depts.flatMap(dept =>
              dept.designations.map(designation => (
                <motion.div key={designation.id} whileHover={{ y: -2 }}
                  className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-gray-800">{designation.name}</h4>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs border border-gray-200">{designation.code}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs border border-blue-200">{dept.name}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${designation.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {designation.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {designation.description && <p className="text-sm text-gray-500 mb-2">{designation.description}</p>}
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {designation._count.employees} employees</span>
                        <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {designation.defaultKPIs.length} KPIs</span>
                      </div>
                      {designation.defaultKPIs.length > 0 && (
                        <div className="border-t border-gray-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-600">Default KPIs</p>
                            <button onClick={() => setSelectedDesignation(designation)}
                              className="flex items-center gap-1 text-xs text-violet-600 hover:underline cursor-pointer">
                              <Plus className="w-3 h-3" /> Add KPI
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {designation.defaultKPIs.slice(0, 3).map(kpi => (
                              <div key={kpi.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700">{kpi.metricName}</span>
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${typeColors[kpi.type]}`}>{kpi.type}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-gray-700">{kpi.defaultTarget} {kpi.unit}</span>
                                  {kpi.targetMin && kpi.targetMax && (
                                    <p className="text-xs text-gray-400">Range: {kpi.targetMin}–{kpi.targetMax}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                            {designation.defaultKPIs.length > 3 && (
                              <p className="text-center text-xs text-gray-400">+{designation.defaultKPIs.length - 3} more KPIs</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => setSelectedDesignation(designation)} className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                        <Eye className="w-4 h-4 text-violet-500" />
                      </button>
                      <button onClick={() => setSelectedDesignation(designation)} className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ── PERFORMANCE ── */}
      {selectedView === 'performance' && (
        <motion.div variants={iv} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Target',    value: (companyPerformance as any)?.totalTarget || 0,    color: 'blue' },
              { label: 'Total Achieved',  value: (companyPerformance as any)?.totalAchieved || 0,  color: 'green' },
              { label: 'Avg Achievement', value: `${Math.round((companyPerformance as any)?.averageAchievement || 0)}%`, color: 'amber' },
            ].map((c, i) => (
              <motion.div key={i} whileHover={{ y: -2 }} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
                <p className="text-sm text-gray-500 mb-2">{c.label}</p>
                <p className={`text-3xl font-bold ${c.color === 'green' ? 'text-emerald-600' : c.color === 'amber' ? 'text-amber-600' : 'text-blue-600'}`}>{c.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-800">Department Breakdown</h3>
            </div>
            <div className="p-5 space-y-4">
              {(companyPerformance as any)?.departmentBreakdown?.map((dept: any) => (
                <div key={dept.departmentId} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-gray-800 text-sm">{dept.name}</span>
                      <span className={`text-sm font-bold ${getPerformanceColor(dept.avgAchievement)}`}>{Math.round(dept.avgAchievement)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(dept.avgAchievement, 100)}%` }} transition={{ duration: 0.8 }}
                        className={`h-2 rounded-full ${dept.avgAchievement >= 80 ? 'bg-emerald-500' : dept.avgAchievement >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className="font-semibold text-gray-700">{dept.totalAchieved}/{dept.totalTarget}</p>
                    <p className="text-xs text-gray-400">{dept.employees} emp</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Lock Month Modal */}
      <AnimatePresence>
        {showLockModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Lock Month Data</h3>
                    <p className="text-xs text-gray-400">This action cannot be undone</p>
                  </div>
                </div>
                <button onClick={() => setShowLockModal(false)} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> Locking will make all performance data for this period immutable.
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">You are about to lock:</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button onClick={() => lockMonthMutation.mutate({ year: selectedMonth.year, month: selectedMonth.month, lockedBy: currentUser.id })}
                  disabled={lockMonthMutation.isPending}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {lockMonthMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Locking…</> : 'Lock Month'}
                </button>
                <button onClick={() => setShowLockModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── KPI Management Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedDesignation && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Manage KPIs</h3>
                    <p className="text-xs text-gray-400">{selectedDesignation.name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDesignation(null)} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Existing KPIs */}
                <div className="space-y-2">
                  {selectedDesignation.defaultKPIs.map(kpi => (
                    <div key={kpi.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${typeColors[kpi.type]}`}>{kpi.type}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{kpi.metricName}</p>
                          <p className="text-xs text-gray-400">{kpi.category} · Target: {kpi.defaultTarget} {kpi.unit}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete KPI "${kpi.metricName}"?`)) return;
                          try {
                            await departmentApi.deleteDefaultKPI(kpi.id);
                            queryClient.invalidateQueries({ queryKey: ['departments'] });
                            setSelectedDesignation(prev =>
                              prev ? { ...prev, defaultKPIs: prev.defaultKPIs.filter(k => k.id !== kpi.id) } : null
                            );
                            notify('KPI deleted', true);
                          } catch { notify('Failed to delete KPI', false); }
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                  {selectedDesignation.defaultKPIs.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No KPIs defined yet</p>
                  )}
                </div>

                {/* Add New KPI form */}
                <KPIAddForm
                  designationId={selectedDesignation.id}
                  onAdded={(newKPI) => {
                    setSelectedDesignation(prev =>
                      prev ? { ...prev, defaultKPIs: [...prev.defaultKPIs, newKPI] } : null
                    );
                    queryClient.invalidateQueries({ queryKey: ['departments'] });
                    notify('KPI added successfully', true);
                  }}
                  onError={(msg) => notify(msg, false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedDepartment && <></>}
    </motion.div>
  );
}

// ─── KPI Add Form (sub-component to keep state clean) ─────────────────────────
function KPIAddForm({ designationId, onAdded, onError }: {
  designationId: number;
  onAdded: (kpi: any) => void;
  onError: (msg: string) => void;
}) {
  const VALID_CATEGORIES = ['applications', 'interviews', 'assessments', 'calls', 'meetings', 'closures', 'screenings', 'submissions', 'placements'];
  const [form, setForm] = useState({
    metricName: '', type: 'daily', category: 'applications',
    defaultTarget: '', unit: '', targetMin: '', targetMax: '', description: ''
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.metricName || !form.defaultTarget || !form.unit) {
      onError('Please fill in Metric Name, Default Target, and Unit'); return;
    }
    setSaving(true);
    try {
      const res = await departmentApi.createDefaultKPI({
        designationId,
        metricName: form.metricName.trim(),
        type: form.type,
        category: form.category,
        defaultTarget: parseInt(form.defaultTarget),
        unit: form.unit.trim(),
        targetMin: form.targetMin ? parseInt(form.targetMin) : undefined,
        targetMax: form.targetMax ? parseInt(form.targetMax) : undefined,
        description: form.description.trim() || undefined,
        isActive: true,
      });
      const newKPI = res?.data || res;
      onAdded(newKPI);
      setForm({ metricName: '', type: 'daily', category: 'applications', defaultTarget: '', unit: '', targetMin: '', targetMax: '', description: '' });
    } catch (e: any) {
      onError(e?.response?.data?.message || 'Failed to add KPI');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      <h4 className="text-sm font-bold text-gray-700 mb-3">Add New KPI</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Metric Name *</label>
          <input value={form.metricName} onChange={e => setForm(p => ({ ...p, metricName: e.target.value }))}
            placeholder="e.g. Placements" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Type *</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Category *</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
            {VALID_CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Default Target *</label>
          <input type="number" min="1" value={form.defaultTarget}
            onChange={e => setForm(p => ({ ...p, defaultTarget: e.target.value }))}
            placeholder="e.g. 10" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Unit *</label>
          <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
            placeholder="e.g. placements" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Min Target</label>
          <input type="number" min="0" value={form.targetMin}
            onChange={e => setForm(p => ({ ...p, targetMin: e.target.value }))}
            placeholder="Optional" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Max Target</label>
          <input type="number" min="0" value={form.targetMax}
            onChange={e => setForm(p => ({ ...p, targetMax: e.target.value }))}
            placeholder="Optional" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
          <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Optional description" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
        </div>
      </div>
      <button onClick={handleAdd} disabled={saving}
        className="mt-4 w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : <><Plus className="w-4 h-4" /> Add KPI</>}
      </button>
    </div>
  );
}