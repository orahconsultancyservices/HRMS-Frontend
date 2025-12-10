import { useState } from 'react';
import { demoEmployees } from '../../data/demoData';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, FileText, Check, X, Eye, Trash2, Clock, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Define types
interface LeaveRequest {
  id: number;
  empId: string;
  empName: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate?: string;
}

interface Employee {
  empId: string;
  name: string;
}

interface LeaveBalance {
  casual: number;
  sick: number;
  earned: number;
}

interface DemoEmployee {
  id: string;
  name: string;
  leaveBalance: LeaveBalance;
}

interface MyLeavesProps {
  employee: Employee;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
}

interface FormState {
  type: string;
  from: Date | null;
  to: Date | null;
  reason: string;
}

const MyLeavesPage = ({ employee, leaveRequests, setLeaveRequests }: MyLeavesProps) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>({ 
    type: 'Casual', 
    from: null, 
    to: null, 
    reason: '' 
  });
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);
  
  const myLeaves = leaveRequests.filter((l) => l.empId === employee.empId);
  const emp = demoEmployees.find(e => e.id === employee.empId) as DemoEmployee | undefined;

  const calculateDays = (from: Date, to: Date) => {
    const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

  const handleSubmit = () => {
    if (!form.from || !form.to || !form.reason.trim()) {
      alert('Please fill all fields');
      return;
    }

    const days = calculateDays(form.from, form.to);
    const newLeave: LeaveRequest = { 
      id: Date.now(), 
      empId: employee.empId, 
      empName: employee.name, 
      type: form.type, 
      from: form.from.toISOString().split('T')[0], 
      to: form.to.toISOString().split('T')[0], 
      days, 
      reason: form.reason, 
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };
    
    setLeaveRequests((prev) => [...prev, newLeave]);
    setShowModal(false);
    setForm({ type: 'Casual', from: null, to: null, reason: '' });
  };

  const handleCancelLeave = (id: number) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      setLeaveRequests((prev) => prev.filter((leave) => leave.id !== id));
    }
  };

  const handleViewLeave = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setShowLeaveDetails(true);
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

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', damping: 25 }
    },
    exit: { opacity: 0, scale: 0.9 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Leaves</h2>
          <p className="text-gray-500">Manage your leave requests and balances</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="px-6 py-3 cursor-pointer bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition"
        >
          <Calendar className="w-5 h-5" />
          Apply Leave
        </motion.button>
      </motion.div>

      {/* Leave Balance Cards with Animation */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-[#6B8DA2] rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Casual Leave</p>
              <p className="text-3xl font-bold text-[#6B8DA2] mt-1">{emp?.leaveBalance.casual || 0}</p>
              <p className="text-gray-400 text-sm mt-1">Days Available</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#6B8DA2] to-[#7A9DB2] rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-[#F5A42C] rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Sick Leave</p>
              <p className="text-3xl font-bold text-[#F5A42C] mt-1">{emp?.leaveBalance.sick || 0}</p>
              <p className="text-gray-400 text-sm mt-1">Days Available</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#F5A42C] to-[#F5B53C] rounded-xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-[#5A7A8F] rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Earned Leave</p>
              <p className="text-3xl font-bold text-[#5A7A8F] mt-1">{emp?.leaveBalance.earned || 0}</p>
              <p className="text-gray-400 text-sm mt-1">Days Available</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#5A7A8F] to-[#6A8A9F] rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-[#6B8DA2]" />
                  Apply for Leave
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Leave Type */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Leave Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Casual', 'Sick', 'Earned'].map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setForm({...form, type})}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          form.type === type 
                            ? 'border-[#6B8DA2] bg-gradient-to-br from-[#6B8DA2]/10 to-[#F5A42C]/10' 
                            : 'border-gray-200 hover:border-[#6B8DA2]/50'
                        }`}
                      >
                        <div className={`text-center font-medium ${
                          form.type === type ? 'text-[#6B8DA2]' : 'text-gray-600'
                        }`}>
                          {type}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Date Range Picker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">From Date</label>
                    <div className="relative">
                      <DatePicker
                        selected={form.from}
                        onChange={(date: Date | null) => setForm({...form, from: date})}
                        selectsStart
                        startDate={form.from}
                        endDate={form.to}
                        minDate={new Date()}
                        dateFormat="MMMM d, yyyy"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                        placeholderText="Select start date"
                      />
                      <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">To Date</label>
                    <div className="relative">
                      <DatePicker
                        selected={form.to}
                        onChange={(date: Date | null) => setForm({...form, to: date})}
                        selectsEnd
                        startDate={form.from}
                        endDate={form.to}
                        minDate={form.from || new Date()}
                        dateFormat="MMMM d, yyyy"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                        placeholderText="Select end date"
                      />
                      <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Days Calculation */}
                {form.from && form.to && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 p-4 rounded-xl border border-[#6B8DA2]/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600">Total Days</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] bg-clip-text text-transparent">
                          {calculateDays(form.from, form.to)} days
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600">Date Range</p>
                        <p className="font-medium text-gray-800">
                          {form.from.toLocaleDateString()} - {form.to.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Reason</label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({...form, reason: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                    placeholder="Please provide a reason for your leave..."
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    className="flex-1 cursor-pointer px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold hover:shadow-lg transition"
                  >
                    Submit Leave Request
                  </motion.button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 cursor-pointer py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Details Modal */}
      <AnimatePresence>
        {showLeaveDetails && selectedLeave && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Leave Details</h3>
                <button 
                  onClick={() => setShowLeaveDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <p className="text-gray-600 text-sm">Type</p>
                  <p className="font-medium text-gray-800">{selectedLeave.type}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <p className="text-gray-600 text-sm">Duration</p>
                  <p className="font-medium text-gray-800">{selectedLeave.from} to {selectedLeave.to}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <p className="text-gray-600 text-sm">Total Days</p>
                  <p className="font-medium text-gray-800">{selectedLeave.days} days</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <p className="text-gray-600 text-sm">Reason</p>
                  <p className="font-medium text-gray-800">{selectedLeave.reason}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <p className="text-gray-600 text-sm">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedLeave.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    selectedLeave.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedLeave.status}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Requests Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#6B8DA2]/5 to-[#F5A42C]/5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#6B8DA2]" />
            Leave History
          </h3>
          <p className="text-gray-500 text-sm mt-1">All your leave requests and their status</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Type</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Duration</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Days</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Applied On</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Status</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-gray-500">No leave requests found</p>
                      <p className="text-sm text-gray-400 mt-1">Apply for your first leave!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {myLeaves.map((leave, index) => (
                    <motion.tr 
                      key={leave.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-gray-100 hover:bg-gradient-to-r hover:from-[#6B8DA2]/5 hover:to-transparent"
                    >
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          leave.type === 'Casual' ? 'bg-blue-100 text-blue-700' :
                          leave.type === 'Sick' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {leave.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-medium">{leave.from}</span>
                          <span className="text-xs text-gray-400">to {leave.to}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{leave.days}</span>
                          <span className="text-gray-400 text-sm">days</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(leave.appliedDate || leave.from).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <motion.span 
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                            leave.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {leave.status === 'approved' && <Check className="w-3 h-3" />}
                          {leave.status === 'rejected' && <X className="w-3 h-3" />}
                          {leave.status === 'pending' && <Clock className="w-3 h-3" />}
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewLeave(leave)}
                            className="p-2 text-[#6B8DA2] cursor-pointer hover:bg-[#6B8DA2]/10 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          
                          {leave.status === 'pending' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleCancelLeave(leave.id)}
                              className="p-2 cursor-pointer text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Cancel Leave"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>  
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MyLeavesPage;