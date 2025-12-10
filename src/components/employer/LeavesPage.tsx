import React, { lazy, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Calendar, FileText, Filter, Search,
  Users, Clock, AlertCircle, Eye, ChevronDown, ChevronUp,
  Download, Mail, Phone, Briefcase, TrendingUp, TrendingDown,
  BarChart3, PieChart, DownloadCloud, User, Clock as ClockIcon,
  CheckCircle, XCircle, CalendarDays, MessageSquare, Send,
  ExternalLink, ChevronRight, MoreVertical, FileCheck, FileX,
  Plus, Edit, Trash2, Tag, Settings
} from 'lucide-react';
const DatePicker = lazy(() => import('react-datepicker'));
import 'react-datepicker/dist/react-datepicker.css';

// Define types
interface LeaveRequest {
  id: number;
  empId: number;
  empName: string;
  type: string; // Changed from fixed type to string
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

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  leaveBalance: Record<string, number>; // Changed to dynamic leave balance
  avatar?: string;
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

interface LeavesPageProps {
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  employees: Employee[];
  leaveTypes: LeaveType[];
  setLeaveTypes: React.Dispatch<React.SetStateAction<LeaveType[]>>;
}

interface FormState {
  status: 'pending' | 'approved' | 'rejected' | 'all';
  type: string;
  department: string;
  dateRange: [Date | null, Date | null];
}

type DateRange = [Date | null, Date | null];

// Default leave types for initial state
const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: 1, name: 'Casual Leave', code: 'CL', description: 'Casual leaves for personal work', color: '#3B82F6', isActive: true, createdAt: '2024-01-01' },
  { id: 2, name: 'Sick Leave', code: 'SL', description: 'Medical leaves for illness', color: '#F97316', isActive: true, createdAt: '2024-01-01' },
  { id: 3, name: 'Earned Leave', code: 'EL', description: 'Privilege leaves earned over time', color: '#8B5CF6', isActive: true, createdAt: '2024-01-01' },
  { id: 4, name: 'Maternity Leave', code: 'ML', description: 'Leave for pregnancy and childbirth', color: '#EC4899', isActive: true, createdAt: '2024-01-01' },
  { id: 5, name: 'Paternity Leave', code: 'PL', description: 'Leave for new fathers', color: '#06B6D4', isActive: true, createdAt: '2024-01-01' },
  { id: 6, name: 'Bereavement Leave', code: 'BL', description: 'Leave for family bereavement', color: '#6B7280', isActive: true, createdAt: '2024-01-01' },
];

const LeavesPage = ({
  leaveRequests,
  setLeaveRequests,
  employees = [],
  leaveTypes = DEFAULT_LEAVE_TYPES,
  setLeaveTypes
}: LeavesPageProps) => {
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

  // Process employees for dropdown
  const processedEmployees = employees || [];

  // Get active leave types
  const activeLeaveTypes = leaveTypes.filter(lt => lt.isActive);

  // Filter leave requests
  const filteredLeaves = leaveRequests.filter(leave => {
    const matchesStatus = filters.status === 'all' || leave.status === filters.status;
    const matchesType = filters.type === 'all' || leave.type === filters.type;
    const matchesDepartment = filters.department === 'all' ||
      (processedEmployees.find(e => e.id === leave.empId)?.department === filters.department);

    const matchesSearch = searchTerm === '' ||
      leave.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.type.toLowerCase().includes(searchTerm.toLowerCase());

    const leaveFrom = new Date(leave.from);
    const matchesDate = (!startDate || leaveFrom >= startDate) &&
      (!endDate || leaveFrom <= endDate);

    return matchesStatus && matchesType && matchesDepartment && matchesSearch && matchesDate;
  });

  // Calculate statistics
  const pendingCount = leaveRequests.filter(l => l.status === 'pending').length;
  const approvedCount = leaveRequests.filter(l => l.status === 'approved').length;
  const rejectedCount = leaveRequests.filter(l => l.status === 'rejected').length;

  // Dynamic calculation of leave types statistics
  const leaveTypeStats = activeLeaveTypes.map(leaveType => ({
    ...leaveType,
    count: leaveRequests.filter(l => l.type === leaveType.name).length
  }));

  const totalLeaveDays = leaveRequests
    .filter(l => l.status === 'approved')
    .reduce((acc, curr) => acc + curr.days, 0);

  const avgProcessingTime = 2.5; // Mock data

  // Get unique departments
  const departments = Array.from(new Set(processedEmployees.map(e => e.department)));

  // Handle leave actions
  const handleAction = (id: number, status: 'approved' | 'rejected', notes?: string) => {
    setLeaveRequests(prev => prev.map(l =>
      l.id === id ? {
        ...l,
        status,
        managerNotes: notes || l.managerNotes
      } : l
    ));

    // Clear from selected if exists
    const newSelected = new Set(selectedLeaves);
    newSelected.delete(id);
    setSelectedLeaves(newSelected);

    setShowDetailsModal(false);
  };

  const handleBulkAction = (status: 'approved' | 'rejected') => {
    setLeaveRequests(prev => prev.map(l =>
      selectedLeaves.has(l.id) ? { ...l, status } : l
    ));
    setSelectedLeaves(new Set());
    setShowBulkActions(false);
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
    return processedEmployees.find(e => e.id === empId);
  };

  const getLeaveTypeColor = (typeName: string) => {
    const leaveType = activeLeaveTypes.find(lt => lt.name === typeName);
    if (leaveType && leaveType.color) {
      return `bg-[${leaveType.color}]/10 text-[${leaveType.color}] border-[${leaveType.color}]/20`;
    }

    // Fallback colors
    switch (typeName) {
      case 'Casual Leave': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Sick Leave': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Earned Leave': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Maternity Leave': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'Paternity Leave': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Bereavement Leave': return 'bg-gray-100 text-gray-700 border-gray-200';
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

  const calculateOverlap = (leave: LeaveRequest) => {
    // Check if other employees from same department are on leave during this period
    const sameDeptLeaves = leaveRequests.filter(l =>
      l.status === 'approved' &&
      l.empId !== leave.empId &&
      getEmployeeDetails(l.empId)?.department === getEmployeeDetails(leave.empId)?.department
    );

    const overlapping = sameDeptLeaves.filter(l => {
      const leaveFrom = new Date(leave.from);
      const leaveTo = new Date(leave.to);
      const otherFrom = new Date(l.from);
      const otherTo = new Date(l.to);

      return (leaveFrom <= otherTo && leaveTo >= otherFrom);
    });

    return overlapping.length;
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
      // Remove these fields:
      // maxDaysPerYear: newLeaveType.maxDaysPerYear || 12,
      // requiresDocumentation: newLeaveType.requiresDocumentation || false,
      // isActive: newLeaveType.isActive !== undefined ? newLeaveType.isActive : true,
      isActive: true, // Always active since we removed the toggle
      createdAt: editingLeaveType ? editingLeaveType.createdAt : new Date().toISOString().split('T')[0]
    };

    if (editingLeaveType) {
      setLeaveTypes(prev => prev.map(lt => lt.id === editingLeaveType.id ? newType : lt));
    } else {
      setLeaveTypes(prev => [...prev, newType]);
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

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    setNewLeaveType({
      name: leaveType.name,
      code: leaveType.code,
      description: leaveType.description || '',
      maxDaysPerYear: leaveType.maxDaysPerYear || 12,
      requiresDocumentation: leaveType.requiresDocumentation || false,
      color: leaveType.color || '#3B82F6',
      isActive: leaveType.isActive
    });
  };

  const handleDeleteLeaveType = (id: number) => {
    if (window.confirm('Are you sure you want to delete this leave type? This will affect all related leave requests.')) {
      setLeaveTypes(prev => prev.filter(lt => lt.id !== id));
    }
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

      {/* Statistics Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <motion.div
  whileHover={{ y: -5 }}
  className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-xl p-6 shadow-sm"
>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm whitespace-nowrap">Total Leave Requests</p>
      <p className="text-3xl font-bold text-orange-600 mt-1">
        {leaveRequests.length}
      </p>
      <p className="text-gray-400 text-sm mt-1">Pending: {
        leaveRequests.filter(lr => lr.status === 'pending').length
      }</p>
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

        {/* In the statistics cards section, update the "Leave Types" card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-[#6B8DA2]/10 to-[#F5A42C]/10 border-l-4 border-[#6B8DA2] rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Leave Types</p>
              <p className="text-3xl font-bold text-[#6B8DA2] mt-1">{activeLeaveTypes.length}</p>
              <p className="text-gray-400 text-sm mt-1">Configured types</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#6B8DA2] to-[#7A9DB2] rounded-xl flex items-center justify-center shadow-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filter and Search Bar */}
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
              {leaveTypes.map(type => (
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

      {/* Leaves Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
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
                    const overlappingLeaves = calculateOverlap(leave);

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
                                {employee?.avatar || leave.empName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">{leave.empName}</div>
                                <div className="text-sm text-gray-500">{employee?.department || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getLeaveTypeColor(leave.type)}`}>
                              {leave.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800">{leave.from}</span>
                              <span className="text-xs text-gray-500">to {leave.to}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">{leave.days}</span>
                              <span className="text-gray-500 text-sm">days</span>
                              {overlappingLeaves > 0 && leave.status === 'pending' && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                  {overlappingLeaves} overlap
                                </span>
                              )}
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
                                      <span className="text-sm">Joined: {employee?.joinDate || 'N/A'}</span>
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
                                      <span className="text-sm font-medium">{leave.days} days</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Applied On:</span>
                                      <span className="text-sm font-medium">{leave.appliedDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Department Coverage:</span>
                                      <span className={`text-sm font-medium ${overlappingLeaves > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {overlappingLeaves > 0 ? `${overlappingLeaves} overlaps` : 'Good coverage'}
                                      </span>
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

        {/* Summary Footer */}
        {filteredLeaves.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {filteredLeaves.length} of {leaveRequests.length} leave requests
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Pending</div>
                  <div className="text-lg font-bold text-yellow-600">{pendingCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Approval Rate</div>
                  <div className="text-lg font-bold text-green-600">
                    {leaveRequests.length > 0
                      ? `${Math.round((approvedCount / leaveRequests.length) * 100)}%`
                      : '0%'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Avg. Days</div>
                  <div className="text-lg font-bold text-[#6B8DA2]">
                    {leaveRequests.length > 0
                      ? (totalLeaveDays / approvedCount || 0).toFixed(1)
                      : '0.0'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Additional Stats */}
     


      {/* Leave Types Management Modal */}
      <AnimatePresence>
        {showLeaveTypesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-[#F5A42C]" />
                    Manage Leave Types
                  </h3>
                  <button
                    onClick={() => {
                      setShowLeaveTypesModal(false);
                      setEditingLeaveType(null);
                      setNewLeaveType({
                        name: '',
                        code: '',
                        description: '',
                        color: '#3B82F6',
                      });
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Form for adding/editing leave type */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    {editingLeaveType ? 'Edit Leave Type' : 'Add New Leave Type'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm mb-2">Leave Type Name *</label>
                      <input
                        type="text"
                        value={newLeaveType.name}
                        onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F5A42C] focus:ring-2 focus:ring-[#F5A42C]/20"
                        placeholder="e.g., Casual Leave"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm mb-2">Code *</label>
                      <input
                        type="text"
                        value={newLeaveType.code}
                        onChange={(e) => setNewLeaveType({ ...newLeaveType, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F5A42C] focus:ring-2 focus:ring-[#F5A42C]/20"
                        placeholder="e.g., CL"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-sm mb-2">Description</label>
                      <textarea
                        value={newLeaveType.description}
                        onChange={(e) => setNewLeaveType({ ...newLeaveType, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F5A42C] focus:ring-2 focus:ring-[#F5A42C]/20"
                        placeholder="Brief description of this leave type"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm mb-2">Color</label>
                      <input
                        type="color"
                        value={newLeaveType.color}
                        onChange={(e) => setNewLeaveType({ ...newLeaveType, color: e.target.value })}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddLeaveType}
                      className="px-6 py-2 bg-gradient-to-r from-[#F5A42C] to-[#FFB84D] text-white rounded-lg font-semibold hover:shadow transition cursor-pointer"
                    >
                      {editingLeaveType ? 'Update Type' : 'Add Type'}
                    </motion.button>
                    {editingLeaveType && (
                      <button
                        onClick={() => {
                          setEditingLeaveType(null);
                          setNewLeaveType({
                            name: '',
                            code: '',
                            description: '',
                            color: '#3B82F6',
                          });
                        }}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* List of existing leave types */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Existing Leave Types ({leaveTypes.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-gray-600 font-medium text-sm">Type</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-medium text-sm">Code</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-medium text-sm">Description</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveTypes.map((type) => (
                          <tr key={type.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: type.color || '#3B82F6' }}
                                />
                                <span className="font-medium text-gray-800">{type.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm text-gray-700">{type.code}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-600 text-sm">{type.description || 'No description'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditLeaveType(type)}
                                  className="p-2 text-[#6B8DA2] hover:bg-[#6B8DA2]/10 rounded-lg transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteLeaveType(type.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Details Modal */}
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
              <div className="p-6 border-b border-gray-100">
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
                          {selectedRequest.empName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{selectedRequest.empName}</h4>
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
                        <div className="flex items-center gap-3">
                          <CalendarDays className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">Joined: {getEmployeeDetails(selectedRequest.empId)?.joinDate || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Leave Balance */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-800 mb-4">Leave Balance</h4>
                      <div className="space-y-3">
                        {Object.entries(getEmployeeDetails(selectedRequest.empId)?.leaveBalance || {}).map(([type, balance]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{type}</span>
                            <span className="font-semibold text-blue-600">{balance} days</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getLeaveTypeColor(selectedRequest.type)}`}>
                              {selectedRequest.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Applied On</p>
                          <p className="font-medium">{selectedRequest.appliedDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Leave Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                        <p className="font-medium text-gray-800">{selectedRequest.from} to {selectedRequest.to}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Days</p>
                        <p className="text-2xl font-bold text-[#6B8DA2]">{selectedRequest.days} days</p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-2">Reason for Leave</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedRequest.reason}</p>
                    </div>

                    {/* Contact Information */}
                    {selectedRequest.contactDuringLeave && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-1">Contact During Leave</p>
                        <p className="font-medium text-gray-800">{selectedRequest.contactDuringLeave}</p>
                      </div>
                    )}

                    {/* Manager Notes */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Manager Notes</label>
                      <textarea
                        value={managerNotes[selectedRequest.id] || selectedRequest.managerNotes || ''}
                        onChange={(e) => setManagerNotes({
                          ...managerNotes,
                          [selectedRequest.id]: e.target.value
                        })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20"
                        placeholder="Add notes or comments about this leave request..."
                      />
                    </div>

                    {/* Action Buttons */}
                    {selectedRequest.status === 'pending' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAction(selectedRequest.id, 'approved', managerNotes[selectedRequest.id])}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Check className="w-5 h-5" />
                          Approve Leave
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAction(selectedRequest.id, 'rejected', managerNotes[selectedRequest.id])}
                          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <X className="w-5 h-5" />
                          Reject Leave
                        </motion.button>
                      </div>
                    )}
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
              <h3 className="text-xl font-bold text-gray-800 mb-4">Export Leave Data</h3>

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
                        className={`px-4 py-3 rounded-lg border-2 cursor-pointer ${exportFormat === format
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
                    <Calendar className="w-5 h-5 text-gray-400" />
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
                    {['Employee Information', 'Leave History', 'Manager Notes', 'Department Stats'].map((item) => (
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
                  onClick={() => {
                    alert(`Exporting ${filteredLeaves.length} leave requests in ${exportFormat.toUpperCase()} format...`);
                    setShowExportModal(false);
                  }}
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

export default LeavesPage;