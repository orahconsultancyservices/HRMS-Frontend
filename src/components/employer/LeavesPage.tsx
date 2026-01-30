import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Check, X, Calendar, FileText, Filter, Search,
  Clock, Eye, ChevronDown, ChevronUp,
  Mail, Phone, Briefcase,
  DownloadCloud, User, Clock as ClockIcon,
  CheckCircle, XCircle, CalendarDays, MessageSquare,
  FileCheck, Edit, Trash2, Tag, Settings,
  Users, AlertCircle, CheckSquare, XSquare,
  MoreVertical
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useLeaves, useUpdateLeaveStatus } from '../../hooks/useLeaves';
import { useEmployees } from '../../hooks/useEmployees';
import { useQueryClient } from '@tanstack/react-query';

// Define types
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  department: string;
  position: string;
  joinDate: string;
  avatar?: string;
  phone?: string;
}

interface LeaveType {
  id: number;
  name: string;
  code: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
}

interface LeaveRequest {
  id: number;
  employeeId: number;
  empId: number;
  empName: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  department?: string;
  contactDuringLeave?: string;
  addressDuringLeave?: string;
  managerNotes?: string;
}

interface LeavesPageProps {
  leaveTypes?: LeaveType[];
  setLeaveTypes?: React.Dispatch<React.SetStateAction<LeaveType[]>>;
}

interface FormState {
  status: 'pending' | 'approved' | 'rejected' | 'all';
  type: string;
  department: string;
  dateRange: [Date | null, Date | null];
}

type DateRange = [Date | null, Date | null];

const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: 1, name: 'Casual Leave', code: 'CL', description: 'Casual leaves for personal work', color: '#3B82F6', isActive: true, createdAt: '2024-01-01' },
  { id: 2, name: 'Sick Leave', code: 'SL', description: 'Medical leaves for illness', color: '#F97316', isActive: true, createdAt: '2024-01-01' },
  { id: 3, name: 'Earned Leave', code: 'EL', description: 'Privilege leaves earned over time', color: '#8B5CF6', isActive: true, createdAt: '2024-01-01' },
  { id: 4, name: 'Paid Leave', code: 'PL', description: 'Paid leaves from balance', color: '#10B981', isActive: true, createdAt: '2024-01-01' },
  { id: 5, name: 'Unpaid Leave', code: 'UL', description: 'Leave without pay', color: '#EF4444', isActive: true, createdAt: '2024-01-01' },
  { id: 6, name: 'Half Day', code: 'HD', description: 'Half day leave', color: '#8B5CF6', isActive: true, createdAt: '2024-01-01' },
];

const LeavesPage = ({
  leaveTypes = DEFAULT_LEAVE_TYPES,
  setLeaveTypes
}: LeavesPageProps) => {
  const queryClient = useQueryClient();
  
  // React Query hooks
  const { data: leavesData, isLoading: isLoadingLeaves } = useLeaves();
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees();
  const updateLeaveStatusMutation = useUpdateLeaveStatus();

  const [filters, setFilters] = useState<FormState>({
    status: 'all',
    type: 'all',
    department: 'all',
    dateRange: [null, null]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedLeaves, setSelectedLeaves] = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [managerNotes, setManagerNotes] = useState<{ [key: number]: string }>({});
  const [showLeaveTypesModal, setShowLeaveTypesModal] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [newLeaveType, setNewLeaveType] = useState<Partial<LeaveType>>({
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
  });

  const [startDate, endDate] = filters.dateRange;

  // Process data from API
  // Replace lines around where you define leaveRequests:
const leaveRequests = React.useMemo(() => {
  if (!leavesData) return [];
  
  console.log('📊 Processing leavesData:', leavesData);
  
  // If leavesData is already an array, use it directly
  if (Array.isArray(leavesData)) {
    return leavesData;
  }
  
  // If leavesData has a data property that's an array
  if (leavesData && leavesData.data && Array.isArray(leavesData.data)) {
    return leavesData.data.map((leave: any) => ({
      id: leave.id,
      empId: leave.empId,
      employeeId: leave.employee?.id || leave.empId,
      type: leave.type,
      from: leave.from,
      to: leave.to,
      days: leave.days,
      reason: leave.reason,
      status: leave.status,
      appliedDate: leave.appliedDate,
      contactDuringLeave: leave.contactDuringLeave,
      addressDuringLeave: leave.addressDuringLeave,
      managerNotes: leave.managerNotes,
      isHalfDay: leave.isHalfDay || false,
      isPaid: leave.isPaid || false,
      paidDays: leave.paidDays || 0,
      department: leave.employee?.department,
      empName: leave.employee ? 
        `${leave.employee.firstName} ${leave.employee.lastName}` : 
        `Employee ${leave.empId}`
    }));
  }
  
  console.warn('⚠️ Unexpected leaves data format:', leavesData);
  return [];
}, [leavesData]);

const employees = React.useMemo(() => {
  if (!employeesData) return [];
  
  console.log('👥 Processing employeesData:', employeesData);
  
  if (Array.isArray(employeesData)) {
    return employeesData;
  }
  
  if (employeesData && typeof employeesData === 'object') {
    if (Array.isArray(employeesData.data)) {
      return employeesData.data;
    }
    if (employeesData.success && Array.isArray(employeesData.data)) {
      return employeesData.data;
    }
  }
  
  console.error('❌ Invalid employees data format:', employeesData);
  return [];
}, [employeesData]);
  // Get active leave types
  const activeLeaveTypes = leaveTypes.filter(lt => lt.isActive);

  // Inside your component, add this:
// Add this useEffect in LeavePage.tsx:
useEffect(() => {
  console.log('📊 Leaves Page Data Debug:', {
    leavesData,
    employeesData,
    leaveRequestsCount: leaveRequests.length,
    employeesCount: employees.length
  });
  
  // Log first few items to verify structure
  if (leaveRequests.length > 0) {
    console.log('📋 First leave request:', leaveRequests[0]);
    console.log('🔑 Keys:', Object.keys(leaveRequests[0]));
  }
  
  if (employees.length > 0) {
    console.log('👤 First employee:', employees[0]);
  }
}, [leavesData, employeesData, leaveRequests, employees]);

  // Filter leave requests
// Update the filteredLeaves calculation:
const filteredLeaves = leaveRequests.filter(leave => {
  const matchesStatus = filters.status === 'all' || leave.status === filters.status;
  const matchesType = filters.type === 'all' || leave.type === filters.type;
  
  // Get employee details - try multiple approaches
  let employee;
  if (leave.employeeId) {
    employee = employees.find(e => e.id === leave.employeeId);
  } else if (leave.empId) {
    employee = employees.find(e => e.id === leave.empId);
  }
  
  // Use leave.department if available, otherwise employee department
  const department = leave.department || employee?.department;
  const matchesDepartment = filters.department === 'all' || department === filters.department;

  const matchesSearch = searchTerm === '' ||
    (employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     leave.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     leave.type?.toLowerCase().includes(searchTerm.toLowerCase()));

  const leaveFrom = new Date(leave.from);
  const matchesDate = (!startDate || leaveFrom >= startDate) &&
    (!endDate || leaveFrom <= endDate);

  return matchesStatus && matchesType && matchesDepartment && matchesSearch && matchesDate;
});

  // Calculate statistics
  const pendingCount = leaveRequests.filter(l => l.status === 'pending').length;
  const approvedCount = leaveRequests.filter(l => l.status === 'approved').length;
  const rejectedCount = leaveRequests.filter(l => l.status === 'rejected').length;
  const totalLeaveDays = leaveRequests
    .filter(l => l.status === 'approved')
    .reduce((acc, curr) => acc + (curr.days || 0), 0);

  // Get unique departments from employees
  const departments = Array.from(new Set(employees
    .filter(e => e.department)
    .map(e => e.department))) as string[];

  // Handle leave actions with API
  const handleAction = (id: number, status: 'approved' | 'rejected', notes?: string) => {
    updateLeaveStatusMutation.mutate({
      id,
      status,
      notes
    }, {
      onSuccess: () => {
        // Clear from selected if exists
        const newSelected = new Set(selectedLeaves);
        newSelected.delete(id);
        setSelectedLeaves(newSelected);
        
        setShowDetailsModal(false);
        setSelectedRequest(null);
      }
    });
  };

  const handleBulkAction = (status: 'approved' | 'rejected') => {
    // Process each selected leave
    const promises = Array.from(selectedLeaves).map(id =>
      updateLeaveStatusMutation.mutateAsync({
        id,
        status,
        notes: `Bulk ${status}`
      })
    );

    Promise.all(promises).then(() => {
      setSelectedLeaves(new Set());
      setShowBulkActions(false);
    });
  };

  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedLeaves);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeaves(newSelected);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleViewDetails = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

const getEmployeeDetails = (empId: number) => {
  // First try to find by id
  let employee = employees.find(e => e.id === empId);
  
  // If not found, check if there's an employee object in the leave itself
  if (!employee) {
    const leave = leaveRequests.find(l => l.empId === empId);
    if (leave && leave.employee) {
      return leave.employee;
    }
  }
  
  return employee;
};

  const getLeaveTypeColor = (typeName: string) => {
    const leaveType = activeLeaveTypes.find(lt => lt.name === typeName);
    if (leaveType && leaveType.color) {
      // Use inline style for dynamic colors
      return {
        backgroundColor: `${leaveType.color}20`,
        color: leaveType.color,
        borderColor: `${leaveType.color}40`
      };
    }

    // Fallback colors
    switch (typeName) {
      case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'Unpaid': return 'bg-red-100 text-red-700 border-red-200';
      case 'Half Day': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Casual': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Sick': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Earned': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'pending': return ClockIcon;
      default: return ClockIcon;
    }
  };

  // Leave Types Management Functions
  const handleAddLeaveType = () => {
    if (!newLeaveType.name || !newLeaveType.code) {
      alert('Please enter name and code for the leave type');
      return;
    }

    const newType: LeaveType = {
      id: editingLeaveType ? editingLeaveType.id : Date.now(),
      name: newLeaveType.name,
      code: newLeaveType.code.toUpperCase(),
      description: newLeaveType.description || '',
      color: newLeaveType.color || '#3B82F6',
      isActive: true,
      createdAt: editingLeaveType ? editingLeaveType.createdAt : new Date().toISOString().split('T')[0]
    };

    if (editingLeaveType) {
      setLeaveTypes?.(prev => prev.map(lt => lt.id === editingLeaveType.id ? newType : lt));
    } else {
      setLeaveTypes?.(prev => [...prev, newType]);
    }

    // Reset form
    setNewLeaveType({
      name: '',
      code: '',
      description: '',
      color: '#3B82F6',
    });
    setEditingLeaveType(null);
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

  // Loading state
  if (isLoadingLeaves || isLoadingEmployees) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8DA2] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaves data...</p>
        </div>
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
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-500">Review and manage employee leave requests</p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLeaveTypesModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#F5A42C] to-[#FFB84D] text-white rounded-xl hover:shadow-lg transition cursor-pointer flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage Leave Types
          </motion.button>

          {selectedLeaves.size > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-gray-600">{selectedLeaves.size} selected</span>
              <button
                onClick={() => setShowBulkActions(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-lg text-sm font-medium hover:shadow transition cursor-pointer"
              >
                Bulk Actions
              </button>
            </motion.div>
          )}

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
      </motion.div>

      {/* Statistics Cards - Beautified */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Leave Requests</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{leaveRequests.length}</p>
              <p className="text-gray-400 text-sm mt-1">All time</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              <p className="text-gray-400 text-sm mt-1">Awaiting approval</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Approved Leaves</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{approvedCount}</p>
              <p className="text-gray-400 text-sm mt-1">{totalLeaveDays} total days</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-400 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Rejected Requests</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{rejectedCount}</p>
              <p className="text-gray-400 text-sm mt-1">This month</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-400 rounded-xl flex items-center justify-center shadow-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filter and Search Bar - Enhanced */}
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
                placeholder="Search by employee name, reason, or leave type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white"
            >
              <option value="all">All Types</option>
              {activeLeaveTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>

            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update: DateRange) => setFilters({ ...filters, dateRange: update })}
              dateFormat="MMM d, yyyy"
              placeholderText="Date Range"
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white cursor-pointer"
            />
          </div>
        </div>
      </motion.div>

      {/* Leaves Table - Enhanced Design */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#6B8DA2]/5 to-[#F5A42C]/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#6B8DA2]" />
                Leave Requests
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredLeaves.length} found)
                </span>
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Showing {filteredLeaves.length} of {leaveRequests.length} requests
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                {selectedLeaves.size > 0 && `${selectedLeaves.size} selected`}
              </div>
              <button
                onClick={() => setSelectedLeaves(new Set())}
                className="text-sm text-[#6B8DA2] hover:underline cursor-pointer"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">
                  <input
                    type="checkbox"
                    checked={filteredLeaves.length > 0 && selectedLeaves.size === filteredLeaves.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeaves(new Set(filteredLeaves.map(l => l.id)));
                      } else {
                        setSelectedLeaves(new Set());
                      }
                    }}
                    className="rounded border-gray-300 text-[#6B8DA2] focus:ring-[#6B8DA2]"
                  />
                </th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Employee</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Leave Type</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Duration</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Days</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Applied On</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Status</th>
                <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-gray-500">No leave requests found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave, index) => {
                   const employee = getEmployeeDetails(leave.empId);
                    const StatusIcon = getStatusIcon(leave.status);
                    const isExpanded = expandedRows.has(leave.id);
                    const employeeName = employee ? 
  `${employee.firstName} ${employee.lastName}` : 
  leave.empName || `Employee ${leave.empId}`;

                    return (
                      <React.Fragment key={leave.id}>
                        <motion.tr
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-t border-gray-100 group hover:bg-gray-50 ${leave.status === 'pending' ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''
                            }`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedLeaves.has(leave.id)}
                              onChange={() => toggleRowSelection(leave.id)}
                              className="rounded border-gray-300 text-[#6B8DA2] focus:ring-[#6B8DA2]"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] rounded-full flex items-center justify-center text-white font-semibold">
                                {employee?.firstName?.charAt(0) || employeeName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">{employeeName}</div>
                                <div className="text-sm text-gray-500">{employee?.department || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span 
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${typeof getLeaveTypeColor(leave.type) === 'string' 
                                ? getLeaveTypeColor(leave.type) as string
                                : ''
                              }`}
                              style={typeof getLeaveTypeColor(leave.type) !== 'string' 
                                ? getLeaveTypeColor(leave.type) as React.CSSProperties 
                                : {}
                              }
                            >
                              {leave.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800">
                                {new Date(leave.from).toLocaleDateString()}
                              </span>
                              {!leave.isHalfDay && leave.to && (
                                <span className="text-xs text-gray-500">
                                  to {new Date(leave.to).toLocaleDateString()}
                                </span>
                              )}
                              {leave.isHalfDay && (
                                <span className="text-xs text-purple-600 font-medium">
                                  Half Day
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">{leave.days || 1}</span>
                              <span className="text-gray-500 text-sm">days</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(leave.appliedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="w-4 h-4" />
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(leave.status)}`}>
                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleRowExpansion(leave.id)}
                                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                                title={isExpanded ? "Hide Details" : "Show Details"}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleViewDetails(leave)}
                                className="p-2 text-[#6B8DA2] hover:bg-[#6B8DA2]/10 rounded-lg transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>

                              {leave.status === 'pending' && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleAction(leave.id, 'approved')}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition cursor-pointer"
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4" />
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleAction(leave.id, 'rejected')}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>

                        {/* Expanded Row Details */}
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-50"
                          >
                            <td colSpan={8} className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Employee Details */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Employee Information
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm">{employee?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm">{employee?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm">{employee?.position || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <CalendarDays className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm">Joined: {employee?.joinDate ? new Date(employee.joinDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Leave Details */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Leave Details
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Leave Type:</span>
                                      <span className="text-sm font-medium">{leave.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Total Days:</span>
                                      <span className="text-sm font-medium">{leave.days || 1} days</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Applied On:</span>
                                      <span className="text-sm font-medium">
                                        {new Date(leave.appliedDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Reason:</span>
                                      <span className="text-sm font-medium max-w-xs truncate">{leave.reason}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Quick Actions
                                  </h4>
                                  <div className="flex flex-col gap-2">
                                    {leave.status === 'pending' ? (
                                      <>
                                        <motion.button
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => handleAction(leave.id, 'approved')}
                                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:shadow transition cursor-pointer flex items-center justify-center gap-2"
                                        >
                                          <Check className="w-4 h-4" />
                                          Approve Leave
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => handleAction(leave.id, 'rejected')}
                                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:shadow transition cursor-pointer flex items-center justify-center gap-2"
                                        >
                                          <X className="w-4 h-4" />
                                          Reject Leave
                                        </motion.button>
                                      </>
                                    ) : (
                                      <div className="text-center py-3 text-gray-500">
                                        <FileCheck className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm">Leave already {leave.status}</p>
                                      </div>
                                    )}
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => handleViewDetails(leave)}
                                      className="px-4 py-2 border border-[#6B8DA2] text-[#6B8DA2] rounded-lg text-sm font-medium hover:bg-[#6B8DA2]/10 transition cursor-pointer"
                                    >
                                      View Full Details
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Leave Details Modal - Enhanced */}
      <AnimatePresence>
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#6B8DA2]/5 to-[#F5A42C]/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#6B8DA2]" />
                    Leave Request Details
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Employee Info */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Employee Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {getEmployeeDetails(selectedRequest.empId)?.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">
                            {getEmployeeDetails(selectedRequest.empId)?.firstName} {getEmployeeDetails(selectedRequest.empId)?.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{getEmployeeDetails(selectedRequest.empId)?.position || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{getEmployeeDetails(selectedRequest.empId)?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{getEmployeeDetails(selectedRequest.empId)?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{getEmployeeDetails(selectedRequest.empId)?.department || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    {selectedRequest.status === 'pending' && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-800 mb-4">Quick Decision</h4>
                        <div className="space-y-3">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleAction(selectedRequest.id, 'approved', managerNotes[selectedRequest.id])}
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow transition cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Check className="w-5 h-5" />
                            Approve Leave
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleAction(selectedRequest.id, 'rejected', managerNotes[selectedRequest.id])}
                            className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:shadow transition cursor-pointer flex items-center justify-center gap-2"
                          >
                            <X className="w-5 h-5" />
                            Reject Leave
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Leave Details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Leave Status Card */}
                    <div className={`rounded-xl p-6 border ${selectedRequest.status === 'approved' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' :
                      selectedRequest.status === 'rejected' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' :
                        'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-800">Leave Status</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${selectedRequest.status === 'approved' ? 'bg-green-100 text-green-700' :
                              selectedRequest.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                              {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                            </span>
                            <span 
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${typeof getLeaveTypeColor(selectedRequest.type) === 'string' 
                                ? getLeaveTypeColor(selectedRequest.type) as string
                                : ''
                              }`}
                              style={typeof getLeaveTypeColor(selectedRequest.type) !== 'string' 
                                ? getLeaveTypeColor(selectedRequest.type) as React.CSSProperties 
                                : {}
                              }
                            >
                              {selectedRequest.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Applied On</p>
                          <p className="font-medium">
                            {new Date(selectedRequest.appliedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Leave Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                        <p className="font-medium text-gray-800">
                          {new Date(selectedRequest.from).toLocaleDateString()} 
                          {selectedRequest.to && ` to ${new Date(selectedRequest.to).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Days</p>
                        <p className="text-2xl font-bold text-purple-600">{selectedRequest.days || 1} days</p>
                        {selectedRequest.isHalfDay && (
                          <p className="text-xs text-purple-500">Half Day Leave</p>
                        )}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-2">Reason for Leave</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedRequest.reason}</p>
                    </div>

                    {/* Manager Notes */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                      <label className="block text-gray-700 font-medium mb-2">Manager Notes</label>
                      <textarea
                        value={managerNotes[selectedRequest.id] || selectedRequest.managerNotes || ''}
                        onChange={(e) => setManagerNotes({
                          ...managerNotes,
                          [selectedRequest.id]: e.target.value
                        })}
                        rows={3}
                        className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-[#F5A42C] focus:ring-2 focus:ring-[#F5A42C]/20 bg-white"
                        placeholder="Add notes or comments about this leave request..."
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        These notes will be saved when you approve or reject this leave
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Modal */}
      <AnimatePresence>
        {showBulkActions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Bulk Actions</h3>
              <p className="text-gray-600 mb-6">
                You have selected {selectedLeaves.size} leave request{selectedLeaves.size !== 1 ? 's' : ''}. Choose an action:
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBulkAction('approved')}
                    className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Approve All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBulkAction('rejected')}
                    className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Reject All
                  </motion.button>
                </div>

                <div className="text-center text-sm text-gray-500 mt-4">
                  This action will apply to all selected leave requests
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBulkActions(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition cursor-pointer"
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

export default LeavesPage;