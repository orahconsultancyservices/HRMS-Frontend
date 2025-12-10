import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Calendar, Download, Filter, 
  TrendingUp, BarChart3, CheckCircle, 
  XCircle, Clock as ClockIcon, CalendarDays,
  Search, DownloadCloud, FileText,
  PieChart, LogIn, LogOut, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Define types
interface AttendanceRecord {
  id: number;
  date: string;
  loginTime: string | null;
  logoutTime: string | null;
  totalHours: string;
  status: 'present' | 'absent';
  breaks: number;
  dayOfWeek: string;
}

interface Employee {
  empId: string;
  name: string;
}

interface MyAttendanceProps {
  employee: Employee;
  attendance: Array<{
    empId: string;
    loginTime?: string;
    logoutTime?: string;
    status?: string;
    hours?: string;
    date?: string;
  }>;
  setAttendance: React.Dispatch<React.SetStateAction<any>>;
}

type DateRange = [Date | null, Date | null];

const MyAttendancePage = ({ employee, attendance, setAttendance }: MyAttendanceProps) => {
  const [isClocking, setIsClocking] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' as 'success' | 'error' | 'info' });
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const [startDate, endDate] = dateRange;
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakDuration, setBreakDuration] = useState(0);
  
  // Date navigation states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = current month
  
  // Demo attendance history data with more dates
  const generateAttendanceData = () => {
    const data: AttendanceRecord[] = [];
    const today = new Date();
    
    // Generate 90 days of data
    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Skip weekends randomly (approximately 2 days per week)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isAbsent = Math.random() > 0.85; // 15% chance of absence
      const isPresent = !isWeekend && !isAbsent;
      
      if (isPresent) {
        // Generate realistic login/logout times
        const loginHour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
        const loginMinute = Math.floor(Math.random() * 60);
        const logoutHour = 17 + Math.floor(Math.random() * 2); // 5-6 PM
        const logoutMinute = Math.floor(Math.random() * 60);
        
        const loginTime = `${loginHour.toString().padStart(2, '0')}:${loginMinute.toString().padStart(2, '0')}`;
        const logoutTime = `${logoutHour.toString().padStart(2, '0')}:${logoutMinute.toString().padStart(2, '0')}`;
        
        // Calculate total hours
        const totalHours = (logoutHour + logoutMinute/60) - (loginHour + loginMinute/60);
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);
        const totalHoursStr = `${hours}h ${minutes}m`;
        
        data.push({
          id: i + 1,
          date: dateStr,
          loginTime,
          logoutTime,
          totalHours: totalHoursStr,
          status: 'present',
          breaks: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
          dayOfWeek
        });
      } else {
        data.push({
          id: i + 1,
          date: dateStr,
          loginTime: null,
          logoutTime: null,
          totalHours: '0h',
          status: 'absent',
          breaks: 0,
          dayOfWeek
        });
      }
    }
    
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>(generateAttendanceData());
  
  const currentAtt = attendance.find(a => a.empId === employee.empId);
  const canPunchIn = !currentAtt?.loginTime;
  const canPunchOut = currentAtt?.loginTime && !currentAtt?.logoutTime;
  const workCompleted = currentAtt?.loginTime && currentAtt?.logoutTime;

  // Get filtered data based on view mode
  const getFilteredDataByViewMode = () => {
    const today = new Date(currentDate);
    
    switch (viewMode) {
      case 'daily':
        return attendanceHistory.filter(record => 
          record.date === today.toISOString().split('T')[0]
        );
        
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + selectedWeek * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return attendanceHistory.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });
        
      case 'monthly':
        const monthStart = new Date(today.getFullYear(), today.getMonth() + selectedMonth, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + selectedMonth + 1, 0);
        
        return attendanceHistory.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });
        
      default:
        return attendanceHistory;
    }
  };

  // Filtered attendance based on date range, search, and view mode
  const filteredAttendance = getFilteredDataByViewMode().filter(record => {
    const recordDate = new Date(record.date);
    const matchesDate = (!startDate || recordDate >= startDate) && 
                       (!endDate || recordDate <= endDate);
    const matchesSearch = record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.dayOfWeek.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  // Calculate statistics based on filtered data
  const totalPresent = filteredAttendance.filter(a => a.status === 'present').length;
  const totalAbsent = filteredAttendance.filter(a => a.status === 'absent').length;
  const averageHours = filteredAttendance
    .filter(a => a.status === 'present')
    .reduce((acc, curr) => {
      const hoursMatch = curr.totalHours.match(/(\d+)h\s*(\d*)m?/);
      if (hoursMatch) {
        const hours = parseInt(hoursMatch[1]);
        const minutes = hoursMatch[2] ? parseInt(hoursMatch[2]) / 60 : 0;
        return acc + hours + minutes;
      }
      return acc;
    }, 0) / totalPresent || 0;
  
  const totalWorkHours = filteredAttendance
    .filter(a => a.status === 'present')
    .reduce((acc, curr) => {
      const hoursMatch = curr.totalHours.match(/(\d+)h\s*(\d*)m?/);
      if (hoursMatch) {
        const hours = parseInt(hoursMatch[1]);
        const minutes = hoursMatch[2] ? parseInt(hoursMatch[2]) / 60 : 0;
        return acc + hours + minutes;
      }
      return acc;
    }, 0);

  // Date navigation functions
  const navigateToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const navigateToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const navigateToPreviousWeek = () => {
    setSelectedWeek(prev => prev - 1);
  };

  const navigateToNextWeek = () => {
    setSelectedWeek(prev => prev + 1);
  };

  const navigateToPreviousMonth = () => {
    setSelectedMonth(prev => prev - 1);
  };

  const navigateToNextMonth = () => {
    setSelectedMonth(prev => prev + 1);
  };

  const resetToCurrent = () => {
    setCurrentDate(new Date());
    setSelectedWeek(0);
    setSelectedMonth(0);
  };

  // Get date range display based on view mode
  const getDateRangeDisplay = () => {
    const today = new Date(currentDate);
    
    switch (viewMode) {
      case 'daily':
        return today.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + selectedWeek * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        
      case 'monthly':
        const monthStart = new Date(today.getFullYear(), today.getMonth() + selectedMonth, 1);
        return monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
      default:
        return '';
    }
  };

  const handleClockIn = () => {
    setIsClocking(true);
    setTimeout(() => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setAttendance((prev: any[]) => prev.map((a) => a.empId === employee.empId ? { 
        ...a, 
        loginTime: time, 
        status: 'present', 
        hours: 'Active',
        date: now.toISOString().split('T')[0]
      } : a));
      setIsClocking(false);
      showNotificationMessage('Successfully clocked in!', 'success');
    }, 800);
  };

  const handleClockOut = () => {
    setIsClocking(true);
    setTimeout(() => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const loginTime = currentAtt?.loginTime;
      if (loginTime) {
        const [loginHour, loginMinute] = loginTime.split(':').map(Number);
        const loginDate = new Date();
        loginDate.setHours(loginHour, loginMinute, 0);
        
        const diffMs = now.getTime() - loginDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const totalHours = `${diffHours}h ${diffMinutes}m`;
        
        setAttendance((prev: any[]) => prev.map((a) => a.empId === employee.empId ? { 
          ...a, 
          logoutTime: time, 
          hours: totalHours
        } : a));
      }
      
      setIsClocking(false);
      showNotificationMessage('Successfully clocked out!', 'success');
    }, 800);
  };

  const handleTakeBreak = () => {
    setShowBreakModal(true);
  };

  const handleBreakSubmit = () => {
    showNotificationMessage(`Break of ${breakDuration} minutes recorded`, 'info');
    setBreakDuration(0);
    setShowBreakModal(false);
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const downloadAttendance = () => {
    showNotificationMessage('Downloading attendance report...', 'info');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border-l-4 ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-500 text-green-800' 
                : notification.type === 'error'
                ? 'bg-red-50 border-red-500 text-red-800'
                : 'bg-blue-50 border-blue-500 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100' : 
                notification.type === 'error' ? 'bg-red-100' : 
                'bg-blue-100'
              }`}>
                {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✗' : 'ℹ'}
              </div>
              <p className="font-medium">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
          <p className="text-gray-500">Track your daily attendance and view history</p>
        </div>
        <div className="flex items-center gap-2 text-gray-600 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 px-4 py-2 rounded-xl border border-[#6B8DA2]/20">
          <Calendar className="w-5 h-5 text-[#6B8DA2]" />
          <span className="font-medium">{getDateRangeDisplay()}</span>
        </div>
      </motion.div>



      {/* Enhanced Clock Card */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] rounded-2xl p-6 text-white overflow-hidden relative shadow-xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold mb-2">Today's Attendance</h3>
              <p className="text-white/90 text-lg">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              
              <div className="flex items-center gap-6 mt-6">
                <div className="text-center">
                  <p className="text-sm text-white/80">Clock In</p>
                  <p className="text-2xl font-bold mt-1">{currentAtt?.loginTime || '--:--'}</p>
                </div>
                <div className="h-10 w-px bg-white/30"></div>
                <div className="text-center">
                  <p className="text-sm text-white/80">Clock Out</p>
                  <p className="text-2xl font-bold mt-1">{currentAtt?.logoutTime || '--:--'}</p>
                </div>
                <div className="h-10 w-px bg-white/30"></div>
                <div className="text-center">
                  <p className="text-sm text-white/80">Total Hours</p>
                  <p className="text-2xl font-bold mt-1">{currentAtt?.hours || '--'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <motion.button
                  variants={pulseVariants}
                  animate={canPunchIn ? "pulse" : ""}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClockIn}
                  disabled={!canPunchIn || isClocking}
                  className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all cursor-pointer ${
                    canPunchIn 
                      ? 'bg-white text-[#6B8DA2] hover:shadow-lg' 
                      : 'bg-white/30 text-white/70 cursor-not-allowed'
                  }`}
                >
                  {isClocking && canPunchIn ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-[#6B8DA2] border-t-transparent rounded-full"
                    />
                  ) : (
                    <LogIn className="w-6 h-6" />
                  )}
                  {canPunchIn ? (isClocking ? 'Punching In...' : 'Punch In') : 'Already Punched In'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClockOut}
                  disabled={!canPunchOut || isClocking}
                  className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all cursor-pointer ${
                    canPunchOut 
                      ? 'bg-white text-[#F5A42C] hover:shadow-lg' 
                      : 'bg-white/30 text-white/70 cursor-not-allowed'
                  }`}
                >
                  {isClocking && canPunchOut ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-[#F5A42C] border-t-transparent rounded-full"
                    />
                  ) : (
                    <LogOut className="w-6 h-6" />
                  )}
                  {canPunchOut ? (isClocking ? 'Punching Out...' : 'Punch Out') : 'Punch Out'}
                </motion.button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTakeBreak}
                disabled={!canPunchOut}
                className={`px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer ${
                  canPunchOut 
                    ? 'bg-white/20 text-white hover:bg-white/30' 
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}
              >
                <Clock className="w-4 h-4" />
                Take a Break
              </motion.button>
            </div>
          </div>

          {/* Status Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center justify-center"
          >
            <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
              <motion.div
                animate={workCompleted ? { scale: [1, 1.2, 1] } : canPunchOut ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: workCompleted || canPunchOut ? Infinity : 0, duration: 2 }}
                className={`w-3 h-3 rounded-full ${
                  workCompleted ? 'bg-green-400 shadow-lg shadow-green-400/50' : 
                  canPunchOut ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 
                  'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium">
                {workCompleted 
                  ? 'Work completed for today! 🎉' 
                  : canPunchOut 
                    ? 'Active - Currently working' 
                    : 'Ready to start your day'}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {/* Present Days Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Present Days</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{totalPresent} day{totalPresent !== 1 ? 's' : ''}</p>
          <p className="text-sm text-gray-500 mt-2">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view</p>
        </motion.div>

        {/* Absent Days Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Absent Days</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">{totalAbsent} day{totalAbsent !== 1 ? 's' : ''}</p>
          <p className="text-sm text-gray-500 mt-2">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view</p>
        </motion.div>

        {/* Average Hours Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Avg. Hours/Day</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-[#6B8DA2] to-[#7A9DB2] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#6B8DA2]">{averageHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-500 mt-2">Daily average</p>
        </motion.div>

        {/* Total Hours Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Total Hours</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-[#F5A42C] to-[#F5B53C] rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#F5A42C]">{totalWorkHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-500 mt-2">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view</p>
        </motion.div>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${viewMode} attendance...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#6B8DA2]" />
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update: DateRange) => setDateRange(update)}
                dateFormat="MMM d, yyyy"
                placeholderText="Filter by date range"
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] cursor-pointer min-w-[250px]"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadAttendance}
              className="px-4 py-2 bg-gradient-to-r from-[#F5A42C] to-[#F5A42C] text-white rounded-xl hover:shadow-lg transition cursor-pointer flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              Export {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
            </motion.button>
          </div>
        </div>
      </motion.div>

            {/* Date Navigation based on View Mode */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
              <button 
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 flex items-center gap-2 cursor-pointer ${
                  viewMode === 'daily' 
                    ? 'bg-[#6B8DA2] text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Daily
              </button>
              <button 
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 flex items-center gap-2 cursor-pointer ${
                  viewMode === 'weekly' 
                    ? 'bg-[#6B8DA2] text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Weekly
              </button>
              <button 
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 flex items-center gap-2 cursor-pointer ${
                  viewMode === 'monthly' 
                    ? 'bg-[#6B8DA2] text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Monthly
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation buttons based on view mode */}
            {viewMode === 'daily' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={navigateToPreviousDay}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetToCurrent}
                  className="px-4 py-2 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 text-[#6B8DA2] rounded-lg hover:shadow-sm cursor-pointer"
                >
                  Today
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={navigateToNextDay}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </>
            )}
            
            {viewMode === 'weekly' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={navigateToPreviousWeek}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetToCurrent}
                  className="px-4 py-2 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 text-[#6B8DA2] rounded-lg hover:shadow-sm cursor-pointer"
                >
                  This Week
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={navigateToNextWeek}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </>
            )}
            
            {viewMode === 'monthly' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={navigateToPreviousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetToCurrent}
                  className="px-4 py-2 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 text-[#6B8DA2] rounded-lg hover:shadow-sm cursor-pointer"
                >
                  This Month
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={navigateToNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* View Mode Specific Display */}
      {viewMode === 'weekly' && (
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="font-semibold text-gray-800 text-lg mb-4">Weekly Breakdown</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
              const dayData = filteredAttendance.find(a => a.dayOfWeek === day);
              return (
                <motion.div
                  key={day}
                  whileHover={{ y: -5 }}
                  className="text-center p-3 rounded-lg border border-gray-100"
                >
                  <div className="text-sm text-gray-500 mb-2">{day}</div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    dayData?.status === 'present' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {dayData ? (dayData.status === 'present' ? '✓' : '✗') : '-'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {dayData ? dayData.totalHours : 'N/A'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Attendance History */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#6B8DA2]" />
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Attendance History
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredAttendance.length} records)
            </span>
          </h3>
          <p className="text-gray-500 text-sm mt-1">Detailed history of your attendance records</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Date</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Day</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Clock In</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Clock Out</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Total Hours</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Breaks</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Status</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAttendance.length > 0 ? (
                  filteredAttendance.map((record, index) => (
                    <motion.tr 
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.dayOfWeek}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{record.loginTime || '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{record.logoutTime || '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">{record.totalHours}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 text-[#6B8DA2] rounded-full text-xs font-medium border border-[#6B8DA2]/20">
                          {record.breaks}m
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                            record.status === 'present' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {record.status === 'present' ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Present
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Absent
                            </>
                          )}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-[#6B8DA2] hover:bg-[#6B8DA2]/10 rounded-lg transition cursor-pointer"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-[#F5A42C] hover:bg-[#F5A42C]/10 rounded-lg transition cursor-pointer"
                            title="Download"
                            onClick={downloadAttendance}
                          >
                            <Download className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No attendance records found for the selected {viewMode} view.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Weekly Overview & Summary */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Weekly Overview */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#6B8DA2]" />
              {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Overview
            </h3>
          </div>
          <div className="space-y-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const dayData = attendanceHistory
                .filter(a => a.dayOfWeek === day && a.status === 'present')
                .slice(0, 4);
              
              const avgHours = dayData.length > 0 
                ? dayData.reduce((acc, curr) => {
                    const hoursMatch = curr.totalHours.match(/(\d+)h\s*(\d*)m?/);
                    if (hoursMatch) {
                      const hours = parseInt(hoursMatch[1]);
                      const minutes = hoursMatch[2] ? parseInt(hoursMatch[2]) / 60 : 0;
                      return acc + hours + minutes;
                    }
                    return acc;
                  }, 0) / dayData.length
                : 0;
              
              return (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-16 text-gray-500 text-sm">{day}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(avgHours / 10 * 100, 100)}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full rounded-full ${
                        i < 5 
                          ? 'bg-gradient-to-r from-[#6B8DA2] to-[#7A9DB2]' 
                          : 'bg-gradient-to-r from-[#F5A42C] to-[#F5B53C]'
                      }`}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-700">
                    {avgHours > 0 ? `${avgHours.toFixed(1)}h` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Attendance Summary */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#F5A42C]" />
              {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Summary
            </h3>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              {/* Pie chart visualization */}
              <div className="absolute inset-0 rounded-full border-8 border-green-500"></div>
              <div className="absolute inset-0 rounded-full border-8 border-red-500" 
                style={{ 
                  clipPath: `inset(0 ${100 - (totalAbsent / Math.max(totalPresent + totalAbsent, 1) * 100)}% 0 0)`,
                  transform: 'rotate(-90deg)'
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {Math.round((totalPresent / Math.max(totalPresent + totalAbsent, 1)) * 100)}%
                  </div>
                  <div className="text-gray-500 text-sm">Attendance Rate</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Present ({totalPresent})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Absent ({totalAbsent})</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Break Modal */}
      <AnimatePresence>
        {showBreakModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Take a Break</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Break Duration (minutes)</label>
                  <div className="flex items-center gap-4">
                    {[15, 30, 45, 60].map((duration) => (
                      <motion.button
                        key={duration}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setBreakDuration(duration)}
                        className={`px-4 py-2 rounded-lg border-2 cursor-pointer ${
                          breakDuration === duration 
                            ? 'border-[#6B8DA2] bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 text-[#6B8DA2]' 
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {duration}m
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Custom Duration</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#6B8DA2]"
                    placeholder="Enter minutes"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBreakSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-lg font-semibold hover:shadow-lg transition cursor-pointer"
                >
                  Start Break
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBreakModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition cursor-pointer"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyAttendancePage;