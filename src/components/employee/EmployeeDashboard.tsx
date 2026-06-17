import { useEffect, useState } from 'react';
import { Calendar, Clock, LogIn, LogOut, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceApi } from '../../services/api';
import EmployeeKPIWidget from './EmployeeKPIWidget';

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
  breaks?: number;
  breakCount?: number;
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

const EmployeeDashboard = ({ employee }: EmployeeDashboardProps) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [isClocking, setIsClocking] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);

  const [breaks, setBreaks] = useState<any[]>([]);
  const [activeBreakId, setActiveBreakId] = useState<number | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  // ── 1-second tick to drive live clocks ─────────────────────────────────────
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const getEmployeeIdNumber = () => {
    try {
      if (employee.id) return parseInt(employee.id.toString());
      if (employee.empId) {
        const parsedId = parseInt(employee.empId);
        if (!isNaN(parsedId)) return parsedId;
      }
      const fallbackId = parseInt(employee.empId);
      return isNaN(fallbackId) ? 1 : fallbackId;
    } catch {
      return 1;
    }
  };

  const employeeIdNumber = getEmployeeIdNumber();

  // ── Format time: UTC → EST/EDT ──────────────────────────────────────────────
  const formatTimeForDisplay = (dateTime: string | Date | null | undefined) => {
    if (!dateTime) return '--:--';
    try {
      return new Date(dateTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'
      });
    } catch {
      return '--:--';
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        timeZone: 'America/New_York'
      });
    } catch {
      return dateStr;
    }
  };

  const formatHoursForDisplay = (hours: number | null | undefined) => {
    if (!hours || hours === 0) return '--';
    const totalMinutes = Math.round(hours * 60);
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  };

  // ── Format break duration: minutes → "Xh Ym" ───────────────────────────────
  const formatBreakDuration = (minutes: number) => {
    if (!minutes || minutes === 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // ── Derived break values ────────────────────────────────────────────────────
  // Total break minutes: prefer live breaks array, fall back to API data
  const totalBreakTime = (() => {
    if (breaks.length > 0) {
      return breaks.reduce((sum: number, brk: any) => {
        if (brk.status === 'completed') return sum + (brk.duration || 0);
        if (brk.status === 'active' && brk.startTime) {
          return sum + Math.round((Date.now() - new Date(brk.startTime).getTime()) / 60000);
        }
        return sum;
      }, 0);
    }
    return todayAttendance?.breaks || 0;
  })();

  // Number of breaks taken: prefer live breaks array, fall back to API data
  const totalBreakCount = (() => {
    if (breaks.length > 0) return breaks.length;
    return todayAttendance?.breakCount || 0;
  })();

  // ── Break summary for the card ──────────────────────────────────────────────
  const getBreakSummary = () => {
    if (totalBreakTime === 0 && totalBreakCount === 0) return 'No breaks taken';
    return `${totalBreakCount} break${totalBreakCount !== 1 ? 's' : ''} · ${formatBreakDuration(totalBreakTime)}`;
  };

  // ── Fetch today's attendance ────────────────────────────────────────────────
  const fetchTodayAttendance = async () => {
    try {
      const response = await attendanceApi.getTodayStatus(employeeIdNumber);
      if (response.success && response.data) {
        setTodayAttendance(response.data);
        // Always fetch breaks so local state is in sync
        await fetchBreaks();
      } else {
        setTodayAttendance(null);
        setIsOnBreak(false);
        setBreaks([]);
        setActiveBreakId(null);
      }
    } catch {
      setTodayAttendance(null);
      setIsOnBreak(false);
      setBreaks([]);
      setActiveBreakId(null);
    }
  };

  useEffect(() => { fetchTodayAttendance(); }, []);

  // ── Fetch monthly attendance ────────────────────────────────────────────────
  useEffect(() => {
    const fetchMonthly = async () => {
      try {
        const response = await attendanceApi.getByEmployee(employeeIdNumber, {
          month: currentMonth + 1, year: currentYear
        });
        if (response.success) {
          let data: any[] = [];
          if (Array.isArray(response.data?.data)) data = response.data.data;
          else if (Array.isArray(response.data))    data = response.data;
          else if (Array.isArray(response))         data = response;
          setMonthlyAttendance(data);
        } else {
          setMonthlyAttendance([]);
        }
      } catch {
        setMonthlyAttendance([]);
      }
    };
    fetchMonthly();
  }, [employeeIdNumber, currentMonth, currentYear]);

  // ── Fetch break records ─────────────────────────────────────────────────────
  const fetchBreaks = async () => {
    try {
      const res = await attendanceApi.getBreaks(employeeIdNumber);
      if (res.success && res.data) {
        // Filter to today's breaks only (compare date portion in UTC)
        const todayBreaks = res.data.filter((brk: any) => {
          const breakDate = new Date(brk.startTime).toISOString().split('T')[0];
          return breakDate === todayStr;
        });
        setBreaks(todayBreaks);
        const active = todayBreaks.find((b: any) => b.status === 'active');
        if (active) {
          setIsOnBreak(true);
          setActiveBreakId(active.id);
        } else {
          setIsOnBreak(false);
          setActiveBreakId(null);
        }
      }
    } catch {
      setIsOnBreak(false);
      setBreaks([]);
      setActiveBreakId(null);
    }
  };

  // ── Punch in ────────────────────────────────────────────────────────────────
  const handlePunchIn = async () => {
    setIsClocking(true); setLoading(true);
    try {
      const response = await attendanceApi.clockIn(employeeIdNumber, {
        location: 'Office', notes: 'Punched in via web app'
      });
      if (response.success) {
        setTodayAttendance(response.data);
        setIsOnBreak(false);
        showMsg(
          response.data.status === 'late' ? 'Punched in — You are late today!' : 'Successfully punched in! Have a productive day!',
          response.data.status === 'late' ? 'warning' : 'success'
        );
        await fetchBreaks();
      } else throw new Error(response.message || 'Failed to punch in');
    } catch (e: any) {
      showMsg(e.response?.data?.message || e.message || 'Failed to punch in.', 'error');
    } finally { setIsClocking(false); setLoading(false); }
  };

  // ── Punch out ───────────────────────────────────────────────────────────────
  const handlePunchOut = async () => {
    setIsClocking(true); setLoading(true);
    try {
      const response = await attendanceApi.clockOut(employeeIdNumber, {
        location: 'Office', notes: 'Punched out via web app'
      });
      if (response.success) {
        setTodayAttendance(response.data);
        setIsOnBreak(false);
        showMsg('Successfully punched out! See you tomorrow!', 'success');
        await fetchBreaks();
      } else throw new Error(response.message || 'Failed to punch out');
    } catch (e: any) {
      showMsg(e.response?.data?.message || e.message || 'Failed to punch out.', 'error');
    } finally { setIsClocking(false); setLoading(false); }
  };

  // ── Break toggle ────────────────────────────────────────────────────────────
  const handleTakeBreak = async () => {
    setLoading(true);
    try {
      if (isOnBreak && activeBreakId) {
        const response = await attendanceApi.endBreak(employeeIdNumber, activeBreakId);
        if (response.success) {
          setIsOnBreak(false);
          setActiveBreakId(null);
          showMsg(`Break ended · ${formatBreakDuration(response.data.duration || 0)}`, 'success');
          await fetchTodayAttendance();
        }
      } else {
        const response = await attendanceApi.startBreak(employeeIdNumber, { reason: 'Coffee break' });
        if (response.success) {
          setIsOnBreak(true);
          setActiveBreakId(response.data.id);
          showMsg('Break started. Enjoy! ☕', 'success');
          await fetchBreaks();
        }
      }
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Break action failed', 'error');
      if (e.response?.status === 404) { setIsOnBreak(false); setActiveBreakId(null); }
    } finally { setLoading(false); }
  };

  const showMsg = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    setNotification({ message, type });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // ── Derived UI states ───────────────────────────────────────────────────────
  const hasPunchedIn   = !!todayAttendance?.checkIn;
  const hasPunchedOut  = !!todayAttendance?.checkOut;
  const canPunchIn     = !hasPunchedIn;
  const canPunchOut    = hasPunchedIn && !hasPunchedOut;
  const workCompleted  = hasPunchedIn && hasPunchedOut;
  const isActive       = canPunchOut && !isOnBreak;
  const isBreakActive  = isOnBreak;

  // ── Live working-hours clock ────────────────────────────────────────────────
  // Ticks every second while clocked in, pauses during breaks, freezes on punch-out
  const getLiveWorkingDisplay = () => {
    if (!hasPunchedIn) return '--';
    if (hasPunchedOut) return formatHoursForDisplay(todayAttendance?.totalHours);

    const elapsed = Math.floor((Date.now() - new Date(todayAttendance.checkIn).getTime()) / 1000);

    // Subtract all break time so the clock pauses during breaks
    let breakSecs = 0;
    if (breaks.length > 0) {
      for (const brk of breaks) {
        if (brk.status === 'completed') {
          breakSecs += (brk.duration || 0) * 60;
        } else if (brk.status === 'active' && brk.startTime) {
          // Active break grows at same rate as elapsed → net stays frozen
          breakSecs += Math.floor((Date.now() - new Date(brk.startTime).getTime()) / 1000);
        }
      }
    } else {
      // Fallback: use stored break minutes from API
      breakSecs = (todayAttendance?.breaks || 0) * 60;
    }

    const netSecs = Math.max(0, elapsed - breakSecs);
    const h = Math.floor(netSecs / 3600);
    const m = Math.floor((netSecs % 3600) / 60);
    const s = netSecs % 60;
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  // ── Live break-duration clock ───────────────────────────────────────────────
  // Ticks while a break is active, shows static total after break ends
  const getLiveBreakDisplay = () => {
    let totalSecs = 0;
    if (breaks.length > 0) {
      for (const brk of breaks) {
        if (brk.status === 'completed') {
          totalSecs += (brk.duration || 0) * 60;
        } else if (brk.status === 'active' && brk.startTime) {
          totalSecs += Math.floor((Date.now() - new Date(brk.startTime).getTime()) / 1000);
        }
      }
    } else {
      totalSecs = (todayAttendance?.breaks || 0) * 60;
    }
    if (totalSecs === 0) return '0m';
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    // Show seconds precision only while a break is in progress
    if (isOnBreak) {
      if (h === 0) return `${m}m ${String(s).padStart(2, '0')}s`;
      return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    }
    // Static after break ends
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const getStatusText = () => {
    if (workCompleted)  return 'Work completed for today! 🎉';
    if (isBreakActive)  return 'On Break — Enjoy your coffee! ☕';
    if (isActive)       return 'Active — Currently working 💼';
    if (canPunchIn)     return 'Ready to start your day ⏰';
    return 'Punched In — Ready to work';
  };

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const generateMonthlyAttendance = () => {
    const daysInMonth    = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date     = new Date(currentYear, currentMonth, day);
      const dateStr  = date.toISOString().split('T')[0];
      const rec      = monthlyAttendance.find((a: any) =>
        new Date(a.date).toISOString().split('T')[0] === dateStr
      );
      const isToday  = date.toDateString() === today.toDateString();
      const dow      = date.getDay();
      const isWeekend = dow === 0 || dow === 6;

      let status = 'none';
      if (rec) {
        if (rec.checkIn && rec.checkOut)  status = rec.status === 'late' ? 'late' : 'present';
        else if (rec.checkIn)             status = 'active';
      }
      days.push({ date: dateStr, day, attendance: rec, isToday, isWeekend, status });
    }

    const presentDays          = days.filter(d => d.status === 'present').length;
    const lateDays             = days.filter(d => d.status === 'late').length;
    const workingDays          = days.filter(d => !d.isWeekend).length;
    const attendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
    const totalHours           = monthlyAttendance.reduce((s: number, r: any) => s + (r.totalHours || 0), 0);
    const totalMonthBreakMins  = monthlyAttendance.reduce((s: number, r: any) => s + (r.breaks || 0), 0);

    return { days, firstDayOfMonth, presentDays, lateDays, workingDays, attendancePercentage,
             totalHours: totalHours.toFixed(1), totalMonthBreakMins };
  };

  const monthData = generateMonthlyAttendance();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const dayNames   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const getStatusColor = (status: string, isWeekend: boolean) => {
    if (isWeekend) return 'bg-gray-100 text-gray-400';
    switch (status) {
      case 'present':  return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'late':     return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'absent':   return 'bg-red-100 text-red-700 hover:bg-red-200';
      case 'half_day': return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
      case 'on_leave': return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'active':   return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      default:         return 'bg-gray-50 text-gray-400 hover:bg-gray-100';
    }
  };

  // ── Animation variants ──────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1] as [number, number, number],
      transition: { duration: 2, repeat: Infinity as number, ease: 'easeInOut' as const }
    }
  };
  const breakPulseVariants = {
    pulse: {
      scale: [1, 1.02, 1] as [number, number, number],
      boxShadow: [
        '0 0 0 0 rgba(245,164,44,0.4)',
        '0 0 0 20px rgba(245,164,44,0)',
        '0 0 0 0 rgba(245,164,44,0)'
      ] as string[],
      transition: { duration: 2, repeat: Infinity as number, ease: 'easeInOut' as const }
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border-l-4 ${
              notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
              notification.type === 'error'   ? 'bg-red-50 border-red-500 text-red-800' :
                                                'bg-blue-50 border-blue-500 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100 text-green-600' :
                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                notification.type === 'error'   ? 'bg-red-100 text-red-600' :
                                                  'bg-blue-100 text-blue-600'
              }`}>
                {notification.type === 'success' ? '✓' : notification.type === 'warning' ? '⚠' :
                 notification.type === 'error' ? '✗' : 'ℹ'}
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
          <span className="font-medium">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6">

        {/* ── Clock Card ── */}
        <motion.div variants={itemVariants}
          className="bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] rounded-2xl p-6 text-white overflow-hidden relative shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

              {/* Left: times + stats */}
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-bold mb-2">Today's Attendance</h3>
                <p className="text-white/90 text-lg">
                  {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <div className="flex flex-wrap items-center gap-6 mt-6">

                  {/* Clock In */}
                  <div className="text-center">
                    <p className="text-sm text-white/80">Clock In</p>
                    <p className="text-xl font-bold mt-1 whitespace-nowrap">
                      {todayAttendance?.checkIn ? formatTimeForDisplay(todayAttendance.checkIn) : '--:--'}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-white/30" />

                  {/* Clock Out */}
                  <div className="text-center">
                    <p className="text-sm text-white/80">Clock Out</p>
                    <p className="text-xl font-bold mt-1 whitespace-nowrap">
                      {todayAttendance?.checkOut ? formatTimeForDisplay(todayAttendance.checkOut) : '--:--'}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-white/30" />

                  {/* Break info */}
                  <div className="text-center">
                    <p className="text-sm text-white/80 flex items-center justify-center gap-1">
                      Break Time
                      {isOnBreak && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />}
                    </p>
                    <p className="text-xl font-bold mt-1 tabular-nums">
                      {getLiveBreakDisplay()}
                    </p>
                    <p className="text-xs text-white/70 mt-1">
                      {totalBreakCount > 0
                        ? `${totalBreakCount} break${totalBreakCount !== 1 ? 's' : ''} taken`
                        : 'No breaks taken'}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-white/30" />

                  {/* Working hours */}
                  <div className="text-center">
                    <p className="text-sm text-white/80 flex items-center justify-center gap-1">
                      Working Hours
                      {hasPunchedIn && !hasPunchedOut && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />}
                    </p>
                    <p className="text-xl font-bold mt-1 tabular-nums">
                      {getLiveWorkingDisplay()}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-white/30" />

                  {/* Status */}
                  <div className="text-center">
                    <p className="text-sm text-white/80">Status</p>
                    <p className="text-xl font-bold mt-1 capitalize">
                      {todayAttendance?.status
                        ? todayAttendance.status.replace('_', ' ')
                        : '--'}
                    </p>
                  </div>
                </div>

                {todayAttendance?.notes && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <p className="text-sm text-white/80 mb-1">Notes:</p>
                    <p className="text-white">{todayAttendance.notes}</p>
                  </div>
                )}
              </div>

              {/* Right: buttons */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  {/* Punch In */}
                  <motion.button
                    variants={pulseVariants} animate={canPunchIn ? 'pulse' : ''}
                    whileHover={{ scale: canPunchIn ? 1.05 : 1 }}
                    whileTap={{ scale: canPunchIn ? 0.95 : 1 }}
                    onClick={handlePunchIn}
                    disabled={!canPunchIn || isClocking || loading}
                    className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all ${
                      canPunchIn ? 'bg-white text-[#6B8DA2] hover:shadow-lg cursor-pointer'
                                 : 'bg-white/30 text-white/70 cursor-not-allowed'
                    }`}
                  >
                    {isClocking && canPunchIn
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-6 h-6 border-2 border-[#6B8DA2] border-t-transparent rounded-full" />
                      : <LogIn className="w-6 h-6" />}
                    {canPunchIn ? (isClocking ? 'Punching In…' : 'Punch In') : 'Already Punched In'}
                  </motion.button>

                  {/* Punch Out */}
                  <motion.button
                    whileHover={{ scale: canPunchOut && !isOnBreak ? 1.05 : 1 }}
                    whileTap={{ scale: canPunchOut && !isOnBreak ? 0.95 : 1 }}
                    onClick={handlePunchOut}
                    disabled={!canPunchOut || isClocking || loading || isOnBreak}
                    className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all ${
                      canPunchOut && !isOnBreak ? 'bg-white text-[#F5A42C] hover:shadow-lg cursor-pointer'
                                                : 'bg-white/30 text-white/70 cursor-not-allowed'
                    }`}
                  >
                    {isClocking && canPunchOut
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-6 h-6 border-2 border-[#F5A42C] border-t-transparent rounded-full" />
                      : <LogOut className="w-6 h-6" />}
                    {isOnBreak ? 'End Break First' : canPunchOut ? (isClocking ? 'Punching Out…' : 'Punch Out') : 'Punch Out'}
                  </motion.button>
                </div>

                {/* Break button */}
                <motion.button
                  variants={isBreakActive ? breakPulseVariants : {}}
                  animate={isBreakActive ? 'pulse' : ''}
                  whileHover={{ scale: canPunchOut ? 1.02 : 1 }}
                  whileTap={{ scale: canPunchOut ? 0.98 : 1 }}
                  onClick={handleTakeBreak}
                  disabled={!canPunchOut || loading}
                  className={`px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    canPunchOut
                      ? isBreakActive ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                                       : 'bg-white text-[#F5A42C] hover:bg-white/90 cursor-pointer'
                      : 'bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                >
                  {isBreakActive ? <><Coffee className="w-4 h-4" /> End Break</>
                                 : <><Clock className="w-4 h-4" /> Take a Break</>}
                </motion.button>
              </div>
            </div>

            {/* Status indicator */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-center justify-center">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                <motion.div
                  animate={workCompleted ? { scale: [1,1.2,1] } : isActive ? { scale: [1,1.1,1] } : isBreakActive ? { scale: [1,1.05,1] } : {}}
                  transition={{ repeat: (workCompleted || isActive || isBreakActive) ? Infinity : 0, duration: 2 }}
                  className={`w-3 h-3 rounded-full ${
                    workCompleted  ? 'bg-green-400 shadow-lg shadow-green-400/50' :
                    isBreakActive  ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' :
                    isActive       ? 'bg-blue-400 shadow-lg shadow-blue-400/50' :
                    canPunchOut    ? 'bg-orange-400 shadow-lg shadow-orange-400/50' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Calendar ── */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800 text-lg">Attendance Calendar</h3>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">{monthNames[currentMonth]} {currentYear}</span>
              <button onClick={nextMonth} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monthly stats */}
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
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
              <p className="text-sm text-orange-600">Total Break Time</p>
              <p className="text-2xl font-bold text-orange-700">{formatBreakDuration(monthData.totalMonthBreakMins)}</p>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
            {Array.from({ length: monthData.firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 bg-gray-50 rounded" />
            ))}
            {monthData.days.map(({ day, date, attendance: rec, isToday, isWeekend, status }) => {
              const breakMins  = rec?.breaks      || 0;
              const breakCount = rec?.breakCount  || 0;

              // Build tooltip with break count + duration
              const breakLine = breakMins > 0
                ? `Breaks: ${breakCount} time${breakCount !== 1 ? 's' : ''} (${formatBreakDuration(breakMins)})`
                : 'No breaks taken';

              const tooltip = rec
                ? `${date}: ${rec.status}\nIn: ${rec.checkIn ? formatTimeForDisplay(rec.checkIn) : '--'}\nOut: ${rec.checkOut ? formatTimeForDisplay(rec.checkOut) : '--'}\nHours: ${rec.totalHours || '--'}\n${breakLine}`
                : `${date}: No record`;

              return (
                <div
                  key={date}
                  title={tooltip}
                  className={`h-8 rounded flex items-center justify-center relative cursor-pointer transition-all hover:scale-105
                    ${getStatusColor(status, isWeekend)}
                    ${isToday ? 'ring-2 ring-[#6B8DA2] ring-offset-1' : ''}`}
                  onClick={() => {
                    if (rec) {
                      showMsg(
                        `${formatDateForDisplay(date)}: ${rec.status.replace('_',' ')}\nIn: ${rec.checkIn ? formatTimeForDisplay(rec.checkIn) : '--'} · Out: ${rec.checkOut ? formatTimeForDisplay(rec.checkOut) : '--'}\n${breakLine}`,
                        'info'
                      );
                    } else {
                      showMsg(`No attendance record for ${formatDateForDisplay(date)}`, 'info');
                    }
                  }}
                >
                  {day}
                  {rec?.checkIn && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  )}
                  {breakMins > 0 && (
                    <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-yellow-500 opacity-80"
                         title={breakLine} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600 mt-4">
            {[
              { color: 'bg-green-100 border-green-200',   label: 'Present'  },
              { color: 'bg-yellow-100 border-yellow-200', label: 'Late'     },
              { color: 'bg-red-100 border-red-200',       label: 'Absent'   },
              { color: 'bg-orange-100 border-orange-200', label: 'Half Day' },
              { color: 'bg-purple-100 border-purple-200', label: 'On Leave' },
              { color: 'bg-blue-100 border-blue-200',     label: 'Active'   },
              { color: 'bg-gray-100 border-gray-200',     label: 'No Record'},
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded border ${color}`} />
                {label}
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-80" />
              Break taken
            </div>
          </div>
        </motion.div>
      </div>

      <EmployeeKPIWidget employee={employee} />
    </motion.div>
  );
};

export default EmployeeDashboard;