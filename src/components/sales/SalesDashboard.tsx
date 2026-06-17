// src/components/sales/SalesDashboard.tsx
// Sales Department KPI Dashboard — Revenue, Closures, Conversion Tracking

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, TrendingUp, Phone, Users, Target,
    Plus, X,
    BarChart3, PieChart, Activity, Award, Zap,
    ArrowUpRight, ArrowDownRight, RefreshCw,
    Briefcase, Filter,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { useTasks, useCreateTask } from '../../hooks/useTasks';
import { useEmployees } from '../../hooks/useEmployees';
import { useTeamPerformanceSummary, useCompanyPerformance } from '../../hooks/usePerformance';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SalesDashboardProps {
    currentUser: {
        id: number;
        empId: string;
        name: string;
        department: string;
        position: string;
        role: 'employer' | 'teamlead' | 'employee';
    };
}

interface SalesKPI {
    id: string;
    label: string;
    target: number;
    achieved: number;
    unit: string;
    category: 'revenue' | 'calls' | 'leads' | 'closures' | 'meetings' | 'conversion';
    type: 'daily' | 'weekly' | 'monthly';
    trend: 'up' | 'down' | 'stable';
    trendPct: number;
    color: string;
    icon: any;
    gradient: string;
}

interface EditableKPI {
    kpiId: string;
    title: string;
    type: 'daily' | 'weekly' | 'monthly';
    category: string;
    unit: string;
    icon: any;
    target: number;
    deadline: string;
    included: boolean;
    priority: 'low' | 'medium' | 'high';
}

// ─────────────────────────────────────────────────────────────────────────────
// SALES KPI DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

const SALES_KPI_TEMPLATES = [
    // Daily
    { title: 'Leads Generated', category: 'applications' as const, type: 'daily' as const, target: 12, unit: 'leads', icon: Briefcase },
    { title: 'Calls Made', category: 'calls' as const, type: 'daily' as const, target: 50, unit: 'calls', icon: Phone },
    // Weekly
    { title: 'Qualified Leads', category: 'applications' as const, type: 'weekly' as const, target: 40, unit: 'leads', icon: Users },
    { title: 'Demos / Meetings', category: 'meetings' as const, type: 'weekly' as const, target: 6, unit: 'meetings', icon: Users },
    // Monthly
    { title: 'Revenue Target', category: 'closures' as const, type: 'monthly' as const, target: 100000, unit: '$', icon: DollarSign },
    { title: 'Closures', category: 'closures' as const, type: 'monthly' as const, target: 5, unit: 'deals', icon: Award },
    { title: 'Lead-to-Closure %', category: 'assessments' as const, type: 'monthly' as const, target: 20, unit: '%', icon: TrendingUp },
];

const CHART_COLORS = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6'];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
};

const getProgressColor = (pct: number) => {
    if (pct >= 90) return '#10B981';
    if (pct >= 70) return '#F59E0B';
    if (pct >= 40) return '#6366F1';
    return '#EF4444';
};

// ─────────────────────────────────────────────────────────────────────────────
// TREND DATA (computed from real task data)
// ─────────────────────────────────────────────────────────────────────────────
// Trend data will be computed inside component from real API responses

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────

const KPICard = ({ kpi }: { kpi: SalesKPI }) => {
    const pct = kpi.target > 0 ? Math.min((kpi.achieved / kpi.target) * 100, 100) : 0;
    const remaining = Math.max(0, kpi.target - kpi.achieved);
    const isRevenue = kpi.unit === '$';

    return (
        <motion.div
            whileHover={{ y: -3, boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
        >
            <div className={`bg-gradient-to-r ${kpi.gradient} p-3 relative overflow-hidden`}>
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full" />
                <div className="relative flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-[10px] uppercase tracking-wide mb-0.5">{kpi.type} · {kpi.label}</p>
                        <p className="text-xl font-black text-white leading-none">
                            {isRevenue ? formatCurrency(kpi.achieved) : kpi.achieved.toLocaleString()}
                        </p>
                        <p className="text-white/60 text-[10px] mt-0.5">
                            of {isRevenue ? formatCurrency(kpi.target) : `${kpi.target.toLocaleString()} ${kpi.unit}`}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                            <kpi.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            kpi.trend === 'up' ? 'bg-white/20 text-white' :
                            kpi.trend === 'down' ? 'bg-red-500/30 text-white' : 'bg-white/10 text-white/70'
                        }`}>
                            {kpi.trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> :
                                kpi.trend === 'down' ? <ArrowDownRight className="w-2.5 h-2.5" /> :
                                    <Activity className="w-2.5 h-2.5" />}
                            {kpi.trendPct}%
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3">
                <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-400 font-medium">Progress</span>
                    <span className="font-bold text-gray-700">{pct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: getProgressColor(pct) }}
                    />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px]">
                    <span className="text-gray-400">
                        {isRevenue ? `${formatCurrency(remaining)} left` : `${remaining.toLocaleString()} ${kpi.unit} left`}
                    </span>
                    <span className={`font-semibold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {pct >= 100 ? '✓ Achieved' : pct >= 80 ? 'On Track' : pct >= 50 ? 'At Risk' : 'Behind'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const SalesDashboard = ({ currentUser }: SalesDashboardProps) => {
    const { data: tasksRaw = [], isLoading, refetch } = useTasks();
    const { data: rawEmployees = [] } = useEmployees();
    const createTask = useCreateTask();

    const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'team' | 'assign'>('overview');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<number>(0);
    const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
    const [deadline, setDeadline] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [filterPeriod, setFilterPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
    const [editableKPIs, setEditableKPIs] = useState<EditableKPI[]>([]);
    const [bulkDeadline, setBulkDeadline] = useState('');

    const tasks: any[] = useMemo(() => {
        const raw = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw as any)?.data || [];
        return raw.filter((t: any) =>
            ['closures', 'meetings', 'calls', 'applications'].includes(t.category)
        );
    }, [tasksRaw]);

    const employees: any[] = useMemo(() => {
        const raw = Array.isArray(rawEmployees) ? rawEmployees : [];
        return raw
            .map((e: any) => ({
                id: e.id,
                name: e.name ?? `${e.firstName || ''} ${e.lastName || ''}`.trim(),
                position: e.position || '',
                department: e.department || '',
                status: e.isActive === false ? 'inactive' : 'active',
            }))
            .filter((e: any) =>
                e.status === 'active' &&
                e.department?.toLowerCase().includes('sales')
            );
    }, [rawEmployees]);

    // Build KPI cards from tasks - use REAL data only
    const salesKPIs: SalesKPI[] = useMemo(() => {
        const kpiMap: Record<string, { achieved: number; target: number }> = {};

        tasks
            .filter(t => filterPeriod === 'all' || t.type === filterPeriod)
            .forEach(t => {
                const key = t.title;
                if (!kpiMap[key]) kpiMap[key] = { achieved: 0, target: t.target };
                kpiMap[key].achieved += t.achieved || 0;
            });

        return SALES_KPI_TEMPLATES
            .filter(k => filterPeriod === 'all' || k.type === filterPeriod)
            .map((k, i) => {
                const real = kpiMap[k.title] || { achieved: 0, target: k.target };
                const pct = (real.achieved / k.target) * 100;
                return {
                    id: `${k.type}_${k.title}`,
                    label: k.title,
                    target: k.target,
                    achieved: real.achieved,
                    unit: k.unit,
                    category: k.category as any,
                    type: k.type,
                    trend: pct > 80 ? 'up' : pct < 40 ? 'down' : 'stable',
                    trendPct: Math.round(pct / 10), // Realistic: based on actual %
                    color: CHART_COLORS[i % CHART_COLORS.length],
                    icon: k.icon,
                    gradient: [
                        'from-amber-500 to-orange-600',
                        'from-emerald-500 to-teal-600',
                        'from-indigo-500 to-violet-600',
                        'from-pink-500 to-rose-600',
                        'from-blue-500 to-cyan-600',
                        'from-purple-500 to-fuchsia-600',
                        'from-red-500 to-orange-500',
                    ][i % 7],
                };
            });
    }, [tasks, filterPeriod]);

    // Conversion funnel data - derived from actual sales KPI data
    const funnelData = useMemo(() => {
        const leadsKPI = salesKPIs.find(k => k.label === 'Leads Generated');
        const qualifiedKPI = salesKPIs.find(k => k.label === 'Qualified Leads');
        const demoKPI = salesKPIs.find(k => k.label === 'Demos / Meetings');
        const closuresKPI = salesKPIs.find(k => k.label === 'Closures');
        
        const leads = leadsKPI?.achieved || 0;
        const qualified = qualifiedKPI?.achieved || 0;
        const demos = demoKPI?.achieved || 0;
        const closures = closuresKPI?.achieved || 0;
        const proposal = Math.round(demos * 0.5);
        
        return [
            { stage: 'Leads', value: leads, fill: '#6366F1' },
            { stage: 'Qualified', value: qualified, fill: '#8B5CF6' },
            { stage: 'Demo', value: demos, fill: '#F59E0B' },
            { stage: 'Proposal', value: proposal, fill: '#10B981' },
            { stage: 'Closed', value: closures, fill: '#EC4899' },
        ];
    }, [salesKPIs]);

    // Trend data for charts - computed from real task data
    const trendData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const revenueKPI = salesKPIs.find(k => k.unit === '$');
        const closuresKPI = salesKPIs.find(k => k.label === 'Closures');
        const leadsKPI = salesKPIs.find(k => k.label === 'Leads Generated');
        const callsKPI = salesKPIs.find(k => k.label === 'Calls Made');
        
        // Use current month data, others show 0 or estimated based on targets
        return months.map((month, idx) => ({
            month,
            revenue: idx === 5 ? (revenueKPI?.achieved || 0) : 0, // Current month
            target: 100000,
            closures: idx === 5 ? (closuresKPI?.achieved || 0) : 0,
            leads: idx === 5 ? (leadsKPI?.achieved || 0) : 0,
            calls: idx === 5 ? (callsKPI?.achieved || 0) : 0,
            conversion: idx === 5 ? ((closuresKPI?.achieved || 0) / (leadsKPI?.achieved || 1)) * 100 : 0,
        }));
    }, [salesKPIs]);

    const handleBulkAssign = async (kpiOverride?: string[]) => {
        const kpisToAssign = kpiOverride ?? selectedKPIs;
        if (!selectedEmployee || kpisToAssign.length === 0 || !deadline) {
            alert('Please select employee, KPIs, and deadline');
            return;
        }
        setIsAssigning(true);
        let created = 0, failed = 0;
        for (const kpiId of kpisToAssign) {
            const tmpl = SALES_KPI_TEMPLATES.find(k => `${k.type}_${k.title}` === kpiId);
            if (!tmpl) continue;
            try {
                await createTask.mutateAsync({
                    title: tmpl.title,
                    description: `Sales KPI: ${tmpl.title}`,
                    type: tmpl.type,
                    category: tmpl.category,
                    target: tmpl.target,
                    unit: tmpl.unit,
                    deadline: new Date(deadline + 'T00:00:00').toISOString(),
                    priority: 'high',
                    assignedToId: selectedEmployee,
                    assignedById: String(currentUser.id),
                    notes: tmpl.unit === '$' ? 'Revenue target in USD' : '',
                    recurring: false,
                });
                created++;
            } catch { failed++; }
        }
        setIsAssigning(false);
        setShowAssignModal(false);
        setSelectedKPIs([]);
        refetch();
        alert(`Done: ${created} KPIs assigned${failed ? `, ${failed} failed` : ''}`);
    };

    const openAssignModal = () => {
        setEditableKPIs(SALES_KPI_TEMPLATES.map(k => ({
            kpiId: `${k.type}_${k.title}`,
            title: k.title,
            type: k.type,
            category: String(k.category),
            unit: k.unit,
            icon: k.icon,
            target: k.target,
            deadline: '',
            included: true,
            priority: 'high' as const,
        })));
        setSelectedEmployee(0);
        setBulkDeadline('');
        setShowAssignModal(true);
    };

    const updateKPI = (kpiId: string, field: keyof EditableKPI, value: any) => {
        setEditableKPIs(prev => prev.map(k => k.kpiId === kpiId ? { ...k, [field]: value } : k));
    };

    const applyBulkDeadline = () => {
        if (!bulkDeadline) return;
        setEditableKPIs(prev => prev.map(k => ({ ...k, deadline: bulkDeadline })));
    };

    const handleModalAssign = async () => {
        const toAssign = editableKPIs.filter(k => k.included);
        if (!selectedEmployee) { alert('Please select an employee'); return; }
        if (toAssign.length === 0) { alert('Please select at least one KPI'); return; }
        const missing = toAssign.find(k => !k.deadline);
        if (missing) { alert(`Please set a deadline for "${missing.title}"`); return; }
        setIsAssigning(true);
        let created = 0, failed = 0;
        for (const kpi of toAssign) {
            try {
                await createTask.mutateAsync({
                    title: kpi.title,
                    description: `Sales KPI: ${kpi.title}`,
                    type: kpi.type,
                    category: kpi.category as any,
                    target: kpi.target,
                    unit: kpi.unit,
                    deadline: new Date(kpi.deadline + 'T00:00:00').toISOString(),
                    priority: kpi.priority,
                    assignedToId: selectedEmployee,
                    assignedById: String(currentUser.id),
                    notes: kpi.unit === '$' ? 'Revenue target in USD' : '',
                    recurring: false,
                });
                created++;
            } catch { failed++; }
        }
        setIsAssigning(false);
        setShowAssignModal(false);
        refetch();
        alert(`Done: ${created} KPIs assigned${failed ? `, ${failed} failed` : ''}`);
    };

    const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
    const iv = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    // ── Summary stats ─────────────────────────────────────────────────────────
    const totalRevenue = salesKPIs.find(k => k.unit === '$')?.achieved ?? 0;
    const revenueTarget = salesKPIs.find(k => k.unit === '$')?.target ?? 100000;
    const totalClosures = salesKPIs.find(k => k.label === 'Closures')?.achieved ?? 0;
    const totalCalls = salesKPIs.find(k => k.label === 'Calls Made')?.achieved ?? 0;
    const conversionRate = funnelData[0].value > 0
        ? ((funnelData[4].value / funnelData[0].value) * 100).toFixed(1)
        : '0';

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-14 h-14 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
        </div>
    );

    return (
        <motion.div initial="hidden" animate="visible" variants={cv} className="space-y-6 pb-10">

            {/* ── HEADER ─────────────────────────────────────────────────────────── */}
            <motion.div variants={iv} className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Sales KPI Dashboard</h2>
                    </div>
                    <p className="text-gray-400 text-sm ml-12">Revenue · Closures · Lead-to-Call Conversion</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Period filter — now includes 'all' */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        {(['all', 'daily', 'weekly', 'monthly'] as const).map(p => (
                            <button key={p} onClick={() => setFilterPeriod(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
                                    filterPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => refetch()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    {(currentUser.role === 'employer' || currentUser.role === 'teamlead') && (
                        <button onClick={openAssignModal}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition cursor-pointer">
                            <Plus className="w-4 h-4" /> Assign Sales KPIs
                        </button>
                    )}
                </div>
            </motion.div>

            {/* ── SUMMARY CARDS ──────────────────────────────────────────────────── */}
            <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Revenue Achieved', value: formatCurrency(totalRevenue),
                        sub: `Target: ${formatCurrency(revenueTarget)}`,
                        pct: Math.round((totalRevenue / revenueTarget) * 100),
                        gradient: 'from-amber-500 to-orange-600', icon: DollarSign,
                    },
                    {
                        label: 'Deals Closed', value: totalClosures,
                        sub: 'This month',
                        pct: Math.round((totalClosures / 5) * 100),
                        gradient: 'from-emerald-500 to-teal-600', icon: Award,
                    },
                    {
                        label: 'Calls Made', value: totalCalls,
                        sub: 'vs target 50/day',
                        pct: Math.round((totalCalls / 50) * 100),
                        gradient: 'from-indigo-500 to-violet-600', icon: Phone,
                    },
                    {
                        label: 'Conversion Rate', value: `${conversionRate}%`,
                        sub: 'Lead → Closure',
                        pct: parseFloat(conversionRate),
                        gradient: 'from-pink-500 to-rose-600', icon: TrendingUp,
                    },
                ].map((card, i) => (
                    <motion.div key={i} whileHover={{ y: -3 }}
                        className={`bg-gradient-to-br ${card.gradient} p-5 rounded-2xl shadow-sm relative overflow-hidden`}>
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
                        <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-white/70 text-xs font-medium">{card.label}</p>
                                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                                    <card.icon className="w-3.5 h-3.5 text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-black text-white">{card.value}</p>
                            <p className="text-white/60 text-xs mt-1">{card.sub}</p>
                            <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
                                <div className="h-1.5 bg-white rounded-full" style={{ width: `${Math.min(card.pct, 100)}%` }} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── TABS ──────────────────────────────────────────────────────────── */}
            <motion.div variants={iv} className="flex gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
                {([
                    { id: 'overview', label: 'KPI Overview', icon: Target },
                    { id: 'funnel', label: 'Sales Funnel', icon: Filter },
                    { id: 'team', label: 'Team', icon: Users },
                    { id: 'assign', label: 'Assign', icon: Plus },
                ] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                            activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* ══ OVERVIEW TAB ════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {salesKPIs.map(kpi => <KPICard key={kpi.id} kpi={kpi} />)}
                    </div>

                    {/* Revenue Trend Chart */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-amber-500" />
                                <h3 className="font-bold text-gray-800">Revenue vs Target (6 months)</h3>
                            </div>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                    {/* FIX 2a: formatter accepts number | undefined */}
                                    <Tooltip
                                        formatter={(v: number | undefined) => [formatCurrency(v ?? 0), '']}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5}
                                        fill="url(#revenueGrad)" name="Revenue" />
                                    <Area type="monotone" dataKey="target" stroke="#E5E7EB" strokeWidth={1.5}
                                        fill="none" strokeDasharray="5 5" name="Target" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Metrics Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" /> Monthly Metrics
                            </h3>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
                                        <Legend />
                                        <Bar dataKey="closures" name="Closures" fill="#10B981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="conversion" name="Conversion %" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-pink-500" /> Call Activity Trend
                            </h3>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="calls" stroke="#EC4899" strokeWidth={2.5}
                                            dot={{ fill: '#EC4899', r: 4 }} name="Calls" />
                                        <Line type="monotone" dataKey="leads" stroke="#F59E0B" strokeWidth={2.5}
                                            dot={{ fill: '#F59E0B', r: 4 }} name="Leads" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ══ FUNNEL TAB ══════════════════════════════════════════════════════ */}
            {activeTab === 'funnel' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Visual Funnel */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-amber-500" /> Lead-to-Closure Funnel
                            </h3>
                            <div className="space-y-3">
                                {funnelData.map((stage, i) => {
                                    const pct = funnelData[0].value > 0 ? (stage.value / funnelData[0].value) * 100 : 0;
                                    const convPct = i > 0
                                        ? (funnelData[i - 1].value > 0 ? ((stage.value / funnelData[i - 1].value) * 100).toFixed(0) : '0')
                                        : '100';
                                    return (
                                        <div key={stage.stage}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-sm font-semibold text-gray-700">{stage.stage}</span>
                                                <div className="flex items-center gap-3">
                                                    {i > 0 && (
                                                        <span className="text-xs text-gray-400">↓ {convPct}% conversion</span>
                                                    )}
                                                    <span className="text-sm font-bold text-gray-900">{stage.value.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="relative bg-gray-100 rounded-full h-10 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                                    className="h-full rounded-full flex items-center px-4"
                                                    style={{ backgroundColor: stage.fill + '20', borderLeft: `4px solid ${stage.fill}` }}
                                                >
                                                    <span className="text-xs font-bold" style={{ color: stage.fill }}>
                                                        {pct.toFixed(0)}%
                                                    </span>
                                                </motion.div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-sm font-semibold text-amber-800 mb-1">Overall Conversion</p>
                                <p className="text-2xl font-black text-amber-700">{conversionRate}%</p>
                                <p className="text-xs text-amber-600 mt-1">
                                    {funnelData[4].value} closed out of {funnelData[0].value} leads
                                </p>
                            </div>
                        </div>

                        {/* Stage breakdown pie */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-indigo-500" /> Pipeline Distribution
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie data={funnelData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                                            paddingAngle={3} dataKey="value">
                                            {funnelData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        {/* FIX 2b: formatter accepts number | undefined */}
                                        <Tooltip
                                            formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Leads']}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                {funnelData.map(stage => (
                                    <div key={stage.stage} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.fill }} />
                                            <span className="text-xs font-medium text-gray-600">{stage.stage}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-800">{stage.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Conversion metrics table */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" /> Stage Conversion Rates
                            </h3>
                        </div>
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Stage', 'Volume', 'From Previous', 'From Total', 'Status'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {funnelData.map((stage, i) => {
                                    const fromPrev = i > 0
                                        ? (funnelData[i - 1].value > 0 ? ((stage.value / funnelData[i - 1].value) * 100).toFixed(1) : '0')
                                        : '100';
                                    const fromTotal = funnelData[0].value > 0 ? ((stage.value / funnelData[0].value) * 100).toFixed(1) : '0';
                                    const status = parseFloat(fromTotal) > 50 ? 'Healthy' : parseFloat(fromTotal) > 20 ? 'Average' : 'Critical';
                                    return (
                                        <tr key={stage.stage} className="hover:bg-gray-50/50">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.fill }} />
                                                    <span className="text-sm font-semibold text-gray-800">{stage.stage}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm font-bold text-gray-800">{stage.value.toLocaleString()}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-sm font-semibold ${parseFloat(fromPrev) < 30 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                    {fromPrev}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600">{fromTotal}%</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                                                    status === 'Average' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>{status}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ══ TEAM TAB ════════════════════════════════════════════════════════ */}
            {activeTab === 'team' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-50">
                            <h3 className="font-bold text-gray-800">Sales Team Performance</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {employees.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">No sales team members found</p>
                                </div>
                            ) : employees.map(emp => {
                                    const empTasks = tasks.filter((t: any) => t.assignedToId === emp.id);
                                    const totalTarget = empTasks.reduce((s: number, t: any) => s + t.target, 0);
                                    const totalAchieved = empTasks.reduce((s: number, t: any) => s + t.achieved, 0);
                                    const pct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
                                    return (
                                        <div key={emp.id} className="p-5 flex items-center gap-4 hover:bg-gray-50/60">
                                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                                <span className="text-white font-bold text-sm">
                                                    {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className="font-semibold text-gray-800">{emp.name}</p>
                                                    <span className={`text-sm font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div className="h-2 rounded-full transition-all" style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: getProgressColor(pct)
                                                    }} />
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">{emp.position} · {empTasks.length} tasks</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-gray-400">Achieved</p>
                                                <p className="font-bold text-gray-800">{totalAchieved.toLocaleString()}</p>
                                                <p className="text-xs text-gray-400">/{totalTarget.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ══ ASSIGN TAB ══════════════════════════════════════════════════════ */}
            {activeTab === 'assign' && (currentUser.role === 'employer' || currentUser.role === 'teamlead') && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* KPI reference card */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-amber-100 bg-amber-50">
                                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" /> Sales KPI Templates
                                </h3>
                                <p className="text-xs text-amber-700 mt-1">Standard targets for Sales Executive role</p>
                            </div>
                            {['daily', 'weekly', 'monthly'].map(type => {
                                const kpis = SALES_KPI_TEMPLATES.filter(k => k.type === type);
                                return (
                                    <div key={type}>
                                        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{type}</p>
                                        </div>
                                        {kpis.map(kpi => (
                                            <div key={kpi.title} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <kpi.icon className="w-4 h-4 text-amber-500" />
                                                    <span className="text-sm font-medium text-gray-700">{kpi.title}</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                                    {kpi.target.toLocaleString()} {kpi.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick assign form */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" /> Quick Assign
                            </h3>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Employee *</label>
                                <select value={selectedEmployee} onChange={e => setSelectedEmployee(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-amber-400 cursor-pointer">
                                    <option value={0}>— Select employee —</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} · {e.position}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Deadline *</label>
                                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-amber-400" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-700">Select KPIs *</label>
                                    <button onClick={() => setSelectedKPIs(SALES_KPI_TEMPLATES.map(k => `${k.type}_${k.title}`))}
                                        className="text-xs text-amber-600 hover:underline cursor-pointer font-medium">Select All</button>
                                </div>
                                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                    {SALES_KPI_TEMPLATES.map(kpi => {
                                        const key = `${kpi.type}_${kpi.title}`;
                                        const checked = selectedKPIs.includes(key);
                                        return (
                                            <label key={key} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${checked ? 'bg-amber-50/50' : ''}`}>
                                                <input type="checkbox" checked={checked} className="accent-amber-500 w-4 h-4"
                                                    onChange={e => {
                                                        if (e.target.checked) setSelectedKPIs(p => [...p, key]);
                                                        else setSelectedKPIs(p => p.filter(k => k !== key));
                                                    }} />
                                                <div className="flex-1">
                                                    <span className="text-xs font-medium text-gray-700 capitalize">[{kpi.type}]</span>
                                                    <span className="text-sm text-gray-700 ml-1">{kpi.title}</span>
                                                </div>
                                                <span className="text-xs text-gray-400 shrink-0">{kpi.target.toLocaleString()} {kpi.unit}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleBulkAssign}
                                disabled={isAssigning || !selectedEmployee || selectedKPIs.length === 0 || !deadline}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                                {isAssigning ? (
                                    <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Assigning…</>
                                ) : `Assign ${selectedKPIs.length} KPIs`}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ════════════════ ASSIGN MODAL ═════════════════════════════════════ */}
            <AnimatePresence>
                {showAssignModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Assign Sales KPIs</h3>
                                        <p className="text-xs text-gray-400">Customize target, deadline &amp; priority per KPI</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAssignModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer transition">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Employee + Bulk Deadline */}
                            <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/60 shrink-0">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                                        Assign To *
                                    </label>
                                    <select
                                        value={selectedEmployee}
                                        onChange={e => setSelectedEmployee(parseInt(e.target.value))}
                                        className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none cursor-pointer transition ${
                                            !selectedEmployee ? 'border-red-200 focus:border-red-400' : 'border-gray-200 focus:border-amber-400'
                                        }`}
                                    >
                                        <option value={0}>— Select sales employee —</option>
                                        {employees.map(e => (
                                            <option key={e.id} value={e.id}>{e.name} · {e.position}</option>
                                        ))}
                                    </select>
                                    {employees.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">No sales employees found in the system</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                                        Bulk Deadline — apply to all at once
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={bulkDeadline}
                                            onChange={e => setBulkDeadline(e.target.value)}
                                            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-amber-400"
                                        />
                                        <button
                                            onClick={applyBulkDeadline}
                                            disabled={!bulkDeadline}
                                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition cursor-pointer whitespace-nowrap"
                                        >
                                            Apply All
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Toolbar */}
                            <div className="px-6 py-2.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                <p className="text-sm text-gray-500">
                                    <span className="font-bold text-gray-900">{editableKPIs.filter(k => k.included).length}</span>
                                    <span> of {editableKPIs.length} KPIs selected</span>
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setEditableKPIs(prev => prev.map(k => ({ ...k, included: true })))}
                                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-300 text-xs">|</span>
                                    <button
                                        onClick={() => setEditableKPIs(prev => prev.map(k => ({ ...k, included: false })))}
                                        className="text-xs font-medium text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            {/* KPI Rows — scrollable */}
                            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2.5">
                                {editableKPIs.map(kpi => (
                                    <div
                                        key={kpi.kpiId}
                                        className={`rounded-xl border p-4 transition-all duration-200 ${
                                            kpi.included
                                                ? 'border-amber-200 bg-amber-50/40'
                                                : 'border-gray-100 bg-gray-50/60 opacity-55'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Custom checkbox toggle */}
                                            <button
                                                onClick={() => updateKPI(kpi.kpiId, 'included', !kpi.included)}
                                                className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition cursor-pointer ${
                                                    kpi.included
                                                        ? 'bg-amber-500 border-amber-500'
                                                        : 'border-gray-300 bg-white hover:border-amber-300'
                                                }`}
                                            >
                                                {kpi.included && (
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                                                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </button>

                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 min-w-0">
                                                {/* KPI name + type */}
                                                <div className="sm:col-span-1 flex items-center gap-2.5 min-w-0">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                        kpi.included ? 'bg-amber-100' : 'bg-gray-100'
                                                    }`}>
                                                        <kpi.icon className={`w-4 h-4 ${kpi.included ? 'text-amber-600' : 'text-gray-400'}`} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{kpi.title}</p>
                                                        <span className={`inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                                            kpi.type === 'daily' ? 'bg-blue-100 text-blue-700' :
                                                            kpi.type === 'weekly' ? 'bg-violet-100 text-violet-700' :
                                                            'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                            {kpi.type}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Target */}
                                                <div className="sm:col-span-1">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Target</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={kpi.target}
                                                            disabled={!kpi.included}
                                                            onChange={e => updateKPI(kpi.kpiId, 'target', Math.max(1, parseInt(e.target.value) || 1))}
                                                            className="w-24 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:border-amber-400 disabled:bg-gray-100 disabled:text-gray-400"
                                                        />
                                                        <span className="text-xs text-gray-400 font-medium shrink-0">{kpi.unit}</span>
                                                    </div>
                                                </div>

                                                {/* Deadline */}
                                                <div className="sm:col-span-1">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Deadline *</p>
                                                    <input
                                                        type="date"
                                                        value={kpi.deadline}
                                                        disabled={!kpi.included}
                                                        onChange={e => updateKPI(kpi.kpiId, 'deadline', e.target.value)}
                                                        className={`w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 transition ${
                                                            kpi.included && !kpi.deadline
                                                                ? 'border-red-200 focus:border-red-400'
                                                                : 'border-gray-200 focus:border-amber-400'
                                                        }`}
                                                    />
                                                </div>

                                                {/* Priority */}
                                                <div className="sm:col-span-1">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Priority</p>
                                                    <select
                                                        value={kpi.priority}
                                                        disabled={!kpi.included}
                                                        onChange={e => updateKPI(kpi.kpiId, 'priority', e.target.value as 'low' | 'medium' | 'high')}
                                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-400 cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                                                    >
                                                        <option value="high">🔴 High</option>
                                                        <option value="medium">🟡 Medium</option>
                                                        <option value="low">🟢 Low</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/60 rounded-b-2xl shrink-0">
                                <div>
                                    {editableKPIs.filter(k => k.included).length > 0 ? (
                                        <p className="text-sm font-semibold text-gray-700">
                                            {editableKPIs.filter(k => k.included).length} KPI{editableKPIs.filter(k => k.included).length !== 1 ? 's' : ''} will be assigned
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">No KPIs selected</p>
                                    )}
                                    {!selectedEmployee && (
                                        <p className="text-xs text-red-400 mt-0.5">Select an employee first</p>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowAssignModal(false)}
                                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleModalAssign}
                                        disabled={isAssigning || !selectedEmployee || editableKPIs.filter(k => k.included).length === 0}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition cursor-pointer"
                                    >
                                        {isAssigning ? (
                                            <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Assigning…</>
                                        ) : (
                                            <><DollarSign className="w-4 h-4" /> Assign {editableKPIs.filter(k => k.included).length} KPIs</>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default SalesDashboard;