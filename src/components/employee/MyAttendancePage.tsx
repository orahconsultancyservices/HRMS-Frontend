import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Calendar, Download, TrendingUp, BarChart3, 
  CheckCircle, XCircle, CalendarDays, Search, DownloadCloud, 
  FileText, PieChart, LogIn, LogOut, ChevronLeft, ChevronRight, Coffee,
  Filter, List
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { attendanceApi } from '../../services/api';

interface Employee {
  empId: string;
  name: string;
  id?: number;
  employeeId?: string;
}

interface MyAttendanceProps {
  employee: Employee;
}

interface AttendanceRecord {
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

type DateRange = [Date | null, Date | null];

const MyAttendancePage = ({ employee }: MyAttendanceProps) => {
  // Convert empId to number safely
  const getEmployeeIdNumber = () => {
    try {
      if (employee.id) {
        return parseInt(employee.id.toString());
      }
      
      if (employee.empId) {
        const parsedId = parseInt(employee.empId);
        if (!isNaN(parsedId)) {
          return parsedId;
        }
      }
      
      const fallbackId = parseInt(employee.empId);
      return isNaN(fallbackId) ? 1 : fallbackId;
    } catch (error) {
      console.error('Error parsing employee ID:', error);
      return 1;
    }
  };

  const employeeIdNumber = getEmployeeIdNumber();
  
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' as 'success' | 'error' | 'info' });
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const [startDate, endDate] = dateRange;
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // State for data
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Today's status
  const canPunchIn = !todayStatus?.checkIn;
  const canPunchOut = todayStatus?.checkIn && !todayStatus?.checkOut;
  const workCompleted = todayStatus?.checkIn && todayStatus?.checkOut;
  const activeBreak = breaks.find((b: any) => b.status === 'active');
  const isOnBreak = !!activeBreak;

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
  const fetchTodayAttendance = async () => {
    try {
      const response = await attendanceApi.getTodayStatus(employeeIdNumber);
      console.log('Today attendance response:', response);
      
      if (response.success && response.data) {
        setTodayStatus(response.data);
      } else {
        setTodayStatus(null);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      setTodayStatus(null);
    }
  };

  // Fetch attendance history
  const fetchAttendanceHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const params: any = {
        employeeId: employeeIdNumber.toString()
      };

      if (startDate) params.startDate = startDate.toISOString().split('T')[0];
      if (endDate) params.endDate = endDate.toISOString().split('T')[0];

      console.log('Fetching attendance history with params:', params);

      const response = await attendanceApi.getAll(params);
      console.log('Attendance history response:', response);
      
      let dataArray = [];
      
      // Handle different response structures
      if (response.success) {
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        } 
        else if (response.data && Array.isArray(response.data)) {
          dataArray = response.data;
        }
        else if (Array.isArray(response)) {
          dataArray = response;
        }
      }
      
      // Format the data
      const formattedHistory = dataArray.map((record: any) => ({
        id: record.id || 0,
        date: record.date || '',
        day: getDayName(record.date || ''),
        checkIn: record.checkIn || null,
        checkOut: record.checkOut || null,
        totalHours: record.totalHours || 0,
        status: record.status || 'unknown',
        breaks: record.breaks || 0,
        location: record.location || '',
        notes: record.notes || '',
        dayOfWeek: getDayName(record.date || '')
      }));

      console.log('Formatted history:', formattedHistory);
      setAttendanceHistory(formattedHistory);
      
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      setAttendanceHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch monthly attendance
  const fetchMonthlyAttendance = async () => {
    try {
      const response = await attendanceApi.getByEmployee(employeeIdNumber, {
        month: currentMonth + 1,
        year: currentYear
      });
      
      if (response.success) {
        let dataArray = [];
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        } 
        else if (response.data && Array.isArray(response.data)) {
          dataArray = response.data;
        }
        
        setMonthlyAttendance(dataArray);
      } else {
        setMonthlyAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
      setMonthlyAttendance([]);
    }
  };

  // Fetch breaks
  const fetchBreaks = async () => {
    try {
      const response = await attendanceApi.getBreaks(employeeIdNumber);
      
      if (response.success && response.data) {
        setBreaks(response.data);
      }
    } catch (error) {
      console.error('Error fetching breaks:', error);
      setBreaks([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceHistory();
    fetchMonthlyAttendance();
    fetchBreaks();
  }, [employeeIdNumber]);

  // Fetch history when date range changes
  useEffect(() => {
    if (startDate || endDate) {
      fetchAttendanceHistory();
    }
  }, [startDate, endDate]);

  // Fetch monthly data when month/year changes
  useEffect(() => {
    fetchMonthlyAttendance();
  }, [currentMonth, currentYear]);

  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      const response = await attendanceApi.clockIn(employeeIdNumber, {
        location: 'Office',
        notes: 'Punched in via web app'
      });

      if (response.success) {
        showNotificationMessage('Successfully clocked in! Have a productive day!', 'success');
        fetchTodayAttendance();
        fetchAttendanceHistory();
        fetchMonthlyAttendance();
      } else {
        throw new Error(response.message || 'Failed to clock in');
      }
    } catch (error: any) {
      console.error('Error punching in:', error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Failed to punch in. Please try again.';
      showNotificationMessage(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    try {
      const response = await attendanceApi.clockOut(employeeIdNumber, {
        location: 'Office',
        notes: 'Punched out via web app'
      });

      if (response.success) {
        showNotificationMessage('Successfully clocked out! See you tomorrow!', 'success');
        fetchTodayAttendance();
        fetchAttendanceHistory();
        fetchMonthlyAttendance();
      } else {
        throw new Error(response.message || 'Failed to clock out');
      }
    } catch (error: any) {
      console.error('Error punching out:', error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Failed to punch out. Please try again.';
      showNotificationMessage(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setIsLoading(true);
    try {
      const response = await attendanceApi.startBreak(employeeIdNumber, {
        reason: 'Coffee break'
      });

      if (response.success) {
        showNotificationMessage('Break started. Enjoy your break! ☕', 'success');
        fetchBreaks();
        fetchTodayAttendance();
      } else {
        throw new Error(response.message || 'Failed to start break');
      }
    } catch (error: any) {
      console.error('Error starting break:', error);
      showNotificationMessage(error.response?.data?.message || 'Failed to start break', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!activeBreak) return;
    
    setIsLoading(true);
    try {
      const response = await attendanceApi.endBreak(employeeIdNumber, activeBreak.id);

      if (response.success) {
        showNotificationMessage('Break ended!', 'success');
        fetchBreaks();
        fetchTodayAttendance();
      } else {
        throw new Error(response.message || 'Failed to end break');
      }
    } catch (error: any) {
      console.error('Error ending break:', error);
      showNotificationMessage(error.response?.data?.message || 'Failed to end break', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeBreak = () => {
    if (isOnBreak) {
      handleEndBreak();
    } else {
      handleStartBreak();
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

  const downloadAttendance = () => {
    showNotificationMessage('Downloading attendance report...', 'info');
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

  // Filter attendance based on view mode
  const getFilteredDataByViewMode = () => {
    const today = new Date(currentDate);
    
    switch (viewMode) {
      case 'daily':
        return attendanceHistory.filter((record: any) => 
          new Date(record.date).toDateString() === today.toDateString()
        );
        
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + selectedWeek * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return attendanceHistory.filter((record: any) => {
          const recordDate = new Date(record.date);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });
        
      case 'monthly':
        const monthStart = new Date(currentYear, currentMonth + selectedMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + selectedMonth + 1, 0);
        
        return attendanceHistory.filter((record: any) => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });
        
      default:
        return attendanceHistory;
    }
  };

  const filteredAttendance = getFilteredDataByViewMode().filter((record: any) => {
    const matchesSearch = record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.dayOfWeek && record.dayOfWeek.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Calculate statistics
  const totalPresent = filteredAttendance.filter((a: any) => a.status === 'present').length;
  const totalAbsent = filteredAttendance.filter((a: any) => a.status === 'absent').length;
  const totalLate = filteredAttendance.filter((a: any) => a.status === 'late').length;
  const totalHalfDay = filteredAttendance.filter((a: any) => a.status === 'half_day').length;
  const totalOnLeave = filteredAttendance.filter((a: any) => a.status === 'on_leave').length;
  
  const averageHours = filteredAttendance
    .filter((a: any) => a.status === 'present' || a.status === 'late' || a.status === 'half_day')
    .reduce((acc: number, curr: any) => acc + (curr.totalHours || 0), 0) / 
    (totalPresent + totalLate + totalHalfDay) || 0;
  
  const totalWorkHours = filteredAttendance
    .filter((a: any) => a.status === 'present' || a.status === 'late' || a.status === 'half_day')
    .reduce((acc: number, curr: any) => acc + (curr.totalHours || 0), 0);

  // Date navigation
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

  const navigateToPreviousWeek = () => setSelectedWeek(prev => prev - 1);
  const navigateToNextWeek = () => setSelectedWeek(prev => prev + 1);
  const navigateToPreviousMonth = () => setSelectedMonth(prev => prev - 1);
  const navigateToNextMonth = () => setSelectedMonth(prev => prev + 1);

  const resetToCurrent = () => {
    setCurrentDate(new Date());
    setSelectedWeek(0);
    setSelectedMonth(0);
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
  };

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
        const monthStart = new Date(currentYear, currentMonth + selectedMonth, 1);
        return monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
      default:
        return '';
    }
  };

  const getStatusText = () => {
    if (workCompleted) return 'Work completed for today! 🎉';
    if (isOnBreak) return 'On Break - Enjoy your coffee! ☕';
    if (canPunchOut) return 'Active - Currently working 💼';
    if (canPunchIn) return 'Ready to start your day ⏰';
    return 'Status unavailable';
  };

  // Get month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  // Calculate total break time
  const totalBreakTime = breaks
    .filter(brk => brk.status === 'completed')
    .reduce((sum, brk) => sum + (brk.duration || 0), 0);



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
          <p className="text-sm text-gray-400">Employee ID: {employee.employeeId || employee.empId}</p>
        </div>
        <div className="flex items-center gap-2 text-gray-600 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 px-4 py-2 rounded-xl border border-[#6B8DA2]/20">
          <Calendar className="w-5 h-5 text-[#6B8DA2]" />
          <span className="font-medium">{getDateRangeDisplay()}</span>
        </div>
      </motion.div>



      {/* Statistics Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
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
          <p className="text-3xl font-bold text-green-600">{totalPresent}</p>
          <p className="text-sm text-gray-500 mt-2">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Late Days</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{totalLate}</p>
          <p className="text-sm text-gray-500 mt-2">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view</p>
        </motion.div>

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

      {/* Attendance History Table */}
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
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6B8DA2]"></div>
                        <span>Loading attendance data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAttendance.length > 0 ? (
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
                          {formatDateForDisplay(record.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.day}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{record.checkIn ? formatTimeForDisplay(record.checkIn) : '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{record.checkOut ? formatTimeForDisplay(record.checkOut) : '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">{formatHoursForDisplay(record.totalHours)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 text-[#6B8DA2] rounded-full text-xs font-medium border border-[#6B8DA2]/20">
                          {record.breaks || 0}m
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusBadgeColor(record.status)}`}
                        >
                          {record.status === 'present' && <CheckCircle className="w-3 h-3" />}
                          {record.status === 'late' && <Clock className="w-3 h-3" />}
                          {record.status === 'absent' && <XCircle className="w-3 h-3" />}
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                        </motion.span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No attendance records found for the selected {viewMode} view.
                      <button
                        onClick={fetchAttendanceHistory}
                        className="mt-2 block mx-auto px-4 py-2 bg-[#6B8DA2] text-white rounded-lg hover:bg-[#5A7A8F] transition"
                      >
                        Refresh Data
                      </button>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      
    </motion.div>
  );
};

export default MyAttendancePage;