import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Clock, Calendar,  Filter, 
  Search, Mail, Phone, MapPin, Briefcase,
  FileText, 
  BarChart3, PieChart, 
  DownloadCloud, CalendarDays,
  Users, Target,
  ChevronLeft,
  ChevronRight,

  Users as UsersIcon
} from 'lucide-react';
// import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import StatCard from '../common/StatCard';

// Define types based on your demo data structure
interface EmployeeDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  avatar: string;
  location?: string;
  status?: 'active' | 'inactive';
}

interface AttendanceRecord {
  id: number;
  empId: number;
  empName: string;
  date: string;
  loginTime: string | null;
  logoutTime: string | null;
  hours: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  breaks?: number;
  department?:any;
  overtime?: string;
  productivity?: number;
  location?: string;
  notes?: string;
}

interface AttendancePageProps {
  attendance: AttendanceRecord[];
  employees?: EmployeeDetail[];
}

type DateRange = [Date | null, Date | null];

const AttendancePage = ({ 
  attendance = [], 
  employees = []
}: AttendancePageProps) => {
  const [dateRange, _setDateRange] = useState<DateRange>([null, null]);
  const [startDate, endDate] = dateRange;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<{ date: number; fullDate: string } | null>(null);
  const [showDateDetails, setShowDateDetails] = useState(false);
  
  // Ensure employees have default values for missing fields
  const processedEmployees = useMemo(() => {
    return Array.isArray(employees) 
      ? employees.map(emp => ({
          ...emp,
          location: emp.location || 'Not specified',
          status: emp.status || 'active',
          empId: emp.id.toString()
        }))
      : [];
  }, [employees]);

  // Generate demo attendance data for the current month if needed
  const generatedAttendance = useMemo(() => {
    // Merge provided attendance with generated data
    const mergedData = [...(attendance || [])];
    
    // If we don't have employees, return existing attendance
    if (processedEmployees.length === 0) {
      return mergedData;
    }
    
    // Generate data for current month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    let id = mergedData.length > 0 ? Math.max(...mergedData.map(a => a.id)) + 1 : 1000;
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Skip weekends
      const date = new Date(selectedYear, selectedMonth, day);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Check if we already have attendance for this date
      const existingRecordsForDate = mergedData.filter(a => a.date === dateStr);
      const existingEmpIds = new Set(existingRecordsForDate.map(a => a.empId));
      
      // Generate attendance for employees not already in the data for this date
      processedEmployees.forEach(emp => {
        if (!existingEmpIds.has(emp.id)) {
          // Use consistent random seed based on emp.id and day for reproducibility
          const seed = (emp.id * 1000 + day) % 100;
          const statusRandom = seed / 100;
          
          let status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave' = 'present';
          if (statusRandom < 0.05) status = 'absent';
          else if (statusRandom < 0.15) status = 'late';
          else if (statusRandom < 0.18) status = 'half-day';
          else if (statusRandom < 0.22) status = 'on-leave';
          
          const loginTime = status === 'absent' || status === 'on-leave' ? null : 
                           status === 'late' ? `${Math.floor((seed % 3) + 9)}:${String((seed * 7) % 60).padStart(2, '0')}` : 
                           '09:00';
          
          const logoutTime = status === 'absent' || status === 'on-leave' ? null : '18:00';
          
          const hours = status === 'absent' || status === 'on-leave' ? '-' : 
                       status === 'half-day' ? '4h 00m' : 
                       status === 'late' ? '8h 30m' : '9h 00m';
          
          mergedData.push({
            id: id++,
            empId: emp.id,
            empName: emp.name,
            date: dateStr,
            loginTime,
            logoutTime,
            status,
            hours,
            department: emp.department
          } as AttendanceRecord);
        }
      });
    }
    
    return mergedData;
  }, [attendance, processedEmployees, selectedMonth, selectedYear]);

  // Filter attendance based on date range, search, and status
  const filteredAttendance = useMemo(() => {
    if (!Array.isArray(generatedAttendance)) return [];
    
    return generatedAttendance.filter(record => {
      if (!record) return false;
      
      const recordDate = new Date(record.date);
      const matchesDate = (!startDate || recordDate >= startDate) && 
                         (!endDate || recordDate <= endDate);
      const matchesSearch = record.empName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.empId?.toString().includes(searchTerm) ||
                           record.department?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      
      return matchesDate && matchesSearch && matchesStatus;
    });
  }, [generatedAttendance, startDate, endDate, searchTerm, statusFilter]);

  // Calculate statistics
  const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
  const absentCount = filteredAttendance.filter(a => a.status === 'absent').length;
  const lateCount = filteredAttendance.filter(a => a.status === 'late').length;
  const halfDayCount = filteredAttendance.filter(a => a.status === 'half-day').length;
  const onLeaveCount = filteredAttendance.filter(a => a.status === 'on-leave').length;
  
  const totalRecords = filteredAttendance.length;
  const attendanceRate = totalRecords > 0 
    ? ((presentCount / totalRecords) * 100).toFixed(1)
    : '0.0';
  
  // const avgHours = totalRecords > 0
  //   ? filteredAttendance.reduce((acc, curr) => {
  //       const hourMatch = curr.hours?.match(/(\d+(\.\d+)?)h/);
  //       const hourValue = hourMatch ? parseFloat(hourMatch[1]) : 0;
  //       return acc + hourValue;
  //     }, 0) / totalRecords
  //   : 0;

  // Calendar view specific functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getMonthName = (monthIndex: number) => {
    return new Date(2000, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const getAttendanceForDate = (date: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return filteredAttendance.filter(record => record.date === dateStr);
  };

  const getDateStatusSummary = (date: number) => {
    const records = getAttendanceForDate(date);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const onLeave = records.filter(r => r.status === 'on-leave').length;
    const halfDay = records.filter(r => r.status === 'half-day').length;
    
    return { present, absent, late, onLeave, halfDay, total: records.length };
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleDateClick = (dayNumber: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    setSelectedDate({ date: dayNumber, fullDate: dateStr });
    setShowDateDetails(true);
  };

  const handleExport = () => {
    // Export functionality
    console.log(`Exporting as ${exportFormat}`);
    setShowExportModal(false);
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'present': return 'bg-green-100 text-green-700 border-green-200';
    case 'absent': return 'bg-red-100 text-red-700 border-red-200';
    case 'late': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'half-day': return 'bg-cyan-100 text-cyan-700 border-cyan-200'; 
    case 'on-leave': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return Check;
      case 'absent': return X;
      case 'late': return Clock;
      case 'half-day': return Clock;
      case 'on-leave': return Calendar;
      default: return Clock;
    }
  };

  const uniqueDepartments = Array.from(new Set(processedEmployees.map(e => e.department)));

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

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employee Attendance</h1>
          <p className="text-gray-600">Monitor and manage employee attendance</p>
        </div>
      </motion.div>

      {/* Statistics Cards */}
{/* Statistics Cards */}
<motion.div 
  variants={itemVariants}
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4" 
>
  <StatCard 
    icon={Check} 
    label="Present" 
    value={presentCount} 
    color="bg-gradient-to-r from-green-500 to-green-400"
    trend={"+12%"}
  />
  <StatCard 
    icon={X} 
    label="Absent" 
    value={absentCount} 
    color="bg-gradient-to-r from-red-500 to-red-400"
    trend={"-5%"}
  />
  <StatCard 
    icon={Clock} 
    label="Late Arrivals" 
    value={lateCount} 
    color="bg-gradient-to-r from-yellow-500 to-yellow-400"
    trend={"+3%"}
  />
  {/* Added Half Day Card */}
  <StatCard 
    icon={Clock} 
    label="Half Day" 
    value={halfDayCount} 
    color="bg-gradient-to-r from-blue-500 to-blue-400"
    trend={"-2%"}
  />
  <StatCard 
    icon={Calendar} 
    label="On Leave" 
    value={onLeaveCount} 
    color="bg-gradient-to-r from-purple-500 to-purple-400"
    trend={"0%"}
  />
  <div className="bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] rounded-xl p-6 text-white shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold">Attendance Rate</h3>
      <Target className="w-5 h-5 text-white/80" />
    </div>
    <p className="text-3xl font-bold">{attendanceRate}%</p>
    <p className="text-sm text-white/80 mt-2">Overall attendance</p>
  </div>
</motion.div>

      {/* Filter and Search Bar */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
              <input
                type="text"
                placeholder="Search employees by name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl hover:shadow-lg transition cursor-pointer flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area - Calendar Only */}
      <motion.div
        key="calendar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#6B8DA2]" />
              Attendance Calendar
              <span className="text-sm font-normal text-gray-600 ml-2">
                {getMonthName(selectedMonth)} {selectedYear}
              </span>
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer border border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <span className="text-gray-700 font-medium">
                  {getMonthName(selectedMonth)} {selectedYear}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer border border-gray-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-gray-600 font-medium py-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-32 rounded-lg bg-gray-50 p-2" />
            ))}
            
            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNumber = index + 1;
              const isToday = new Date().getDate() === dayNumber && 
                              new Date().getMonth() === selectedMonth && 
                              new Date().getFullYear() === selectedYear;
              const statusSummary = getDateStatusSummary(dayNumber);
              const hasAttendance = statusSummary.total > 0;
              
              return (
                <motion.div
                  key={dayNumber}
                  whileHover={{ scale: 1.02 }}
                  className={`min-h-32 rounded-lg border p-3 transition-all cursor-pointer ${
                    isToday 
                      ? 'border-[#F5A42C] bg-gradient-to-br from-[#F5A42C]/10 to-[#F5A42C]/5 shadow-sm' 
                      : 'border-gray-200 hover:border-[#6B8DA2] hover:shadow-sm'
                  } ${hasAttendance ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => handleDateClick(dayNumber)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-semibold ${isToday ? 'text-[#F5A42C]' : 'text-gray-700'}`}>
                      {dayNumber}
                      {isToday && (
                        <span className="ml-1 text-xs text-[#F5A42C] font-normal">Today</span>
                      )}
                    </span>
                    {hasAttendance && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        {statusSummary.total} records
                      </span>
                    )}
                  </div>
                  
                  {hasAttendance ? (
                    <div className="space-y-2">
                      {statusSummary.present > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-gray-600">Present</span>
                          </div>
                          <span className="text-xs font-bold text-green-600">{statusSummary.present}</span>
                        </div>
                      )}
                      
                      {statusSummary.absent > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs text-gray-600">Absent</span>
                          </div>
                          <span className="text-xs font-bold text-red-600">{statusSummary.absent}</span>
                        </div>
                      )}
                      
                      {statusSummary.late > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-xs text-gray-600">Late</span>
                          </div>
                          <span className="text-xs font-bold text-yellow-600">{statusSummary.late}</span>
                        </div>
                      )}
                      
                      {statusSummary.onLeave > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-xs text-gray-600">On Leave</span>
                          </div>
                          <span className="text-xs font-bold text-purple-600">{statusSummary.onLeave}</span>
                        </div>
                      )}

                      {statusSummary.halfDay > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-gray-600">Half Day</span>
                          </div>
                          <span className="text-xs font-bold text-blue-600">{statusSummary.halfDay}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm">No records</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600">On Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Half Day</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Additional Stats Section */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Department Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6B8DA2]" />
            Department Distribution
          </h3>
          <div className="space-y-4">
            {uniqueDepartments.length > 0 ? (
              uniqueDepartments.map((dept, i) => {
                const deptCount = processedEmployees.filter(e => e.department === dept).length;
                const percentage = (deptCount / processedEmployees.length) * 100;
                return (
                  <div key={dept} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        i === 0 ? 'bg-[#4A6A82]' : 
                        i === 1 ? 'bg-[#F5A42C]' : 
                        i === 2 ? 'bg-green-500' : 
                        i === 3 ? 'bg-purple-500' : 
                        'bg-blue-500'
                      }`} />
                      <span className="text-sm font-medium">{dept}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            i === 0 ? 'bg-[#6B8DA2]' : 
                            i === 1 ? 'bg-[#F5A42C]' : 
                            i === 2 ? 'bg-green-500' : 
                            i === 3 ? 'bg-purple-500' : 
                            'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{deptCount}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No department data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#F5A42C]" />
            Attendance Overview
          </h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              {presentCount + absentCount > 0 ? (
                <>
                  <div className="absolute inset-0 rounded-full border-8 border-green-500"></div>
                  <div className="absolute inset-0 rounded-full border-8 border-red-500" 
                    style={{ 
                      clipPath: `inset(0 ${Math.max(0, 100 - (absentCount / (presentCount + absentCount) * 100))}% 0 0)` 
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{attendanceRate}%</div>
                      <div className="text-gray-600 text-sm">Attendance Rate</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-300">0%</div>
                    <div className="text-gray-600 text-sm">No data</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Present ({presentCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Absent ({absentCount})</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Daily Details Modal */}
      <AnimatePresence>
        {showDateDetails && selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Attendance Details</h3>
                    <p className="text-gray-600 mt-1">
                      {new Date(selectedDate.fullDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowDateDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                  {[
                    { label: 'Total Employees', value: processedEmployees.length, icon: UsersIcon, color: 'bg-blue-100 text-blue-600' },
                    { label: 'Present', value: getDateStatusSummary(selectedDate.date).present, icon: Check, color: 'bg-green-100 text-green-600' },
                    { label: 'Absent', value: getDateStatusSummary(selectedDate.date).absent, icon: X, color: 'bg-red-100 text-red-600' },
                    { label: 'Late', value: getDateStatusSummary(selectedDate.date).late, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
                     { label: 'Half Day', value: getDateStatusSummary(selectedDate.date).halfDay, icon: Clock, color: 'bg-blue-100 text-blue-600' },
                    { label: 'On Leave', value: getDateStatusSummary(selectedDate.date).onLeave, icon: Calendar, color: 'bg-purple-100 text-purple-600' },
                  ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg ${stat.color.split(' ')[0]}`}>
                            <Icon className={`w-5 h-5 ${stat.color.split(' ')[1]}`} />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                            <div className="text-sm text-gray-600 whitespace-nowrap">{stat.label}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Attendance Table */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#6B8DA2]" />
                    Employee Attendance for {selectedDate.date} {getMonthName(selectedMonth)} {selectedYear}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Employee</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Department</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Login Time</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Logout Time</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Hours</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAttendanceForDate(selectedDate.date).length > 0 ? (
                          getAttendanceForDate(selectedDate.date).map((record) => {
                            const employee = processedEmployees.find(emp => emp.id === record.empId);
                            const StatusIcon = getStatusIcon(record.status);
                            
                            return (
                              <tr key={record.id} className="border-t border-gray-200 hover:bg-white transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] rounded-full flex items-center justify-center text-white font-semibold">
                                      {employee?.avatar || record.empName?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-800">{record.empName || 'Unknown'}</div>
                                      <div className="text-sm text-gray-600">ID: {record.empId}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {employee?.department || 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                    <StatusIcon className="w-3 h-3 inline-block mr-1" />
                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-medium text-gray-800">
                                  {record.loginTime || '--:--'}
                                </td>
                                <td className="py-3 px-4 font-medium text-gray-800">
                                  {record.logoutTime || '--:--'}
                                </td>
                                <td className="py-3 px-4 font-bold text-gray-800">
                                  {record.hours || '-'}
                                </td>
                                <td className="py-3 px-4">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const emp = processedEmployees.find(e => e.id === record.empId);
                                      if (emp) setSelectedEmployee(emp);
                                    }}
                                    className="text-sm text-[#6B8DA2] hover:text-[#F5A42C] hover:underline cursor-pointer px-3 py-1 rounded-lg hover:bg-gray-100"
                                  >
                                    View Profile
                                  </motion.button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-600">
                              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-lg">No attendance records for this day</p>
                              <p className="text-gray-600">Try selecting a different date</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Notes Section */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#6B8DA2]" />
                    Daily Notes
                  </h4>
                  <textarea
                    placeholder="Add notes about this day's attendance..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 resize-none"
                    defaultValue="All present employees worked on project deliverables. Team meeting scheduled for tomorrow."
                  />
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDateDetails(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition cursor-pointer"
                  >
                    Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-medium hover:shadow-lg transition cursor-pointer"
                  >
                    Download Report
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Employee Profile</h3>
                  <button 
                    onClick={() => setSelectedEmployee(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column - Profile */}
                  <div className="md:w-1/3 space-y-6">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                        {selectedEmployee.avatar || selectedEmployee.name.charAt(0)}
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">{selectedEmployee.name}</h4>
                      <p className="text-gray-600">{selectedEmployee.position}</p>
                      <p className="text-sm text-gray-600 mt-1">ID: {selectedEmployee.id}</p>
                      
                      <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedEmployee.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedEmployee.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700">{selectedEmployee.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700">{selectedEmployee.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700">{selectedEmployee.location}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700">{selectedEmployee.department}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700">Joined: {selectedEmployee.joinDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Attendance History */}
                  <div className="md:w-2/3">
                    <h4 className="font-semibold text-gray-800 mb-4">Attendance History (Last 30 Days)</h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Date</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Hours</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAttendance
                              .filter(a => a.empId === selectedEmployee.id)
                              .slice(0, 7)
                              .map(att => (
                                <tr key={att.id} className="border-t border-gray-200">
                                  <td className="py-2 text-sm">{att.date}</td>
                                  <td className="py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(att.status)}`}>
                                      {att.status}
                                    </span>
                                  </td>
                                  <td className="py-2 text-sm font-medium">{att.hours}</td>
                                  <td className="py-2">
                                    <button className="text-[#6B8DA2] text-sm hover:underline cursor-pointer">
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-[#6B8DA2]">{attendanceRate}%</div>
                        <div className="text-xs text-gray-600">Attendance Rate</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                        <div className="text-xs text-gray-600">Present Days</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
                        <div className="text-xs text-gray-600">Late Days</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedEmployee(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition cursor-pointer"
                  >
                    Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-medium hover:shadow-lg transition cursor-pointer"
                  >
                    View Full Profile
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Export Attendance Data</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Export Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['csv', 'pdf', 'excel'].map((format) => (
                      <motion.button
                        key={format}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setExportFormat(format as any)}
                        className={`px-4 py-3 rounded-lg border-2 cursor-pointer ${
                          exportFormat === format 
                            ? 'border-[#6B8DA2] bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 text-[#6B8DA2]' 
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {format.toUpperCase()}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Date Range</label>
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span>
                      {startDate && endDate 
                        ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                        : 'All Dates'
                      }
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Include Details</label>
                  <div className="space-y-2">
                    {['Employee Information', 'Attendance History', 'Department Stats', 'Productivity Metrics'].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-[#6B8DA2] rounded" />
                        <span className="text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExport}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-lg font-semibold hover:shadow-lg transition cursor-pointer"
                >
                  Export Data
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExportModal(false)}
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

export default AttendancePage;