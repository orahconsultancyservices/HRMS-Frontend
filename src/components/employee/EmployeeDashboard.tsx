import { useEffect, useState } from 'react';
import { Calendar, Clock, LogIn, LogOut, Coffee, ChevronLeft, ChevronRight, BarChart3, Filter, List, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceApi } from '../../services/api';

interface AttendanceRecord {
  id?: number;
  employeeId: number;
  date?: string;
  checkIn?: string;
  checkOut?: string;
  loginTime?: string;
  logoutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | '';
  totalHours?: number;
  hours?: string;
  isOnBreak?: boolean;
  breakStartTime?: string;
  totalBreakTime?: string;
  location?: string;
  notes?: string;
}

interface EmployeeDashboardProps {
  employee: {
    id?: number;
    empId: string;
    name: string;
    employeeId?: string;
  };
  attendance: Array<AttendanceRecord>;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

interface AttendanceHistoryItem {
  id: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number | null;
  status: string;
  breaks: number;
  location?: string;
  notes?: string;
  day?: string;
}

const EmployeeDashboard = ({ employee, attendance, setAttendance }: EmployeeDashboardProps) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [isClocking, setIsClocking] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Monthly calendar state
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);

  // Attendance history state
  const [viewMode, setViewMode] = useState<'calendar' | 'history'>('calendar');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  });

  const [breaks, setBreaks] = useState<any[]>([]);
  const [activeBreakId, setActiveBreakId] = useState<number | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  // Convert empId to number safely
  const getEmployeeIdNumber = () => {
    try {
      console.log('🔍 Debug employee object:', employee);

      if (employee.id) {
        console.log('✅ Using employee.id:', employee.id);
        return parseInt(employee.id.toString());
      }

      if (employee.empId) {
        const parsedId = parseInt(employee.empId);
        if (!isNaN(parsedId)) {
          console.log('✅ Using parsed empId as database ID:', parsedId);
          return parsedId;
        } else {
          console.log('⚠️ empId is not numeric:', employee.empId);
        }
      }

      if (employee.employeeId) {
        console.log('ℹ️ Employee has employeeId (code):', employee.employeeId);
      }

      console.warn('⚠️ No valid numeric ID found, trying to parse empId as fallback');
      const fallbackId = parseInt(employee.empId);
      return isNaN(fallbackId) ? 1 : fallbackId;
    } catch (error) {
      console.error('❌ Error parsing employee ID:', error, employee);
      return 1;
    }
  };

  const employeeIdNumber = getEmployeeIdNumber();

  // Format time for display
  const formatTimeForDisplay = (dateTime: string | Date | null | undefined) => {
    if (!dateTime) return '--:--';
    try {
      const date = new Date(dateTime);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '--:--';
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  // Get day name from date
  const getDayName = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } catch (error) {
      return '';
    }
  };

  // Format hours for display
  const formatHoursForDisplay = (hours: number | null | undefined) => {
    if (!hours || hours === 0) return '--';
    const totalMinutes = Math.round(hours * 60);
    const displayHours = Math.floor(totalMinutes / 60);
    const displayMinutes = totalMinutes % 60;
    return `${displayHours}h ${displayMinutes}m`;
  };

  // Fetch today's attendance
  const fetchTodayAttendance = async (forceRefresh = false) => {
    try {
      console.log('Fetching today attendance for employee:', employeeIdNumber);

      const response = await attendanceApi.getTodayStatus(employeeIdNumber);
      console.log('Today attendance response:', response);

      if (response.success && response.data) {
        setTodayAttendance(response.data);
        console.log('Set today attendance:', response.data);

        if (response.data.checkIn && !response.data.checkOut) {
          await fetchBreaks();
        } else {
          setIsOnBreak(false);
          setBreaks([]);
          setActiveBreakId(null);
        }
      } else {
        console.log('No attendance data found for today');
        setTodayAttendance(null);
        setIsOnBreak(false);
        setBreaks([]);
        setActiveBreakId(null);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      setTodayAttendance(null);
      setIsOnBreak(false);
      setBreaks([]);
      setActiveBreakId(null);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, [employeeIdNumber]);

  // Fetch monthly attendance
  useEffect(() => {
    const fetchMonthlyAttendance = async () => {
      try {
        const response = await attendanceApi.getByEmployee(employeeIdNumber, {
          month: currentMonth + 1,
          year: currentYear
        });

        console.log('📅 Monthly attendance response:', response);

        if (response.success) {
          // ✅ FIX: Check both response.data.data and response.data
          let dataArray = [];

          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            console.log('✅ Found monthly data in response.data.data');
            dataArray = response.data.data;
          }
          else if (response.data && Array.isArray(response.data)) {
            console.log('✅ Found monthly data in response.data');
            dataArray = response.data;
          }
          else if (Array.isArray(response)) {
            console.log('✅ Response is directly an array');
            dataArray = response;
          }

          console.log(`📅 Setting monthly attendance: ${dataArray.length} records`);
          setMonthlyAttendance(dataArray);
        } else {
          console.log('❌ Monthly attendance not successful:', response.message);
          setMonthlyAttendance([]);
        }
      } catch (error) {
        console.error('Error fetching monthly attendance:', error);
        setMonthlyAttendance([]);
      }
    };

    fetchMonthlyAttendance();
  }, [employeeIdNumber, currentMonth, currentYear]);

  // Get break summary text
  const getBreakSummary = () => {
    const completedBreaks = breaks.filter(b => b.status === 'completed').length;
    const activeBreaks = breaks.filter(b => b.status === 'active').length;

    let summary = `Total: ${formatBreakDuration(totalBreakTime)}`;

    if (completedBreaks > 0) {
      summary += ` | ${completedBreaks} break${completedBreaks !== 1 ? 's' : ''}`;
    }

    if (activeBreaks > 0) {
      summary += ` | 1 active`;
    }

    return summary;
  };

  // Fetch attendance history
  const fetchAttendanceHistory = async (filters = historyFilter) => {
    setIsLoadingHistory(true);
    try {
      // Build query parameters
      const params: any = {
        employeeId: employeeIdNumber.toString()
      };

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status !== 'all') params.status = filters.status;

      console.log('🔍 Fetching attendance history...');

      const response = await attendanceApi.getAll(params);
      console.log('📊 Raw API response:', response);

      let dataArray = [];

      // Handle different response structures
      if (response.success) {
        // Check for response.data.data (nested array)
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          console.log('✅ Found data in response.data.data');
          dataArray = response.data.data;
        }
        // Check for response.data (direct array)
        else if (response.data && Array.isArray(response.data)) {
          console.log('✅ Found data in response.data');
          dataArray = response.data;
        }
        // Check for response directly being an array
        else if (Array.isArray(response)) {
          console.log('✅ Response is directly an array');
          dataArray = response;
        }
        else {
          console.log('❌ No valid array found in response');
          console.log('Response structure:', {
            hasData: !!response.data,
            isDataArray: Array.isArray(response.data),
            hasDataData: !!(response.data && response.data.data),
            isDataDataArray: !!(response.data && response.data.data && Array.isArray(response.data.data))
          });
        }
      } else {
        console.log('❌ API response not successful:', response.message);
      }

      console.log(`📊 Processing ${dataArray.length} records`);

      // Format the data
      // Format the data with break information
      const formattedHistory = dataArray.map((record: any) => ({
        id: record.id || 0,
        date: record.date || '',
        day: getDayName(record.date || ''),
        checkIn: record.checkIn || null,
        checkOut: record.checkOut || null,
        totalHours: record.totalHours || 0,
        status: record.status || 'unknown',
        breaks: record.breaks || 0, // Total break time in minutes
        breakCount: record.breakCount || 0, // Number of breaks taken
        location: record.location || '',
        notes: record.notes || ''
      }));

      console.log('✅ Formatted history:', formattedHistory);
      setAttendanceHistory(formattedHistory);

    } catch (error) {
      console.error('❌ Error fetching attendance history:', error);
      setAttendanceHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  // Fetch history when view mode changes to history
  useEffect(() => {
    if (viewMode === 'history') {
      fetchAttendanceHistory();
    }
  }, [viewMode]);

  // Apply history filters
  const applyHistoryFilters = () => {
    fetchAttendanceHistory(historyFilter);
  };

  // Reset history filters
  const resetHistoryFilters = () => {
    const defaultFilters = {
      startDate: '',
      endDate: '',
      status: 'all'
    };
    setHistoryFilter(defaultFilters);
    fetchAttendanceHistory(defaultFilters);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'late': return 'bg-yellow-100 text-yellow-700';
      case 'absent': return 'bg-red-100 text-red-700';
      case 'half_day': return 'bg-orange-100 text-orange-700';
      case 'on_leave': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Handle punch in
  const handlePunchIn = async () => {
    setIsClocking(true);
    setLoading(true);
    try {
      console.log('Attempting to punch in for employee:', employeeIdNumber);
      const response = await attendanceApi.clockIn(employeeIdNumber, {
        location: 'Office',
        notes: 'Punched in via web app'
      });

      console.log('Full clock in response:', response);

      if (response.success) {
        console.log('Punch in successful:', response.data);
        setTodayAttendance(response.data);
        setIsOnBreak(false);

        showNotificationMessage(
          response.data.status === 'late'
            ? 'Punched in - You are late today!'
            : 'Successfully punched in! Have a productive day!',
          response.data.status === 'late' ? 'warning' : 'success'
        );

        await fetchTodayAttendance(true);
        await fetchBreaks();
      } else {
        throw new Error(response.message || 'Failed to punch in');
      }
    } catch (error: any) {
      console.error('Error punching in:', error);
      const errorMessage = error.response?.data?.message
        || error.message
        || 'Failed to punch in. Please try again.';
      showNotificationMessage(errorMessage, 'error');
    } finally {
      setIsClocking(false);
      setLoading(false);
    }
  };

  // Handle punch out
  const handlePunchOut = async () => {
    setIsClocking(true);
    setLoading(true);
    try {
      console.log('Attempting to punch out for employee:', employeeIdNumber);
      const response = await attendanceApi.clockOut(employeeIdNumber, {
        location: 'Office',
        notes: 'Punched out via web app'
      });

      console.log('Full clock out response:', response);

      if (response.success) {
        console.log('Punch out successful:', response.data);
        setTodayAttendance(response.data);
        setIsOnBreak(false);

        showNotificationMessage('Successfully punched out! See you tomorrow!', 'success');

        // Refresh both today's attendance and breaks data
        await fetchTodayAttendance(true);
        await fetchBreaks(); // Add this line

      } else {
        throw new Error(response.message || 'Failed to punch out');
      }
    } catch (error: any) {
      console.error('Error punching out:', error);
      const errorMessage = error.response?.data?.message
        || error.message
        || 'Failed to punch out. Please try again.';
      showNotificationMessage(errorMessage, 'error');
    } finally {
      setIsClocking(false);
      setLoading(false);
    }
  };



  // Format break duration
  const formatBreakDuration = (minutes: number) => {
    if (!minutes || minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  const fetchBreaks = async () => {
    try {
      console.log('Fetching breaks for employee:', employeeIdNumber);
      const breaksResponse = await attendanceApi.getBreaks(employeeIdNumber);
      console.log('Breaks response:', breaksResponse);

      if (breaksResponse.success && breaksResponse.data) {
        const todayBreaks = breaksResponse.data.filter((brk: any) => {
          const breakDate = new Date(brk.startTime).toISOString().split('T')[0];
          return breakDate === todayStr;
        });

        setBreaks(todayBreaks);

        const activeBreak = todayBreaks.find((brk: any) => brk.status === 'active');
        if (activeBreak) {
          setIsOnBreak(true);
          setActiveBreakId(activeBreak.id);
        } else {
          setIsOnBreak(false);
          setActiveBreakId(null);
        }
      }
    } catch (breakError) {
      console.error('Error fetching breaks:', breakError);
      setIsOnBreak(false);
      setBreaks([]);
      setActiveBreakId(null);
    }
  };

  // Calculate total break time
  // Calculate total break time (including active breaks)
  const totalBreakTime = breaks.reduce((sum, brk) => {
    if (brk.status === 'completed') {
      return sum + (brk.duration || 0);
    } else if (brk.status === 'active' && brk.startTime) {
      // Calculate duration for active breaks
      const startTime = new Date(brk.startTime);
      const now = new Date();
      const durationInMinutes = Math.round((now - startTime) / (1000 * 60));
      return sum + durationInMinutes;
    }
    return sum;
  }, 0);
  // Handle break
  const handleTakeBreak = async () => {
    if (isOnBreak && activeBreakId) {
      // End break
      try {
        setLoading(true);
        console.log('Attempting to end break with ID:', activeBreakId);

        const response = await attendanceApi.endBreak(employeeIdNumber, activeBreakId);

        console.log('End break response:', response);

        if (response.success) {
          console.log('Break ended successfully:', response.data);
          setIsOnBreak(false);
          setActiveBreakId(null);

          const duration = response.data.duration || 0;
          showNotificationMessage(
            `Break ended. Duration: ${formatBreakDuration(duration)}`,
            'success'
          );

          await fetchTodayAttendance();
        }
      } catch (error: any) {
        console.error('Error ending break:', error);
        showNotificationMessage(
          error.response?.data?.message || 'Failed to end break',
          'error'
        );

        if (error.response?.status === 404) {
          setIsOnBreak(false);
          setActiveBreakId(null);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Start break
      try {
        setLoading(true);
        console.log('Attempting to start break for employee:', employeeIdNumber);

        const response = await attendanceApi.startBreak(employeeIdNumber, {
          reason: 'Coffee break'
        });

        console.log('Start break response:', response);

        if (response.success) {
          console.log('Break started successfully:', response.data);
          setIsOnBreak(true);
          setActiveBreakId(response.data.id);
          showNotificationMessage('Break started. Enjoy your break! ☕', 'success');
          await fetchBreaks();
        }
      } catch (error: any) {
        console.error('Error starting break:', error);
        showNotificationMessage(
          error.response?.data?.message || 'Failed to start break',
          'error'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const showNotificationMessage = (message: string, type: 'success' | 'warning' | 'error') => {
    setNotification({ message, type });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Calculate derived states
  const hasPunchedIn = todayAttendance?.checkIn;
  const hasPunchedOut = todayAttendance?.checkOut;
  const canPunchIn = !hasPunchedIn;
  const canPunchOut = hasPunchedIn && !hasPunchedOut;
  const workCompleted = hasPunchedIn && hasPunchedOut;
  const isActive = canPunchOut && !isOnBreak;
  const isBreakActive = isOnBreak;

  const getStatusText = () => {
    if (workCompleted) return 'Work completed for today! 🎉';
    if (isBreakActive) return 'On Break - Enjoy your coffee! ☕';
    if (isActive) return 'Active - Currently working 💼';
    if (canPunchIn) return 'Ready to start your day ⏰';
    return 'Punched In - Ready to work';
  };

  // Generate monthly attendance data
  const generateMonthlyAttendance = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecord = monthlyAttendance.find((att: any) =>
        new Date(att.date).toISOString().split('T')[0] === dateStr
      );
      const isToday = date.toDateString() === today.toDateString();
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let status = 'none';
      if (attendanceRecord) {
        if (attendanceRecord.checkIn && attendanceRecord.checkOut) {
          status = attendanceRecord.status === 'late' ? 'late' : 'present';
        } else if (attendanceRecord.checkIn && !attendanceRecord.checkOut) {
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

    const presentDays = days.filter(d => d.status === 'present').length;
    const lateDays = days.filter(d => d.status === 'late').length;
    const workingDays = days.filter(d => !d.isWeekend).length;
    const attendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
    const totalHours = monthlyAttendance.reduce((sum: number, record: any) => {
      return sum + (record.totalHours || 0);
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

  // Get status color for calendar
  const getStatusColor = (status: string, isWeekend: boolean) => {
    if (isWeekend) return 'bg-gray-100 text-gray-400';
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'late': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'absent': return 'bg-red-100 text-red-700 hover:bg-red-200';
      case 'half_day': return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
      case 'on_leave': return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'active': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'none': return 'bg-gray-50 text-gray-400 hover:bg-gray-100';
      default: return 'bg-gray-50 text-gray-400 hover:bg-gray-100';
    }
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
      scale: [1, 1.05, 1] as [number, number, number],
      transition: {
        duration: 2,
        repeat: Infinity as number,
        ease: "easeInOut" as const
      }
    }
  };

  const breakPulseVariants = {
    pulse: {
      scale: [1, 1.02, 1] as [number, number, number],
      boxShadow: [
        '0 0 0 0 rgba(245, 164, 44, 0.4)',
        '0 0 0 20px rgba(245, 164, 44, 0)',
        '0 0 0 0 rgba(245, 164, 44, 0)'
      ] as string[],
      transition: {
        duration: 2,
        repeat: Infinity as number,
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
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border-l-4 ${notification.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-800'
              : notification.type === 'warning'
                ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                : 'bg-red-50 border-red-500 text-red-800'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-green-100 text-green-600' :
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
          <p className="text-sm text-gray-400">Employee ID: {employee.employeeId || employee.empId}</p>
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

                {/* Updated Time Display Section */}
                <div className="flex items-center gap-6 mt-6">
                  <div className="text-center">
                    <p className="text-sm text-white/80">Clock In</p>
                    <p className="text-2xl font-bold mt-1">
                      {todayAttendance?.checkIn ? formatTimeForDisplay(todayAttendance.checkIn) : '--:--'}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-white/30"></div>

                  <div className="text-center">
                    <p className="text-sm text-white/80">Clock Out</p>
                    <p className="text-2xl font-bold mt-1">
                      {todayAttendance?.checkOut ? formatTimeForDisplay(todayAttendance.checkOut) : '--:--'}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-white/30"></div>

                  {/* Total Break Time */}
                  <div className="text-center">
                    <p className="text-sm text-white/80">Total Break Time</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatBreakDuration(totalBreakTime)}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      {breaks.length > 0 ? getBreakSummary() : 'No breaks taken'}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-white/30"></div>

                  {/* Net Working Hours (Total Hours minus breaks) */}
                  <div className="text-center">
                    <p className="text-sm text-white/80">Working Hours</p>
                    <p className="text-2xl font-bold mt-1">
                      {todayAttendance?.totalHours ? formatHoursForDisplay(todayAttendance.totalHours) : '--'}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-white/30"></div>

                  <div className="text-center">
                    <p className="text-sm text-white/80">Status</p>
                    <p className="text-2xl font-bold mt-1">
                      {todayAttendance?.status ? todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1) : '--'}
                    </p>
                  </div>
                </div>

                {/* Notes Display */}
                {todayAttendance?.notes && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <p className="text-sm text-white/80 mb-1">Notes:</p>
                    <p className="text-white">{todayAttendance.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  {/* Punch In Button */}
                  <motion.button
                    variants={pulseVariants}
                    animate={canPunchIn ? "pulse" : ""}
                    whileHover={{ scale: canPunchIn ? 1.05 : 1 }}
                    whileTap={{ scale: canPunchIn ? 0.95 : 1 }}
                    onClick={handlePunchIn}
                    disabled={!canPunchIn || isClocking || loading}
                    className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all ${canPunchIn
                      ? 'bg-white text-[#6B8DA2] hover:shadow-lg cursor-pointer'
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

                  {/* Punch Out Button */}
                  <motion.button
                    whileHover={{ scale: canPunchOut && !isOnBreak ? 1.05 : 1 }}
                    whileTap={{ scale: canPunchOut && !isOnBreak ? 0.95 : 1 }}
                    onClick={handlePunchOut}
                    disabled={!canPunchOut || isClocking || loading || isOnBreak}
                    className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all ${canPunchOut && !isOnBreak
                      ? 'bg-white text-[#F5A42C] hover:shadow-lg cursor-pointer'
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
                    {isOnBreak ? 'End Break First' : canPunchOut ? (isClocking ? 'Punching Out...' : 'Punch Out') : 'Punch Out'}
                  </motion.button>
                </div>

                {/* Break Button */}
                <motion.button
                  variants={isBreakActive ? breakPulseVariants : {}}
                  animate={isBreakActive ? "pulse" : ""}
                  whileHover={{ scale: canPunchOut ? 1.02 : 1 }}
                  whileTap={{ scale: canPunchOut ? 0.98 : 1 }}
                  onClick={handleTakeBreak}
                  disabled={!canPunchOut || loading}
                  className={`px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${canPunchOut
                    ? isBreakActive
                      ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                      : 'bg-white text-[#F5A42C] hover:bg-white/90 cursor-pointer'
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

            {breaks.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="font-semibold text-gray-800 text-lg mb-4">
                  Today's Breaks ({breaks.length})
                </h3>
                <div className="space-y-3">
                  {breaks.map((breakItem: any, index: number) => (
                    <div
                      key={breakItem.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${breakItem.status === 'active'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-green-100 text-green-600'
                          }`}>
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            Break #{index + 1}
                            {breakItem.reason && ` - ${breakItem.reason}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTimeForDisplay(breakItem.startTime)}
                            {breakItem.endTime && ` - ${formatTimeForDisplay(breakItem.endTime)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {breakItem.status === 'completed' ? (
                          <div>
                            <span className="text-lg font-bold text-gray-800">
                              {formatBreakDuration(breakItem.duration || 0)}
                            </span>
                            <p className="text-xs text-gray-500">Duration</p>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Break Time Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Total Break Time Today:</span>
                    <span className="text-xl font-bold text-[#F5A42C]">
                      {formatBreakDuration(totalBreakTime)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

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
                  className={`w-3 h-3 rounded-full ${workCompleted ? 'bg-green-400 shadow-lg shadow-green-400/50' :
                    isBreakActive ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' :
                      isActive ? 'bg-blue-400 shadow-lg shadow-blue-400/50' :
                        canPunchOut ? 'bg-orange-400 shadow-lg shadow-orange-400/50' : 'bg-gray-400'
                    }`}
                />
                <span className="text-sm font-medium">
                  {getStatusText()}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Monthly Attendance/History Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-gray-800 text-lg">Attendance</h3>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 text-sm rounded-md transition ${viewMode === 'calendar'
                    ? 'bg-[#6B8DA2] text-white'
                    : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Calendar
                </button>
                <button
                  onClick={() => {
                    setViewMode('history');
                    fetchAttendanceHistory();
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition ${viewMode === 'history'
                    ? 'bg-[#6B8DA2] text-white'
                    : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4 inline mr-2" />
                  History
                </button>
              </div>
            </div>

            {viewMode === 'calendar' ? (
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
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* Export functionality */ }}
                  className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            )}
          </div>

          {viewMode === 'calendar' ? (
            <>
              {/* Monthly Stats */}
              {/* Monthly Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
                {/* NEW: Break Statistics Card */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
                  <p className="text-sm text-orange-600">Total Break Time</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {formatBreakDuration(monthlyAttendance.reduce((sum: number, record: any) => {
                      return sum + (record.breaks || 0);
                    }, 0))}
                  </p>
                </div>
              </div>
              {/* Mini Calendar */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}

                {Array.from({ length: monthData.firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8 bg-gray-50 rounded" />
                ))}

                {monthData.days.map(({ day, date, attendance, isToday, isWeekend, status }) => {
                  const attendanceRecord = attendance;

                  // Calculate break time for this day
                  let breakTime = 0;
                  let breakCount = 0;

                  if (attendanceRecord) {
                    // If breaks data is available in the record
                    breakTime = attendanceRecord.breaks || 0;
                    breakCount = attendanceRecord.breakCount || 0;
                  }

                  return (
                    <div
                      key={date}
                      className={`h-8 rounded flex items-center justify-center relative cursor-pointer transition-all hover:scale-105 ${getStatusColor(status, isWeekend)} ${isToday ? 'ring-2 ring-[#6B8DA2] ring-offset-1' : ''
                        }`}
                      onClick={() => {
                        if (attendanceRecord) {
                          // Prepare break info text
                          const breakInfo = breakTime > 0
                            ? `Breaks: ${breakCount} time${breakCount !== 1 ? 's' : ''} (${formatBreakDuration(breakTime)})`
                            : 'No breaks taken';

                          console.log('Clicked date:', {
                            date,
                            attendance: attendanceRecord,
                            status: attendanceRecord.status,
                            checkIn: attendanceRecord.checkIn,
                            checkOut: attendanceRecord.checkOut,
                            breakTime,
                            breakCount
                          });

                          // Show details with break information
                          showNotificationMessage(
                            `${formatDateForDisplay(date)}: ${attendanceRecord.status.charAt(0).toUpperCase() + attendanceRecord.status.slice(1)}\n${breakInfo}`,
                            'info'
                          );
                        } else {
                          console.log('No attendance for date:', date);
                          showNotificationMessage(
                            `No attendance record for ${formatDateForDisplay(date)}`,
                            'info'
                          );
                        }
                      }}
                      title={attendanceRecord ?
                        `${date}: ${attendanceRecord.status}\nClock In: ${attendanceRecord.checkIn ? formatTimeForDisplay(attendanceRecord.checkIn) : '--:--'}\nClock Out: ${attendanceRecord.checkOut ? formatTimeForDisplay(attendanceRecord.checkOut) : '--:--'}\nHours: ${attendanceRecord.totalHours || '--'}\n${breakTime > 0 ? `Break: ${formatBreakDuration(breakTime)} (${breakCount} time${breakCount !== 1 ? 's' : ''})` : 'No breaks taken'}` :
                        `${date}: No attendance record\nClick for details`
                      }
                    >
                      {day}
                      {attendanceRecord && attendanceRecord.checkIn && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      )}
                      {/* Add break indicator if breaks were taken */}
                      {breakTime > 0 && (
                        <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-yellow-500 opacity-80" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-600 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-100 rounded border border-green-200"></div>
                  Present
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-100 rounded border border-yellow-200"></div>
                  Late
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-100 rounded border border-red-200"></div>
                  Absent
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-100 rounded border border-orange-200"></div>
                  Half Day
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-100 rounded border border-purple-200"></div>
                  On Leave
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
            </>
          ) : (
            /* Attendance History View */
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={historyFilter.startDate}
                    onChange={(e) => setHistoryFilter({ ...historyFilter, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={historyFilter.endDate}
                    onChange={(e) => setHistoryFilter({ ...historyFilter, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={historyFilter.status}
                    onChange={(e) => setHistoryFilter({ ...historyFilter, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">All Status</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={applyHistoryFilters}
                  className="px-4 py-2 bg-[#6B8DA2] text-white rounded-lg hover:bg-[#5A7A8F] transition flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Apply Filters
                </button>
                <button
                  onClick={resetHistoryFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Reset
                </button>
              </div>

              {/* History Table */}
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8DA2]"></div>
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-8 border border-gray-200 rounded-lg">
                  <div className="text-gray-400 mb-2">No attendance records found</div>
                  <p className="text-gray-500">Start by punching in to create your first attendance record</p>
                  <button
                    onClick={fetchAttendanceHistory}
                    className="mt-4 px-4 py-2 bg-[#6B8DA2] text-white rounded-lg hover:bg-[#5A7A8F] transition"
                  >
                    Refresh
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700">
                          Showing {attendanceHistory.length} attendance record{attendanceHistory.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        Latest record: {attendanceHistory.length > 0 ? formatDateForDisplay(attendanceHistory[0].date) : 'None'}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                          {/* NEW: Break Time Header */}
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceHistory.map((record) => {
                          // Calculate break time for each record (assuming breaks are stored)
                          const breakTime = record.breaks || 0; // breaks is in minutes

                          return (
                            <tr
                              key={record.id}
                              className="hover:bg-gray-50 transition"
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDateForDisplay(record.date)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{record.day}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {record.checkIn ? formatTimeForDisplay(record.checkIn) : '--:--'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {record.checkOut ? formatTimeForDisplay(record.checkOut) : '--:--'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {record.totalHours ? formatHoursForDisplay(record.totalHours) : '--'}
                                </div>
                              </td>
                              {/* NEW: Break Time Column */}
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {breakTime > 0 ? formatBreakDuration(breakTime) : '--'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(record.status)}`}>
                                  {record.status.replace('_', ' ').charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
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
              <span className="font-bold text-[#6B8DA2]">12 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sick</span>
              <span className="font-bold text-[#F5A42C]">8 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Earned</span>
              <span className="font-bold text-[#5A7A8F]">20 days</span>
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
              <span className={`font-bold ${workCompleted ? 'text-green-600' : isBreakActive ? 'text-yellow-600' : isActive ? 'text-blue-600' : canPunchOut ? 'text-orange-600' : 'text-gray-600'}`}>
                {workCompleted ? 'Completed' : isBreakActive ? 'On Break' : isActive ? 'Active' : canPunchOut ? 'Punched In' : 'Not Started'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Working Hours</span>
              <span className="font-bold text-[#6B8DA2]">
                {canPunchOut ? 'In Progress' : todayAttendance?.totalHours ? formatHoursForDisplay(todayAttendance.totalHours) : '--'}
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm text-black/80">Break Time</p>
              <p className="text-2xl font-bold mt-1">
                {totalBreakTime > 0 ? formatBreakDuration(totalBreakTime) : '0m'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Attendance Statistics */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-[#6B8DA2]/10 to-[#F5A42C]/10 rounded-xl p-6 border border-[#6B8DA2]/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Attendance Statistics</h3>
            <BarChart3 className="w-5 h-5 text-[#6B8DA2]" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="font-bold text-[#6B8DA2]">
                {monthData.presentDays}/{monthData.workingDays} days
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Attendance Rate</span>
              <span className="font-bold text-green-600">{monthData.attendancePercentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Late Days</span>
              <span className="font-bold text-yellow-600">{monthData.lateDays} days</span>
            </div>
          </div>
          <motion.button
            whileHover={{ x: 5 }}
            className="w-full text-left px-4 py-3 bg-white rounded-lg hover:shadow-md transition cursor-pointer mt-3"
            onClick={() => setViewMode('history')}
          >
            <span className="text-sm font-medium text-gray-700">📊 View Detailed History</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default EmployeeDashboard;