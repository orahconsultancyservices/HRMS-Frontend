import React, { useState, useEffect } from 'react';
import { demoEmployees } from '../../data/demoData';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Calendar, FileText, Check, X, Eye, Trash2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
  id?: number;
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

  // Fetch leaves with proper refetch intervals
  const { data: leavesData, isLoading: isLoadingLeaves, refetch } = useQuery({
    queryKey: ['leaves', employee.empId],
    queryFn: async () => {
      try {
        console.log('📥 Fetching leaves for employee:', employee.empId);

        if (employee.id && !isNaN(employee.id)) {
          const response = await leaveApi.getByEmployee(employee.id);
          console.log('✅ Leaves fetched via numeric ID:', response.data);
          return response.data;
        }

        if (employee.empId) {
          try {
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
        return { success: false, data: [] };
      }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const myLeaves = React.useMemo(() => {
    if (leavesData?.success && Array.isArray(leavesData.data)) {
      return leavesData.data;
    }
    return leaveRequests.filter(l => l.empId === employee.empId);
  }, [leavesData, leaveRequests, employee.empId]);

  const emp = demoEmployees.find((e: any) => e.id === employee.empId) as DemoEmployee | undefined;

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

  React.useEffect(() => {
    const fetchEmployeeId = async () => {
      if (!employee.id) {
        const numericId = await getNumericEmployeeId();
        if (numericId) {
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
      queryClient.invalidateQueries({ queryKey: ['paidLeaveBalance', employee.empId] });
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
      queryClient.invalidateQueries({ queryKey: ['paidLeaveBalance', employee.empId] });
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to delete leave request');
    }
  });

  const calculateDays = (from: Date, to: Date) => {
    if (from.toDateString() === to.toDateString()) {
      return 1;
    }

    const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

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

  const calculateExactDays = (from: string, to: string, isHalfDay: boolean) => {
    if (isHalfDay) return 0.5;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate.toDateString() === toDate.toDateString()) return 1;

    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = () => {
    console.log('Form data:', form);

    if (!form.from || !form.reason.trim()) {
      alert('Please fill all required fields');
      return;
    }

    if (!form.isHalfDay && !form.to) {
      alert('Please select an end date for full day leave');
      return;
    }

    const exactDays = form.isHalfDay ? 0.5 : calculateDays(form.from, form.to!);
    const isPaidLeave = form.type === 'Paid';

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
      days: exactDays,
      reason: form.reason,
      isHalfDay: form.isHalfDay,
      isPaid: isPaidLeave,
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

  // FIXED: Paid Leave Card with proper balance calculation
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

          let numericId = employee.id;

          if (!numericId || isNaN(numericId)) {
            console.log('⚠️ No numeric ID found, trying to get it...');

            if (!isNaN(parseInt(employee.empId))) {
              numericId = parseInt(employee.empId);
            } else {
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

            // FIXED: Calculate applied paid leaves correctly
            // Only approved leaves reduce the balance
            // Pending leaves show in UI but don't affect balance until approved
            const paidLeaves = myLeaves.filter(leave => leave.isPaid && leave.paidDays > 0);
            const pending = paidLeaves
              .filter(l => l.status === 'pending')
              .reduce((sum, l) => sum + (l.paidDays || 0), 0);
            const approved = paidLeaves
              .filter(l => l.status === 'approved')
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

    const formatDays = (value: number) => {
      if (value === 0) return '0';
      if (value % 1 === 0) return value.toString();
      return value.toFixed(1);
    };

    if (isLoading) {
      return (
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-20"></div>
          <div className="flex items-center justify-center h-32 relative z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15)' }}
        className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg relative overflow-hidden transition-all duration-300"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-200 rounded-full blur-2xl opacity-20"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <p className="text-emerald-700 text-sm font-semibold uppercase tracking-wide">Paid Leaves</p>
              </div>
              <p className="text-5xl font-bold text-emerald-600 mb-2">
                {formatDays(paidLeaveBalance.available)}
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <p className="text-emerald-600 text-sm">
                    Earned: <span className="font-semibold">{formatDays(paidLeaveBalance.earned)}</span> {paidLeaveBalance.earned === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-300"></div>
                  <p className="text-emerald-600 text-sm">
                    Used: <span className="font-semibold">{formatDays(paidLeaveBalance.consumed)}</span> {paidLeaveBalance.consumed === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-6 transition-transform">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(paidLeaveBalance.available / paidLeaveBalance.earned) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
              />
            </div>
          </div>

          {/* Applied Leaves Section */}
          {appliedLeaves.total > 0 && (
            <div className="pt-4 border-t border-emerald-200">
              <p className="text-xs text-emerald-600 font-semibold mb-2 uppercase tracking-wide">Applied Leaves</p>
              <div className="flex gap-2 flex-wrap">
                {appliedLeaves.pending > 0 && (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 shadow-sm"
                  >
                    ⏳ Pending: {formatDays(appliedLeaves.pending)} {appliedLeaves.pending === 1 ? 'day' : 'days'}
                  </motion.span>
                )}
                {appliedLeaves.approved > 0 && (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-200 text-emerald-800 border border-emerald-300 shadow-sm"
                  >
                    ✓ Approved: {formatDays(appliedLeaves.approved)} {appliedLeaves.approved === 1 ? 'day' : 'days'}
                  </motion.span>
                )}
              </div>
              <p className="text-xs text-emerald-500 mt-2 italic">
                💡 Balance updates after approval
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // IMPROVED: Unpaid Leave Card with pending and used days
  const UnpaidLeaveCard = () => {
    const [appliedLeaves, setAppliedLeaves] = React.useState({
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    });

    React.useEffect(() => {
      // Calculate unpaid leaves (including half days as 0.5)
      const unpaidLeaves = myLeaves.filter(leave =>
        !leave.isPaid || (leave.isPaid && leave.paidDays === 0)
      );

      const pending = unpaidLeaves
        .filter(l => l.status === 'pending')
        .reduce((sum, l) => sum + (l.isHalfDay ? 0.5 : l.days), 0);
      const approved = unpaidLeaves
        .filter(l => l.status === 'approved')
        .reduce((sum, l) => sum + (l.isHalfDay ? 0.5 : l.days), 0);
      const rejected = unpaidLeaves
        .filter(l => l.status === 'rejected')
        .reduce((sum, l) => sum + (l.isHalfDay ? 0.5 : l.days), 0);

      setAppliedLeaves({
        pending,
        approved,
        rejected,
        total: pending + approved
      });
    }, [myLeaves]);

    const formatDays = (value: number) => {
      if (value === 0) return '0';
      if (value % 1 === 0) return value.toString();
      return value.toFixed(1);
    };

    return (
      <motion.div
        whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(239, 68, 68, 0.15)' }}
        className="bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 border-2 border-rose-200 rounded-2xl p-6 shadow-lg relative overflow-hidden transition-all duration-300"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-200 rounded-full blur-2xl opacity-20"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <p className="text-rose-700 text-sm font-semibold uppercase tracking-wide">Unpaid Leaves</p>
              </div>
              <p className="text-5xl font-bold text-rose-600 mb-2">∞</p>
              <p className="text-rose-500 text-sm font-medium">Unlimited availability</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-3 hover:-rotate-6 transition-transform">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Usage Statistics */}
          {appliedLeaves.total > 0 && (
            <div className="mb-4 bg-white/50 rounded-xl p-3 border border-rose-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-rose-500 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-rose-600">{formatDays(appliedLeaves.pending)}</p>
                </div>
                <div>
                  <p className="text-xs text-rose-500 mb-1">Used</p>
                  <p className="text-2xl font-bold text-rose-600">{formatDays(appliedLeaves.approved)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Applied Leaves Section */}
          {appliedLeaves.total > 0 && (
            <div className="pt-4 border-t border-rose-200">
              <p className="text-xs text-rose-600 font-semibold mb-2 uppercase tracking-wide">Applied Leaves</p>
              <div className="flex gap-2 flex-wrap">
                {appliedLeaves.pending > 0 && (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 shadow-sm"
                  >
                    ⏳ Pending: {formatDays(appliedLeaves.pending)} {appliedLeaves.pending === 1 ? 'day' : 'days'}
                  </motion.span>
                )}
                {appliedLeaves.approved > 0 && (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-200 text-rose-800 border border-rose-300 shadow-sm"
                  >
                    ✓ Used: {formatDays(appliedLeaves.approved)} {appliedLeaves.approved === 1 ? 'day' : 'days'}
                  </motion.span>
                )}
                {appliedLeaves.rejected > 0 && (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 text-gray-700 border border-gray-300 shadow-sm"
                  >
                    ✗ Rejected: {formatDays(appliedLeaves.rejected)} {appliedLeaves.rejected === 1 ? 'day' : 'days'}
                  </motion.span>
                )}
              </div>
            </div>
          )}

          {appliedLeaves.total === 0 && (
            <div className="pt-4 border-t border-rose-200">
              <p className="text-xs text-rose-400 italic text-center">No unpaid leaves applied yet</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const leaveTypeOptions = ['Paid', 'Unpaid'];

  const renderStatusBadge = (leave: LeaveRequest) => {
    const formatDays = (value: number) => {
      if (value === 0) return '0';
      if (value % 1 === 0) return value.toString();
      return value.toFixed(1);
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] bg-clip-text text-transparent">
            My Leaves
          </h2>
          <p className="text-gray-500 mt-1">Manage your leave requests and balances</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(107, 141, 162, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="px-6 py-3 cursor-pointer bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all"
        >
          <Calendar className="w-5 h-5" />
          Apply Leave
        </motion.button>
      </motion.div>

      {/* Leave Balance Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <PaidLeaveCard />
        <UnpaidLeaveCard />
      </motion.div>

      {/* IMPROVED: Beautiful Apply Leave Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
              }}
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#6B8DA2]/10 to-[#F5A42C]/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#F5A42C]/10 to-[#6B8DA2]/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] bg-clip-text text-transparent">
                        Apply for Leave
                      </h3>
                      <p className="text-sm text-gray-500">Fill in the details below</p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setShowModal(false)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </motion.button>
                </div>

                <div className="space-y-6">
                  {/* Leave Type Section */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3 text-base flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C]"></div>
                      Leave Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {leaveTypeOptions.map((type) => (
                        <motion.button
                          key={type}
                          type="button"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setForm({ ...form, type })}
                          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all shadow-md relative overflow-hidden ${form.type === type
                              ? type === 'Paid'
                                ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-emerald-200'
                                : 'border-rose-400 bg-gradient-to-br from-rose-50 to-orange-50 shadow-rose-200'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                            }`}
                        >
                          {form.type === type && (
                            <motion.div
                              layoutId="activeLeaveType"
                              className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <div className="relative z-10 flex flex-col items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${form.type === type
                                  ? type === 'Paid'
                                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                                    : 'bg-gradient-to-br from-rose-400 to-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                              {type === 'Paid' ? (
                                <Check className="w-6 h-6" />
                              ) : (
                                <AlertCircle className="w-6 h-6" />
                              )}
                            </div>
                            <span
                              className={`font-bold text-lg ${form.type === type
                                  ? type === 'Paid'
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
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
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3 text-base flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C]"></div>
                      Leave Duration
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {['fullDay', 'halfDay'].map((duration) => (
                        <motion.button
                          key={duration}
                          type="button"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setForm({
                              ...form,
                              leaveDuration: duration as 'fullDay' | 'halfDay',
                              isHalfDay: duration === 'halfDay',
                            })
                          }
                          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all shadow-md relative overflow-hidden ${form.leaveDuration === duration
                              ? 'border-[#6B8DA2] bg-gradient-to-br from-[#6B8DA2]/10 to-[#F5A42C]/10 shadow-[#6B8DA2]/20'
                              : 'border-gray-200 bg-white hover:border-[#6B8DA2]/50 hover:shadow-lg'
                            }`}
                        >
                          {form.leaveDuration === duration && (
                            <motion.div
                              layoutId="activeDuration"
                              className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <div className="relative z-10 flex flex-col items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${form.leaveDuration === duration
                                  ? 'bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] text-white'
                                  : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                              <Clock className="w-6 h-6" />
                            </div>
                            <span
                              className={`font-bold text-lg ${form.leaveDuration === duration
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
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3 text-base flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C]"></div>
                      {form.isHalfDay ? 'Select Date' : 'Select Date Range'}
                    </label>

                    {!form.isHalfDay ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-600 text-sm mb-2 font-medium">From Date</label>
                          <div className="relative">
                            <DatePicker
                              selected={form.from}
                              onChange={(date: Date | null) => setForm({ ...form, from: date })}
                              selectsStart
                              startDate={form.from}
                              endDate={form.to}
                              minDate={new Date()}
                              dateFormat="MMMM d, yyyy"
                              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-4 focus:ring-[#6B8DA2]/10 bg-white font-medium transition-all"
                              placeholderText="Select start date"
                              isClearable
                            />
                            <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-600 text-sm mb-2 font-medium">To Date</label>
                          <div className="relative">
                            <DatePicker
                              selected={form.to}
                              onChange={(date: Date | null) => setForm({ ...form, to: date })}
                              selectsEnd
                              startDate={form.from}
                              endDate={form.to}
                              minDate={form.from || new Date()}
                              dateFormat="MMMM d, yyyy"
                              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-4 focus:ring-[#6B8DA2]/10 bg-white font-medium transition-all"
                              placeholderText="Select end date"
                              isClearable
                            />
                            <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-gray-600 text-sm mb-2 font-medium">Half Day Date</label>
                        <div className="relative">
                          <DatePicker
                            selected={form.from}
                            onChange={(date: Date | null) => setForm({ ...form, from: date })}
                            minDate={new Date()}
                            dateFormat="MMMM d, yyyy"
                            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-4 focus:ring-[#6B8DA2]/10 bg-white font-medium transition-all"
                            placeholderText="Select date for half day leave"
                            isClearable
                          />
                          <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
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
                          ? 'from-emerald-100 via-green-100 to-teal-100 border-emerald-300'
                          : 'from-rose-100 via-red-100 to-orange-100 border-rose-300'
                        } p-5 rounded-2xl border-2 shadow-lg`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 font-medium mb-1">Total Days</p>
                          <p
                            className={`text-3xl font-bold ${form.type === 'Paid'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'
                                : 'bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent'
                              }`}
                          >
                            {calculateDays(form.from, form.to)} {calculateDays(form.from, form.to) === 1 ? 'day' : 'days'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600 font-medium mb-1">Date Range</p>
                          <p className="font-semibold text-gray-800 text-sm">
                            {form.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {form.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                      className="bg-gradient-to-r from-purple-100 via-violet-100 to-indigo-100 p-5 rounded-2xl border-2 border-purple-300 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 font-medium mb-1">Half Day Leave</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            0.5 day
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600 font-medium mb-1">Date</p>
                          <p className="font-semibold text-gray-800">
                            {form.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Reason Section */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3 text-base flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C]"></div>
                      Reason for Leave
                    </label>
                    <div className="relative">
                      <textarea
                        value={form.reason}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-4 focus:ring-[#6B8DA2]/10 bg-white resize-none font-medium transition-all"
                        placeholder="Please provide a detailed reason for your leave..."
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
                        {form.reason.length}/500
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={createLeaveMutation.isPending}
                      className="flex-1 cursor-pointer px-6 py-4 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg"
                    >
                      {createLeaveMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Submitting...
                        </span>
                      ) : (
                        'Submit Leave Request'
                      )}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={createLeaveMutation.isPending}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 cursor-pointer py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 text-base"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Details Modal */}
      {/* IMPROVED Leave Details Modal with Better Spacing and Scrollability */}
      <AnimatePresence>
        {showLeaveDetails && selectedLeave && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl relative flex flex-col"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                maxHeight: 'calc(100vh - 2rem)',
                height: 'auto'
              }}
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#6B8DA2]/10 to-[#F5A42C]/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#F5A42C]/10 to-[#6B8DA2]/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Close Button - Top Right */}
              <motion.button
                type="button"
                onClick={() => setShowLeaveDetails(false)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 z-20 p-2.5 bg-white/90 hover:bg-white rounded-xl transition cursor-pointer shadow-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>

              {/* Modal Content Container */}
              <div className="relative z-10 flex flex-col h-full overflow-hidden">
                {/* Fixed Header */}
                <div className="flex-shrink-0 p-6 pb-4 border-b-2 border-gray-100">
                  <div className="flex items-center gap-4 pr-12">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                      <Eye className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] bg-clip-text text-transparent truncate">
                        Leave Details
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">Complete information about your leave request</p>
                    </div>
                    <div className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm ${selectedLeave.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : selectedLeave.status === 'rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                      {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'thin' }}>
                  <div className="space-y-6 pb-2">
                    {/* Top Row - Key Information Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Employee Info Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border-2 border-blue-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-sm">ID</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-blue-600 text-xs font-medium mb-1">Employee</p>
                            <p className="font-bold text-gray-800 truncate">{selectedLeave.empName}</p>
                            <p className="text-blue-500 text-xs mt-1">ID: {selectedLeave.empId}</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Leave Type Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className={`p-4 rounded-2xl border-2 ${selectedLeave.type === 'Paid'
                            ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50'
                            : 'border-rose-400 bg-gradient-to-br from-rose-50 to-orange-50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow flex-shrink-0 ${selectedLeave.type === 'Paid'
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                              : 'bg-gradient-to-br from-rose-400 to-orange-500'
                            }`}>
                            {selectedLeave.type === 'Paid' ? (
                              <Check className="w-5 h-5 text-white" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-600 text-xs font-medium mb-1">Leave Type</p>
                            <p className="font-bold text-gray-800">{selectedLeave.type}</p>
                            {selectedLeave.isHalfDay && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-xs font-medium mt-2">
                                <Clock className="w-3 h-3" />
                                Half Day
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>

                      {/* Duration Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border-2 border-indigo-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-indigo-600 text-xs font-medium mb-1">Duration</p>
                            <p className="font-bold text-gray-800 text-lg">
                              {calculateExactDays(selectedLeave.from, selectedLeave.to, selectedLeave.isHalfDay)} days
                            </p>
                            <p className="text-indigo-500 text-xs mt-1 truncate">
                              {formatDate(selectedLeave.from)} to {formatDate(selectedLeave.to)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Middle Row - Detailed Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Left Column - Date and Payment Details */}
                      <div className="space-y-4">
                        {/* Date Information Card */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 }}
                          className="bg-white p-5 rounded-2xl border-2 border-gray-200 shadow-sm"
                        >
                          <h4 className="font-bold text-base text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[#6B8DA2]" />
                            Date Information
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600 text-sm">From Date</span>
                              <span className="font-bold text-gray-800 text-sm">
                                {formatDate(selectedLeave.from)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600 text-sm">To Date</span>
                              <span className="font-bold text-gray-800 text-sm">
                                {formatDate(selectedLeave.to)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600 text-sm">Applied On</span>
                              <span className="font-bold text-gray-800 text-sm">
                                {new Date(selectedLeave.appliedDate || selectedLeave.from).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-gray-700 font-semibold text-sm">Total Duration</span>
                              <span className="text-xl font-bold text-[#6B8DA2]">
                                {calculateExactDays(selectedLeave.from, selectedLeave.to, selectedLeave.isHalfDay)} days
                              </span>
                            </div>
                          </div>
                        </motion.div>

                        {/* Payment Details Card */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className={`p-5 rounded-2xl border-2 ${selectedLeave.isPaid
                              ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50'
                              : 'border-rose-400 bg-gradient-to-br from-rose-50 to-orange-50'
                            }`}
                        >
                          <h4 className="font-bold text-base text-gray-800 mb-4 flex items-center gap-2">
                            {selectedLeave.isPaid ? (
                              <Check className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-rose-600" />
                            )}
                            Payment Details
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 text-sm">Payment Type</span>
                              <span className={`px-3 py-1.5 rounded-lg font-bold text-xs ${selectedLeave.isPaid
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                                }`}>
                                {selectedLeave.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                              </span>
                            </div>
                            {selectedLeave.isPaid && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Paid Days</span>
                                <span className="text-2xl font-bold text-emerald-600">
                                  {selectedLeave.paidDays || 0}
                                </span>
                              </div>
                            )}
                            {selectedLeave.isHalfDay && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Day Type</span>
                                <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-bold text-xs">
                                  Half Day (0.5 day)
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>

                      {/* Right Column - Reason and Status */}
                      <div className="space-y-4">
                        {/* Reason Card */}
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 }}
                          className="bg-white p-5 rounded-2xl border-2 border-gray-200 shadow-sm"
                        >
                          <h4 className="font-bold text-base text-gray-800 mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#6B8DA2]" />
                            Reason for Leave
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 min-h-[100px] max-h-[160px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                              {selectedLeave.reason}
                            </p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Applied on {new Date(selectedLeave.appliedDate || selectedLeave.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="text-gray-400">
                                ID: #{selectedLeave.id}
                              </span>
                            </div>
                          </div>
                        </motion.div>

                        {/* Status Timeline Card */}
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="bg-white p-5 rounded-2xl border-2 border-gray-200 shadow-sm"
                        >
                          <h4 className="font-bold text-base text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#6B8DA2]" />
                            Status Timeline
                          </h4>
                          <div className="space-y-3">
                            {/* Pending Status */}
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${selectedLeave.status === 'pending'
                                  ? 'bg-amber-100 text-amber-600'
                                  : 'bg-gray-100 text-gray-400'
                                }`}>
                                <Clock className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-700 text-sm">Pending</p>
                                <p className="text-xs text-gray-500">Waiting for approval</p>
                              </div>
                            </div>

                            {/* Approval/Review Status */}
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${selectedLeave.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : selectedLeave.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                {selectedLeave.status === 'approved' && <Check className="w-4 h-4" />}
                                {selectedLeave.status === 'rejected' && <X className="w-4 h-4" />}
                                {!['approved', 'rejected'].includes(selectedLeave.status) && <Clock className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-700 text-sm">
                                  {selectedLeave.status === 'approved' ? 'Approved' : selectedLeave.status === 'rejected' ? 'Rejected' : 'Under Review'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {selectedLeave.status === 'approved'
                                    ? 'Leave has been approved'
                                    : selectedLeave.status === 'rejected'
                                      ? 'Leave has been rejected'
                                      : 'Manager will review soon'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Bottom Summary Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="bg-gradient-to-r from-[#6B8DA2]/5 to-[#F5A42C]/5 p-5 rounded-2xl border-2 border-[#6B8DA2]/20"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Leave Type</p>
                          <p className="text-xl font-bold text-gray-800">{selectedLeave.type}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Total Days</p>
                          <p className="text-xl font-bold text-[#6B8DA2]">
                            {calculateExactDays(selectedLeave.from, selectedLeave.to, selectedLeave.isHalfDay)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Current Status</p>
                          <p className={`text-xl font-bold ${selectedLeave.status === 'approved'
                              ? 'text-emerald-600'
                              : selectedLeave.status === 'rejected'
                                ? 'text-rose-600'
                                : 'text-amber-600'
                            }`}>
                            {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Fixed Action Buttons at Bottom */}
                <div className="flex-shrink-0 p-5 border-t-2 border-gray-100 bg-white/90 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setShowLeaveDetails(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 cursor-pointer py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-bold hover:from-gray-300 hover:to-gray-400 transition-all shadow-sm text-sm"
                    >
                      Close Details
                    </motion.button>
                    {selectedLeave.status === 'pending' && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleCancelLeave(selectedLeave.id);
                          setShowLeaveDetails(false);
                        }}
                        className="flex-1 cursor-pointer py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold hover:from-rose-600 hover:to-orange-600 transition-all shadow-sm text-sm"
                      >
                        Cancel Request
                      </motion.button>
                    )}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 cursor-pointer py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl font-bold hover:shadow-lg transition-all shadow-sm text-sm"
                      onClick={() => {
                        setShowLeaveDetails(false);
                        setForm({
                          type: selectedLeave.type,
                          from: new Date(selectedLeave.from),
                          to: new Date(selectedLeave.to),
                          reason: selectedLeave.reason,
                          isHalfDay: selectedLeave.isHalfDay || false,
                          leaveDuration: selectedLeave.isHalfDay ? 'halfDay' : 'fullDay'
                        });
                        setShowModal(true);
                      }}
                    >
                      Apply Similar Leave
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Requests Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
        <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-[#6B8DA2]/5 to-[#F5A42C]/5">
          <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#6B8DA2]" />
            Leave History
          </h3>
          <p className="text-gray-500 text-sm mt-1">All your leave requests and their status</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-gray-600 font-bold text-sm">Type</th>
                <th className="text-left px-6 py-4 text-gray-600 font-bold text-sm">Duration</th>
                <th className="text-left px-6 py-4 text-gray-600 font-bold text-sm">Days</th>
                <th className="text-left px-6 py-4 text-gray-600 font-bold text-sm">Paid/Unpaid</th>
                <th className="text-left px-6 py-4 text-gray-600 font-bold text-sm">Applied On</th>
                <th className="text-left px-6 py-4 text-gray-600 font-bold text-sm">Status</th>
                <th className="text-left px-6 py-4 text-gray-600 font-bold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-gray-500 font-medium">No leave requests found</p>
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
                      className="border-t-2 border-gray-100 hover:bg-gradient-to-r hover:from-[#6B8DA2]/5 hover:to-transparent transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${leave.type === 'Paid' ? 'bg-green-100 text-green-700' :
                            leave.type === 'Unpaid' ? 'bg-red-100 text-red-700' :
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
                          <span className="font-semibold">
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
                          <span className="font-bold text-gray-800 text-lg">
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
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {new Date(leave.appliedDate || leave.from).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-sm ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
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