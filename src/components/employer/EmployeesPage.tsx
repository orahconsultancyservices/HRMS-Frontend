import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Users, UserPlus, Search, Filter, Mail, Phone, MapPin,
  Briefcase, Calendar, Eye, Edit, Trash2,
  ChevronDown, ChevronUp,
  CheckCircle, Clock,
  DownloadCloud, X, Building,
  PhoneCall, PhoneMissed,
  User, Lock, ChevronLeft, ChevronRight,
  Cake
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useDepartments,
  usePositions,
  useLeaveBalance,
  useUpdateLeaveBalance
} from '../../hooks/useEmployees';
import { useLeaves } from '../../hooks/useLeaves';

// Define types
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string; // This comes from API
  email: string;
  orgEmail: string;
  orgPassword: string; // Actual password from API
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  leaveDate?: string;
  birthday?: string; // This is in the API response
  avatar?: string;
  location?: string;
  emergencyContact?: string;
  isActive?: boolean;
  // Add fields that might be missing but useful
  name?: string; // Not in API, but we can compute it
  empId?: string; // Alternative ID field

  // Add leave balance from API
  leaveBalance?: {
    id: number;
    employeeId: number;
    casual: number;
    sick: number;
    earned: number;
    maternity?: number;
    paternity?: number;
    bereavement?: number;
  };
}
interface LeaveRequest {
  id: number;
  empId: number;
  empName: string;
  type: 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement';
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

interface NewEmployeeForm {
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  orgEmail: string;
  orgPassword: string;
  phone: string;
  department: string;
  birthday: Date | null;
  position: string;
  joinDate: Date | null;
  leaveDate: Date | null;
  location: string;
  emergencyContact: string;
}

type DateRange = [Date | null, Date | null];

// Employee Info Tab Component
interface EmployeeInfoTabProps {
  newEmployee: NewEmployeeForm;
  setNewEmployee: React.Dispatch<React.SetStateAction<NewEmployeeForm>>;
  departments: string[];
  positions: string[];
  showCustomDepartment: boolean;
  setShowCustomDepartment: React.Dispatch<React.SetStateAction<boolean>>;
  showCustomPosition: boolean;
  setShowCustomPosition: React.Dispatch<React.SetStateAction<boolean>>;
  customDepartment: string;
  setCustomDepartment: React.Dispatch<React.SetStateAction<string>>;
  customPosition: string;
  setCustomPosition: React.Dispatch<React.SetStateAction<string>>;
  handleAddCustomDepartment: () => void;
  handleAddCustomPosition: () => void;
  isEditing: boolean;
}

const EmployeeInfoTab: React.FC<EmployeeInfoTabProps> = ({
  newEmployee,
  setNewEmployee,
  departments,
  positions,
  showCustomDepartment,
  setShowCustomDepartment,
  showCustomPosition,
  setShowCustomPosition,
  customDepartment,
  setCustomDepartment,
  customPosition,
  setCustomPosition,
  handleAddCustomDepartment,
  handleAddCustomPosition,
}) => {
  const [showOrgPassword, setShowOrgPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">First Name *</label>
          <input
            type="text"
            value={newEmployee.firstName}
            onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter First Name"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Last Name *</label>
          <input
            type="text"
            value={newEmployee.lastName}
            onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter Last Name"
          />
        </div>

        {/* Employee ID */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Employee ID *</label>
          <input
            type="text"
            value={newEmployee.employeeId}
            onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter Employee ID, e.g., O-001"
          />
        </div>

        {/* Personal Email */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Personal Email *</label>
          <input
            type="email"
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter personal email address"
          />
        </div>

        {/* Organization Email */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Organization Email *</label>
          <input
            type="email"
            value={newEmployee.orgEmail}
            onChange={(e) => setNewEmployee({ ...newEmployee, orgEmail: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter organization email"
          />
        </div>

        {/* Organization Password */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Organization Password *</label>
          <div className="relative">
            <input
              type={showOrgPassword ? "text" : "password"}
              value={newEmployee.orgPassword}
              onChange={(e) => setNewEmployee({ ...newEmployee, orgPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 pr-10"
              placeholder="Enter organization password"
            />
            <button
              type="button"
              onClick={() => setShowOrgPassword(!showOrgPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              {showOrgPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Personal Phone Number */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Personal Phone Number</label>
          <input
            type="tel"
            value={newEmployee.phone}
            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter personal phone number"
          />
        </div>

        {/* Department Field */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Department *</label>
          {!showCustomDepartment ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={newEmployee.department}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setShowCustomDepartment(true);
                      setNewEmployee({ ...newEmployee, department: '' });
                    } else {
                      setNewEmployee({ ...newEmployee, department: e.target.value });
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="custom" className="text-purple-600 font-medium">+ Create New Department</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  placeholder="Enter new department name"
                  autoFocus
                />
                <button
                  onClick={handleAddCustomDepartment}
                  disabled={!customDepartment.trim()}
                  className={`px-4 py-3 rounded-xl font-medium transition cursor-pointer ${customDepartment.trim()
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  title="Add Department"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setShowCustomDepartment(false);
                    setCustomDepartment('');
                    setNewEmployee({ ...newEmployee, department: '' });
                  }}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition cursor-pointer"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-500 ml-1">Enter a new department name and click the checkmark to add it</p>
            </div>
          )}
        </div>

        {/* Designation Field */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Designation *</label>
          {!showCustomPosition ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={newEmployee.position}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setShowCustomPosition(true);
                      setNewEmployee({ ...newEmployee, position: '' });
                    } else {
                      setNewEmployee({ ...newEmployee, position: e.target.value });
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer"
                >
                  <option value="">Select Designation</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                  <option value="custom" className="text-purple-600 font-medium">+ Create New Designation</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPosition}
                  onChange={(e) => setCustomPosition(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  placeholder="Enter new designation name"
                  autoFocus
                />
                <button
                  onClick={handleAddCustomPosition}
                  disabled={!customPosition.trim()}
                  className={`px-4 py-3 rounded-xl font-medium transition cursor-pointer ${customPosition.trim()
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  title="Add Designation"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setShowCustomPosition(false);
                    setCustomPosition('');
                    setNewEmployee({ ...newEmployee, position: '' });
                  }}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition cursor-pointer"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-500 ml-1">Enter a new designation name and click the checkmark to add it</p>
            </div>
          )}
        </div>

        {/* Birthday - NEW FIELD */}
        <div>
          <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
            <Cake className="w-4 h-4 text-purple-600" />
            Date of Birth
          </label>
          <DatePicker
            selected={newEmployee.birthday}
            onChange={(date: Date | null) => setNewEmployee({ ...newEmployee, birthday: date })}
            dateFormat="MMMM d, yyyy"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer"
            placeholderText="Select date of birth"
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            maxDate={new Date()}
            isClearable
          />
          <p className="text-sm text-gray-500 mt-1">This will be used for birthday reminders</p>
        </div>

        {/* Join Date and Leave Date */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Join Date</label>
          <DatePicker
            selected={newEmployee.joinDate}
            onChange={(date: Date | null) => setNewEmployee({ ...newEmployee, joinDate: date })}
            dateFormat="MMMM d, yyyy"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer"
            placeholderText="Select join date"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Leave Date</label>
          <DatePicker
            selected={newEmployee.leaveDate}
            onChange={(date: Date | null) => setNewEmployee({ ...newEmployee, leaveDate: date })}
            dateFormat="MMMM d, yyyy"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer"
            placeholderText="Select leave date (optional)"
            isClearable
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Location</label>
          <input
            type="text"
            value={newEmployee.location}
            onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter location"
          />
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Emergency Contact</label>
          <input
            type="text"
            value={newEmployee.emergencyContact}
            onChange={(e) => setNewEmployee({ ...newEmployee, emergencyContact: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter emergency contact"
          />
        </div>
      </div>
    </div>
  );
};

// Leave Balance Tab Component
interface LeaveBalanceTabProps {
  employee: Employee;
}

const LeaveBalanceTab: React.FC<LeaveBalanceTabProps> = ({ employee }) => {
  const { data: leaveBalanceData, isLoading, refetch } = useLeaveBalance(employee.id);
  const updateLeaveBalanceMutation = useUpdateLeaveBalance();

  const [leaveBalance, setLeaveBalance] = useState({
    casual: 12,
    sick: 8,
    earned: 20,
    maternity: 90,
    paternity: 7,
    bereavement: 7
  });

  useEffect(() => {
    if (leaveBalanceData) {
      setLeaveBalance({
        casual: leaveBalanceData.casual || 12,
        sick: leaveBalanceData.sick || 8,
        earned: leaveBalanceData.earned || 20,
        maternity: leaveBalanceData.maternity || 90,
        paternity: leaveBalanceData.paternity || 7,
        bereavement: leaveBalanceData.bereavement || 7
      });
    }
  }, [leaveBalanceData]);

  const handleLeaveBalanceChange = (type: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setLeaveBalance(prev => ({
      ...prev,
      [type.toLowerCase()]: numValue
    }));
  };

  const handleSaveLeaveBalance = () => {
    updateLeaveBalanceMutation.mutate({
      employeeId: employee.id,
      data: leaveBalance
    }, {
      onSuccess: () => {
        alert('Leave balance updated successfully!');
        refetch();
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to update leave balance');
      }
    });
  };

  // Mock leave history data
  const allLeaveHistory = [
    {
      id: 1,
      type: 'Casual' as const,
      startDate: '2024-02-15',
      endDate: '2024-02-17',
      days: 3,
      reason: 'Family function',
      status: 'approved' as const
    },
    // ... other mock data
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const totalPages = Math.ceil(allLeaveHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeaveHistory = allLeaveHistory.slice(startIndex, endIndex);

  const [newLeave, setNewLeave] = useState({
    type: 'Casual' as const,
    startDate: '',
    endDate: '',
    reason: ''
  });

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'Casual': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Sick': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Earned': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Maternity': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'Paternity': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Bereavement': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading leave balance...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(leaveBalance).map(([type, days]) => (
              <div key={type} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 capitalize">{type}</span>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => handleLeaveBalanceChange(type, e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                    min="0"
                  />
                </div>
                <div className="text-2xl font-bold text-purple-600">{days} days</div>
                <div className="text-xs text-gray-500 mt-1">Available balance</div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveLeaveBalance}
              disabled={updateLeaveBalanceMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateLeaveBalanceMutation.isPending ? 'Updating...' : 'Update Balance'}
            </button>
          </div>
        </>
      )}

      {/* Leave History Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Leave History</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date Range</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentLeaveHistory.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLeaveTypeColor(leave.type)}`}>
                      {leave.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {leave.startDate} to {leave.endDate}
                  </td>
                  <td className="px-4 py-3 font-medium">{leave.days} days</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{leave.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Employee Full Info Tab Component
interface EmployeeFullInfoTabProps {
  employee: Employee;
}

const EmployeeFullInfoTab: React.FC<EmployeeFullInfoTabProps> = ({ employee }) => {
  if (!employee) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">
          <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-gray-500">Employee information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 text-lg">Personal Information</h4>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Full Name</span>
            <span className="font-medium">{employee.name || `${employee.firstName} ${employee.lastName}`}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Personal Email</span>
            <span className="font-medium">{employee.email || 'Not provided'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Phone Number</span>
            <span className="font-medium">{employee.phone || 'Not provided'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Emergency Contact</span>
            <span className="font-medium">{employee.emergencyContact || 'Not provided'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Location</span>
            <span className="font-medium">{employee.location || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 text-lg">Employment Information</h4>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Employee ID</span>
            <span className="font-medium">{employee.employeeId || employee.empId || `EMP-${employee.id.toString().padStart(4, '0')}`}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Department</span>
            <span className="font-medium">{employee.department || 'Not provided'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Position</span>
            <span className="font-medium">{employee.position || 'Not provided'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Organization Email</span>
            <span className="font-medium">{employee.orgEmail || 'Not provided'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 flex items-center gap-2">
              <Cake className="w-4 h-4 text-purple-600" />
              Date of Birth
            </span>
            <span className="font-medium">
              {employee.birthday ? new Date(employee.birthday).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not provided'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Organization Password</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {employee.orgPassword}
              </span>
              {employee.orgPassword && <Lock className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Join Date</span>
            <span className="font-medium">
              {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not provided'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Employee Leave History Tab Component
interface EmployeeLeaveHistoryTabProps {
  employee: Employee;
  leaveRequests?: LeaveRequest[];
}

const EmployeeLeaveHistoryTab: React.FC<EmployeeLeaveHistoryTabProps> = ({ employee, leaveRequests = [] }) => {
  const employeeLeaves = leaveRequests.filter(leave => leave.empId === employee.id);
  const sortedLeaves = [...employeeLeaves].sort((a, b) =>
    new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const totalPages = Math.ceil(sortedLeaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeaves = sortedLeaves.slice(startIndex, endIndex);

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'Casual': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Sick': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Earned': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Maternity': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'Paternity': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Bereavement': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(employee.leaveBalance || { casual: 0, sick: 0, earned: 0 }).map(([type, days]) => (
          <div key={type} className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-sm text-gray-600 capitalize">{type}</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{days}</div>
            <div className="text-xs text-gray-500">days left</div>
          </div>
        ))}
      </div>

      {/* Leave Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="text-sm text-blue-600">Total Leaves Taken</div>
          <div className="text-2xl font-bold text-blue-700">{employeeLeaves.length}</div>
          <div className="text-xs text-blue-500 mt-1">All time</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
          <div className="text-sm text-green-600">Approved Leaves</div>
          <div className="text-2xl font-bold text-green-700">
            {employeeLeaves.filter(l => l.status === 'approved').length}
          </div>
          <div className="text-xs text-green-500 mt-1">This year</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6">
          <div className="text-sm text-yellow-600">Pending Requests</div>
          <div className="text-2xl font-bold text-yellow-700">
            {employeeLeaves.filter(l => l.status === 'pending').length}
          </div>
          <div className="text-xs text-yellow-500 mt-1">Awaiting approval</div>
        </div>
      </div>

      {/* Leave History Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Leave History</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {sortedLeaves.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No leave history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date Range</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLeaveTypeColor(leave.type)}`}>
                        {leave.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{leave.days} days</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{leave.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                        leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(leave.appliedDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Employee Attendance Tab Component
const EmployeeAttendanceTab: React.FC = () => {
  // Mock attendance data
  const generateAttendanceData = () => {
    const data = [];
    for (let month = 0; month < 5; month++) {
      for (let day = 1; day <= 30; day++) {
        const date = new Date(2024, month, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const statuses = ['present', 'present', 'present', 'present', 'late', 'leave'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        data.push({
          date: date.toISOString().split('T')[0],
          checkIn: randomStatus === 'leave' ? '-' : randomStatus === 'late' ? '10:00 AM' : '09:00 AM',
          checkOut: randomStatus === 'leave' ? '-' : '06:00 PM',
          status: randomStatus as 'present' | 'late' | 'leave',
          hours: randomStatus === 'leave' ? '0' : randomStatus === 'late' ? '8.0' : '9.0'
        });
      }
    }
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const allAttendanceData = generateAttendanceData();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const totalPages = Math.ceil(allAttendanceData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttendanceData = allAttendanceData.slice(startIndex, endIndex);

  const currentMonthAttendance = allAttendanceData.filter(record => {
    const date = new Date(record.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const stats = {
    present: currentMonthAttendance.filter(a => a.status === 'present').length,
    late: currentMonthAttendance.filter(a => a.status === 'late').length,
    leave: currentMonthAttendance.filter(a => a.status === 'leave').length,
    totalHours: currentMonthAttendance.reduce((sum, a) => sum + parseFloat(a.hours), 0)
  };

  return (
    <div className="space-y-6">
      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
          <div className="text-sm text-green-600">Days Present</div>
          <div className="text-2xl font-bold text-green-700">{stats.present}</div>
          <div className="text-xs text-green-500 mt-1">This month</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6">
          <div className="text-sm text-yellow-600">Late Arrivals</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.late}</div>
          <div className="text-xs text-yellow-500 mt-1">This month</div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="text-sm text-blue-600">Leave Days</div>
          <div className="text-2xl font-bold text-blue-700">{stats.leave}</div>
          <div className="text-xs text-blue-500 mt-1">This month</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
          <div className="text-sm text-purple-600">Total Hours</div>
          <div className="text-2xl font-bold text-purple-700">{stats.totalHours.toFixed(1)}</div>
          <div className="text-xs text-purple-500 mt-1">This month</div>
        </div>
      </div>

      {/* Attendance Calendar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">Attendance Calendar - {monthNames[currentMonth]} {currentYear}</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 px-2">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}

          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 bg-gray-50 rounded-lg" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const attendance = currentMonthAttendance.find(a => a.date === dateStr);
            const status = attendance?.status || 'future';
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div key={day} className={`h-10 rounded-lg flex items-center justify-center relative ${status === 'present' ? 'bg-green-100 text-green-700' :
                status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                  status === 'leave' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-400'
                } ${isToday ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}>
                {day}
                {attendance && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-current opacity-60" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            Present
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            Late
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            Leave
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            No Data
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Daily Attendance Log</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Check In</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Check Out</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Working Hours</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentAttendanceData.map((attendance, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {new Date(attendance.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{attendance.checkIn}</td>
                  <td className="px-4 py-3 font-medium">{attendance.checkOut}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${attendance.status === 'present' ? 'bg-green-100 text-green-700' :
                      attendance.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{attendance.hours} hrs</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {attendance.status === 'late' ? 'Late arrival' :
                      attendance.status === 'leave' ? 'On leave' : 'Regular day'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main EmployeesPage Component
const EmployeesPage = () => {
  // React Query hooks
  const { data: employeesData, isLoading, error, refetch } = useEmployees();

  const { data: departmentsData } = useDepartments();
  const { data: positionsData } = usePositions();
  const { data: leaveRequestsData } = useLeaves();

  const employees = Array.isArray(employeesData) ? employeesData : [];
  const departments = Array.isArray(departmentsData) ? departmentsData : (Array.isArray(departmentsData?.data) ? departmentsData.data : []);
  const positions = Array.isArray(positionsData) ? positionsData : (Array.isArray(positionsData?.data) ? positionsData.data : []);
  const leaveRequests = Array.isArray(leaveRequestsData) ? leaveRequestsData : (Array.isArray(leaveRequestsData?.data) ? leaveRequestsData.data : []);

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    position: 'all'
  });
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>({
    firstName: '',
    lastName: '',
    employeeId: '',
    email: '',
    orgEmail: '',
    orgPassword: '',
    phone: '',
    department: '',
    birthday: null,
    position: '',
    joinDate: null,
    leaveDate: null,
    location: '',
    emergencyContact: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [departmentsState, setDepartmentsState] = useState<string[]>([]);
  const [positionsState, setPositionsState] = useState<string[]>([]);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [showCustomPosition, setShowCustomPosition] = useState(false);
  const [customDepartment, setCustomDepartment] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const [activeEditTab, setActiveEditTab] = useState('info');
  const [viewModalTab, setViewModalTab] = useState('info');

  const [startDate, endDate] = dateRange;




  // Initialize departments and positions
  useEffect(() => {
    if (departments.length > 0) {
      setDepartmentsState(departments);
    } else {
      // Default departments if API returns empty
      setDepartmentsState(['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']);
    }

    if (positions.length > 0) {
      setPositionsState(positions);
    } else {
      // Default positions if API returns empty
      setPositionsState(['Developer', 'Designer', 'Manager', 'Analyst', 'Executive', 'Specialist']);
    }
  }, [departments, positions]);

  useEffect(() => {
    if (departments && Array.isArray(departments)) {
      // Filter out null/undefined and ensure unique values
      const uniqueDepartments = [...new Set(departments.filter(dept => dept && dept.trim() !== ''))];
      setDepartmentsState(uniqueDepartments);
    }

    if (positions && Array.isArray(positions)) {
      const uniquePositions = [...new Set(positions.filter(pos => pos && pos.trim() !== ''))];
      setPositionsState(uniquePositions);
    }
  }, [departments, positions]);

  const transformApiEmployee = (apiEmployee: any): Employee => {
    if (!apiEmployee) return null;

    return {
      id: apiEmployee.id || 0,
      firstName: apiEmployee.firstName || '',
      lastName: apiEmployee.lastName || '',
      name: `${apiEmployee.firstName || ''} ${apiEmployee.lastName || ''}`.trim(),
      employeeId: apiEmployee.employeeId || `EMP-${apiEmployee.id?.toString().padStart(4, '0')}`,
      email: apiEmployee.email || '',
      orgEmail: apiEmployee.orgEmail || '',
      orgPassword: apiEmployee.orgPassword || '', // This should be the actual password from API
      phone: apiEmployee.phone || '',
      department: apiEmployee.department || '',
      position: apiEmployee.position || '',
      joinDate: apiEmployee.joinDate || '',
      leaveDate: apiEmployee.leaveDate,
      birthday: apiEmployee.birthday,
      avatar: apiEmployee.avatar || (apiEmployee.firstName ? apiEmployee.firstName.charAt(0).toUpperCase() : '?'),
      location: apiEmployee.location || '',
      emergencyContact: apiEmployee.emergencyContact || '',
      isActive: apiEmployee.isActive !== undefined ? apiEmployee.isActive : true,
      leaveBalance: apiEmployee.leaveBalance || {
        casual: 0,
        sick: 0,
        earned: 0
      }
    };
  };

  const processedEmployees = React.useMemo(() => {
    if (Array.isArray(employeesData)) {
      return employeesData.map(transformApiEmployee);
    }
    return [];
  }, [employeesData]);

  useEffect(() => {
    console.log('📊 Employees Data from API:', employeesData);
    console.log('📊 Employees array:', employees);
    console.log('📊 Processed employees:', processedEmployees);
  }, [employeesData, employees, processedEmployees]);

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filters.department === 'all' || emp.department === filters.department;
    const matchesPosition = filters.position === 'all' || emp.position === filters.position;

    const joinDate = new Date(emp.joinDate);
    const matchesDate = (!startDate || joinDate >= startDate) &&
      (!endDate || joinDate <= endDate);

    return matchesSearch && matchesDepartment && matchesPosition && matchesDate;
  });

  // Handle employee actions
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewModalTab('info');
    setShowEmployeeDetailsModal(true);
  };

const handleEditEmployee = (employee: Employee) => {
  setNewEmployee({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    employeeId: employee.employeeId || `EMP-${employee.id.toString().padStart(4, '0')}`,
    email: employee.email || '',
    orgEmail: employee.orgEmail || '',
    orgPassword: '', // Leave empty or show placeholder
    phone: employee.phone || '',
    department: employee.department || '',
    position: employee.position || '',
    joinDate: employee.joinDate ? new Date(employee.joinDate) : new Date(),
    leaveDate: employee.leaveDate ? new Date(employee.leaveDate) : null,
    birthday: employee.birthday ? new Date(employee.birthday) : null,
    location: employee.location || '',
    emergencyContact: employee.emergencyContact || ''
  });
    setSelectedEmployee(employee);
    setIsEditing(true);
    setActiveEditTab('info');
    setShowEmployeeModal(true);
  };

  // Safe avatar getter
  // Update the getEmployeeAvatar function:
  const getEmployeeAvatar = (employee: Employee | string | null) => {
    if (!employee) return '?';

    if (typeof employee === 'string') {
      return employee.trim().charAt(0).toUpperCase() || '?';
    }

    // Try in order: avatar, firstName, name
    if (employee.avatar && employee.avatar.trim() !== '') {
      return employee.avatar.trim().charAt(0).toUpperCase();
    }

    if (employee.firstName && employee.firstName.trim() !== '') {
      return employee.firstName.trim().charAt(0).toUpperCase();
    }

    if (employee.name && employee.name.trim() !== '') {
      return employee.name.trim().charAt(0).toUpperCase();
    }

    return '?';
  };

  const handleDeleteEmployee = (id: number) => {
    const employeeToDelete = employees.find(e => e.id === id);
    if (employeeToDelete) {
      setSelectedEmployee(employeeToDelete);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteEmployeeMutation.mutate(selectedEmployee.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setSelectedEmployee(null);
          refetch();
        },
        onError: (error: any) => {
          alert(error.response?.data?.message || 'Failed to delete employee');
        }
      });
    }
  };

  const handleAddEmployee = () => {
    setNewEmployee({
      firstName: '',
      lastName: '',
      employeeId: '',
      email: '',
      orgEmail: '',
      orgPassword: '',
      phone: '',
      department: '',
      position: '',
      joinDate: null,
      leaveDate: null,
      location: '',
      emergencyContact: ''
    });
    setIsEditing(false);
    setShowCustomDepartment(false);
    setShowCustomPosition(false);
    setCustomDepartment('');
    setCustomPosition('');
    setShowEmployeeModal(true);
  };

  const handleAddCustomDepartment = () => {
    if (customDepartment.trim() && !departmentsState.includes(customDepartment.trim())) {
      const newDept = customDepartment.trim();
      setDepartmentsState(prev => [...prev, newDept]);
      setNewEmployee(prev => ({ ...prev, department: newDept }));
      setCustomDepartment('');
      setShowCustomDepartment(false);
    }
  };

  const handleAddCustomPosition = () => {
    if (customPosition.trim() && !positionsState.includes(customPosition.trim())) {
      const newPos = customPosition.trim();
      setPositionsState(prev => [...prev, newPos]);
      setNewEmployee(prev => ({ ...prev, position: newPos }));
      setCustomPosition('');
      setShowCustomPosition(false);
    }
  };

  const handleSaveEmployee = () => {
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.employeeId ||
      !newEmployee.email || !newEmployee.orgEmail || !newEmployee.orgPassword ||
      !newEmployee.department || !newEmployee.position) {
      alert('Please fill in all required fields');
      return;
    }

    const employeeData = {
      firstName: newEmployee.firstName.trim(),
      lastName: newEmployee.lastName.trim(),
      employeeId: newEmployee.employeeId.trim(),
      email: newEmployee.email.trim(),
      orgEmail: newEmployee.orgEmail.trim(),
      orgPassword: newEmployee.orgPassword.trim(),
      phone: newEmployee.phone.trim(),
      department: newEmployee.department,
      position: newEmployee.position,
      joinDate: newEmployee.joinDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      leaveDate: newEmployee.leaveDate?.toISOString().split('T')[0] || undefined,
      birthday: newEmployee.birthday?.toISOString().split('T')[0] || undefined,
      location: newEmployee.location.trim(),
      emergencyContact: newEmployee.emergencyContact.trim()
    };

    if (isEditing && selectedEmployee) {
      updateEmployeeMutation.mutate({
        id: selectedEmployee.id,
        data: employeeData
      }, {
        onSuccess: () => {
          setShowEmployeeModal(false);
          resetNewEmployeeForm();
          setSelectedEmployee(null);
          refetch();
        },
        onError: (error: any) => {
          alert(error.response?.data?.message || 'Failed to update employee');
        }
      });
    } else {
      createEmployeeMutation.mutate(employeeData, {
        onSuccess: () => {
          setShowEmployeeModal(false);
          resetNewEmployeeForm();
          refetch();
        },
        onError: (error: any) => {
          alert(error.response?.data?.message || 'Failed to create employee');
        }
      });
    }
  };

  const resetNewEmployeeForm = () => {
    setNewEmployee({
      firstName: '',
      lastName: '',
      employeeId: '',
      email: '',
      orgEmail: '',
      orgPassword: '',
      phone: '',
      department: '',
      position: '',
      joinDate: null,
      leaveDate: null,
      location: '',
      emergencyContact: ''
    });
    setShowCustomDepartment(false);
    setShowCustomPosition(false);
    setCustomDepartment('');
    setCustomPosition('');
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

  const getDepartmentColor = (dept: string) => {
    const colors: { [key: string]: string } = {
      'Engineering': 'bg-blue-100 text-blue-700',
      'Design': 'bg-pink-100 text-pink-700',
      'Marketing': 'bg-green-100 text-green-700',
      'Sales': 'bg-purple-100 text-purple-700',
      'HR': 'bg-orange-100 text-orange-700',
      'Finance': 'bg-teal-100 text-teal-700',
      'Operations': 'bg-indigo-100 text-indigo-700'
    };
    return colors[dept] || 'bg-gray-100 text-gray-700';
  };

  const clearDateRange = () => {
    setDateRange([null, null]);
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
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', damping: 20, stiffness: 300 }
    },
    exit: { opacity: 0, scale: 0.95 }
  };

  // Grid view item component
  const EmployeeGridItem = ({ employee }: { employee: Employee }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {getEmployeeAvatar(employee)}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{employee.name || `${employee.firstName} ${employee.lastName}`}</h4>
              <p className="text-gray-600 text-sm">{employee.position || 'N/A'}</p>
            </div>
          </div>
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 truncate">{employee.email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{employee.department || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1">
  <Lock className="w-4 h-4 text-gray-400" />
  <span className="text-gray-600">{employee.orgEmail || 'No org email'}</span>
</div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {employee.isActive ? 'Active' : 'Inactive'}
          </span>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleEditEmployee(employee)}
              className="p-1 text-yellow-600 hover:bg-yellow-100 rounded-lg transition cursor-pointer"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDeleteEmployee(employee.id)}
              className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-red-800 font-semibold">Error loading employees</h3>
        <p className="text-red-600 mt-2">Please try again later.</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
        >
          Retry
        </button>
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
          <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
          <p className="text-gray-500">Manage all employee records and information</p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-xl hover:shadow-lg transition cursor-pointer flex items-center gap-2"
          >
            <DownloadCloud className="w-4 h-4" />
            Export
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddEmployee}
            disabled={createEmployeeMutation.isPending}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5" />
            {createEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
          </motion.button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Employees</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{processedEmployees.length}</p>
              <p className="text-gray-400 text-sm mt-1">Across all depart ments</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Position Types</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{positionsState.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Departments</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{departmentsState.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl flex items-center justify-center shadow-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Leave Requests</p>
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
                placeholder="Search employees by name, email, or position..."
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
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white"
              >
                <option value="all">All Departments</option>
                {departmentsState.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <select
              value={filters.position}
              onChange={(e) => setFilters({ ...filters, position: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white"
            >
              <option value="all">All Positions</option>
              {positionsState.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            <div className="relative">
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update: DateRange) => setDateRange(update)}
                dateFormat="MMM d, yyyy"
                placeholderText="Join Date Range"
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] bg-white cursor-pointer pr-10"
              />
              {(startDate || endDate) && (
                <button
                  onClick={clearDateRange}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  title="Clear date range"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 cursor-pointer ${viewMode === 'list' ? 'bg-[#6B8DA2] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 cursor-pointer ${viewMode === 'grid' ? 'bg-[#6B8DA2] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Employees View */}
      {viewMode === 'list' ? (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#6B8DA2]" />
                  Employee Directory
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredEmployees.length} employees)
                  </span>
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Showing {filteredEmployees.length} of {employees.length} employees
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Employee</th>
                  <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Department</th>
                  <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Position</th>
                  <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Phone Number</th>
                  <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Join Date</th>
                  <th className="text-left px-6 py-4 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-gray-500">No employees found</p>
                          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp, index) => {
                      const isExpanded = expandedRows.has(emp.id);
                      const employeeName = emp.name || `${emp.firstName} ${emp.lastName}`;

                      return (
                        <React.Fragment key={emp.id}>
                          <motion.tr
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-t border-gray-100 hover:bg-gray-50 group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {getEmployeeAvatar(emp)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {emp.name || `${emp.firstName} ${emp.lastName}`}
                                  </div>
                                  <div className="text-gray-500 text-xs">{emp.employeeId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getDepartmentColor(emp.department)}`}>
                                {emp.department || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{emp.position || 'N/A'}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{emp.phone || 'No phone'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }) : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => toggleRowExpansion(emp.id)}
                                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                                  title={isExpanded ? "Hide Details" : "Show Details"}
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleViewEmployee(emp)}
                                  className="p-2 text-[#6B8DA2] hover:bg-[#6B8DA2]/10 rounded-lg transition cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditEmployee(emp)}
                                  className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
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
                              <td colSpan={6} className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Contact Information */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                      <Phone className="w-4 h-4" />
                                      Contact Information
                                    </h4>
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{emp.email || 'N/A'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{emp.orgEmail || 'N/A'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <PhoneCall className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{emp.phone || 'N/A'}</span>
                                      </div>
                                      {emp.location && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="w-4 h-4 text-gray-400" />
                                          <span className="text-sm">{emp.location}</span>
                                        </div>
                                      )}
                                      {emp.emergencyContact && (
                                        <div className="flex items-center gap-2">
                                          <PhoneMissed className="w-4 h-4 text-gray-400" />
                                          <span className="text-sm">Emergency: {emp.emergencyContact}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Job Details */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                      <Briefcase className="w-4 h-4" />
                                      Job Details
                                    </h4>
                                    <div className="space-y-3">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Department:</span>
                                        <span className="text-sm font-medium">{emp.department || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Position:</span>
                                        <span className="text-sm font-medium">{emp.position || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Join Date:</span>
                                        <span className="text-sm font-medium">{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Org Password:</span>
                                        <span className="text-sm font-medium flex items-center gap-1">
                                          {emp.orgPassword ? '••••••••' : 'N/A'}
                                          {emp.orgPassword && <Lock className="w-3 h-3 text-gray-400" />}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Leave Balance */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      Leave Balance
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-blue-600">Casual</p>
                                        <p className="text-lg font-bold text-blue-700">{emp.leaveBalance?.casual || 0}</p>
                                      </div>
                                      <div className="bg-orange-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-orange-600">Sick</p>
                                        <p className="text-lg font-bold text-orange-700">{emp.leaveBalance?.sick || 0}</p>
                                      </div>
                                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-purple-600">Earned</p>
                                        <p className="text-lg font-bold text-purple-700">{emp.leaveBalance?.earned || 0}</p>
                                      </div>
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
      ) : (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {filteredEmployees.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-gray-500 text-lg font-medium">No employees found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <EmployeeGridItem key={employee.id} employee={employee} />
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add/Edit Employee Modal */}
      <AnimatePresence>
        {showEmployeeModal && (
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
                    <UserPlus className="w-6 h-6 text-purple-600" />
                    {isEditing ? 'Edit Employee' : 'Add New Employee'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEmployeeModal(false);
                      resetNewEmployeeForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Tabs for Edit Mode */}
              {isEditing && selectedEmployee && (
                <div className='flex items-left justify-left h-12 border-b border-gray-200 px-6'>
                  <div className='flex'>
                    <button
                      className={`py-3 px-6 border-b-2 cursor-pointer transition ${activeEditTab === 'info' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveEditTab('info')}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Employee Information
                      </div>
                    </button>
                    <button
                      className={`py-3 px-6 border-b-2 cursor-pointer transition ${activeEditTab === 'leave' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveEditTab('leave')}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Leave Balance
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Content */}
              <div className="p-6">
                {isEditing && activeEditTab === 'leave' && selectedEmployee ? (
                  <LeaveBalanceTab employee={selectedEmployee} />
                ) : (
                  <EmployeeInfoTab
                    newEmployee={newEmployee}
                    setNewEmployee={setNewEmployee}
                    departments={departmentsState}
                    positions={positionsState}
                    showCustomDepartment={showCustomDepartment}
                    setShowCustomDepartment={setShowCustomDepartment}
                    showCustomPosition={showCustomPosition}
                    setShowCustomPosition={setShowCustomPosition}
                    customDepartment={customDepartment}
                    setCustomDepartment={setCustomDepartment}
                    customPosition={customPosition}
                    setCustomPosition={setCustomPosition}
                    handleAddCustomDepartment={handleAddCustomDepartment}
                    handleAddCustomPosition={handleAddCustomPosition}
                    isEditing={isEditing}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveEmployee}
                    disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEditing
                      ? (updateEmployeeMutation.isPending ? 'Updating...' : 'Update Employee')
                      : (createEmployeeMutation.isPending ? 'Adding...' : 'Add Employee')}
                  </motion.button>
                  <button
                    onClick={() => {
                      setShowEmployeeModal(false);
                      resetNewEmployeeForm();
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Delete Employee</h3>
                  <p className="text-gray-600">Are you sure you want to delete this employee?</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {getEmployeeAvatar(selectedEmployee)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedEmployee.name || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}</p>
                    <p className="text-gray-600 text-sm">{selectedEmployee.position || 'N/A'} • {selectedEmployee.department || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <p className="text-red-600 text-sm mb-6">
                This action cannot be undone. All related data (attendance, leaves, etc.) will also be removed.
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmDelete}
                  disabled={deleteEmployeeMutation.isPending}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteEmployeeMutation.isPending ? 'Deleting...' : 'Delete Employee'}
                </motion.button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Employee Details Modal */}
      <AnimatePresence>
        {showEmployeeDetailsModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {getEmployeeAvatar(selectedEmployee)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {selectedEmployee.name || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                      </h3>
                      <p className="text-gray-600">{selectedEmployee.position} • {selectedEmployee.department}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEmployeeDetailsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 px-6">
                <button
                  className={`py-4 px-6 border-b-2 cursor-pointer transition ${viewModalTab === 'info' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setViewModalTab('info')}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Employee Information
                  </div>
                </button>
                <button
                  className={`py-4 px-6 border-b-2 cursor-pointer transition ${viewModalTab === 'leave' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setViewModalTab('leave')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Leave Balance & History
                  </div>
                </button>
                <button
                  className={`py-4 px-6 border-b-2 cursor-pointer transition ${viewModalTab === 'attendance' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setViewModalTab('attendance')}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Attendance History
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {viewModalTab === 'info' && (
                  <EmployeeFullInfoTab employee={selectedEmployee} />
                )}

                {viewModalTab === 'leave' && (
                  <EmployeeLeaveHistoryTab
                    employee={selectedEmployee}
                    leaveRequests={leaveRequests}
                  />
                )}

                {viewModalTab === 'attendance' && (
                  <EmployeeAttendanceTab />
                )}
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
              <h3 className="text-xl font-bold text-gray-800 mb-4">Export Employee Data</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Export Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['csv', 'pdf', 'excel'].map((format) => (
                      <motion.button
                        key={format}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setExportFormat(format as 'csv' | 'pdf' | 'excel')}
                        className={`px-4 py-3 rounded-lg border-2 cursor-pointer ${exportFormat === format
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {format.toUpperCase()}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Include Details</label>
                  <div className="space-y-2">
                    {[
                      'Contact Information',
                      'Employment Details',
                      'Organization Credentials',
                      'Leave Balance',
                      'Department Information'
                    ].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
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
                    alert(`Exporting ${employees.length} employees in ${exportFormat.toUpperCase()} format...`);
                    setShowExportModal(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg transition cursor-pointer"
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

export default EmployeesPage;