import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import UpcomingBirthdays from '../common/UpcomingBirthdays';
import { Calendar, Gift, RefreshCw, AlertCircle } from 'lucide-react';
import { useBirthdays } from '../../hooks/useBirthdaysQuery';

const BirthdaysPage = () => {
  const { data: employees, isLoading, isError, error, refetch } = useBirthdays();
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6A82]"></div>
        <p className="text-gray-600">Loading birthdays...</p>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error loading birthdays</p>
          <p className="text-gray-600 text-sm mb-4">
            {error instanceof Error ? error.message : 'Failed to fetch birthdays'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#4A6A82] text-white rounded-lg hover:bg-[#3A5A72] transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </motion.button>
        </div>
      </div>
    );
  }

  // Group birthdays by month
  const grouped = (employees || []).reduce((acc: Record<number, typeof employees>, emp) => {
    const dateStr = emp.birthday;
    if (!dateStr) return acc;

    let month: number;
    try {
      if (dateStr.includes('T')) {
        const date = new Date(dateStr);
        month = date.getMonth();
      } else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length >= 2) {
          month = parseInt(parts[1], 10) - 1;
        } else {
          return acc;
        }
      } else {
        const date = new Date(dateStr);
        month = date.getMonth();
      }

      if (isNaN(month) || month < 0 || month > 11) {
        console.warn('Invalid month for employee:', emp.name, 'date:', dateStr);
        return acc;
      }

      if (!acc[month]) acc[month] = [];
      acc[month].push(emp);
    } catch (error) {
      console.error('Error parsing date for employee:', emp.name, error);
    }

    return acc;
  }, {});

  const sortedMonths = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  const getDepartmentGradient = (department: string) => {
    const gradients = {
      'Engineering': 'from-[#6B8DA2] to-[#7A9DB2]',
      'Design': 'from-[#F5A42C] to-[#F5B53C]',
      'Marketing': 'from-[#6B8DA2] to-[#F5A42C]',
      'HR': 'from-[#5A7A8F] to-[#6B8DA2]',
      'Sales': 'from-[#F5A42C] to-[#F5C55C]',
      'Finance': 'from-[#5A7A8F] to-[#4A6A7F]',
      'Operations': 'from-[#6B8DA2] to-[#5A7A8F]',
      'default': 'from-[#6B8DA2] to-[#F5A42C]'
    };
    return gradients[department as keyof typeof gradients] || gradients.default;
  };

  const formatBirthdayDate = (birthdayStr: string) => {
    if (!birthdayStr) return 'Date not set';

    try {
      let date: Date;

      if (birthdayStr.includes('T')) {
        date = new Date(birthdayStr);
      } else if (birthdayStr.includes('-')) {
        const [year, month, day] = birthdayStr.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(birthdayStr);
      }

      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', birthdayStr, error);
      return 'Invalid Date';
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const monthCardVariants: Variants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
    hover: { scale: 1.02, transition: { type: 'spring', stiffness: 300 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Birthday Calendar</h1>
          <p className="text-gray-500">Celebrate birthdays with your colleagues</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-gray-600 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 px-4 py-2 rounded-xl border border-[#6B8DA2]/20">
            <Calendar className="w-5 h-5 text-[#6B8DA2]" />
            <span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => refetch()}
            className="p-2 bg-white rounded-lg border border-gray-200 hover:border-[#4A6A82] transition-colors"
            title="Refresh birthdays"
          >
            <RefreshCw className="w-5 h-5 text-[#4A6A82]" />
          </motion.button>
        </div>
      </motion.div>

      {/* Upcoming Birthdays Component */}
      <motion.div variants={itemVariants}>
        <UpcomingBirthdays />
      </motion.div>

      {/* All Birthdays by Month */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">All Birthdays by Month</h3>
              <p className="text-gray-500 text-sm">Complete list of birthdays throughout the year</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Total: {employees?.length || 0} employees
          </div>
        </div>

        {sortedMonths.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No birthday data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMonths.map((month) => {
              const monthEmployees = grouped[month];
              const currentMonth = new Date().getMonth();
              const isCurrentMonth = month === currentMonth;

              return (
                <motion.div
                  key={month}
                  variants={monthCardVariants}
                  whileHover="hover"
                  className={`p-4 rounded-xl border transition-all ${isCurrentMonth
                      ? 'bg-gradient-to-r from-[#6B8DA2]/5 to-[#F5A42C]/5 border-[#6B8DA2]/20 shadow-sm'
                      : 'bg-gray-50/50 border-gray-200 hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-semibold ${isCurrentMonth ? 'text-[#6B8DA2]' : 'text-gray-700'}`}>
                      {months[month]}
                      {isCurrentMonth && ' (Current)'}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isCurrentMonth
                        ? 'bg-[#4A6A82] text-white'
                        : 'bg-gray-200 text-gray-600'
                      }`}>
                      {monthEmployees.length} {monthEmployees.length === 1 ? 'birthday' : 'birthdays'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {monthEmployees
                      .sort((a, b) => {
                        const dateA = new Date(a.birthday);
                        const dateB = new Date(b.birthday);
                        return dateA.getDate() - dateB.getDate();
                      })
                      .map((emp) => {
                        const today = new Date();
                        const birthday = new Date(emp.birthday);
                        const isToday = birthday.getDate() === today.getDate() &&
                          birthday.getMonth() === today.getMonth();

                        return (
                          <motion.div
                            key={emp.id}
                            whileHover={{ x: 5 }}
                            className={`flex items-center gap-3 p-2 rounded-lg ${isToday
                                ? 'bg-gradient-to-r from-[#F5A42C]/10 to-[#F5A42C]/5 border border-[#F5A42C]/20'
                                : 'hover:bg-white'
                              }`}
                          >
                            <div className="relative">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r ${getDepartmentGradient(emp.department)}`}>
                                <span className="text-white font-semibold text-sm">{emp.avatar}</span>
                              </div>
                              {isToday && (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-[#F5A42C] rounded-full flex items-center justify-center"
                                >
                                  <span className="text-white text-xs">!</span>
                                </motion.div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium truncate ${isToday ? 'text-[#F5A42C]' : 'text-gray-800'}`}>
                                  {emp.name}
                                </p>
                                {isToday && (
                                  <span className="text-xs font-bold text-[#F5A42C] px-1.5 py-0.5 bg-[#F5A42C]/10 rounded">
                                    TODAY
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-gray-500 text-xs">{emp.department}</p>
                                <p className={`text-sm font-medium ${isToday ? 'text-[#F5A42C]' : 'text-gray-600'}`}>
                                  {formatBirthdayDate(emp.birthday)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Stats Footer */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-[#6B8DA2]">
            {Object.keys(grouped).reduce((sum, month) => sum + grouped[parseInt(month)].length, 0)}
          </div>
          <div className="text-sm text-gray-500">Total Birthdays</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-[#F5A42C]">
            {(employees || []).filter(emp => {
              const birthday = new Date(emp.birthday);
              return birthday.getMonth() === new Date().getMonth();
            }).length}
          </div>
          <div className="text-sm text-gray-500">This Month</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-[#5A7A8F]">
            {(employees || []).filter(emp => {
              const birthday = new Date(emp.birthday);
              const nextMonth = new Date().getMonth() + 1;
              return birthday.getMonth() === (nextMonth > 11 ? 0 : nextMonth);
            }).length}
          </div>
          <div className="text-sm text-gray-500">Next Month</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-green-600">
            {new Set((employees || []).map(emp => emp.department)).size}
          </div>
          <div className="text-sm text-gray-500">Departments</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BirthdaysPage;