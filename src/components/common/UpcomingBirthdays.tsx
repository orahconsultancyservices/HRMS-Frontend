import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Gift, Calendar, ChevronLeft, ChevronRight,
  Cake, Crown, Search
} from 'lucide-react';
import { useBirthdays } from '../../hooks/useBirthdaysQuery';

interface EmployeeWithBirthday {
  id: string;
  name: string;
  avatar: string;
  department: string;
  position: string;
  birthday: string;
  birthMonth: number;
  birthDay: number;
  formattedDate: string;
}

const UpcomingBirthdays = () => {
  const { data: employees, isLoading, isError } = useBirthdays();
  const [viewMode, setViewMode] = useState('upcoming');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentYear] = useState(new Date().getFullYear());

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const getBirthdayMonthDate = (birthdayStr: string) => {
    if (!birthdayStr) {
      return { month: 0, date: 1 };
    }

    const parts = birthdayStr.split('-');
    if (parts.length < 3) {
      return { month: 0, date: 1 };
    }

    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    return {
      month: isNaN(month) ? 0 : month,
      date: isNaN(day) ? 1 : day
    };
  };

  const formatDateWithoutTimezone = (year: number, month: number, day: number) => {
    const validMonth = month >= 0 && month <= 11 ? month : 0;
    const validDay = day >= 1 && day <= 31 ? day : 1;

    const date = new Date(year, validMonth, validDay);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const monthCardVariants: Variants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
    hover: { scale: 1.05, transition: { type: 'spring', stiffness: 300 } }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white to-[#4A6A82]/10 rounded-2xl p-6 shadow-lg border border-[#4A6A82]/20">
        <div className="flex items-center justify-center h-48 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A6A82]"></div>
          <p className="text-gray-600">Loading birthdays...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="bg-gradient-to-br from-white to-[#4A6A82]/10 rounded-2xl p-6 shadow-lg border border-[#4A6A82]/20">
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <Gift className="w-12 h-12 text-gray-300" />
          <p className="text-gray-600">Unable to load birthdays</p>
        </div>
      </div>
    );
  }

  const employeesList = employees || [];

  // Group birthdays by month
  const birthdaysByMonth = employeesList.reduce((acc: EmployeeWithBirthday[][], emp) => {
    const bdayInfo = getBirthdayMonthDate(emp.birthday);
    const month = bdayInfo.month;
    if (!acc[month]) acc[month] = [];
    acc[month].push({
      ...emp,
      birthMonth: bdayInfo.month,
      birthDay: bdayInfo.date,
      formattedDate: formatDateWithoutTimezone(currentYear, bdayInfo.month, bdayInfo.date)
    });
    return acc;
  }, Array.from({ length: 12 }, () => []));

  birthdaysByMonth.forEach((month: EmployeeWithBirthday[]) => {
    month.sort((a, b) => a.birthDay - b.birthDay);
  });

  // Filter upcoming birthdays
  const upcomingBirthdays = employeesList
    .map((emp) => {
      const bdayInfo = getBirthdayMonthDate(emp.birthday);
      const currentYearBday = new Date(todayYear, bdayInfo.month, bdayInfo.date);
      const todayDateObj = new Date(todayYear, todayMonth, todayDate);

      let nextBday = currentYearBday;
      if (currentYearBday < todayDateObj) {
        nextBday = new Date(todayYear + 1, bdayInfo.month, bdayInfo.date);
      }

      const diff = Math.ceil((nextBday.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
      const isToday = bdayInfo.month === todayMonth && bdayInfo.date === todayDate;

      return {
        ...emp,
        daysUntil: diff,
        nextBirthday: nextBday,
        isToday: isToday,
        birthMonth: bdayInfo.month,
        birthDay: bdayInfo.date,
        displayDate: formatDateWithoutTimezone(nextBday.getFullYear(), bdayInfo.month, bdayInfo.date)
      };
    })
    .filter((emp) => emp.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 10);

  const todaysBirthdays = employeesList.filter((emp) => {
    const bdayInfo = getBirthdayMonthDate(emp.birthday);
    return bdayInfo.month === todayMonth && bdayInfo.date === todayDate;
  });

  const filteredBirthdays = upcomingBirthdays.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMonthName = (monthIndex: number) => {
    return new Date(2000, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const getCelebrationEmoji = (daysUntil: number, isToday: boolean) => {
    if (isToday) return '🎉🎂';
    if (daysUntil === 0) return '🎉';
    if (daysUntil === 1) return '🎂';
    if (daysUntil <= 3) return '🥳';
    if (daysUntil <= 7) return '🎊';
    return '🎁';
  };

  const getDepartmentGradient = (department: string) => {
    const gradients: Record<string, string> = {
      'Engineering': 'from-[#4A6A82] to-[#7A9DB2]',
      'Design': 'from-[#F5A42C] to-[#F5B53C]',
      'Marketing': 'from-[#4A6A82] to-[#F5A42C]',
      'HR': 'from-[#5A7A8F] to-[#4A6A82]',
      'Sales': 'from-[#F5A42C] to-[#F5C55C]',
      'Finance': 'from-[#5A7A8F] to-[#4A6A7F]',
      'Operations': 'from-[#4A6A82] to-[#5A7A8F]',
      'default': 'from-[#4A6A82] to-[#F5A42C]'
    };
    return gradients[department] || gradients.default;
  };

  const hasTodaysBirthdays = todaysBirthdays.length > 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-gradient-to-br from-white to-[#4A6A82]/10 rounded-2xl p-6 shadow-lg border border-[#4A6A82]/20 relative"
    >
      {hasTodaysBirthdays && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4A6A82] to-[#F5A42C] text-white px-6 py-2 rounded-full shadow-lg z-10"
        >
          <div className="flex items-center gap-2">
            <Cake className="w-4 h-4" />
            <span className="font-bold">🎉 {todaysBirthdays.length} Birthday{todaysBirthdays.length > 1 ? 's' : ''} Today! 🎉</span>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-[#F5A42C] to-[#F5A42C] rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            {hasTodaysBirthdays && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-2 -right-2"
              >
                <Crown className="w-6 h-6 text-[#F5A42C]" />
              </motion.div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Birthday Calendar</h1>
            <p className="text-gray-600">
              {hasTodaysBirthdays
                ? `Celebrating ${todaysBirthdays.length} birthday${todaysBirthdays.length > 1 ? 's' : ''} today!`
                : 'Celebrate with your colleagues'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search birthdays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#4A6A82]"
            />
          </div>
          <div className="flex border border-gray-300 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-4 py-2 cursor-pointer ${viewMode === 'upcoming' ? 'bg-[#4A6A82] text-white' : 'text-gray-700'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 cursor-pointer ${viewMode === 'monthly' ? 'bg-[#4A6A82] text-white' : 'text-gray-700'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-4 py-2 cursor-pointer ${viewMode === 'yearly' ? 'bg-[#4A6A82] text-white' : 'text-gray-700'}`}
            >
              Yearly
            </button>
          </div>
        </div>
      </motion.div>

      {hasTodaysBirthdays && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-gradient-to-r from-[#4A6A82]/10 to-[#F5A42C]/10 rounded-xl p-4 border border-[#4A6A82]/20"
        >
          <h3 className="font-semibold text-lg text-[#4A6A82] mb-3 flex items-center gap-2">
            <Cake className="w-5 h-5" />
            🎂 Today's Birthday Stars! 🎂
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todaysBirthdays.map((emp, index) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-300 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r ${getDepartmentGradient(emp.department)}`}>
                    <span className="text-white font-bold">{emp.avatar}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{emp.name}</p>
                    <p className="text-gray-600 text-sm">{emp.department} • {emp.position}</p>
                  </div>
                  <div className="ml-auto text-3xl">🎉</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'upcoming' && (
          <motion.div
            key="upcoming"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4A6A82]" />
                Next 30 Days
              </div>
              <span className="text-sm text-gray-600">
                {filteredBirthdays.length} {filteredBirthdays.length === 1 ? 'birthday' : 'birthdays'}
              </span>
            </div>

            {filteredBirthdays.length === 0 ? (
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-300 text-center"
              >
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No upcoming birthdays found</p>
                <p className="text-gray-600 text-sm mt-1">Try searching for a different name</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredBirthdays.map((emp: any) => (
                  <motion.div
                    key={emp.id}
                    variants={itemVariants}
                    whileHover={{ x: 5 }}
                    className={`bg-white rounded-xl p-4 border transition-all cursor-pointer ${emp.isToday
                      ? 'border-[#F5A42C] bg-gradient-to-r from-[#F5A42C]/10 to-[#F5A42C]/5 shadow-md'
                      : 'border-gray-200 hover:border-[#4A6A82] hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${getDepartmentGradient(emp.department)}`}>
                            <span className="text-white font-bold text-sm">{emp.avatar}</span>
                          </div>
                          {emp.isToday && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute -top-1 -right-1"
                            >
                              <Crown className="w-5 h-5 text-[#F5A42C]" />
                            </motion.div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${emp.isToday ? 'text-[#F5A42C]' : 'text-gray-800'}`}>
                              {emp.name}
                            </p>
                            {emp.daysUntil <= 7 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${emp.isToday
                                ? 'bg-[#F5A42C] text-white font-bold'
                                : 'bg-[#4A6A82]/10 text-[#4A6A82]'
                                }`}>
                                {emp.isToday ? 'TODAY 🎂' : 'SOON'}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">{emp.department} • {emp.position}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-2xl">
                            {getCelebrationEmoji(emp.daysUntil, emp.isToday)}
                          </span>
                          <div>
                            <p className={`font-bold ${emp.isToday ? 'text-[#F5A42C]' : 'text-gray-800'}`}>
                              {emp.isToday ? (
                                <span className="text-[#F5A42C]">Today! 🎂🎉</span>
                              ) : emp.daysUntil === 1 ? (
                                <span className="text-[#4A6A82]">Tomorrow</span>
                              ) : (
                                `In ${emp.daysUntil} days`
                              )}
                            </p>
                            <p className="text-gray-600 text-sm">{emp.displayDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {emp.daysUntil <= 7 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - (emp.daysUntil / 7 * 100)}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`mt-3 h-2 rounded-full overflow-hidden ${emp.isToday
                          ? 'bg-gradient-to-r from-[#F5A42C] to-[#F5A42C]/80'
                          : 'bg-gradient-to-r from-[#4A6A82] to-[#F5A42C]'
                          }`}
                      >
                        <motion.div
                          animate={{ x: [-100, 100] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="h-full w-4 bg-white/30"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {viewMode === 'monthly' && (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-[#4A6A82]/10 to-[#F5A42C]/10 p-4 rounded-xl border border-[#4A6A82]/20">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedMonth(prev => (prev - 1 + 12) % 12)}
                className="p-2 hover:bg-white rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-[#4A6A82]" />
              </motion.button>
              <h4 className="font-bold text-xl text-gray-800">
                {getMonthName(selectedMonth)} {currentYear}
              </h4>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedMonth(prev => (prev + 1) % 12)}
                className="p-2 hover:bg-white rounded-lg cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 text-[#4A6A82]" />
              </motion.button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-gray-600 text-sm font-medium">
                  {day}
                </div>
              ))}
              {Array.from({ length: 31 }).map((_, day) => {
                const dayNumber = day + 1;
                const hasBirthday = birthdaysByMonth[selectedMonth].some(
                  (emp: EmployeeWithBirthday) => emp.birthDay === dayNumber
                );
                const birthdayEmps = birthdaysByMonth[selectedMonth].filter(
                  (emp: EmployeeWithBirthday) => emp.birthDay === dayNumber
                );
                const isToday = selectedMonth === todayMonth && dayNumber === todayDate;

                return (
                  <motion.div
                    key={day}
                    variants={monthCardVariants}
                    whileHover="hover"
                    className={`min-h-[60px] p-2 rounded-lg border cursor-pointer ${isToday
                      ? 'bg-gradient-to-br from-[#F5A42C]/20 to-[#F5A42C]/10 border-[#F5A42C] ring-1 ring-[#F5A42C]/20'
                      : hasBirthday
                        ? 'bg-gradient-to-br from-[#4A6A82]/10 to-[#F5A42C]/5 border-[#4A6A82]/20'
                        : 'bg-white border-gray-200'
                      } ${isToday ? 'relative' : ''}`}
                  >
                    {isToday && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#F5A42C] rounded-full"></div>
                    )}
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[#F5A42C] font-bold' : 'text-gray-700'}`}>
                      {dayNumber}
                      {isToday && ' 📌'}
                    </div>
                    {hasBirthday && (
                      <div className="space-y-1">
                        {birthdayEmps.slice(0, 2).map((emp: EmployeeWithBirthday) => {
                          const isTodayBirthday = selectedMonth === todayMonth && dayNumber === todayDate;
                          return (
                            <div key={emp.id} className="flex items-center gap-1">
                              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getDepartmentGradient(emp.department)}`} />
                              <span className={`text-xs ${isTodayBirthday ? 'font-bold text-[#F5A42C]' : 'text-gray-600'} truncate`}>
                                {emp.name.split(' ')[0]}
                              </span>
                            </div>
                          );
                        })}
                        {birthdayEmps.length > 2 && (
                          <div className="text-xs text-gray-600">+{birthdayEmps.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {viewMode === 'yearly' && (
          <motion.div
            key="yearly"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h4 className="font-bold text-lg text-gray-800 mb-4 text-center">
              {currentYear} Birthday Calendar
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {birthdaysByMonth.map((monthBirthdays: EmployeeWithBirthday[], monthIndex: number) => (
                <motion.div
                  key={monthIndex}
                  variants={monthCardVariants}
                  whileHover="hover"
                  onClick={() => {
                    setSelectedMonth(monthIndex);
                    setViewMode('monthly');
                  }}
                  className={`bg-white rounded-xl p-3 border transition-all ${monthIndex === todayMonth
                    ? 'border-[#4A6A82] shadow-md'
                    : 'border-gray-200 hover:border-[#4A6A82] hover:shadow-md'
                    } cursor-pointer`}
                >
                  <div className="text-center mb-2">
                    <div className={`text-sm font-semibold ${monthIndex === todayMonth ? 'text-[#4A6A82]' : 'text-gray-700'}`}>
                      {getMonthName(monthIndex).substring(0, 3)}
                      {monthIndex === todayMonth && ' 📅'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {monthBirthdays.length} {monthBirthdays.length === 1 ? 'birthday' : 'birthdays'}
                    </div>
                  </div>

                  {monthBirthdays.length > 0 ? (
                    <div className="space-y-2">
                      {monthBirthdays.slice(0, 3).map((emp: EmployeeWithBirthday) => {
                        const isTodayBirthday = monthIndex === todayMonth && emp.birthDay === todayDate;
                        return (
                          <div key={emp.id} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getDepartmentGradient(emp.department)}`} />
                            <div className={`text-xs ${isTodayBirthday ? 'font-bold text-[#F5A42C]' : 'text-gray-600'} truncate`}>
                              {emp.name.split(' ')[0]}
                            </div>
                            <div className={`text-xs ${isTodayBirthday ? 'font-bold' : 'text-gray-600'}`}>
                              {emp.formattedDate}
                            </div>
                          </div>
                        );
                      })}
                      {monthBirthdays.length > 3 && (
                        <div className="text-xs text-gray-600 text-center">
                          +{monthBirthdays.length - 3} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="text-center py-3"
                    >
                      <Cake className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">No birthdays</div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Section */}
      <motion.div
        variants={itemVariants}
        className="mt-6 pt-4 border-t border-gray-200"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-300 text-center"
          >
            <div className="text-2xl font-bold text-[#F5A42C]">
              {todaysBirthdays.length}
            </div>
            <div className="text-sm text-gray-600">Today's Birthdays</div>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-300 text-center"
          >
            <div className="text-2xl font-bold text-[#4A6A82]">
              {upcomingBirthdays.filter((emp: any) => emp.daysUntil <= 7 && emp.daysUntil > 0).length}
            </div>
            <div className="text-sm text-gray-600">Next 7 Days</div>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-300 text-center"
          >
            <div className="text-2xl font-bold text-[#5A7A8F]">
              {employeesList.filter((emp) => {
                const bdayInfo = getBirthdayMonthDate(emp.birthday);
                return bdayInfo.month === todayMonth;
              }).length}
            </div>
            <div className="text-sm text-gray-600">This Month</div>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-300 text-center"
          >
            <div className="text-2xl font-bold text-green-600">
              {employeesList.length}
            </div>
            <div className="text-sm text-gray-600">Total Employees</div>
          </motion.div>
        </div>
      </motion.div>

      {/* Confetti Animation for Today's Birthdays */}
      {hasTodaysBirthdays && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100],
                rotate: [0, 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 3,
              }}
            >
              {['🎉', '🎊', '🎂', '🥳', '✨', '🌟', '⭐'][i % 7]}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default UpcomingBirthdays;