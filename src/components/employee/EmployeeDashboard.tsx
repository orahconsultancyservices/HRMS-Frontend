import  { useState } from 'react';
import { Calendar, Clock, LogIn, LogOut, Coffee, ChevronLeft, ChevronRight, BarChart3, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { demoEmployees } from '../../data/demoData';

interface AttendanceRecord {
  empId: string;
  loginTime: string;
  logoutTime: string;
  status: string;
  hours: string;
  isOnBreak: boolean;
  breakStartTime?: string;
  totalBreakTime?: string;
  date?: string; // Added for monthly view
}

interface EmployeeDashboardProps{
  employee:{
    empId:string;
    name:string;
  };
  attendance: Array<AttendanceRecord>;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const EmployeeDashboard = ({ employee, attendance, setAttendance }:EmployeeDashboardProps) => {
  // Get today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Find today's attendance record
  const myAttendance = attendance.find((a) => a.empId === employee.empId && a.date === todayStr) || {
    empId: employee.empId,
    date: todayStr,
    loginTime: '',
    logoutTime: '',
    status: '',
    hours: '',
    isOnBreak: false
  };
  
  const emp = demoEmployees.find((e) => e.id === employee.empId);
  const [isClocking, setIsClocking] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(myAttendance?.isOnBreak || false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  // Monthly calendar state
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const calculateHours = (loginTime: string, logoutTime: string, breakTime: string = '0h 0m') => {
    if (!loginTime || !logoutTime) return '--';
    
    const [loginHour, loginMin] = loginTime.split(':').map(Number);
    const [logoutHour, logoutMin] = logoutTime.split(':').map(Number);
    
    let totalHours = logoutHour - loginHour;
    let totalMinutes = logoutMin - loginMin;
    
    if (totalMinutes < 0) {
      totalHours--;
      totalMinutes += 60;
    }
    
    // Parse break time if provided
    const breakMatch = breakTime.match(/(\d+)h\s*(\d+)m/);
    if (breakMatch) {
      const breakHours = parseInt(breakMatch[1]);
      const breakMinutes = parseInt(breakMatch[2]);
      totalMinutes -= breakMinutes;
      if (totalMinutes < 0) {
        totalHours--;
        totalMinutes += 60;
      }
      totalHours -= breakHours;
    }
    
    return `${totalHours}h ${totalMinutes}m`;
  };

  // Generate monthly attendance data
  const generateMonthlyAttendance = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    // Get all attendance for this month
    const monthAttendance = attendance.filter(record => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    // Create array of days in month
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecord = monthAttendance.find(record => record.date === dateStr);
      const isToday = date.toDateString() === today.toDateString();
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Determine status for display
      let status = 'none';
      if (attendanceRecord) {
        if (attendanceRecord.loginTime && attendanceRecord.logoutTime) {
          status = 'present';
          // Check if late (after 9:30 AM)
          const [loginHour, loginMin] = attendanceRecord.loginTime.split(':').map(Number);
          if (loginHour > 9 || (loginHour === 9 && loginMin > 30)) {
            status = 'late';
          }
        } else if (attendanceRecord.loginTime && !attendanceRecord.logoutTime) {
          status = 'active';
        }
      }
      
      days.push({
        date: dateStr,
        day,
        attendance: attendanceRecord,
        isToday,
        isWeekend,
        status
      });
    }
    
    // Calculate monthly statistics
    const presentDays = days.filter(d => d.status === 'present').length;
    const lateDays = days.filter(d => d.status === 'late').length;
    const workingDays = days.filter(d => !d.isWeekend).length;
    const attendancePercentage = Math.round((presentDays / workingDays) * 100);
    const totalHours = monthAttendance.reduce((sum, record) => {
      if (record.hours && record.hours !== 'Active') {
        const match = record.hours.match(/(\d+)h\s*(\d+)m/);
        if (match) {
          return sum + parseInt(match[1]) + (parseInt(match[2]) / 60);
        }
      }
      return sum;
    }, 0);
    
    return {
      days,
      firstDayOfMonth,
      daysInMonth,
      presentDays,
      lateDays,
      workingDays,
      attendancePercentage,
      totalHours: totalHours.toFixed(1)
    };
  };

  const monthData = generateMonthlyAttendance();
  
  // Navigation functions for calendar
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePunchIn = () => {
    setIsClocking(true);
    setTimeout(() => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Determine if late (after 9:30 AM)
      const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
      
      const newAttendance: AttendanceRecord = {
        empId: employee.empId,
        date: todayStr,
        loginTime: time,
        logoutTime: '',
        status: isLate ? 'late' : 'present',
        hours: 'Active',
        isOnBreak: false
      };
      
      setAttendance((prev) => {
        const filtered = prev.filter(a => !(a.empId === employee.empId && a.date === todayStr));
        return [...filtered, newAttendance];
      });
      setIsClocking(false);
      showNotificationMessage(
        isLate ? 'Punched in - You are late today!' : 'Successfully punched in! Have a productive day!', 
        isLate ? 'warning' : 'success'
      );
    }, 800);
  };

  const handlePunchOut = () => {
    setIsClocking(true);
    setTimeout(() => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Calculate total hours with break time
      const breakTime = myAttendance?.totalBreakTime || '0h 0m';
      const totalHours = calculateHours(myAttendance?.loginTime || '', time, breakTime);
      
      const updatedAttendance: AttendanceRecord = {
        ...myAttendance,
        logoutTime: time,
        hours: totalHours,
        isOnBreak: false
      };
      
      setAttendance((prev) => {
        const filtered = prev.filter(a => !(a.empId === employee.empId && a.date === todayStr));
        return [...filtered, updatedAttendance];
      });
      setIsClocking(false);
      setIsOnBreak(false);
      showNotificationMessage('Successfully punched out! See you tomorrow!', 'success');
    }, 800);
  };

  const handleTakeBreak = () => {
    if (isOnBreak) {
      // End break
      const now = new Date();
      const endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Calculate break duration
      const startTime = myAttendance?.breakStartTime;
      if (startTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        let breakHours = endHour - startHour;
        let breakMinutes = endMin - startMin;
        
        if (breakMinutes < 0) {
          breakHours--;
          breakMinutes += 60;
        }
        
        const breakDuration = `${breakHours}h ${breakMinutes}m`;
        const currentBreakTime = myAttendance?.totalBreakTime || '0h 0m';
        
        // Add to total break time
        const [currentHours, currentMins] = currentBreakTime.match(/(\d+)h\s*(\d+)m/)?.slice(1).map(Number) || [0, 0];
        const totalHours = currentHours + breakHours;
        const totalMinutes = currentMins + breakMinutes;
        
        const totalBreakTime = `${totalHours + Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
        
        const updatedAttendance: AttendanceRecord = {
          ...myAttendance,
          isOnBreak: false,
          totalBreakTime: totalBreakTime,
          breakStartTime: undefined
        };
        
        setAttendance((prev) => {
          const filtered = prev.filter(a => !(a.empId === employee.empId && a.date === todayStr));
          return [...filtered, updatedAttendance];
        });
        setIsOnBreak(false);
        showNotificationMessage(`Break ended. Total break time: ${breakDuration}`, 'success');
      }
    } else {
      // Start break
      const now = new Date();
      const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const updatedAttendance: AttendanceRecord = {
        ...myAttendance,
        isOnBreak: true,
        breakStartTime: startTime
      };
      
      setAttendance((prev) => {
        const filtered = prev.filter(a => !(a.empId === employee.empId && a.date === todayStr));
        return [...filtered, updatedAttendance];
      });
      setIsOnBreak(true);
      showNotificationMessage('Break started. Enjoy your break! ☕', 'success');
    }
  };

  const showNotificationMessage = (message :string, type :string) => {
    setNotification({ message, type });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const canPunchIn = !myAttendance?.loginTime;
  const canPunchOut = myAttendance?.loginTime && !myAttendance?.logoutTime;
  const workCompleted = myAttendance?.loginTime && myAttendance?.logoutTime;
  const isActive = canPunchOut && !isOnBreak;
  const isBreakActive = isOnBreak;

  // Update current status text
  const getStatusText = () => {
    if (workCompleted) return 'Work completed for today! 🎉';
    if (isBreakActive) return 'On Break - Enjoy your coffee! ☕';
    if (isActive) return 'Active - Currently working 💼';
    if (canPunchIn) return 'Ready to start your day ⏰';
    return 'Status unavailable';
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

  const breakPulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      boxShadow: [
        '0 0 0 0 rgba(245, 164, 44, 0.4)',
        '0 0 0 20px rgba(245, 164, 44, 0)',
        '0 0 0 0 rgba(245, 164, 44, 0)'
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  // Get status color for calendar
  const getStatusColor = (status: string, isWeekend: boolean) => {
    if (isWeekend) return 'bg-gray-100 text-gray-400';
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'late': return 'bg-yellow-100 text-yellow-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'none': return 'bg-gray-50 text-gray-400';
      default: return 'bg-gray-50 text-gray-400';
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
                : notification.type === 'warning'
                ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                : 'bg-red-50 border-red-500 text-red-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100 text-green-600' :
                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                {notification.type === 'success' ? '✓' : notification.type === 'warning' ? '⚠' : '✗'}
              </div>
              <p className="font-medium">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {employee.name}! 👋</h1>
          <p className="text-gray-500">Track your attendance, leaves, and performance</p>
        </div>
        <div className="flex items-center gap-2 text-gray-600 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 px-4 py-2 rounded-xl border border-[#6B8DA2]/20">
          <Calendar className="w-5 h-5 text-[#6B8DA2]" />
          <span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* Punch Card and Monthly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
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
                  <p className="text-2xl font-bold mt-1">{myAttendance?.loginTime || '--:--'}</p>
                </div>
                <div className="h-10 w-px bg-white/30"></div>
                <div className="text-center">
                  <p className="text-sm text-white/80">Clock Out</p>
                  <p className="text-2xl font-bold mt-1">{myAttendance?.logoutTime || '--:--'}</p>
                </div>
                <div className="h-10 w-px bg-white/30"></div>
                <div className="text-center">
                  <p className="text-sm text-white/80">Total Hours</p>
                  <p className="text-2xl font-bold mt-1">{myAttendance?.hours || '--'}</p>
                </div>
                <div className="h-10 w-px bg-white/30"></div>
                <div className="text-center">
                  <p className="text-sm text-white/80">Break Time</p>
                  <p className="text-2xl font-bold mt-1">{myAttendance?.totalBreakTime || '0h 0m'}</p>
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
                  onClick={handlePunchIn}
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
                  onClick={handlePunchOut}
                  disabled={!canPunchOut || isClocking || isBreakActive}
                  className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all cursor-pointer ${
                    canPunchOut && !isBreakActive
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
                variants={isBreakActive ? breakPulseVariants : {}}
                animate={isBreakActive ? "pulse" : ""}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTakeBreak}
                disabled={!canPunchOut}
                className={`px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  canPunchOut 
                    ? isBreakActive
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white text-[#F5A42C] hover:bg-white/90'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}
              >
                {isBreakActive ? (
                  <>
                    <Coffee className="w-4 h-4" />
                    End Break
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Take a Break
                  </>
                )}
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
                animate={workCompleted ? { scale: [1, 1.2, 1] } : isActive ? { scale: [1, 1.1, 1] } : isBreakActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: workCompleted || isActive || isBreakActive ? Infinity : 0, duration: 2 }}
                className={`w-3 h-3 rounded-full ${
                  workCompleted ? 'bg-green-400 shadow-lg shadow-green-400/50' : 
                  isBreakActive ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' :
                  isActive ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 
                  'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium">
                {getStatusText()}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
        {/* Monthly Attendance Summary */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800 text-lg">Monthly Attendance - {monthNames[currentMonth]}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
              <p className="text-sm text-green-600">Present Days</p>
              <p className="text-2xl font-bold text-green-700">{monthData.presentDays}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
              <p className="text-sm text-yellow-600">Late Days</p>
              <p className="text-2xl font-bold text-yellow-700">{monthData.lateDays}</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-blue-700">{monthData.attendancePercentage}%</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
              <p className="text-sm text-purple-600">Total Hours</p>
              <p className="text-2xl font-bold text-purple-700">{monthData.totalHours}</p>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: monthData.firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 bg-gray-50 rounded" />
            ))}

            {/* Days of the month */}
            {monthData.days.map(({ day, date, attendance, isToday, isWeekend, status }) => (
              <div 
                key={date} 
                className={`h-8 rounded flex items-center justify-center relative cursor-help ${getStatusColor(status, isWeekend)} ${
                  isToday ? 'ring-2 ring-[#6B8DA2] ring-offset-1' : ''
                }`}
                title={`${date}: ${attendance?.status || 'No attendance record'}`}
              >
                {day}
                {attendance && attendance.loginTime && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-100 rounded border border-green-200"></div>
              Present
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-100 rounded border border-yellow-200"></div>
              Late
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-100 rounded border border-blue-200"></div>
              Active
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-100 rounded border border-gray-200"></div>
              No Record
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Section */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Leave Balance */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Leave Balance</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-[#6B8DA2] to-[#7A9DB2] rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Casual</span>
              <span className="font-bold text-[#6B8DA2]">{emp?.leaveBalance.casual || 0} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sick</span>
              <span className="font-bold text-[#F5A42C]">{emp?.leaveBalance.sick || 0} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Earned</span>
              <span className="font-bold text-[#5A7A8F]">{emp?.leaveBalance.earned || 0} days</span>
            </div>
          </div>
        </motion.div>

        {/* Today's Summary */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Today's Summary</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-[#F5A42C] to-[#F5B53C] rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`font-bold ${workCompleted ? 'text-green-600' : isBreakActive ? 'text-yellow-600' : isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                {workCompleted ? 'Completed' : isBreakActive ? 'On Break' : isActive ? 'Active' : 'Not Started'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Working Hours</span>
              <span className="font-bold text-[#6B8DA2]">
                {myAttendance?.loginTime && !myAttendance?.logoutTime 
                  ? 'In Progress' 
                  : myAttendance?.hours || '--'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Break Time</span>
              <span className="font-bold text-[#F5A42C]">{myAttendance?.totalBreakTime || '0h 0m'}</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-[#6B8DA2]/10 to-[#F5A42C]/10 rounded-xl p-6 border border-[#6B8DA2]/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
            <BarChart3 className="w-5 h-5 text-[#6B8DA2]" />
          </div>
          <div className="space-y-2">
            {attendance
              .filter(a => a.empId === employee.empId && a.date && a.date !== todayStr)
              .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
              .slice(0, 3)
              .map((record, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between px-3 py-2 bg-white rounded-lg hover:shadow-sm transition"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {record.date ? new Date(record.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Unknown date'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {record.loginTime} - {record.logoutTime || '--'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    record.status === 'present' ? 'bg-green-100 text-green-700' :
                    record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {record.status || '--'}
                  </span>
                </motion.div>
              ))}
          </div>
          <motion.button
            whileHover={{ x: 5 }}
            className="w-full text-left px-4 py-3 bg-white rounded-lg hover:shadow-md transition cursor-pointer mt-3"
          >
            <span className="text-sm font-medium text-gray-700">📊 View Full Attendance History</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default EmployeeDashboard;

    