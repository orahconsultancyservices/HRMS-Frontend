import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Search, Filter, Mail, Phone, MapPin,
  Briefcase, Calendar, Eye, Edit, Trash2,
  ChevronDown, ChevronUp, FileText,
  CheckCircle, XCircle, Clock,
  DownloadCloud, X, Building, UserCheck,
  PhoneCall, PhoneMissed,
  PhoneCallIcon,
  User, Lock, ChevronLeft, ChevronRight
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Define types
interface Employee {
  id: number;
  name: string;
  email: string;
  orgEmail: string; // Added organization email
  orgPassword: string; // Added organization password
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  avatar?: string;
  location?: string;
  emergencyContact?: string;
  skills?: string[];
  leaveBalance?: {
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
  name: string;
  email: string;
  orgEmail: string; // Added organization email
  orgPassword: string; // Added organization password
  phone: string;
  department: string;
  position: string;
  joinDate: Date | null;
  location: string;
  emergencyContact: string;
}

interface EmployeesPageProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  departments?: string[];
  positions?: string[];
  leaveRequests?: LeaveRequest[];
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
  isEditing
}) => {
  const [showOrgPassword, setShowOrgPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Full Name *</label>
          <input
            type="text"
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter full name"
          />
        </div>

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
              aria-label={showOrgPassword ? "Hide password" : "Show password"}
            >
              {showOrgPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Personal Phone Number</label>
          <input
            type="tel"
            value={newEmployee.phone}
            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter Personal phone number"
          />
        </div>

        {/* Department Field with Create Option */}
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="custom">+ Create New Department</option>
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
                />
                <button
                  onClick={handleAddCustomDepartment}
                  disabled={!customDepartment.trim()}
                  className={`px-4 py-3 rounded-xl font-medium transition cursor-pointer ${customDepartment.trim()
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
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
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Position Field with Create Option */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Position *</label>
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white"
                >
                  <option value="">Select Position</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                  <option value="custom">+ Create New Position</option>
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
                  placeholder="Enter new position name"
                />
                <button
                  onClick={handleAddCustomPosition}
                  disabled={!customPosition.trim()}
                  className={`px-4 py-3 rounded-xl font-medium transition cursor-pointer ${customPosition.trim()
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
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
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

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
          <label className="block text-gray-700 font-medium mb-2">Location</label>
          <input
            type="text"
            value={newEmployee.location}
            onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter location"
          />
        </div>

        <div className="md:col-span-2">
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

// Paginated Leave Balance Tab Component
interface LeaveBalanceTabProps {
  employee: Employee;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

const LeaveBalanceTab: React.FC<LeaveBalanceTabProps> = ({ employee, employees, setEmployees }) => {
  const [leaveBalance, setLeaveBalance] = useState({
    casual: employee?.leaveBalance?.casual || 12,
    sick: employee?.leaveBalance?.sick || 8,
    earned: employee?.leaveBalance?.earned || 20,
    maternity: employee?.leaveBalance?.maternity || 90,
    paternity: employee?.leaveBalance?.paternity || 7,
    bereavement: employee?.leaveBalance?.bereavement || 7
  });

  // Mock leave history data (latest first)
  const allLeaveHistory = [
    {
      id: 1,
      type: 'Casual' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2024-02-15',
      endDate: '2024-02-17',
      days: 3,
      reason: 'Family function',
      status: 'approved' as 'approved'
    },
    {
      id: 2,
      type: 'Sick' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2024-02-10',
      endDate: '2024-02-12',
      days: 3,
      reason: 'Flu',
      status: 'approved' as 'approved'
    },
    {
      id: 3,
      type: 'Earned' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2024-02-01',
      endDate: '2024-02-07',
      days: 7,
      reason: 'Vacation',
      status: 'approved' as 'approved'
    },
    {
      id: 4,
      type: 'Casual' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2024-01-25',
      endDate: '2024-01-26',
      days: 2,
      reason: 'Personal work',
      status: 'approved' as 'approved'
    },
    {
      id: 5,
      type: 'Sick' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2024-01-20',
      endDate: '2024-01-21',
      days: 2,
      reason: 'Fever',
      status: 'approved' as 'approved'
    },
    {
      id: 6,
      type: 'Casual' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2024-01-15',
      endDate: '2024-01-16',
      days: 2,
      reason: 'Doctor appointment',
      status: 'approved' as 'approved'
    },
    {
      id: 7,
      type: 'Earned' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2024-01-10',
      endDate: '2024-01-11',
      days: 2,
      reason: 'Family event',
      status: 'approved' as 'approved'
    },
    {
      id: 8,
      type: 'Sick' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2024-01-05',
      endDate: '2024-01-06',
      days: 2,
      reason: 'Migraine',
      status: 'approved' as 'approved'
    },
    {
      id: 9,
      type: 'Casual' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2024-01-02',
      endDate: '2024-01-03',
      days: 2,
      reason: 'Personal',
      status: 'approved' as 'approved'
    },
    {
      id: 10,
      type: 'Earned' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
      startDate: '2023-12-28',
      endDate: '2023-12-29',
      days: 2,
      reason: 'Year end break',
      status: 'approved' as 'approved'
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Calculate pagination
  const totalPages = Math.ceil(allLeaveHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeaveHistory = allLeaveHistory.slice(startIndex, endIndex);

  const [newLeave, setNewLeave] = useState({
    type: 'Casual' as 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Bereavement',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleLeaveBalanceChange = (type: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setLeaveBalance(prev => ({
      ...prev,
      [type.toLowerCase()]: numValue
    }));
  };

  const handleSaveLeaveBalance = () => {
    if (employee) {
      setEmployees(prev => prev.map(emp =>
        emp.id === employee.id
          ? { ...emp, leaveBalance }
          : emp
      ));
      alert('Leave balance updated successfully!');
    }
  };

  const handleAddLeave = () => {
    if (!newLeave.startDate || !newLeave.endDate) {
      alert('Please select start and end dates');
      return;
    }

    const start = new Date(newLeave.startDate);
    const end = new Date(newLeave.endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newLeaveEntry = {
      id: Date.now(),
      type: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      days: daysDiff,
      reason: newLeave.reason,
      status: 'approved' as 'approved'
    };

    // Add to beginning of array (latest first)
    allLeaveHistory.unshift(newLeaveEntry);

    // Deduct from balance
    setLeaveBalance(prev => ({
      ...prev,
      [newLeave.type.toLowerCase()]: Math.max(0, (prev[newLeave.type.toLowerCase() as keyof typeof prev] as number) - daysDiff)
    }));

    setNewLeave({
      type: 'Casual',
      startDate: '',
      endDate: '',
      reason: ''
    });

    // Reset to first page to show the newly added leave
    setCurrentPage(1);
  };

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
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer"
        >
          Update Balance
        </button>
      </div>

      {/* Add New Leave Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-800 mb-4">Add Leave History</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={newLeave.type}
            onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="Casual">Casual Leave</option>
            <option value="Sick">Sick Leave</option>
            <option value="Earned">Earned Leave</option>
            <option value="Maternity">Maternity Leave</option>
            <option value="Paternity">Paternity Leave</option>
            <option value="Bereavement">Bereavement Leave</option>
          </select>

          <input
            type="date"
            value={newLeave.startDate}
            onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />

          <input
            type="date"
            value={newLeave.endDate}
            onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />

          <button
            onClick={handleAddLeave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer"
          >
            Add Leave
          </button>
        </div>
        <div className="mt-3">
          <input
            type="text"
            value={newLeave.reason}
            onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
            placeholder="Reason for leave"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Leave History */}
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
  // Add null check
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
            <span className="font-medium">{employee.name || 'Not provided'}</span>
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
            <span className="font-medium">EMP-{(employee.id || '').toString().padStart(4, '0')}</span>
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
            <span className="text-gray-600">Organization Password</span>
            <span className="font-medium flex items-center gap-2">
              {employee.orgPassword ? '••••••••' : 'Not provided'}
              {employee.orgPassword && <Lock className="w-4 h-4 text-gray-400" />}
            </span>
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

  // Sort by applied date descending (latest first)
  const sortedLeaves = [...employeeLeaves].sort((a, b) =>
    new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Calculate pagination
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
      </div>
    </div>
  );
};

// Employee Attendance Tab Component
interface EmployeeAttendanceTabProps {
  employee: Employee;
}

const EmployeeAttendanceTab: React.FC<EmployeeAttendanceTabProps> = ({ employee }) => {
  // Mock attendance data for multiple months
  const generateAttendanceData = () => {
    const data = [];
    const months = ['January', 'February', 'March', 'April', 'May'];

    for (let month = 0; month < 5; month++) {
      for (let day = 1; day <= 30; day++) {
        const date = new Date(2024, month, day);
        const dayOfWeek = date.getDay();

        // Skip weekends (optional)
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

    // Sort by date descending (latest first)
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const allAttendanceData = generateAttendanceData();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Calculate pagination for table
  const totalPages = Math.ceil(allAttendanceData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttendanceData = allAttendanceData.slice(startIndex, endIndex);

  // Filter attendance data for current month for calendar
  const currentMonthAttendance = allAttendanceData.filter(record => {
    const date = new Date(record.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigation functions
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

  // Calculate statistics for current month
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
          <div className="text-2xl font-bold text-purple-700">{stats.totalHours}</div>
          <div className="text-xs text-purple-500 mt-1">This month</div>
        </div>
      </div>

      {/* Attendance Calendar View */}
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

          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 bg-gray-50 rounded-lg" />
          ))}

          {/* Days of the month */}
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
const EmployeesPage = ({
  employees: initialEmployees,
  setEmployees,
  departments: initialDepartments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'],
  positions: initialPositions = ['Developer', 'Designer', 'Manager', 'Analyst', 'Executive', 'Specialist'],
  leaveRequests = []
}: EmployeesPageProps) => {
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
    name: '',
    email: '',
    orgEmail: '',
    orgPassword: '',
    phone: '',
    department: '',
    position: '',
    joinDate: null,
    location: '',
    emergencyContact: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [departments, setDepartments] = useState<string[]>(initialDepartments);
  const [positions, setPositions] = useState<string[]>(initialPositions);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [showCustomPosition, setShowCustomPosition] = useState(false);
  const [customDepartment, setCustomDepartment] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const [activeEditTab, setActiveEditTab] = useState('info');
  const [viewModalTab, setViewModalTab] = useState('info');

  const [startDate, endDate] = dateRange;

  // Filter employees
  const filteredEmployees = initialEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filters.department === 'all' || emp.department === filters.department;
    const matchesPosition = filters.position === 'all' || emp.position === filters.position;

    const joinDate = new Date(emp.joinDate);
    const matchesDate = (!startDate || joinDate >= startDate) &&
      (!endDate || joinDate <= endDate);

    return matchesSearch && matchesDepartment && matchesPosition && matchesDate;
  });

  // Calculate statistics
  const activeCount = initialEmployees.length; // All employees are active in this version
  const totalSalary = initialEmployees.length; // Not using salary anymore

  const departmentsWithCount = departments.map(dept => ({
    name: dept,
    count: initialEmployees.filter(e => e.department === dept).length
  }));

  // Handle employee actions
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewModalTab('info'); // Reset to info tab
    setShowEmployeeDetailsModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setNewEmployee({
      name: employee.name || '',
      email: employee.email || '',
      orgEmail: employee.orgEmail || '',
      orgPassword: employee.orgPassword || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      joinDate: employee.joinDate ? new Date(employee.joinDate) : new Date(),
      location: employee.location || '',
      emergencyContact: employee.emergencyContact || ''
    });
    setSelectedEmployee(employee);
    setIsEditing(true);
    setActiveEditTab('info');
    setShowEmployeeModal(true);
  };

  // Safe avatar getter
  const getEmployeeAvatar = (employee: Employee | string | null) => {
    if (!employee) return '?';

    if (typeof employee === 'string') {
      return employee.trim().charAt(0).toUpperCase() || '?';
    }

    if (employee.avatar && employee.avatar.trim() !== '') {
      return employee.avatar.trim().charAt(0).toUpperCase();
    }

    if (employee.name && employee.name.trim() !== '') {
      return employee.name.trim().charAt(0).toUpperCase();
    }

    return '?';
  };

  const handleDeleteEmployee = (id: number) => {
    const employeeToDelete = initialEmployees.find(e => e.id === id);
    if (employeeToDelete) {
      setSelectedEmployee(employeeToDelete);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      setEmployees(prev => prev.filter(e => e.id !== selectedEmployee.id));
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    }
  };

  const handleAddEmployee = () => {
    setNewEmployee({
      name: '',
      email: '',
      orgEmail: '',
      orgPassword: '',
      phone: '',
      department: '',
      position: '',
      joinDate: null,
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
    if (customDepartment.trim() && !departments.includes(customDepartment.trim())) {
      const newDept = customDepartment.trim();
      setDepartments(prev => [...prev, newDept]);
      setNewEmployee(prev => ({ ...prev, department: newDept }));
      setCustomDepartment('');
      setShowCustomDepartment(false);
    }
  };

  const handleAddCustomPosition = () => {
    if (customPosition.trim() && !positions.includes(customPosition.trim())) {
      const newPos = customPosition.trim();
      setPositions(prev => [...prev, newPos]);
      setNewEmployee(prev => ({ ...prev, position: newPos }));
      setCustomPosition('');
      setShowCustomPosition(false);
    }
  };

  const handleSaveEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.orgEmail || !newEmployee.orgPassword || !newEmployee.department || !newEmployee.position) {
      alert('Please fill in all required fields');
      return;
    }

    const employeeData: Employee = {
      id: isEditing && selectedEmployee ? selectedEmployee.id : Date.now(),
      name: newEmployee.name.trim(),
      email: newEmployee.email.trim(),
      orgEmail: newEmployee.orgEmail.trim(),
      orgPassword: newEmployee.orgPassword.trim(),
      phone: newEmployee.phone.trim(),
      department: newEmployee.department,
      position: newEmployee.position,
      joinDate: newEmployee.joinDate ?
        newEmployee.joinDate.toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0],
      avatar: newEmployee.name.charAt(0).toUpperCase(),
      location: newEmployee.location.trim(),
      emergencyContact: newEmployee.emergencyContact.trim(),
      leaveBalance: selectedEmployee?.leaveBalance || {
        casual: 12,
        sick: 8,
        earned: 20
      }
    };

    if (isEditing && selectedEmployee) {
      setEmployees(prev => prev.map(e => e.id === selectedEmployee.id ?
        { ...e, ...employeeData } : e));
    } else {
      setEmployees(prev => [...prev, employeeData]);
    }

    setShowEmployeeModal(false);
    resetNewEmployeeForm();
    setSelectedEmployee(null);
  };

  const resetNewEmployeeForm = () => {
    setNewEmployee({
      name: '',
      email: '',
      orgEmail: '',
      orgPassword: '',
      phone: '',
      department: '',
      position: '',
      joinDate: null,
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

  // Clear date range
  const clearDateRange = () => {
    setDateRange([null, null]);
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
              <h4 className="font-semibold text-gray-800">{employee?.name || 'Unknown Employee'}</h4>
              <p className="text-gray-600 text-sm">{employee?.position || 'N/A'}</p>
            </div>
          </div>
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 truncate">{employee?.email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{employee?.department || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{employee?.orgEmail || 'No org email'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {employee?.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Active
          </span>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => employee && handleEditEmployee(employee)}
              className="p-1 text-yellow-600 hover:bg-yellow-100 rounded-lg transition cursor-pointer"
              title="Edit"
              disabled={!employee}
            >
              <Edit className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => employee && handleDeleteEmployee(employee.id)}
              className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
              title="Delete"
              disabled={!employee}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
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
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Employee
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
              <p className="text-3xl font-bold text-blue-600 mt-1">{initialEmployees.length}</p>
              <p className="text-gray-400 text-sm mt-1">Across all departments</p>
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
              <p className="text-3xl font-bold text-amber-600 mt-1">{positions.length}</p>

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
              <p className="text-gray-500 text-sm">Total Department</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                07
              </p>
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
                {departments.map(dept => (
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
              {positions.map(pos => (
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
                  Showing {filteredEmployees.length} of {initialEmployees.length} employees
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
                                  <div className="font-medium text-gray-800">{emp?.name || 'Unknown Employee'}</div>
                                  <div className="text-gray-500 text-xs">O-{(emp?.id || '').toString().padStart(4, '0')}</div>
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
                                <span className="text-gray-600">{emp.phone || 'No org email'}</span>
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
                                        <span className="text-sm font-medium">{emp.joinDate || 'N/A'}</span>
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
                {isEditing && activeEditTab === 'leave' ? (
                  <LeaveBalanceTab
                    employee={selectedEmployee!}
                    employees={initialEmployees}
                    setEmployees={setEmployees}
                  />
                ) : (
                  <EmployeeInfoTab
                    newEmployee={newEmployee}
                    setNewEmployee={setNewEmployee}
                    departments={departments}
                    positions={positions}
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer"
                  >
                    {isEditing ? 'Update Employee' : 'Add Employee'}
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
                    <p className="font-medium text-gray-800">{selectedEmployee.name || 'Unknown Employee'}</p>
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
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition cursor-pointer"
                >
                  Delete Employee
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
                      <h3 className="text-2xl font-bold text-gray-800">{selectedEmployee.name}</h3>
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
                  <EmployeeAttendanceTab employee={selectedEmployee} />
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
                        onClick={() => setExportFormat(format as any)}
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
                    alert(`Exporting ${initialEmployees.length} employees in ${exportFormat.toUpperCase()} format...`);
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