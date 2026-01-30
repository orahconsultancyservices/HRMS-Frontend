import React, { useState, useEffect } from 'react';
import { demoEmployees } from '../../data/demoData';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Calendar, FileText, Check, X, Eye, Trash2, Clock, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// Add this import at the top of MyLeavesPage.tsx
import { leaveApi, employeeApi } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


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
  isHalfDay?: boolean;
  isPaid?: boolean;
  paidDays?: number;
}

interface Employee {
  empId: string;
  name: string;
  id?: number; // Add id for API calls
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
  isHalfDay: boolean;
  leaveDuration: 'fullDay' | 'halfDay';
}

const MyLeavesPage = ({ employee, leaveRequests, setLeaveRequests }: MyLeavesProps) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>({
    type: 'Paid',
    from: null,
    to: null,
    reason: '',
    isHalfDay: false,
    leaveDuration: 'fullDay'
  });
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);

  // Replace the useQuery block with this:

  const { data: leavesData, isLoading: isLoadingLeaves, refetch } = useQuery({
    queryKey: ['leaves', employee.empId],
    queryFn: async () => {
      try {
        console.log('📥 Fetching leaves for employee:', employee.empId);

        // If we have a numeric ID, use it directly
        if (employee.id && !isNaN(employee.id)) {
          const response = await leaveApi.getByEmployee(employee.id);
          console.log('✅ Leaves fetched via numeric ID:', response.data);
          return response.data;
        }

        // If we have employeeId string (like "EMP001"), find the numeric ID
        if (employee.empId) {
          try {
            // First, get all employees to find the matching one
            const employeesResponse = await employeeApi.getAll();
            const foundEmployee = employeesResponse.data?.find(
              (emp: any) => emp.employeeId === employee.empId || emp.id?.toString() === employee.empId
            );

            if (foundEmployee && foundEmployee.id) {
              const response = await leaveApi.getByEmployee(foundEmployee.id);
              console.log('✅ Leaves fetched via employee lookup:', response.data);
              return response.data;
            }
          } catch (employeeError) {
            console.warn('⚠️ Could not fetch employee list:', employeeError);
          }
        }

        console.log('⚠️ Using fallback: returning empty leaves array');
        return { success: true, data: [] };

      } catch (error) {
        console.error('❌ Error fetching leaves:', error);
        // Return empty array in consistent format
        return { success: false, data: [] };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Process the API response properly
  const myLeaves = React.useMemo(() => {
    if (leavesData?.success && Array.isArray(leavesData.data)) {
      return leavesData.data;
    }
    // Fallback to local data if API fails
    return leaveRequests.filter(l => l.empId === employee.empId);
  }, [leavesData, leaveRequests, employee.empId]);
  const emp = demoEmployees.find((e: any) => e.id === employee.empId) as DemoEmployee | undefined;

  // Add this utility function at the top of your component
  const getNumericEmployeeId = async () => {
    if (employee.id && !isNaN(employee.id)) return employee.id;

    try {
      const employeesResponse = await employeeApi.getAll();
      const foundEmployee = employeesResponse.data?.find(
        (emp: any) => emp.employeeId === employee.empId || emp.id?.toString() === employee.empId
      );
      return foundEmployee?.id || null;
    } catch (error) {
      console.error('Error fetching employee ID:', error);
      return null;
    }
  };

  // Use it in your component
  React.useEffect(() => {
    const fetchEmployeeId = async () => {
      if (!employee.id) {
        const numericId = await getNumericEmployeeId();
        if (numericId) {
          // Update employee object with numeric ID
          employee.id = numericId;
        }
      }
    };

    fetchEmployeeId();
  }, [employee.empId]);

  // Create leave mutation
  const createLeaveMutation = useMutation({
    mutationFn: async (leaveData: any) => {
      try {
        const response = await leaveApi.create(leaveData);
        return response.data;
      } catch (error: any) {
        console.error('Error creating leave:', error);
        throw new Error(error.response?.data?.message || 'Failed to create leave request');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', employee.empId] });
      setShowModal(false);
      setForm({
        type: 'Paid',
        from: null,
        to: null,
        reason: '',
        isHalfDay: false,
        leaveDuration: 'fullDay'
      });
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to create leave request');
    }
  });

  // Delete leave mutation
  const deleteLeaveMutation = useMutation({
    mutationFn: async (leaveId: number) => {
      try {
        await leaveApi.delete(leaveId);
      } catch (error: any) {
        console.error('Error deleting leave:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete leave request');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', employee.empId] });
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to delete leave request');
    }
  });

  const calculateDays = (from: Date, to: Date) => {
    // If it's the same day, return 1
    if (from.toDateString() === to.toDateString()) {
      return 1;
    }

    const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1; // +1 because both start and end days are included
  };

  // Add these utility functions at the top of your component
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDuration = (from: string, to: string, isHalfDay: boolean = false) => {
    if (isHalfDay) {
      return `${formatDate(from)} (Half Day)`;
    }

    const fromDate = formatDate(from);
    const toDate = formatDate(to);

    if (fromDate === toDate) {
      return `${fromDate} (1 day)`;
    }

    return `${fromDate} to ${toDate}`;
  };

  // Also add a function to calculate exact days
  const calculateExactDays = (from: string, to: string, isHalfDay: boolean) => {
    if (isHalfDay) return 0.5;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // If same day
    if (fromDate.toDateString() === toDate.toDateString()) return 1;

    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const renderLeaveDurationOptions = () => (
    <div className="mb-4">
      <label className="block text-gray-700 font-medium mb-2">Leave Duration</label>
      <div className="grid grid-cols-2 gap-3">
        {['fullDay', 'halfDay'].map((duration) => (
          <motion.button
            key={duration}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setForm({
              ...form,
              leaveDuration: duration as 'fullDay' | 'halfDay',
              isHalfDay: duration === 'halfDay'
            })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${form.leaveDuration === duration
              ? 'border-[#6B8DA2] bg-gradient-to-br from-[#6B8DA2]/10 to-[#F5A42C]/10'
              : 'border-gray-200 hover:border-[#6B8DA2]/50'
              }`}
          >
            <div className={`text-center font-medium ${form.leaveDuration === duration ? 'text-[#6B8DA2]' : 'text-gray-600'
              }`}>
              {duration === 'fullDay' ? 'Full Day' : 'Half Day'}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const calculatePaidLeaves = (joinDate: string) => {
    const join = new Date(joinDate);
    const now = new Date();
    const monthsWorked = (now.getFullYear() - join.getFullYear()) * 12 +
      (now.getMonth() - join.getMonth());
    return Math.max(0, monthsWorked);
  };

  // Updated handleSubmit function in MyLeavesPage.tsx
  // Properly handles 0.5 days for half-day leaves

  const handleSubmit = () => {
    console.log('Form data:', form);

    // Validate required fields
    if (!form.from || !form.reason.trim()) {
      alert('Please fill all required fields');
      return;
    }

    // Validate dates for full day leave
    if (!form.isHalfDay && !form.to) {
      alert('Please select an end date for full day leave');
      return;
    }

    // Calculate exact days (0.5 for half day, whole numbers for full days)
    const exactDays = form.isHalfDay ? 0.5 : calculateDays(form.from, form.to);

    // Auto-detect if this should be a paid leave
    const isPaidLeave = form.type === 'Paid';

    // Get numeric employee ID
    const getNumericEmployeeId = () => {
      if (employee.id && !isNaN(employee.id)) return employee.id;
      if (!isNaN(parseInt(employee.empId))) return parseInt(employee.empId);
      return null;
    };

    const numericEmpId = getNumericEmployeeId();

    if (!numericEmpId) {
      alert('Invalid employee ID');
      return;
    }

    const leaveData = {
      empId: numericEmpId,
      employeeId: numericEmpId,
      type: form.type,
      from: form.from.toISOString().split('T')[0],
      to: form.isHalfDay
        ? form.from.toISOString().split('T')[0]
        : form.to!.toISOString().split('T')[0],
      days: exactDays, // Can be 0.5, 1, 2, etc.
      reason: form.reason,
      isHalfDay: form.isHalfDay,
      isPaid: isPaidLeave,
      // For paid leaves, use the exact days (including 0.5 for half days)
      paidDays: isPaidLeave ? exactDays : 0,
      status: 'pending'
    };

    console.log('Submitting leave data:', leaveData);
    createLeaveMutation.mutate(leaveData);
  };

  const handleCancelLeave = (id: number) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      deleteLeaveMutation.mutate(id);
    }
  };

  const handleViewLeave = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setShowLeaveDetails(true);
  };

  // Animation variants
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

  const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', damping: 25 }
    },
    exit: { opacity: 0, scale: 0.9 }
  };

  const PaidLeaveCard = () => {
    const [paidLeaveBalance, setPaidLeaveBalance] = React.useState({
      earned: 0,
      consumed: 0,
      available: 0
    });

    const [appliedLeaves, setAppliedLeaves] = React.useState({
      pending: 0,
      approved: 0,
      total: 0
    });

    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const fetchPaidLeaveData = async () => {
        setIsLoading(true);
        try {
          console.log('🔍 Fetching paid leave balance for employee:', employee.empId);

          // Get numeric employee ID
          let numericId = employee.id;

          if (!numericId || isNaN(numericId)) {
            console.log('⚠️ No numeric ID found, trying to get it...');

            // Try to parse empId as number
            if (!isNaN(parseInt(employee.empId))) {
              numericId = parseInt(employee.empId);
            } else {
              // Fetch from employees API
              try {
                const employeesResponse = await employeeApi.getAll();
                const foundEmployee = employeesResponse.data?.find(
                  (emp: any) => emp.employeeId === employee.empId || emp.id?.toString() === employee.empId
                );

                if (foundEmployee && foundEmployee.id) {
                  numericId = foundEmployee.id;
                  console.log('✅ Found numeric ID:', numericId);
                }
              } catch (error) {
                console.error('❌ Error fetching employee list:', error);
              }
            }
          }

          if (numericId) {
            console.log('📥 Calling getPaidLeaveBalance API with ID:', numericId);

            // Fetch balance
            const response = await leaveApi.getPaidLeaveBalance(numericId);

            console.log('✅ Paid leave balance response:', response);

            if (response?.success && response?.data) {
              console.log('📊 Setting balance:', response.data);

              setPaidLeaveBalance({
                earned: response.data.earned || 0,
                consumed: response.data.consumed || 0,
                available: response.data.available || 0
              });
            } else {
              console.warn('⚠️ Invalid response format:', response);
            }

            // Calculate applied paid leaves from myLeaves
            const paidLeaves = myLeaves.filter(leave => leave.isPaid && leave.paidDays > 0);
            const pending = paidLeaves.filter(l => l.status === 'pending')
              .reduce((sum, l) => sum + (l.paidDays || 0), 0);
            const approved = paidLeaves.filter(l => l.status === 'approved')
              .reduce((sum, l) => sum + (l.paidDays || 0), 0);

            setAppliedLeaves({
              pending,
              approved,
              total: pending + approved
            });

            console.log('📋 Applied leaves:', { pending, approved });
          } else {
            console.error('❌ Could not determine numeric employee ID');
          }
        } catch (error) {
          console.error('❌ Error fetching paid leave data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPaidLeaveData();
    }, [employee.empId, employee.id, myLeaves]);

    // Format numbers to show decimals properly
    const formatDays = (value: number) => {
      if (value === 0) return '0';
      if (value % 1 === 0) return value.toString();
      return value.toFixed(1);
    };

    if (isLoading) {
      return (
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-gray-500 text-sm">Paid Leaves</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {formatDays(paidLeaveBalance.available)}
            </p>
            <div className="text-gray-400 text-sm mt-1">
              <p>Earned: {formatDays(paidLeaveBalance.earned)} {paidLeaveBalance.earned === 1 ? 'day' : 'days'}</p>
              <p>Used: {formatDays(paidLeaveBalance.consumed)} {paidLeaveBalance.consumed === 1 ? 'day' : 'days'}</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Check className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Applied Leaves Section */}
        {appliedLeaves.total > 0 && (
          <div className="pt-4 border-t border-green-200">
            <p className="text-xs text-gray-500 mb-2">Applied Leaves</p>
            <div className="flex gap-2 flex-wrap">
              {appliedLeaves.pending > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  Pending: {formatDays(appliedLeaves.pending)} {appliedLeaves.pending === 1 ? 'day' : 'days'}
                </span>
              )}
              {appliedLeaves.approved > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                  Approved: {formatDays(appliedLeaves.approved)} {appliedLeaves.approved === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const UnpaidLeaveCard = () => {
    const [appliedLeaves, setAppliedLeaves] = React.useState({
      pending: 0,
      approved: 0,
      total: 0
    });

    React.useEffect(() => {
      // Calculate unpaid leaves (including half days as 0.5)
      const unpaidLeaves = myLeaves.filter(leave =>
        !leave.isPaid || (leave.isPaid && leave.paidDays === 0)
      );

      const pending = unpaidLeaves.filter(l => l.status === 'pending')
        .reduce((sum, l) => sum + (l.isHalfDay ? 0.5 : l.days), 0);
      const approved = unpaidLeaves.filter(l => l.status === 'approved')
        .reduce((sum, l) => sum + (l.isHalfDay ? 0.5 : l.days), 0);

      setAppliedLeaves({
        pending,
        approved,
        total: pending + approved
      });
    }, [myLeaves]);

    return (
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-gray-500 text-sm">Unpaid Leaves</p>
            <p className="text-3xl font-bold text-red-600 mt-1">∞</p>
            <p className="text-gray-400 text-sm mt-1">Unlimited</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Applied Leaves Section */}
        {appliedLeaves.total > 0 && (
          <div className="pt-4 border-t border-red-200">
            <p className="text-xs text-gray-500 mb-2">Applied Leaves</p>
            <div className="flex gap-2 flex-wrap">
              {appliedLeaves.pending > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  Pending: {appliedLeaves.pending} {appliedLeaves.pending === 1 ? 'day' : 'days'}
                </span>
              )}
              {appliedLeaves.approved > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-200 text-red-800">
                  Approved: {appliedLeaves.approved} {appliedLeaves.approved === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Leave type options
  const leaveTypeOptions = ['Paid', 'Unpaid'];

  const renderStatusBadge = (leave: LeaveRequest) => {
    const formatDays = (value: number) => {
      if (value === 0) return '0';
      if (value % 1 === 0) return value.toString(); // Whole number
      return value.toFixed(1); // Show one decimal (e.g., 0.5, 1.5)
    };

    const getDayLabel = (value: number) => {
      return value === 1 ? 'day' : 'days';
    };

    if (leave.isPaid && leave.paidDays && leave.paidDays > 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Paid ({formatDays(leave.paidDays)} {getDayLabel(leave.paidDays)})
        </span>
      );
    }

    if (leave.isHalfDay) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          Half Day (0.5 day)
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Unpaid ({formatDays(leave.days)} {getDayLabel(leave.days)})
      </span>
    );
  };

  if (isLoadingLeaves) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8DA2]"></div>
      </div>
    );
  }

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

      {/* Leave Balance Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <PaidLeaveCard />
        <UnpaidLeaveCard />

      </motion.div>

      {/* Apply Leave Modal */}
      {/* Apply Leave Modal - Updated with better styling */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] bg-clip-text text-transparent">
                    Apply for Leave
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer hover:rotate-90 duration-300"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Leave Type Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <label className="block text-gray-700 font-medium mb-3 text-lg">
                    Leave Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {leaveTypeOptions.map((type) => (
                      <motion.button
                        key={type}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setForm({ ...form, type })}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${form.type === type
                            ? type === 'Paid'
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100'
                              : 'border-red-500 bg-gradient-to-br from-red-50 to-red-100'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.type === type
                                ? type === 'Paid'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-500'
                              }`}
                          >
                            {type === 'Paid' ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <AlertCircle className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className={`font-semibold ${form.type === type
                                ? type === 'Paid'
                                  ? 'text-green-700'
                                  : 'text-red-700'
                                : 'text-gray-600'
                              }`}
                          >
                            {type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {type === 'Paid' ? 'Deducts from balance' : 'No deduction'}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Leave Duration Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <label className="block text-gray-700 font-medium mb-3 text-lg">
                    Leave Duration
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['fullDay', 'halfDay'].map((duration) => (
                      <motion.button
                        key={duration}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          setForm({
                            ...form,
                            leaveDuration: duration as 'fullDay' | 'halfDay',
                            isHalfDay: duration === 'halfDay',
                          })
                        }
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${form.leaveDuration === duration
                            ? 'border-[#6B8DA2] bg-gradient-to-br from-[#6B8DA2]/10 to-[#F5A42C]/10'
                            : 'border-gray-200 hover:border-[#6B8DA2]/50 bg-white'
                          }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.leaveDuration === duration
                                ? 'bg-[#6B8DA2] text-white'
                                : 'bg-gray-100 text-gray-500'
                              }`}
                          >
                            <Clock className="w-4 h-4" />
                          </div>
                          <span
                            className={`font-semibold ${form.leaveDuration === duration
                                ? 'text-[#6B8DA2]'
                                : 'text-gray-600'
                              }`}
                          >
                            {duration === 'fullDay' ? 'Full Day' : 'Half Day'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {duration === 'fullDay' ? 'Full working day' : 'Half working day'}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Date Selection Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <label className="block text-gray-700 font-medium mb-3 text-lg">
                    {form.isHalfDay ? 'Select Date' : 'Select Date Range'}
                  </label>

                  {!form.isHalfDay ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-600 text-sm mb-2">From Date</label>
                        <div className="relative">
                          <DatePicker
                            selected={form.from}
                            onChange={(date: Date | null) => setForm({ ...form, from: date })}
                            selectsStart
                            startDate={form.from}
                            endDate={form.to}
                            minDate={new Date()}
                            dateFormat="MMMM d, yyyy"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 bg-white"
                            placeholderText="Select start date"
                            isClearable
                          />
                          <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-2">To Date</label>
                        <div className="relative">
                          <DatePicker
                            selected={form.to}
                            onChange={(date: Date | null) => setForm({ ...form, to: date })}
                            selectsEnd
                            startDate={form.from}
                            endDate={form.to}
                            minDate={form.from || new Date()}
                            dateFormat="MMMM d, yyyy"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 bg-white"
                            placeholderText="Select end date"
                            isClearable
                          />
                          <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Half Day Date</label>
                      <div className="relative">
                        <DatePicker
                          selected={form.from}
                          onChange={(date: Date | null) => setForm({ ...form, from: date })}
                          minDate={new Date()}
                          dateFormat="MMMM d, yyyy"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 bg-white"
                          placeholderText="Select date for half day leave"
                          isClearable
                        />
                        <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Days Calculation Section */}
                {form.from && !form.isHalfDay && form.to && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gradient-to-r ${form.type === 'Paid'
                        ? 'from-green-100 to-green-50 border-green-200'
                        : 'from-red-100 to-red-50 border-red-200'
                      } p-4 rounded-xl border`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600">Total Days</p>
                        <p
                          className={`text-2xl font-bold ${form.type === 'Paid'
                              ? 'bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent'
                              : 'bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent'
                            }`}
                        >
                          {calculateDays(form.from, form.to)} {calculateDays(form.from, form.to) === 1 ? 'day' : 'days'}
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

                {/* Half Day Indicator */}
                {form.isHalfDay && form.from && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-100 to-purple-50 p-4 rounded-xl border border-purple-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600">Half Day Leave</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                          0.5 day
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium text-gray-800">
                          {form.from.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Reason Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <label className="block text-gray-700 font-medium mb-3 text-lg">
                    Reason for Leave
                  </label>
                  <div className="relative">
                    <textarea
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20 bg-white"
                      placeholder="Please provide a detailed reason for your leave..."
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {form.reason.length}/500
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={createLeaveMutation.isPending}
                    className="flex-1 cursor-pointer px-6 py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    {createLeaveMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Leave Request'
                    )}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={createLeaveMutation.isPending}
                    className="px-6 cursor-pointer py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-50 text-lg"
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
      {/* Leave Details Modal - Beautified to match apply modal */}
      <AnimatePresence>
        {showLeaveDetails && selectedLeave && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] bg-clip-text text-transparent">
                    Leave Details
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLeaveDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer hover:rotate-90 duration-300"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Leave Type Card */}
                <div className={`p-4 rounded-xl border-2 ${selectedLeave.type === 'Paid'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100'
                    : 'border-red-500 bg-gradient-to-br from-red-50 to-red-100'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Leave Type</p>
                      <p className="font-bold text-lg text-gray-800">{selectedLeave.type}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedLeave.type === 'Paid'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                      }`}>
                      {selectedLeave.type === 'Paid' ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <AlertCircle className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                  {selectedLeave.isHalfDay && (
                    <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      <Clock className="w-3 h-3" />
                      Half Day Leave
                    </div>
                  )}
                </div>

                {/* Duration Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Duration</p>
                      <p className="font-bold text-lg text-gray-800">
                        {formatDuration(selectedLeave.from, selectedLeave.to, selectedLeave.isHalfDay)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Days and Paid Status Card */}
                <div className={`p-4 rounded-xl border-2 ${selectedLeave.isPaid && selectedLeave.paidDays && selectedLeave.paidDays > 0
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100'
                    : 'border-red-500 bg-gradient-to-br from-red-50 to-red-100'
                  }`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Total Days</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {calculateExactDays(selectedLeave.from, selectedLeave.to, selectedLeave.isHalfDay)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculateExactDays(selectedLeave.from, selectedLeave.to, selectedLeave.isHalfDay) === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Paid Status</p>
                      <div className="mt-1">
                        {renderStatusBadge(selectedLeave)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <p className="text-gray-600 text-sm mb-2">Reason</p>
                  <p className="font-medium text-gray-800 bg-white p-3 rounded-lg border border-gray-200">
                    {selectedLeave.reason}
                  </p>
                </div>

                {/* Status and Applied Date Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Status</p>
                      <span className={`mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${selectedLeave.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : selectedLeave.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {selectedLeave.status === 'approved' && <Check className="w-3 h-3" />}
                        {selectedLeave.status === 'rejected' && <X className="w-3 h-3" />}
                        {selectedLeave.status === 'pending' && <Clock className="w-3 h-3" />}
                        {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Applied On</p>
                      <p className="font-medium text-gray-800 mt-1">
                        {new Date(selectedLeave.appliedDate || selectedLeave.from).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLeaveDetails(false)}
                    className="w-full cursor-pointer py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-medium hover:from-gray-300 hover:to-gray-400 transition text-lg"
                  >
                    Close Details
                  </button>
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
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Paid/Unpaid</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Applied On</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Status</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-gray-500">No leave requests found</p>
                      <p className="text-sm text-gray-400 mt-1">Apply for your first leave!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {myLeaves.map((leave: LeaveRequest, index: number) => (
                    <motion.tr
                      key={leave.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-gray-100 hover:bg-gradient-to-r hover:from-[#6B8DA2]/5 hover:to-transparent"
                    >
                      {/* In the table row, update the type badge colors */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${leave.type === 'Paid' ? 'bg-green-100 text-green-700' :
                              leave.type === 'Unpaid' ? 'bg-red-100 text-red-700' :
                                // For historical types (Casual, Sick, Earned), show different colors
                                leave.type === 'Casual' ? 'bg-blue-100 text-blue-700' :
                                  leave.type === 'Sick' ? 'bg-orange-100 text-orange-700' :
                                    leave.type === 'Earned' ? 'bg-purple-100 text-purple-700' :
                                      'bg-gray-100 text-gray-700'
                            }`}>
                            {leave.type}
                          </span>
                          {leave.isHalfDay && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              Half Day
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatDuration(leave.from, leave.to, leave.isHalfDay)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {calculateExactDays(leave.from, leave.to, leave.isHalfDay)}
                            {calculateExactDays(leave.from, leave.to, leave.isHalfDay) === 1 ? ' day' : ' days'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {calculateExactDays(leave.from, leave.to, leave?.isHalfDay)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {calculateExactDays(leave.from, leave.to, leave?.isHalfDay) === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(leave)}
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
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
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