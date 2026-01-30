import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, TrendingUp, CheckCircle, Clock, Calendar, 
  Plus, Eye, Edit, Trash2, Award, AlertCircle, 
  Briefcase, Users, FileText, BarChart3, ChevronRight,
  Filter, Search, Download, PieChart as PieChartIcon,
  UserPlus, Users as UsersIcon, UserCheck, UserX,
  Send, ListFilter, MoreVertical, UserCircle, ChevronLeft,
  Star, Trophy, Target as TargetIcon, Bell, Share2,
  Mail, MessageSquare, CalendarRange, Zap,
  TrendingUp as TrendingUpIcon, Activity, ArrowUpRight, ArrowDownRight,
  CalendarDays // Add this import
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';

// Types
interface Employee {
  id: number;
  empId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

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
  assignedTo: number; // Single Employee ID (not array)
  assignedBy: number; // Employer ID
  notes?: string;
  recurring: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly';
}

interface TaskSubmission {
  id: number;
  taskId: number;
  employeeId: number;
  count: number;
  date: string;
  notes: string;
  verified: boolean;
}

interface DailySubmission {
  date: string;
  count: number;
  goal: number;
  efficiency: number;
  dayOfWeek: string;
}

interface AnalyticsData {
  dailySubmissions: DailySubmission[];
  weeklyTrend: { week: string; target: number; achieved: number }[];
  performanceMetrics: {
    avgDaily: number;
    peakDay: { date: string; count: number };
    consistency: number;
    totalSubmitted: number;
  };
}

interface TaskManagementProps {
  employees: Employee[];
  currentUser: Employee;
}

// Demo data for employer side - Updated for single employee assignment
const demoEmployees: Employee[] = [
  { id: 1, empId: 'EMP001', name: 'John Doe', email: 'john@orahhrms.com', department: 'Recruitment', position: 'Senior Recruiter', avatar: 'https://i.pravatar.cc/150?img=1', status: 'active' },
  { id: 2, empId: 'EMP002', name: 'Jane Smith', email: 'jane@orahhrms.com', department: 'Recruitment', position: 'Recruiter', avatar: 'https://i.pravatar.cc/150?img=2', status: 'active' },
  { id: 3, empId: 'EMP003', name: 'Bob Johnson', email: 'bob@orahhrms.com', department: 'Screening', position: 'Screening Specialist', avatar: 'https://i.pravatar.cc/150?img=3', status: 'active' },
  { id: 4, empId: 'EMP004', name: 'Alice Brown', email: 'alice@orahhrms.com', department: 'Interviews', position: 'Interview Coordinator', avatar: 'https://i.pravatar.cc/150?img=4', status: 'active' },
  { id: 5, empId: 'EMP005', name: 'Charlie Wilson', email: 'charlie@orahhrms.com', department: 'Assessments', position: 'Assessment Analyst', avatar: 'https://i.pravatar.cc/150?img=5', status: 'active' },
];

// Updated tasks - each assigned to single employee
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
    priority: 'high',
    assignedTo: 1, // Single employee ID
    assignedBy: 1,
    recurring: true,
    recurrence: 'daily'
  },
  {
    id: 2,
    title: 'Weekly Technical Interviews',
    description: 'Conduct technical interviews for software engineer positions',
    type: 'weekly',
    category: 'interviews',
    target: 15,
    achieved: 12,
    unit: 'interviews',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    assignedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    assignedTo: 2, // Single employee ID
    assignedBy: 1,
    recurring: true,
    recurrence: 'weekly'
  },
  {
    id: 3,
    title: 'Monthly Assessment Review',
    description: 'Review and evaluate candidate assessments',
    type: 'monthly',
    category: 'assessments',
    target: 100,
    achieved: 78,
    unit: 'assessments',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    assignedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high',
    assignedTo: 3, // Single employee ID
    assignedBy: 1,
    recurring: false
  },
  {
    id: 4,
    title: 'Daily Follow-up Calls',
    description: 'Follow up with candidates after interviews',
    type: 'daily',
    category: 'interviews',
    target: 20,
    achieved: 20,
    unit: 'calls',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'completed',
    assignedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    assignedTo: 4, // Single employee ID
    assignedBy: 1,
    recurring: true,
    recurrence: 'daily'
  },
  {
    id: 5,
    title: 'Weekly Job Portal Applications',
    description: 'Apply to positions on various job portals',
    type: 'weekly',
    category: 'applications',
    target: 200,
    achieved: 145,
    unit: 'applications',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high',
    assignedTo: 5, // Single employee ID
    assignedBy: 1,
    recurring: true,
    recurrence: 'weekly'
  }
];

const demoSubmissions: TaskSubmission[] = [
  { id: 1, taskId: 1, employeeId: 1, count: 10, date: new Date().toISOString().split('T')[0], notes: 'Morning session', verified: true },
  { id: 2, taskId: 1, employeeId: 1, count: 8, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: 'LinkedIn applications', verified: true },
  { id: 3, taskId: 2, employeeId: 2, count: 5, date: new Date().toISOString().split('T')[0], notes: 'Technical interviews completed', verified: false },
  { id: 4, taskId: 5, employeeId: 5, count: 50, date: new Date().toISOString().split('T')[0], notes: 'Naukri applications', verified: true },
];

// Generate analytics data for a task
const generateTaskAnalytics = (task: Task, submissions: TaskSubmission[]): AnalyticsData => {
  const today = new Date();
  const daysInWeek = 7;
  const daysInMonth = 30;
  const days = task.type === 'weekly' ? daysInWeek : task.type === 'monthly' ? daysInMonth : 1;
  
  // Generate daily submissions
  const dailySubmissions: DailySubmission[] = [];
  const taskSubmissions = submissions.filter(s => s.taskId === task.id);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const existingSubmission = taskSubmissions.find(s => s.date === dateStr);
    const dayGoal = Math.floor(task.target / days);
    const count = existingSubmission ? existingSubmission.count : Math.floor(dayGoal * (0.3 + Math.random() * 0.7));
    const efficiency = (count / dayGoal) * 100;
    
    dailySubmissions.push({
      date: dateStr,
      count,
      goal: dayGoal,
      efficiency: Math.min(efficiency, 150),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }
  
  // Generate weekly trend data (last 4 weeks)
  const weeklyTrend = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weeklyTrend.push({
      week: `Week ${4 - i}`,
      target: task.target,
      achieved: Math.floor(task.target * (0.6 + Math.random() * 0.4))
    });
  }
  
  // Calculate performance metrics
  const totalSubmitted = dailySubmissions.reduce((sum, day) => sum + day.count, 0);
  const avgDaily = totalSubmitted / days;
  const peakDay = dailySubmissions.reduce((max, day) => 
    day.count > max.count ? day : max, dailySubmissions[0]
  );
  const consistency = (dailySubmissions.filter(d => d.efficiency >= 80).length / days) * 100;
  
  return {
    dailySubmissions,
    weeklyTrend,
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
    }
  };
};

const EmployerTaskManagement = ({ employees, currentUser }: TaskManagementProps) => {
  // State
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>(demoSubmissions);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskAnalytics, setSelectedTaskAnalytics] = useState<AnalyticsData | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tasks' | 'employees' | 'analytics'>('tasks');
  const [analyticsView, setAnalyticsView] = useState<'daily' | 'weekly'>('daily');
  
  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly' | 'monthly',
    category: 'applications' as 'applications' | 'interviews' | 'assessments',
    target: '',
    unit: '',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: 0 as number, // Single employee ID
    notes: '',
    recurring: false,
    recurrence: 'daily' as 'daily' | 'weekly' | 'monthly'
  });

  // Calculate statistics
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  
  const totalSubmissions = taskSubmissions.length;
  const pendingVerification = taskSubmissions.filter(s => !s.verified).length;

  // Calculate team progress
  const teamProgress = tasks.reduce((acc, task) => {
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

  // Get assigned employee for a task
  const getAssignedEmployee = (task: Task) => {
    return employees.find(emp => emp.id === task.assignedTo);
  };

  // Get task submissions
  const getTaskSubmissions = (taskId: number) => {
    return taskSubmissions.filter(sub => sub.taskId === taskId);
  };

  // Get employee performance
  const getEmployeePerformance = (employeeId: number) => {
    const employeeTasks = tasks.filter(task => task.assignedTo === employeeId);
    const totalTarget = employeeTasks.reduce((sum, task) => sum + task.target, 0);
    const totalAchieved = employeeTasks.reduce((sum, task) => sum + task.achieved, 0);
    const completionRate = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
    
    return {
      totalTasks: employeeTasks.length,
      completionRate: completionRate.toFixed(1),
      totalSubmissions: taskSubmissions.filter(s => s.employeeId === employeeId).length,
      verifiedSubmissions: taskSubmissions.filter(s => s.employeeId === employeeId && s.verified).length
    };
  };

  // Handle create task
  const handleCreateTask = () => {
    if (!taskForm.title || !taskForm.target || !taskForm.deadline || taskForm.assignedTo === 0) {
      alert('Please fill in all required fields');
      return;
    }

    const newTask: Task = {
      id: tasks.length + 1,
      title: taskForm.title,
      description: taskForm.description,
      type: taskForm.type,
      category: taskForm.category,
      target: parseInt(taskForm.target),
      achieved: 0,
      unit: taskForm.unit,
      deadline: taskForm.deadline,
      status: 'active',
      assignedDate: new Date().toISOString().split('T')[0],
      priority: taskForm.priority,
      assignedTo: taskForm.assignedTo, // Single employee ID
      assignedBy: currentUser.id,
      notes: taskForm.notes,
      recurring: taskForm.recurring,
      recurrence: taskForm.recurrence
    };

    setTasks([...tasks, newTask]);
    setShowCreateModal(false);
    resetTaskForm();
  };

  // Handle verify submission
  const handleVerifySubmission = (submissionId: number) => {
    setTaskSubmissions(prev => prev.map(sub => 
      sub.id === submissionId ? { ...sub, verified: true } : sub
    ));
  };

  // Handle delete submission
  const handleDeleteSubmission = (submissionId: number) => {
    setTaskSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
  };

  // Reset forms
  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      type: 'daily',
      category: 'applications',
      target: '',
      unit: '',
      deadline: '',
      priority: 'medium',
      assignedTo: 0,
      notes: '',
      recurring: false,
      recurrence: 'daily'
    });
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

  // Open create modal
  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  // Open task details with analytics
  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    const analytics = generateTaskAnalytics(task, taskSubmissions);
    setSelectedTaskAnalytics(analytics);
    setShowTaskDetails(true);
  };

  // Open submissions modal
  const openSubmissionsModal = (task: Task) => {
    setSelectedTask(task);
    setShowSubmissionsModal(true);
  };

  // Calculate progress percentage
  const getProgressPercentage = (task: Task) => {
    return Math.min((task.achieved / task.target) * 100, 100);
  };

  // Custom tooltip for charts
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

  // Analytics Section Component for Task Details
// Analytics Section Component for Task Details
const TaskAnalyticsSection = () => {
  if (!selectedTask || !selectedTaskAnalytics) return null;

  return (
    <div className="mt-8 space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#6B8DA2]" />
          Task Analytics
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
              {selectedTaskAnalytics.performanceMetrics.avgDaily.toFixed(1)}
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
                {selectedTaskAnalytics.performanceMetrics.peakDay.count}
              </p>
              <p className="text-xs text-green-700">
                {selectedTaskAnalytics.performanceMetrics.peakDay.date}
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
              {selectedTaskAnalytics.performanceMetrics.consistency.toFixed(0)}%
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
              {selectedTaskAnalytics.performanceMetrics.totalSubmitted}
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
              <CalendarDays className="w-5 h-5 text-[#6B8DA2]" /> {/* Fixed: CalendarDays instead of CalendarDays */}
              Daily Submissions Trend
            </h5>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={selectedTaskAnalytics.dailySubmissions.slice(-14)}>
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
                <AreaChart data={selectedTaskAnalytics.dailySubmissions.slice(-14)}>
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
              <BarChart data={selectedTaskAnalytics.weeklyTrend}>
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
              {selectedTaskAnalytics.dailySubmissions.slice(-7).map((day, index) => (
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
          <p className="text-gray-500">Create, assign, and track tasks for your employees</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('analytics')}
            className="px-4 py-2 bg-gradient-to-r from-[#6B8DA2] to-[#7A9DB2] text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('employees')}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition cursor-pointer"
          >
            <UsersIcon className="w-4 h-4" />
            Team View
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-[#F5A42C] to-[#F5B53C] text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </motion.button>
        </div>
      </motion.div>

      {/* View Mode Toggle */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200 w-fit">
        <button
          onClick={() => setViewMode('tasks')}
          className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
            viewMode === 'tasks'
              ? 'bg-[#6B8DA2] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setViewMode('employees')}
          className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
            viewMode === 'employees'
              ? 'bg-[#6B8DA2] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Employees
        </button>
        <button
          onClick={() => setViewMode('analytics')}
          className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
            viewMode === 'analytics'
              ? 'bg-[#6B8DA2] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Analytics
        </button>
      </motion.div>

      {/* Statistics Cards */}
      {viewMode === 'tasks' && (
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
                <p className="text-gray-500 text-xs mt-1">Active: {activeTasks}</p>
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
                <p className="text-gray-600 text-sm">Active Employees</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {new Set(tasks.map(t => t.assignedTo)).size}
                </p>
                <p className="text-gray-500 text-xs mt-1">With assigned tasks</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Submissions</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{totalSubmissions}</p>
                <p className="text-gray-500 text-xs mt-1">Pending: {pendingVerification}</p>
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
                <p className="text-gray-600 text-sm">Team Progress</p>
                <p className="text-3xl font-bold text-[#F5A42C] mt-1">{teamProgress.toFixed(0)}%</p>
                <p className="text-gray-500 text-xs mt-1">Overall completion</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#F5A42C] to-[#F5B53C] rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Tasks Grid (Default View) */}
      {viewMode === 'tasks' && (
        <>
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
                const assignedEmployee = getAssignedEmployee(task);
                const submissions = getTaskSubmissions(task.id);

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
                      {/* Assigned Employee */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Assigned To</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            {assignedEmployee?.avatar ? (
                              <img src={assignedEmployee.avatar} alt={assignedEmployee.name} className="w-8 h-8 rounded-full" />
                            ) : (
                              <span className="text-sm font-medium text-gray-700">
                                {assignedEmployee?.name?.charAt(0) || '?'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{assignedEmployee?.name || 'Unassigned'}</p>
                            <p className="text-xs text-gray-500">{assignedEmployee?.position || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

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

                      {/* Submissions */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Submissions</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">{submissions.length} total</p>
                          <p className="text-xs text-gray-500">
                            {submissions.filter(s => s.verified).length} verified
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openTaskDetails(task)}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition cursor-pointer flex items-center justify-center gap-1 text-sm"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openSubmissionsModal(task)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-[#F5A42C] to-[#F5B53C] text-white rounded-lg font-medium hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1 text-sm"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Verify
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Task Details Modal with Analytics */}
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
                {/* Task Header */}
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

                {/* Assigned Employee */}
                {(() => {
                  const assignedEmployee = getAssignedEmployee(selectedTask);
                  return (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-[#6B8DA2]" />
                        Assigned Employee
                      </h4>
                      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                          {assignedEmployee?.avatar ? (
                            <img src={assignedEmployee.avatar} alt={assignedEmployee.name} className="w-12 h-12 rounded-full" />
                          ) : (
                            <span className="text-xl font-medium text-gray-700">
                              {assignedEmployee?.name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-lg">{assignedEmployee?.name || 'Unassigned'}</p>
                          <p className="text-sm text-gray-600">{assignedEmployee?.position || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{assignedEmployee?.department || 'N/A'} • {assignedEmployee?.empId || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Employee ID</p>
                          <p className="font-medium text-gray-800">{assignedEmployee?.empId || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Task Analytics Section */}
                {(selectedTask.type === 'weekly' || selectedTask.type === 'monthly') && (
                  <TaskAnalyticsSection />
                )}

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

                {/* Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Assigned Date</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatDate(selectedTask.assignedDate)}</p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Deadline</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatDate(selectedTask.deadline)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {getDaysRemaining(selectedTask.deadline)} days remaining
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowTaskDetails(false);
                      openSubmissionsModal(selectedTask);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#F5A42C] to-[#F5B53C] text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    View Submissions
                  </motion.button>
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Task Modal (Updated for single employee assignment) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-[#6B8DA2]" />
                  Create New Task
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetTaskForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Task Title */}
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                      placeholder="Enter task title..."
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                      placeholder="Enter task description..."
                    />
                  </div>

                  {/* Task Type and Category */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Task Type *
                    </label>
                    <select
                      value={taskForm.type}
                      onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Category *
                    </label>
                    <select
                      value={taskForm.category}
                      onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    >
                      <option value="applications">Applications</option>
                      <option value="interviews">Interviews</option>
                      <option value="assessments">Assessments</option>
                    </select>
                  </div>

                  {/* Target and Unit */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Target *
                    </label>
                    <input
                      type="number"
                      value={taskForm.target}
                      onChange={(e) => setTaskForm({ ...taskForm, target: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                      placeholder="Enter target number"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Unit *
                    </label>
                    <input
                      type="text"
                      value={taskForm.unit}
                      onChange={(e) => setTaskForm({ ...taskForm, unit: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                      placeholder="e.g., applications, interviews"
                    />
                  </div>

                  {/* Deadline and Priority */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Deadline *
                    </label>
                    <input
                      type="date"
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Priority *
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Assign To (Single Employee) */}
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Assign To *
                    </label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedTo: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    >
                      <option value={0}>Select an employee</option>
                      {employees.filter(emp => emp.status === 'active').map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.position}) - {employee.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recurring Task */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="recurring"
                        checked={taskForm.recurring}
                        onChange={(e) => setTaskForm({ ...taskForm, recurring: e.target.checked })}
                        className="w-4 h-4 text-[#6B8DA2] rounded focus:ring-[#6B8DA2]"
                      />
                      <label htmlFor="recurring" className="text-gray-700 font-medium">
                        Recurring Task
                      </label>
                    </div>
                    {taskForm.recurring && (
                      <div className="mt-3">
                        <label className="block text-gray-700 font-medium mb-2">
                          Recurrence Pattern
                        </label>
                        <select
                          value={taskForm.recurrence}
                          onChange={(e) => setTaskForm({ ...taskForm, recurrence: e.target.value as any })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={taskForm.notes}
                      onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                      placeholder="Any additional instructions..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateTask}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer"
                  >
                    Create Task
                  </motion.button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetTaskForm();
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

      {/* Empty State */}
      {viewMode === 'tasks' && filteredTasks.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-12 text-center border border-gray-100"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Tasks Found</h3>
          <p className="text-gray-500 mb-6">
            No tasks match your current filters. Try adjusting your search criteria or create a new task.
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="px-6 py-2 bg-gradient-to-r from-[#F5A42C] to-[#F5B53C] text-white rounded-xl font-medium hover:shadow-lg transition cursor-pointer"
            >
              Create First Task
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmployerTaskManagement;