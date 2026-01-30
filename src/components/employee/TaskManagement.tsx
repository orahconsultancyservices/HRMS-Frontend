import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, TrendingUp, CheckCircle, Clock, Calendar, 
  Plus, Eye, Edit, Trash2, Award, AlertCircle, 
  Briefcase, Users, FileText, BarChart3, ChevronRight,
  Filter, Search, Download, PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon, Activity, Target as TargetIcon,
  ArrowUpRight, ArrowDownRight, ChevronDown, CalendarDays
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';


// Types
interface Task {
  id: number;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: 'applications' | 'interviews' | 'assessments';
  target: number;
  achieved: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'overdue';
  assignedDate: string;
  priority: 'low' | 'medium' | 'high';
}

interface TaskSubmission {
  taskId: number;
  count: number;
  date: string;
  notes: string;
}


interface DailySubmission {
  date: string;
  count: number;
  goal: number;
  efficiency: number; // percentage
  dayOfWeek: string;
}


interface AnalyticsData {
  dailySubmissions: DailySubmission[];
  weeklyTrend: { week: string; target: number; achieved: number }[];
  monthlyBreakdown: { month: string; value: number }[];
  performanceMetrics: {
    avgDaily: number;
    peakDay: { date: string; count: number };
    consistency: number; // percentage
    totalSubmitted: number;
  };
  categoryDistribution: { name: string; value: number; color: string }[];
}

interface Employee {
  empId: string;
  name: string;
  id?: number;
}

interface TaskManagementProps {
  employee: Employee;
}

// Demo data
const demoTasks: Task[] = [
  {
    id: 1,
    title: 'Daily LinkedIn Applications',
    description: 'Apply to job postings on LinkedIn for various positions',
    type: 'daily',
    category: 'applications',
    target: 50,
    achieved: 35,
    unit: 'applications',
    deadline: new Date().toISOString().split('T')[0],
    status: 'active',
    assignedDate: new Date().toISOString().split('T')[0],
    priority: 'high'
  },
  {
    id: 2,
    title: 'Weekly Interview Scheduling',
    description: 'Schedule and coordinate interviews with candidates',
    type: 'weekly',
    category: 'interviews',
    target: 15,
    achieved: 12,
    unit: 'interviews',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    assignedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Monthly Assessment Completion',
    description: 'Complete skill assessments for candidate evaluation',
    type: 'monthly',
    category: 'assessments',
    target: 100,
    achieved: 78,
    unit: 'assessments',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    assignedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high'
  },
  {
    id: 4,
    title: 'Daily Follow-up Calls',
    description: 'Follow up with candidates after application submission',
    type: 'daily',
    category: 'interviews',
    target: 20,
    achieved: 20,
    unit: 'calls',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'completed',
    assignedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium'
  },
  {
    id: 5,
    title: 'Weekly Job Portal Applications',
    description: 'Apply to positions on various job portals (Naukri, Indeed, etc.)',
    type: 'weekly',
    category: 'applications',
    target: 200,
    achieved: 145,
    unit: 'applications',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high'
  }
];

const generateDemoAnalytics = (taskType: 'weekly' | 'monthly', target: number): AnalyticsData => {
  const today = new Date();
  const daysInWeek = 7;
  const daysInMonth = 30;
  
  // Generate daily submissions for weekly/monthly tasks
  const dailySubmissions: DailySubmission[] = [];
  const days = taskType === 'weekly' ? daysInWeek : daysInMonth;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayGoal = Math.floor(target / days);
    const randomCount = Math.floor(dayGoal * (0.5 + Math.random() * 0.8));
    const efficiency = (randomCount / dayGoal) * 100;
    
    dailySubmissions.push({
      date: date.toISOString().split('T')[0],
      count: randomCount,
      goal: dayGoal,
      efficiency: Math.min(efficiency, 100),
      dayOfWeek: dayOfWeek
    });
  }
  
  // Generate weekly trend data
  const weeklyTrend = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weeklyTrend.push({
      week: `Week ${4 - i}`,
      target: target,
      achieved: Math.floor(target * (0.6 + Math.random() * 0.4))
    });
  }
  
  // Monthly breakdown
  const monthlyBreakdown = [
    { month: 'Applications', value: 65 },
    { month: 'Interviews', value: 20 },
    { month: 'Assessments', value: 15 }
  ];
  
  // Calculate performance metrics
  const totalSubmitted = dailySubmissions.reduce((sum, day) => sum + day.count, 0);
  const avgDaily = totalSubmitted / days;
  const peakDay = dailySubmissions.reduce((max, day) => 
    day.count > max.count ? day : max, dailySubmissions[0]
  );
  const consistency = (dailySubmissions.filter(d => d.efficiency >= 80).length / days) * 100;
  
  // Category distribution
  const categoryDistribution = [
    { name: 'LinkedIn', value: 40, color: '#0077B5' },
    { name: 'Naukri', value: 30, color: '#4CAF50' },
    { name: 'Indeed', value: 20, color: '#2196F3' },
    { name: 'Other', value: 10, color: '#9C27B0' }
  ];
  
  return {
    dailySubmissions,
    weeklyTrend,
    monthlyBreakdown,
    performanceMetrics: {
      avgDaily,
      peakDay: {
        date: new Date(peakDay.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        count: peakDay.count
      },
      consistency,
      totalSubmitted
    },
    categoryDistribution
  };
};

const TaskManagement = ({ employee }: TaskManagementProps) => {
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [submissionForm, setSubmissionForm] = useState({
    count: 0,
    notes: ''
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsView, setAnalyticsView] = useState<'daily' | 'weekly' | 'distribution'>('daily');
  // Calculate statistics
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overallProgress = tasks.reduce((acc, task) => {
    return acc + (task.achieved / task.target) * 100;
  }, 0) / tasks.length;

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // Get task icon
  const getTaskIcon = (category: string) => {
    switch (category) {
      case 'applications': return Briefcase;
      case 'interviews': return Users;
      case 'assessments': return FileText;
      default: return Target;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'applications': return 'from-blue-500 to-blue-600';
      case 'interviews': return 'from-purple-500 to-purple-600';
      case 'assessments': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = (task: Task) => {
    return Math.min((task.achieved / task.target) * 100, 100);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get days remaining
  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Handle task submission
  const handleSubmitProgress = () => {
    if (!selectedTask || submissionForm.count <= 0) {
      alert('Please enter a valid count');
      return;
    }

    const updatedTasks = tasks.map(task => {
      if (task.id === selectedTask.id) {
        const newAchieved = Math.min(task.achieved + submissionForm.count, task.target);
        const newStatus = newAchieved >= task.target ? 'completed' : task.status;
        return {
          ...task,
          achieved: newAchieved,
          status: newStatus as 'active' | 'completed' | 'overdue'
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    setShowSubmitModal(false);
    setSubmissionForm({ count: 0, notes: '' });
    setSelectedTask(null);
  };

  // Open submit modal
  const openSubmitModal = (task: Task) => {
    setSelectedTask(task);
    setShowSubmitModal(true);
  };

  // Open task details
  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
    
    // Generate analytics for weekly/monthly tasks
    if (task.type === 'weekly' || task.type === 'monthly') {
      const analytics = generateDemoAnalytics(task.type, task.target);
      setAnalyticsData(analytics);
      setAnalyticsView('daily');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

    const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-medium text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name === 'efficiency' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


    const AnalyticsSection = () => {
    if (!selectedTask || !analyticsData) return null;

    return (
      <div className="mt-8 space-y-6">
        {/* Analytics Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6B8DA2]" />
            Performance Analytics
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => setAnalyticsView('daily')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                analyticsView === 'daily'
                  ? 'bg-[#6B8DA2] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily Progress
            </button>
            <button
              onClick={() => setAnalyticsView('weekly')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                analyticsView === 'weekly'
                  ? 'bg-[#6B8DA2] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly Trend
            </button>
            <button
              onClick={() => setAnalyticsView('distribution')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                analyticsView === 'distribution'
                  ? 'bg-[#6B8DA2] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Distribution
            </button>
          </div>
        </div>

        {/* Performance Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Avg Daily</span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-blue-900">
                {analyticsData.performanceMetrics.avgDaily.toFixed(1)}
              </p>
              <div className="flex items-center text-green-600 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>12%</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-1">Per day average</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TargetIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Peak Day</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-bold text-green-900">
                  {analyticsData.performanceMetrics.peakDay.count}
                </p>
                <p className="text-xs text-green-700">
                  {analyticsData.performanceMetrics.peakDay.date}
                </p>
              </div>
              <div className="text-orange-600">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-1">Highest single day</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUpIcon className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Consistency</span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-purple-900">
                {analyticsData.performanceMetrics.consistency.toFixed(0)}%
              </p>
              <div className="flex items-center text-green-600 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>5%</span>
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-1">Goal achievement rate</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Total Submitted</span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-orange-900">
                {analyticsData.performanceMetrics.totalSubmitted}
              </p>
              <div className="text-[#F5A42C]">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-orange-600 mt-1">Overall submissions</p>
          </div>
        </div>

        {/* Charts Section */}
        {analyticsView === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Submissions Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#6B8DA2]" />
                Daily Submissions Trend
              </h5>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analyticsData.dailySubmissions.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="dayOfWeek" 
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Submissions" 
                      fill="#6B8DA2" 
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="goal" 
                      name="Daily Goal" 
                      stroke="#F5A42C" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Efficiency Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-[#6B8DA2]" />
                Daily Efficiency Rate
              </h5>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.dailySubmissions.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="dayOfWeek" 
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      label={{ value: '%', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="efficiency" 
                      name="Efficiency %" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {analyticsView === 'weekly' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#6B8DA2]" />
              Weekly Performance Trend
            </h5>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="achieved" 
                    name="Achieved" 
                    fill="#6B8DA2" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="target" 
                    name="Target" 
                    fill="#F5A42C" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {analyticsView === 'distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[#6B8DA2]" />
                Source Distribution
              </h5>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Share']}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TargetIcon className="w-5 h-5 text-[#6B8DA2]" />
                Performance Radar
              </h5>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={analyticsData.monthlyBreakdown}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="month" tick={{ fill: '#6B7280' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280' }} />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#6B8DA2"
                      fill="#6B8DA2"
                      fillOpacity={0.3}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Daily Breakdown Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#6B8DA2]" />
              Daily Breakdown
            </h5>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Goal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analyticsData.dailySubmissions.slice(-7).map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {day.dayOfWeek}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {day.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {day.goal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              day.efficiency >= 80 ? 'bg-green-500' :
                              day.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(day.efficiency, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${
                          day.efficiency >= 80 ? 'text-green-600' :
                          day.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {day.efficiency.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        day.efficiency >= 100 ? 'bg-green-100 text-green-800' :
                        day.efficiency >= 80 ? 'bg-blue-100 text-blue-800' :
                        day.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {day.efficiency >= 100 ? 'Exceeded' :
                         day.efficiency >= 80 ? 'Excellent' :
                         day.efficiency >= 60 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Task Management</h2>
          <p className="text-gray-500">Track and manage your daily, weekly, and monthly targets</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-[#F5A42C] to-[#F5B53C] text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Report
          </motion.button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Tasks</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{totalTasks}</p>
              <p className="text-gray-500 text-xs mt-1">All assigned tasks</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Tasks</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{activeTasks}</p>
              <p className="text-gray-500 text-xs mt-1">In progress</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{completedTasks}</p>
              <p className="text-gray-500 text-xs mt-1">Tasks finished</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-[#F5A42C] rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Overall Progress</p>
              <p className="text-3xl font-bold text-[#F5A42C] mt-1">{overallProgress.toFixed(0)}%</p>
              <p className="text-gray-500 text-xs mt-1">Average completion</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#F5A42C] to-[#F5B53C] rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
              {['all', 'daily', 'weekly', 'monthly'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`px-4 py-2 cursor-pointer transition ${
                    filterType === type
                      ? 'bg-[#6B8DA2] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
              {['all', 'active', 'completed', 'overdue'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-2 cursor-pointer transition ${
                    filterStatus === status
                      ? 'bg-[#F5A42C] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tasks Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredTasks.map((task, index) => {
            const Icon = getTaskIcon(task.category);
            const progress = getProgressPercentage(task);
            const daysLeft = getDaysRemaining(task.deadline);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${getCategoryColor(task.category)} p-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-white/80 text-xs font-medium uppercase tracking-wider">
                          {task.type}
                        </span>
                        <h3 className="text-white font-semibold text-sm mt-0.5">
                          {task.title}
                        </h3>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-bold text-gray-800">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${getCategoryColor(task.category)} rounded-full relative`}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Target</p>
                      <p className="text-lg font-bold text-gray-800">{task.target}</p>
                      <p className="text-xs text-gray-400">{task.unit}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Achieved</p>
                      <p className="text-lg font-bold text-green-600">{task.achieved}</p>
                      <p className="text-xs text-gray-400">{task.unit}</p>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Deadline</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">{formatDate(task.deadline)}</p>
                      <p className={`text-xs ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-center">
                    <span className={`px-4 py-2 rounded-lg text-xs font-medium ${getStatusColor(task.status)} flex items-center gap-2`}>
                      {task.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                      {task.status === 'active' && <Clock className="w-4 h-4" />}
                      {task.status === 'overdue' && <AlertCircle className="w-4 h-4" />}
                      {task.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openTaskDetails(task)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </motion.button>
                    {task.status !== 'completed' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openSubmitModal(task)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-[#6B8DA2] to-[#7A9DB2] text-white rounded-lg font-medium hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Submit
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Submit Progress Modal */}
      <AnimatePresence>
        {showSubmitModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-[#6B8DA2]" />
                  Submit Progress
                </h3>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSubmissionForm({ count: 0, notes: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Task Info */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <p className="text-sm text-gray-600">Task</p>
                  <p className="font-medium text-gray-800">{selectedTask.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Current: {selectedTask.achieved}/{selectedTask.target}</span>
                    <span className="text-sm font-medium text-gray-800">
                      {getProgressPercentage(selectedTask).toFixed(0)}% Complete
                    </span>
                  </div>
                </div>

                {/* Count Input */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Number of {selectedTask.unit} completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedTask.target - selectedTask.achieved}
                    value={submissionForm.count}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, count: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    placeholder="Enter count..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Remaining: {selectedTask.target - selectedTask.achieved} {selectedTask.unit}
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Notes (Optional)</label>
                  <textarea
                    value={submissionForm.notes}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    placeholder="Add any notes or comments..."
                  />
                </div>

                {/* Preview */}
                {submissionForm.count > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200"
                  >
                    <p className="text-sm text-gray-600 mb-1">New Progress</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-700">
                        {selectedTask.achieved + submissionForm.count} / {selectedTask.target}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {Math.min(((selectedTask.achieved + submissionForm.count) / selectedTask.target) * 100, 100).toFixed(0)}%
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmitProgress}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer"
                  >
                    Submit Progress
                  </motion.button>
                  <button
                    onClick={() => {
                      setShowSubmitModal(false);
                      setSubmissionForm({ count: 0, notes: '' });
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Modal */}
     <AnimatePresence>
        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-[#6B8DA2]" />
                  Task Details
                </h3>
                <button
                  onClick={() => setShowTaskDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Task Header Info */}
                <div className={`bg-gradient-to-r ${getCategoryColor(selectedTask.category)} p-6 rounded-xl`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = getTaskIcon(selectedTask.category);
                        return (
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        );
                      })()}
                      <div>
                        <span className="text-white/80 text-xs font-medium uppercase tracking-wider">
                          {selectedTask.type} - {selectedTask.category}
                        </span>
                        <h4 className="text-white font-bold text-lg mt-1">
                          {selectedTask.title}
                        </h4>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-white/90 text-sm">{selectedTask.description}</p>
                </div>

                {/* Progress Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#6B8DA2]" />
                    Progress Overview
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completion Status</span>
                      <span className="text-2xl font-bold text-[#6B8DA2]">
                        {getProgressPercentage(selectedTask).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage(selectedTask)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${getCategoryColor(selectedTask.category)} rounded-full`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Target</p>
                        <p className="text-xl font-bold text-gray-800">{selectedTask.target}</p>
                        <p className="text-xs text-gray-400">{selectedTask.unit}</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Achieved</p>
                        <p className="text-xl font-bold text-green-600">{selectedTask.achieved}</p>
                        <p className="text-xs text-gray-400">{selectedTask.unit}</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Remaining</p>
                        <p className="text-xl font-bold text-orange-600">
                          {selectedTask.target - selectedTask.achieved}
                        </p>
                        <p className="text-xs text-gray-400">{selectedTask.unit}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics for Weekly/Monthly Tasks */}
                {(selectedTask.type === 'weekly' || selectedTask.type === 'monthly') && (
                  <AnalyticsSection />
                )}

                {/* Timeline Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Assigned Date</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900">{formatDate(selectedTask.assignedDate)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Deadline</span>
                    </div>
                    <p className="text-lg font-bold text-orange-900">{formatDate(selectedTask.deadline)}</p>
                    <p className={`text-xs mt-1 ${getDaysRemaining(selectedTask.deadline) < 0 ? 'text-red-600' : getDaysRemaining(selectedTask.deadline) <= 3 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {getDaysRemaining(selectedTask.deadline) < 0 
                        ? `${Math.abs(getDaysRemaining(selectedTask.deadline))} days overdue`
                        : `${getDaysRemaining(selectedTask.deadline)} days remaining`
                      }
                    </p>
                  </div>
                </div>

                {/* Status Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Current Status</span>
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(selectedTask.status)} flex items-center gap-2`}>
                      {selectedTask.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                      {selectedTask.status === 'active' && <Clock className="w-4 h-4" />}
                      {selectedTask.status === 'overdue' && <AlertCircle className="w-4 h-4" />}
                      {selectedTask.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {selectedTask.status !== 'completed' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowTaskDetails(false);
                        openSubmitModal(selectedTask);
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Submit Progress
                    </motion.button>
                  )}
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    className={`${selectedTask.status === 'completed' ? 'flex-1' : ''} px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-12 text-center border border-gray-100"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Tasks Found</h3>
          <p className="text-gray-500 mb-6">
            No tasks match your current filters. Try adjusting your search criteria.
          </p>
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setFilterType('all');
                setFilterStatus('all');
                setSearchTerm('');
              }}
              className="px-6 py-2 bg-gradient-to-r from-[#6B8DA2] to-[#7A9DB2] text-white rounded-xl font-medium hover:shadow-lg transition cursor-pointer"
            >
              Clear Filters
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TaskManagement