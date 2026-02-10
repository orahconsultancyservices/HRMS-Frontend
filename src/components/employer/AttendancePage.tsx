

// src/components/employer/AttendancePage.tsx - ENHANCED WITH TIME PICKER
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Clock, Calendar, Filter,
  Search, DownloadCloud, CalendarDays,
  ChevronLeft, ChevronRight, Edit2, Save, XCircle
} from 'lucide-react';
import { useAttendance, useAttendanceStats } from '../../hooks/useAttendance';
import { useEmployees } from '../../hooks/useEmployees';

type DateRange = [Date | null, Date | null];

interface EditingRecord {
  id: number;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
  status: string;
}

// Helper function to format time in EST
const formatTimeEST = (dateTime: string | null) => {
  if (!dateTime) return '--:--';
  try {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return '--:--';
  }
};

// Helper to extract time from datetime string
const extractTime = (dateTime: string | null): string => {
  if (!dateTime) return '';
  try {
    const date = new Date(dateTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
};

// Helper to combine date with time
const combineDateTime = (originalDateTime: string, newTime: string): string => {
  if (!originalDateTime || !newTime) return originalDateTime;
  try {
    const date = new Date(originalDateTime);
    const [hours, minutes] = newTime.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date.toISOString();
  } catch (error) {
    return originalDateTime;
  }
};

// Time Input Component
const TimeInput = ({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (time: string) => void; 
  label: string;
}) => {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-600 mb-1">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 text-sm"
      />
    </div>
  );
};

// Status Select Component
const StatusSelect = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (status: string) => void;
}) => {
  const statuses = [
    { value: 'present', label: 'Present', color: 'bg-green-100 text-green-700' },
    { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-700' },
    { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'half_day', label: 'Half Day', color: 'bg-cyan-100 text-cyan-700' },
    { value: 'on_leave', label: 'On Leave', color: 'bg-purple-100 text-purple-700' }
  ];

  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-600 mb-1">Status</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 text-sm"
      >
        {statuses.map(status => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const AttendancePage = () => {
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const [startDate, endDate] = dateRange;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<{ date: number; fullDate: string } | null>(null);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EditingRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees();

  const getESTMidnight = (date: Date = new Date()): Date => {
    const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    estDate.setHours(0, 0, 0, 0);
    return estDate;
  };

  const attendanceParams = useMemo(() => {
    const params: any = {
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    };

    if (startDate) {
      const estStartDate = getESTMidnight(startDate);
      params.startDate = estStartDate.toISOString().split('T')[0];
    }
    if (endDate) {
      const estEndDate = getESTMidnight(endDate);
      params.endDate = estEndDate.toISOString().split('T')[0];
    }

    return params;
  }, [departmentFilter, startDate, endDate, statusFilter]);

  const { data: attendanceData = [], isLoading: isLoadingAttendance, refetch } = useAttendance(attendanceParams);

  // Process employees
  const processedEmployees = useMemo(() => {
    return employees.map(emp => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      employeeId: emp.employeeId,
      email: emp.email,
      phone: emp.phone || 'N/A',
      department: emp.department,
      position: emp.position,
      joinDate: emp.joinDate,
      avatar: emp.avatar,
      status: emp.isActive ? 'active' : 'inactive'
    }));
  }, [employees]);

  // Filter attendance
  const monthlyAttendance = useMemo(() => {
    const monthStart = new Date(selectedYear, selectedMonth, 1);
    const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);

    return attendanceData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });
  }, [attendanceData, selectedMonth, selectedYear]);

  const filteredAttendance = useMemo(() => {
    return attendanceData.filter(record => {
      const employee = processedEmployees.find(e => e.id === record.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : '';

      const matchesSearch =
        employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId?.toString().includes(searchTerm) ||
        employee?.department.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [attendanceData, processedEmployees, searchTerm]);

  // Statistics
  const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
  const absentCount = filteredAttendance.filter(a => a.status === 'absent').length;
  const lateCount = filteredAttendance.filter(a => a.status === 'late').length;
  const halfDayCount = filteredAttendance.filter(a => a.status === 'half_day').length;
  const onLeaveCount = filteredAttendance.filter(a => a.status === 'on_leave').length;

  const totalRecords = filteredAttendance.length;
  const attendanceRate = totalRecords > 0
    ? ((presentCount / totalRecords) * 100).toFixed(1)
    : '0.0';

  const uniqueDepartments = Array.from(new Set(processedEmployees.map(e => e.department)));

  // Export function
  const handleExportMonthly = async () => {
    try {
      setIsExporting(true);

      const month = selectedMonth + 1;
      const year = selectedYear;
      const dept = departmentFilter !== 'all' ? departmentFilter : undefined;

      const params = new URLSearchParams();
      params.append('month', month.toString());
      params.append('year', year.toString());
      if (dept) params.append('department', dept);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/attendance/export/monthly?${params.toString()}`,
        { method: 'GET' }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-EST-${year}-${String(month).padStart(2, '0')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ Export error:', error);
      alert('Failed to export attendance. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Edit functions
  const handleEditRecord = (record: any) => {
    setEditingRecord({
      id: record.id,
      checkInTime: extractTime(record.checkIn),
      checkOutTime: extractTime(record.checkOut),
      notes: record.notes || '',
      status: record.status
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      // Find the original record to get the date
      const originalRecord = getAttendanceForDate(selectedDate!.date)
        .find(r => r.id === editingRecord.id);

      if (!originalRecord) {
        throw new Error('Original record not found');
      }

      // Combine the date with the new times
      const newCheckIn = editingRecord.checkInTime 
        ? combineDateTime(originalRecord.checkIn, editingRecord.checkInTime)
        : originalRecord.checkIn;

      const newCheckOut = editingRecord.checkOutTime
        ? combineDateTime(originalRecord.checkOut || originalRecord.checkIn, editingRecord.checkOutTime)
        : originalRecord.checkOut;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/attendance/${editingRecord.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: newCheckIn,
            checkOut: newCheckOut,
            notes: editingRecord.notes,
            status: editingRecord.status
          })
        }
      );

      if (!response.ok) throw new Error('Update failed');

      await refetch();
      setEditingRecord(null);
      alert('Attendance updated successfully!');
    } catch (error) {
      console.error('❌ Save error:', error);
      alert('Failed to update attendance. Please try again.');
    }
  };

  // Calendar functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(Date.UTC(year, month, 1)).getUTCDay();
  };

  const getMonthName = (monthIndex: number) => {
    return new Date(2000, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const getAttendanceForDate = (date: number) => {
    const utcDate = new Date(Date.UTC(selectedYear, selectedMonth, date));
    const targetDateStr = utcDate.toISOString().split('T')[0];

    return monthlyAttendance.filter(record => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      const recordDateUTC = new Date(Date.UTC(
        recordDate.getUTCFullYear(),
        recordDate.getUTCMonth(),
        recordDate.getUTCDate()
      ));
      const recordDateStr = recordDateUTC.toISOString().split('T')[0];
      return recordDateStr === targetDateStr;
    });
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];
    const todayUTC = new Date();
    const todayUTCStr = todayUTC.toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const utcDate = new Date(Date.UTC(selectedYear, selectedMonth, day));
      const dateStr = utcDate.toISOString().split('T')[0];
      const dayOfWeek = utcDate.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dateStr === todayUTCStr;
      const records = getAttendanceForDate(day);
      const hasAttendance = records.length > 0;

      let status = 'none';
      if (hasAttendance) {
        const presentRecords = records.filter(r => r.status === 'present');
        const lateRecords = records.filter(r => r.status === 'late');
        const absentRecords = records.filter(r => r.status === 'absent');

        if (presentRecords.length > 0) {
          status = 'present';
        } else if (lateRecords.length > 0) {
          status = 'late';
        } else if (absentRecords.length > 0) {
          status = 'absent';
        }
      }

      days.push({
        date: dateStr,
        day,
        records,
        isToday,
        isWeekend,
        hasAttendance,
        status
      });
    }

    return { days, firstDayOfMonth, daysInMonth };
  };

  const getDateStatusSummary = (date: number) => {
    const records = getAttendanceForDate(date);
    return {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      onLeave: records.filter(r => r.status === 'on_leave').length,
      halfDay: records.filter(r => r.status === 'half_day').length,
      total: records.length
    };
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
    const utcDate = new Date(Date.UTC(selectedYear, selectedMonth, dayNumber));
    const dateStr = utcDate.toISOString().split('T')[0];

    setSelectedDate({
      date: dayNumber,
      fullDate: dateStr
    });
    setShowDateDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 border-green-200';
      case 'absent': return 'bg-red-100 text-red-700 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'half_day': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'on_leave': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);

  if (isLoadingEmployees || isLoadingAttendance) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8DA2] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] bg-clip-text text-transparent">
            Employee Attendance
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage employee attendance ·
            <span className="ml-1 text-sm font-medium text-[#6B8DA2]">
              🕐 EST/EDT Timezone
            </span>
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportMonthly}
          disabled={isExporting}
          className={`px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl hover:shadow-lg transition cursor-pointer flex items-center gap-2 ${
            isExporting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <DownloadCloud className="w-5 h-5" />
          {isExporting ? 'Exporting...' : 'Export Monthly Report (EST)'}
        </motion.button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Present</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{presentCount}</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Absent</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">{absentCount}</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Late</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{lateCount}</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Half Day</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{halfDayCount}</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">On Leave</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">{onLeaveCount}</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Rate</h3>
          </div>
          <p className="text-3xl font-bold">{attendanceRate}%</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name, ID, or department..."
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
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#6B8DA2]/5 to-[#F5A42C]/5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#6B8DA2]" />
              Attendance Calendar (EST)
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-700 font-medium min-w-[150px] text-center">
                {getMonthName(selectedMonth)} {selectedYear}
              </span>
              <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-gray-600 font-medium py-2">{day}</div>
            ))}

            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-32 rounded-lg bg-gray-50 p-2" />
            ))}

            {generateCalendarDays().days.map(({ day, date, records, isToday, isWeekend, hasAttendance, status }) => {
              const statusSummary = getDateStatusSummary(day);

              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.02 }}
                  className={`min-h-32 rounded-lg border p-3 transition-all cursor-pointer ${
                    isToday
                      ? 'border-[#F5A42C] bg-gradient-to-br from-[#F5A42C]/10 to-[#F5A42C]/5'
                      : 'border-gray-200 hover:border-[#6B8DA2]'
                  } ${hasAttendance ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-semibold ${isToday ? 'text-[#F5A42C]' : 'text-gray-700'}`}>
                      {day}
                    </span>
                    {hasAttendance && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {records.length}
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
                          <span className="text-xs font-bold text-green-600">
                            {statusSummary.present}
                          </span>
                        </div>
                      )}

                      {statusSummary.late > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-xs text-gray-600">Late</span>
                          </div>
                          <span className="text-xs font-bold text-yellow-600">
                            {statusSummary.late}
                          </span>
                        </div>
                      )}

                      {statusSummary.absent > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs text-gray-600">Absent</span>
                          </div>
                          <span className="text-xs font-bold text-red-600">
                            {statusSummary.absent}
                          </span>
                        </div>
                      )}

                      {statusSummary.onLeave > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-xs text-gray-600">On Leave</span>
                          </div>
                          <span className="text-xs font-bold text-purple-600">
                            {statusSummary.onLeave}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-gray-400 text-xs">
                        {isWeekend ? 'Weekend' : 'No records'}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Details Modal */}
      <AnimatePresence>
        {showDateDetails && selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="p-6 border-b border-gray-100 sticky top-0 z-10 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Attendance Details (EST)</h3>
                    <p className="text-gray-600 mt-1">
                      {new Date(`${selectedDate.fullDate}T00:00:00.000Z`).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </p>
                  </div>
                  <button 
                    onClick={() => { 
                      setShowDateDetails(false); 
                      setEditingRecord(null); 
                    }} 
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Employee</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Check In (EST)</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Check Out (EST)</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Hours</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Break</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAttendanceForDate(selectedDate.date).map((record) => {
                          const employee = processedEmployees.find(emp => emp.id === record.employeeId);
                          const isEditing = editingRecord?.id === record.id;

                          return (
                            <tr key={record.id} className="border-t border-gray-200">
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-800">
                                  {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {isEditing ? (
                                  <TimeInput
                                    value={editingRecord.checkInTime}
                                    onChange={(time) => setEditingRecord({ 
                                      ...editingRecord, 
                                      checkInTime: time 
                                    })}
                                    label=""
                                  />
                                ) : (
                                  <span className="font-medium">{formatTimeEST(record.checkIn)}</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isEditing ? (
                                  <TimeInput
                                    value={editingRecord.checkOutTime}
                                    onChange={(time) => setEditingRecord({ 
                                      ...editingRecord, 
                                      checkOutTime: time 
                                    })}
                                    label=""
                                  />
                                ) : (
                                  <span className="font-medium">{formatTimeEST(record.checkOut)}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold">
                                {record.totalHours ? `${record.totalHours.toFixed(1)}h` : '-'}
                              </td>
                              <td className="py-3 px-4">{record.breaks ? `${record.breaks}m` : '-'}</td>
                              <td className="py-3 px-4">
                                {isEditing ? (
                                  <StatusSelect
                                    value={editingRecord.status}
                                    onChange={(status) => setEditingRecord({ 
                                      ...editingRecord, 
                                      status 
                                    })}
                                  />
                                ) : (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                                    {record.status.replace('_', ' ')}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isEditing ? (
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={handleSaveEdit} 
                                      className="text-green-600 p-1 hover:bg-green-50 rounded"
                                      title="Save"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingRecord(null)} 
                                      className="text-red-600 p-1 hover:bg-red-50 rounded"
                                      title="Cancel"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleEditRecord(record)} 
                                    className="text-[#6B8DA2] p-1 hover:bg-blue-50 rounded"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendancePage;