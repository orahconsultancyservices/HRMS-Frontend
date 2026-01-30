import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, LogIn, LogOut, Coffee, Calendar, TrendingUp, MapPin, FileText } from 'lucide-react';

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  attendance: any;
  breaks: any[];
}

const AttendanceHistoryModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  attendance,
  breaks 
}: AttendanceHistoryModalProps) => {
  if (!isOpen) return null;

  const formatTime = (dateTime: string | null | undefined) => {
    if (!dateTime) return '--:--';
    try {
      return new Date(dateTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '--:--';
    }
  };

  const formatHours = (hours: number | null | undefined) => {
    if (!hours || hours === 0) return '--';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const formatBreakDuration = (minutes: number) => {
    if (!minutes || minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 border-green-300';
      case 'late': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'absent': return 'bg-red-100 text-red-700 border-red-300';
      case 'half_day': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'on_leave': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return '✓';
      case 'late': return '⚠';
      case 'absent': return '✗';
      case 'half_day': return '◐';
      case 'on_leave': return '🏖';
      default: return '?';
    }
  };

  const totalBreakTime = breaks
    ?.filter(brk => brk.status === 'completed')
    ?.reduce((sum, brk) => sum + (brk.duration || 0), 0) || 0;

  const dateObj = new Date(selectedDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Attendance Details</h2>
                </div>
                <p className="text-white/90">{formattedDate}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {attendance ? (
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold text-lg ${getStatusColor(attendance.status)}`}>
                    <span>{getStatusIcon(attendance.status)}</span>
                    {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1).replace('_', ' ')}
                  </span>
                  {attendance.totalHours && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <TrendingUp className="w-5 h-5 text-[#6B8DA2]" />
                      <span className="font-semibold text-lg">
                        {formatHours(attendance.totalHours)} worked
                      </span>
                    </div>
                  )}
                </div>

                {/* Time Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Check In */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Check In</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatTime(attendance.checkIn)}
                        </p>
                      </div>
                    </div>
                    {attendance.checkIn && (
                      <p className="text-xs text-green-600">
                        {new Date(attendance.checkIn).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </motion.div>

                  {/* Check Out */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <LogOut className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Check Out</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {formatTime(attendance.checkOut)}
                        </p>
                      </div>
                    </div>
                    {attendance.checkOut && (
                      <p className="text-xs text-orange-600">
                        {new Date(attendance.checkOut).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </motion.div>

                  {/* Total Hours */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Working Hours</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatHours(attendance.totalHours)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600">
                      Excluding break time
                    </p>
                  </motion.div>

                  {/* Break Time */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                        <Coffee className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Break Time</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {formatBreakDuration(totalBreakTime)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600">
                      {breaks?.length || 0} break(s) taken
                    </p>
                  </motion.div>
                </div>

                {/* Breaks Details */}
                {breaks && breaks.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-[#F5A42C]" />
                      Break Details
                    </h3>
                    <div className="space-y-3">
                      {breaks.map((breakItem: any, index: number) => (
                        <motion.div
                          key={breakItem.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-[#F5A42C] transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              breakItem.status === 'active' 
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
                                {formatTime(breakItem.startTime)}
                                {breakItem.endTime && ` - ${formatTime(breakItem.endTime)}`}
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
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attendance.location && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-[#6B8DA2]" />
                        <span className="font-medium text-gray-700">Location</span>
                      </div>
                      <p className="text-gray-600">{attendance.location}</p>
                    </div>
                  )}

                  {attendance.notes && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-[#6B8DA2]" />
                        <span className="font-medium text-gray-700">Notes</span>
                      </div>
                      <p className="text-gray-600">{attendance.notes}</p>
                    </div>
                  )}
                </div>

                {/* Timeline View */}
                {attendance.checkIn && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">Timeline</h3>
                    <div className="relative pl-8 space-y-4">
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-green-400 via-purple-400 to-orange-400"></div>
                      
                      <div className="relative">
                        <div className="absolute -left-6 w-4 h-4 bg-green-500 rounded-full ring-4 ring-white"></div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <p className="font-medium text-gray-800">Checked In</p>
                          <p className="text-sm text-gray-600">{formatTime(attendance.checkIn)}</p>
                        </div>
                      </div>

                      {breaks?.map((brk: any, idx: number) => (
                        <div key={brk.id} className="relative">
                          <div className="absolute -left-6 w-4 h-4 bg-purple-500 rounded-full ring-4 ring-white"></div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="font-medium text-gray-800">Break {idx + 1}</p>
                            <p className="text-sm text-gray-600">
                              {formatTime(brk.startTime)} - {formatTime(brk.endTime)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {attendance.checkOut && (
                        <div className="relative">
                          <div className="absolute -left-6 w-4 h-4 bg-orange-500 rounded-full ring-4 ring-white"></div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="font-medium text-gray-800">Checked Out</p>
                            <p className="text-sm text-gray-600">{formatTime(attendance.checkOut)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Attendance Record
                </h3>
                <p className="text-gray-500">
                  No attendance data found for this date
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white font-medium rounded-xl hover:shadow-lg transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AttendanceHistoryModal;