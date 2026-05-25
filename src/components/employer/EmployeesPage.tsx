// EmployeesPage.tsx — FIXED VERSION
// Changes from previous version:
//   1. Added role/reportTo/managesDepartment to NewEmployeeForm interface (already done in your file)
//   2. Added role/reportTo/managesDepartment to ALL 4 setNewEmployee() calls
//   3. Added useCurrentUser() hook + adminId derived from it
//   4. Removed unused EmployeeRoleTab import (was causing warning)
//   5. Fixed modal: Access Control tab only shown, not both info + access simultaneously

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Users, UserPlus, Search, Filter, Mail, Phone, MapPin,
  Briefcase, Calendar, Eye, Edit, Trash2,
  ChevronDown, ChevronUp,
  CheckCircle, Clock, X, Building,
  PhoneCall, PhoneMissed,
  User, Lock, ChevronLeft, ChevronRight,
  Cake, Coffee, Shield,
  BoxIcon
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee,
  useDepartments, usePositions
} from '../../hooks/useEmployees';
import { useLeaves } from '../../hooks/useLeaves';
import { useEmployeeAttendance } from '../../hooks/useAttendance';
import { useQuery } from '@tanstack/react-query';
import { leaveApi } from '../../services/api';
import { useCurrentUser } from '../../hooks/useAuth';
import AccessControlTab from './AccessControlTab';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  orgEmail?: string;
  orgPassword?: string;
  phone?: string;
  department?: string;
  position?: string;
  joinDate: string;
  leaveDate?: string;
  birthday?: string;
  avatar?: string;
  location?: string;
  emergencyContact?: string;
  isActive?: boolean;
  name?: string;
  empId?: string;
  role?: string;
  reportTo?: number | null;
  managesDepartment?: number | null;
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
  // Role fields
  role: 'employee' | 'teamlead' | 'manager';
  reportTo: number | null;
  managesDepartment: number | null;
}

// Default empty form — used in 4 places
const EMPTY_FORM: NewEmployeeForm = {
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
  emergencyContact: '',
  role: 'employee',
  reportTo: null,
  managesDepartment: null,
};

type DateRange = [Date | null, Date | null];

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeInfoTab
// ─────────────────────────────────────────────────────────────────────────────

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
  newEmployee, setNewEmployee, departments, positions,
  showCustomDepartment, setShowCustomDepartment,
  showCustomPosition, setShowCustomPosition,
  customDepartment, setCustomDepartment,
  customPosition, setCustomPosition,
  handleAddCustomDepartment, handleAddCustomPosition,
}) => {
  const [showOrgPassword, setShowOrgPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">First Name *</label>
          <input type="text" value={newEmployee.firstName}
            onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter First Name" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Last Name *</label>
          <input type="text" value={newEmployee.lastName}
            onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter Last Name" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Employee ID *</label>
          <input type="text" value={newEmployee.employeeId}
            onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="e.g., O-001" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Personal Email *</label>
          <input type="email" value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter personal email" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Organization Email *</label>
          <input type="email" value={newEmployee.orgEmail}
            onChange={(e) => setNewEmployee({ ...newEmployee, orgEmail: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter organization email" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Organization Password *</label>
          <div className="relative">
            <input
              type={showOrgPassword ? 'text' : 'password'}
              value={newEmployee.orgPassword}
              onChange={(e) => setNewEmployee({ ...newEmployee, orgPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 pr-16"
              placeholder="Enter organization password" />
            <button type="button" onClick={() => setShowOrgPassword(!showOrgPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer">
              {showOrgPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Personal Phone Number</label>
          <input type="tel" value={newEmployee.phone}
            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter personal phone number" />
        </div>

        {/* Department */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Department *</label>
          {!showCustomDepartment ? (
            <select value={newEmployee.department}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomDepartment(true);
                  setNewEmployee({ ...newEmployee, department: '' });
                } else {
                  setNewEmployee({ ...newEmployee, department: e.target.value });
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="custom" className="text-purple-600 font-medium">+ Create New Department</option>
            </select>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
                  placeholder="Enter new department name" autoFocus />
                <button onClick={handleAddCustomDepartment} disabled={!customDepartment.trim()}
                  className={`px-4 py-3 rounded-xl font-medium cursor-pointer ${customDepartment.trim() ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>✓</button>
                <button onClick={() => { setShowCustomDepartment(false); setCustomDepartment(''); setNewEmployee({ ...newEmployee, department: '' }); }}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 cursor-pointer">✕</button>
              </div>
              <p className="text-sm text-gray-500 ml-1">Enter a new department name and click the checkmark</p>
            </div>
          )}
        </div>

        {/* Designation */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Designation *</label>
          {!showCustomPosition ? (
            <select value={newEmployee.position}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomPosition(true);
                  setNewEmployee({ ...newEmployee, position: '' });
                } else {
                  setNewEmployee({ ...newEmployee, position: e.target.value });
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer">
              <option value="">Select Designation</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
              <option value="custom" className="text-purple-600 font-medium">+ Create New Designation</option>
            </select>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" value={customPosition}
                  onChange={(e) => setCustomPosition(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
                  placeholder="Enter new designation name" autoFocus />
                <button onClick={handleAddCustomPosition} disabled={!customPosition.trim()}
                  className={`px-4 py-3 rounded-xl font-medium cursor-pointer ${customPosition.trim() ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>✓</button>
                <button onClick={() => { setShowCustomPosition(false); setCustomPosition(''); setNewEmployee({ ...newEmployee, position: '' }); }}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 cursor-pointer">✕</button>
              </div>
              <p className="text-sm text-gray-500 ml-1">Enter a new designation name and click the checkmark</p>
            </div>
          )}
        </div>

        {/* Birthday */}
        <div>
          <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
            <Cake className="w-4 h-4 text-purple-600" /> Date of Birth
          </label>
          <DatePicker selected={newEmployee.birthday}
            onChange={(date: Date | null) => setNewEmployee({ ...newEmployee, birthday: date })}
            dateFormat="MMMM d, yyyy"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer"
            placeholderText="Select date of birth" showYearDropdown scrollableYearDropdown
            yearDropdownItemNumber={100} maxDate={new Date()} isClearable />
          <p className="text-sm text-gray-500 mt-1">Used for birthday reminders</p>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Join Date</label>
          <DatePicker selected={newEmployee.joinDate}
            onChange={(date: Date | null) => setNewEmployee({ ...newEmployee, joinDate: date })}
            dateFormat="MMMM d, yyyy"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer"
            placeholderText="Select join date" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Leave Date</label>
          <DatePicker selected={newEmployee.leaveDate}
            onChange={(date: Date | null) => setNewEmployee({ ...newEmployee, leaveDate: date })}
            dateFormat="MMMM d, yyyy"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer"
            placeholderText="Select leave date (optional)" isClearable />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Location</label>
          <input type="text" value={newEmployee.location}
            onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter location" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Emergency Contact</label>
          <input type="text" value={newEmployee.emergencyContact}
            onChange={(e) => setNewEmployee({ ...newEmployee, emergencyContact: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            placeholder="Enter emergency contact" />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LeaveBalanceTab — Paid leave accrual (1 day per complete month since joining)
// ─────────────────────────────────────────────────────────────────────────────

interface LeaveBalanceTabProps { employee: Employee; }

const LeaveBalanceTab: React.FC<LeaveBalanceTabProps> = ({ employee }) => {
  const { data: paidBalance, isLoading, refetch } = useQuery({
    queryKey: ['paidLeaveBalance', employee.id],
    queryFn: async () => {
      const res = await leaveApi.getPaidLeaveBalance(employee.id);
      return res.data as { earned: number; consumed: number; available: number };
    },
    enabled: !!employee.id && employee.id > 0,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const { nextCreditDate, monthsWorked } = React.useMemo(() => {
    if (!employee.joinDate) return { nextCreditDate: 'N/A', monthsWorked: 0 };
    const join = new Date(employee.joinDate);
    const now  = new Date();
    const joinDay = join.getDate();
    let months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    if (now.getDate() < joinDay) months = Math.max(0, months - 1);
    const next = now.getDate() >= joinDay
      ? new Date(now.getFullYear(), now.getMonth() + 1, joinDay)
      : new Date(now.getFullYear(), now.getMonth(), joinDay);
    return {
      monthsWorked: Math.max(0, months),
      nextCreditDate: next.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  }, [employee.joinDate]);

  if (isLoading) return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
      <p className="mt-2 text-gray-600">Loading leave balance...</p>
    </div>
  );

  const earned    = paidBalance?.earned    ?? 0;
  const consumed  = paidBalance?.consumed  ?? 0;
  const available = paidBalance?.available ?? 0;

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
          <p className="text-sm font-medium text-emerald-600">Earned</p>
          <p className="text-4xl font-bold text-emerald-700 mt-2">{earned}</p>
          <p className="text-xs text-emerald-500 mt-1">days accrued</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center">
          <p className="text-sm font-medium text-orange-600">Consumed</p>
          <p className="text-4xl font-bold text-orange-700 mt-2">{consumed}</p>
          <p className="text-xs text-orange-500 mt-1">days used</p>
        </div>
        <div className={`border rounded-xl p-5 text-center ${available > 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm font-medium ${available > 0 ? 'text-blue-600' : 'text-red-600'}`}>Available</p>
          <p className={`text-4xl font-bold mt-2 ${available > 0 ? 'text-blue-700' : 'text-red-700'}`}>{available}</p>
          <p className={`text-xs mt-1 ${available > 0 ? 'text-blue-500' : 'text-red-500'}`}>days remaining</p>
        </div>
      </div>

      {/* Accrual details */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Accrual Details
        </h4>
        <div className="space-y-0">
          {[
            ['Join Date',       employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'],
            ['Months Worked',   `${monthsWorked} complete months`],
            ['Accrual Rate',    '1 paid leave per complete month'],
            ['Next Credit Date', nextCreditDate],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-xs text-emerald-800 leading-relaxed">
          <strong>How it works:</strong> Employees earn 1 paid leave for every complete calendar month worked since their
          join date. When a "Paid" leave request is approved, the consumed count increases. Deleting or rejecting an
          approved leave automatically restores the balance.
        </p>
      </div>

      <div className="flex justify-end">
        <button onClick={() => refetch()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-2 cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeFullInfoTab
// ─────────────────────────────────────────────────────────────────────────────

const EmployeeFullInfoTab: React.FC<{ employee: Employee }> = ({ employee }) => {
  if (!employee) return (
    <div className="text-center py-12 text-gray-400">
      <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
      <p>Employee information not available</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 text-lg">Personal Information</h4>
          <div className="space-y-3">
            {[
              ['Full Name', employee.name || `${employee.firstName} ${employee.lastName}`],
              ['Personal Email', employee.email || 'Not provided'],
              ['Phone Number', employee.phone || 'Not provided'],
              ['Emergency Contact', employee.emergencyContact || 'Not provided'],
              ['Location', employee.location || 'Not provided'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
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
                <Cake className="w-4 h-4 text-purple-600" /> Date of Birth
              </span>
              <span className="font-medium">
                {employee.birthday ? new Date(employee.birthday).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : 'Not provided'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Organization Password</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{employee.orgPassword || 'Not provided'}</span>
                {employee.orgPassword && <Lock className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Join Date</span>
              <span className="font-medium">
                {new Date(employee.joinDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeLeaveHistoryTab (keep your existing implementation — not changed)
// ─────────────────────────────────────────────────────────────────────────────

const EmployeeLeaveHistoryTab: React.FC<{ employee: Employee }> = ({ employee }) => {
  const { data: paidBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['paidLeaveBalance', employee.id],
    queryFn: async () => {
      const res = await leaveApi.getPaidLeaveBalance(employee.id);
      return res.data as { earned: number; consumed: number; available: number };
    },
    enabled: !!employee.id && employee.id > 0,
    staleTime: 30000,
  });
  const { data: leaveRequestsResponse, isLoading: isLoadingLeaves, error, refetch } = useQuery({
    queryKey: ['employee-leaves', employee.id],
    queryFn: async () => {
      try {
        // leaveApi.getByEmployee returns a raw Axios response:
        // { data: { success: true, count: N, data: [...leaves] }, status: 200, ... }
        const response = await leaveApi.getByEmployee(employee.id) as any;
        let leavesArray: any[] = [];

        if (Array.isArray(response?.data?.data)) {
          // Normal path: Axios response → response.data (backend JSON) → .data (array)
          leavesArray = response.data.data;
        } else if (Array.isArray(response?.data)) {
          // Backend returned an array directly as response body
          leavesArray = response.data;
        } else if (Array.isArray(response)) {
          // Already unwrapped somewhere upstream
          leavesArray = response;
        }

        return leavesArray.map((leave: any) => ({
          id: leave.id, empId: leave.empId, type: leave.type,
          from: leave.from, to: leave.to, days: leave.days,
          reason: leave.reason, status: leave.status,
          appliedDate: leave.appliedDate || leave.createdAt,
          isHalfDay: leave.isHalfDay || false, isPaid: leave.isPaid || false,
          paidDays: leave.paidDays || 0,
          employee: leave.employee || { firstName: employee.firstName, lastName: employee.lastName, department: employee.department }
        }));
      } catch { return []; }
    },
    enabled: !!employee.id && !isNaN(employee.id),
    refetchOnWindowFocus: true, staleTime: 10000, retry: 2,
  });

  const employeeLeaves = Array.isArray(leaveRequestsResponse) ? leaveRequestsResponse : [];
  const sortedLeaves = [...employeeLeaves].sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const totalPages = Math.ceil(sortedLeaves.length / itemsPerPage);
  const currentLeaves = sortedLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getLeaveTypeColor = (type: string) => {
    if (type === 'Paid')   return 'bg-green-100 text-green-700';
    if (type === 'Unpaid') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (isLoadingLeaves || isLoadingBalance) return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
      <p className="mt-4 text-gray-600">Loading leave history...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Leave History ({employeeLeaves.length} total)</h3>
        <button onClick={() => refetch()} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>
      {/* Paid leave accrual summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Earned</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{paidBalance?.earned ?? '–'}</p>
          <p className="text-xs text-emerald-500 mt-1">days accrued</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Consumed</p>
          <p className="text-3xl font-bold text-orange-700 mt-1">{paidBalance?.consumed ?? '–'}</p>
          <p className="text-xs text-orange-500 mt-1">days used</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${(paidBalance?.available ?? 1) > 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${(paidBalance?.available ?? 1) > 0 ? 'text-blue-600' : 'text-red-600'}`}>Available</p>
          <p className={`text-3xl font-bold mt-1 ${(paidBalance?.available ?? 1) > 0 ? 'text-blue-700' : 'text-red-700'}`}>{paidBalance?.available ?? '–'}</p>
          <p className={`text-xs mt-1 ${(paidBalance?.available ?? 1) > 0 ? 'text-blue-500' : 'text-red-500'}`}>days remaining</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leaves', value: employeeLeaves.length, cls: 'from-blue-50 to-blue-100', text: 'text-blue-700', sub: 'text-blue-500' },
          { label: 'Approved', value: employeeLeaves.filter(l => l.status === 'approved').length, cls: 'from-green-50 to-green-100', text: 'text-green-700', sub: 'text-green-500' },
          { label: 'Pending', value: employeeLeaves.filter(l => l.status === 'pending').length, cls: 'from-yellow-50 to-yellow-100', text: 'text-yellow-700', sub: 'text-yellow-500' },
          { label: 'Rejected', value: employeeLeaves.filter(l => l.status === 'rejected').length, cls: 'from-red-50 to-red-100', text: 'text-red-700', sub: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-r ${s.cls} rounded-xl p-6`}>
            <div className={`text-sm ${s.text}`}>{s.label}</div>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>
      {sortedLeaves.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium text-lg">No leave history found</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-800">Detailed Leave Records</h4>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  {['Type', 'Date Range', 'Days', 'Reason', 'Status', 'Applied On'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-sm font-medium text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLeaveTypeColor(leave.type)}`}>{leave.type}</span>
                      {leave.isHalfDay && <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">Half Day</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(leave.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {!leave.isHalfDay && leave.from !== leave.to && (
                        <span className="text-xs text-gray-500 block">to {new Date(leave.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{leave.isHalfDay ? '0.5' : leave.days} days</td>
                    <td className="px-4 py-3 text-sm text-gray-600"><div className="max-w-xs truncate">{leave.reason}</div></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                        leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(leave.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeAttendanceTab (keep your existing implementation — not changed)
// ─────────────────────────────────────────────────────────────────────────────

const EmployeeAttendanceTab: React.FC<{ employee: Employee }> = ({ employee }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const { data: monthlyAttendanceData } = useEmployeeAttendance(employee.id, { month: currentMonth + 1, year: currentYear });
  const monthlyAttendance = Array.isArray(monthlyAttendanceData) ? monthlyAttendanceData : [];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const totalPages = Math.ceil(monthlyAttendance.length / itemsPerPage);
  const currentAttendanceData = monthlyAttendance.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const stats = {
    present: monthlyAttendance.filter(a => a.status === 'present').length,
    late: monthlyAttendance.filter(a => a.status === 'late').length,
    leave: monthlyAttendance.filter(a => a.status === 'on_leave').length,
    totalHours: monthlyAttendance.reduce((s, a) => s + (a.totalHours || 0), 0),
    totalBreakTime: monthlyAttendance.reduce((s, a) => s + (a.breaks || 0), 0),
  };
  const formatTime = (dt: string | null) => {
    if (!dt) return '--:--';
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  const formatHours = (h: number | null) => {
    if (!h) return '--';
    const m = Math.round(h * 60);
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };
  const formatBreak = (m: number | null) => {
    if (!m) return '--';
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + 'm' : ''}`.trim();
  };
  const getStatusColor = (status: string, isWeekend: boolean) => {
    if (isWeekend) return 'bg-gray-100 text-gray-400';
    const map: Record<string, string> = { present: 'bg-green-100 text-green-700', late: 'bg-yellow-100 text-yellow-700', absent: 'bg-red-100 text-red-700', half_day: 'bg-orange-100 text-orange-700', on_leave: 'bg-purple-100 text-purple-700' };
    return map[status] || 'bg-gray-50 text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Days Present', value: stats.present, cls: 'from-green-50 to-green-100 text-green-700' },
          { label: 'Late Arrivals', value: stats.late, cls: 'from-yellow-50 to-yellow-100 text-yellow-700' },
          { label: 'Leave Days', value: stats.leave, cls: 'from-blue-50 to-blue-100 text-blue-700' },
          { label: 'Total Hours', value: stats.totalHours.toFixed(1), cls: 'from-purple-50 to-purple-100 text-purple-700' },
          { label: 'Break Time', value: formatBreak(stats.totalBreakTime), cls: 'from-orange-50 to-orange-100 text-orange-700' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-r ${s.cls} rounded-xl p-6`}>
            <div className={`text-sm ${s.cls.split(' ').pop()}`}>{s.label}</div>
            <div className={`text-2xl font-bold ${s.cls.split(' ').pop()}`}>{s.value}</div>
            <div className="text-xs mt-1 opacity-70">This month</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">Attendance Calendar — {monthNames[currentMonth]} {currentYear}</h4>
          <div className="flex items-center gap-2">
            <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-gray-600 px-2">{monthNames[currentMonth]} {currentYear}</span>
            <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center text-sm font-medium text-gray-500 py-2">{d}</div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} className="h-10 bg-gray-50 rounded-lg" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const att = monthlyAttendance.find(a => new Date(a.date).toISOString().split('T')[0] === dateStr);
            const isToday = date.toDateString() === new Date().toDateString();
            const isWeekend = [0, 6].includes(date.getDay());
            return (
              <div key={day} className={`h-10 rounded-lg flex items-center justify-center relative ${getStatusColor(att?.status || 'none', isWeekend)} ${isToday ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}>
                {day}
                {att?.checkIn && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-current opacity-60" />}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          {[['bg-green-100','Present'],['bg-yellow-100','Late'],['bg-blue-100','Leave'],['bg-gray-100','No Data']].map(([bg, label]) => (
            <div key={label} className="flex items-center gap-1"><div className={`w-3 h-3 ${bg} rounded`} />{label}</div>
          ))}
        </div>
      </div>
      {monthlyAttendance.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-800">Daily Attendance Log</h4>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  {['Date','Check In','Check Out','Status','Working Hours','Break Time','Remarks'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-sm font-medium text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentAttendanceData.map(att => (
                  <tr key={att.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(att.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td className="px-4 py-3 font-medium">{formatTime(att.checkIn)}</td>
                    <td className="px-4 py-3 font-medium">{formatTime(att.checkOut)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${att.status === 'present' ? 'bg-green-100 text-green-700' : att.status === 'late' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                        {att.status.charAt(0).toUpperCase() + att.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatHours(att.totalHours)}</td>
                    <td className="px-4 py-3">
                      {att.breaks > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-orange-600">{formatBreak(att.breaks)}</span>
                          <Coffee className="w-3 h-3 text-orange-400" />
                        </div>
                      ) : <span className="text-gray-400">--</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {att.notes || (att.status === 'late' ? 'Late arrival' : att.status === 'on_leave' ? 'On leave' : 'Regular day')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PaidLeaveBalanceMini — compact card used inside the expandable table row
// ─────────────────────────────────────────────────────────────────────────────

const PaidLeaveBalanceMini: React.FC<{ employeeId: number }> = ({ employeeId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['paidLeaveBalance', employeeId],
    queryFn: async () => {
      const res = await leaveApi.getPaidLeaveBalance(employeeId);
      return res.data as { earned: number; consumed: number; available: number };
    },
    enabled: !!employeeId && employeeId > 0,
    staleTime: 30000,
  });

  if (isLoading) return (
    <div className="grid grid-cols-3 gap-2">
      {[1,2,3].map(i => <div key={i} className="bg-gray-100 rounded-lg h-14 animate-pulse" />)}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-emerald-50 rounded-lg p-2 text-center">
        <p className="text-xs text-emerald-600 font-medium">Earned</p>
        <p className="text-base font-bold text-emerald-700">{data?.earned ?? 0}</p>
      </div>
      <div className="bg-orange-50 rounded-lg p-2 text-center">
        <p className="text-xs text-orange-600 font-medium">Used</p>
        <p className="text-base font-bold text-orange-700">{data?.consumed ?? 0}</p>
      </div>
      <div className={`rounded-lg p-2 text-center ${(data?.available ?? 1) > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
        <p className={`text-xs font-medium ${(data?.available ?? 1) > 0 ? 'text-blue-600' : 'text-red-600'}`}>Left</p>
        <p className={`text-base font-bold ${(data?.available ?? 1) > 0 ? 'text-blue-700' : 'text-red-700'}`}>{data?.available ?? 0}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EmployeesPage Component
// ─────────────────────────────────────────────────────────────────────────────

const EmployeesPage = () => {
  const { data: employeesData, isLoading, error, refetch } = useEmployees();
  const { data: departmentsData } = useDepartments();
  const { data: positionsData } = usePositions();
  const { data: leaveRequestsData } = useLeaves();
  // ✅ FIX: get adminId from current logged-in user
  const { data: currentUser } = useCurrentUser();
  const adminId = currentUser?.id || 1;

  const employees = Array.isArray(employeesData) ? employeesData : [];
  const departments = Array.isArray(departmentsData) ? departmentsData : (Array.isArray((departmentsData as any)?.data) ? (departmentsData as any).data : []);
  const positions = Array.isArray(positionsData) ? positionsData : (Array.isArray((positionsData as any)?.data) ? (positionsData as any).data : []);
  const leaveRequests = Array.isArray(leaveRequestsData) ? leaveRequestsData : Array.isArray((leaveRequestsData as any)?.data) ? (leaveRequestsData as any).data : [];

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ department: 'all', position: 'all' });
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  // ✅ FIX: all 4 setNewEmployee calls now include role/reportTo/managesDepartment
  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>({ ...EMPTY_FORM });
  const [isEditing, setIsEditing] = useState(false);
  const [departmentsState, setDepartmentsState] = useState<string[]>([]);
  const [positionsState, setPositionsState] = useState<string[]>([]);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [showCustomPosition, setShowCustomPosition] = useState(false);
  const [customDepartment, setCustomDepartment] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const [activeEditTab, setActiveEditTab] = useState('info');
  const [viewModalTab, setViewModalTab] = useState('info');
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    const depts = departments.length > 0 ? departments : ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
    const pos = positions.length > 0 ? positions : ['Developer', 'Designer', 'Manager', 'Analyst', 'Executive', 'Specialist'];
    setDepartmentsState([...new Set(depts.filter((d: string) => d?.trim()))]);
    setPositionsState([...new Set(pos.filter((p: string) => p?.trim()))]);
  }, [departments, positions]);

  const transformApiEmployee = (apiEmployee: any): Employee | null => {
    if (!apiEmployee) return null;
    return {
      id: apiEmployee.id || 0,
      firstName: apiEmployee.firstName || '',
      lastName: apiEmployee.lastName || '',
      name: `${apiEmployee.firstName || ''} ${apiEmployee.lastName || ''}`.trim(),
      employeeId: apiEmployee.employeeId || `EMP-${apiEmployee.id?.toString().padStart(4, '0')}`,
      email: apiEmployee.email || '',
      orgEmail: apiEmployee.orgEmail || '',
      orgPassword: apiEmployee.orgPassword || '',
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
      role: apiEmployee.role || 'employee',
      reportTo: apiEmployee.reportTo || null,
      managesDepartment: apiEmployee.managesDepartment || null,
      leaveBalance: apiEmployee.leaveBalance || { casual: 0, sick: 0, earned: 0 },
    };
  };

  const processedEmployees = React.useMemo(() => {
    if (Array.isArray(employeesData)) return employeesData.map(transformApiEmployee).filter(Boolean) as Employee[];
    return [];
  }, [employeesData]);

  const filteredEmployees = processedEmployees.filter(emp => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = emp.name?.toLowerCase().includes(q) || emp.email?.toLowerCase().includes(q) ||
      emp.position?.toLowerCase().includes(q) || `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q);
    const matchesDept = filters.department === 'all' || emp.department === filters.department;
    const matchesPos = filters.position === 'all' || emp.position === filters.position;
    const joinDate = new Date(emp.joinDate);
    const matchesDate = (!startDate || joinDate >= startDate) && (!endDate || joinDate <= endDate);
    return matchesSearch && matchesDept && matchesPos && matchesDate;
  });

  const handleViewEmployee = (employee: Employee) => { setSelectedEmployee(employee); setViewModalTab('info'); setShowEmployeeDetailsModal(true); };

  const parseLocalDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    try {
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
      return new Date(year, month - 1, day);
    } catch { return null; }
  };

  const handleEditEmployee = (employee: Employee) => {
    const empId = employee.employeeId || (employee.id ? `EMP-${employee.id.toString().padStart(4, '0')}` : 'EMP-0000');
    // ✅ FIX: includes role/reportTo/managesDepartment
    setNewEmployee({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      employeeId: empId,
      email: employee.email || '',
      orgEmail: employee.orgEmail || '',
      orgPassword: '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      joinDate: parseLocalDate(employee.joinDate),
      leaveDate: parseLocalDate(employee.leaveDate),
      birthday: parseLocalDate(employee.birthday),
      location: employee.location || '',
      emergencyContact: employee.emergencyContact || '',
      role: (employee.role as 'employee' | 'teamlead' | 'manager') || 'employee',
      reportTo: employee.reportTo || null,
      managesDepartment: employee.managesDepartment || null,
    });
    setSelectedEmployee(employee);
    setIsEditing(true);
    setActiveEditTab('info');
    setShowEmployeeModal(true);
  };

  const getEmployeeAvatar = (employee: Employee | string | null) => {
    if (!employee) return '?';
    if (typeof employee === 'string') return employee.trim().charAt(0).toUpperCase() || '?';
    return (employee.avatar?.trim() || employee.firstName?.trim() || employee.name?.trim() || '?').charAt(0).toUpperCase();
  };

  const handleDeleteEmployee = (id: number) => {
    const emp = employees.find(e => e.id === id);
    if (emp) { setSelectedEmployee(emp); setShowDeleteModal(true); }
  };

  // Step 1: "Delete Employee" button in the info modal → opens confirmation
  const confirmDelete = () => {
    if (!selectedEmployee) return;
    setShowDeleteConfirmModal(true);
  };

  // Step 2: "Yes, delete" in the confirmation modal → actually deletes
  const executeDelete = () => {
    if (!selectedEmployee) return;
    deleteEmployeeMutation.mutate(selectedEmployee.id, {
      onSuccess: () => {
        setShowDeleteConfirmModal(false);
        setShowDeleteModal(false);
        setSelectedEmployee(null);
        refetch();
      },
      onError: (error: any) => alert(error.response?.data?.message || 'Failed to delete employee'),
    });
  };

  const handleAddEmployee = () => {
    // ✅ FIX: uses EMPTY_FORM which includes role/reportTo/managesDepartment
    setNewEmployee({ ...EMPTY_FORM });
    setIsEditing(false);
    setShowCustomDepartment(false);
    setShowCustomPosition(false);
    setCustomDepartment('');
    setCustomPosition('');
    setShowEmployeeModal(true);
  };

  const handleAddCustomDepartment = () => {
    if (customDepartment.trim() && !departmentsState.includes(customDepartment.trim())) {
      const d = customDepartment.trim();
      setDepartmentsState(prev => [...prev, d]);
      setNewEmployee(prev => ({ ...prev, department: d }));
      setCustomDepartment('');
      setShowCustomDepartment(false);
    }
  };

  const handleAddCustomPosition = () => {
    if (customPosition.trim() && !positionsState.includes(customPosition.trim())) {
      const p = customPosition.trim();
      setPositionsState(prev => [...prev, p]);
      setNewEmployee(prev => ({ ...prev, position: p }));
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
      emergencyContact: newEmployee.emergencyContact.trim(),
      role: newEmployee.role,
      reportTo: newEmployee.reportTo || undefined,
      managesDepartment: newEmployee.managesDepartment || undefined,
    };
    if (isEditing && selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, data: employeeData }, {
        onSuccess: () => { setShowEmployeeModal(false); setNewEmployee({ ...EMPTY_FORM }); setSelectedEmployee(null); refetch(); },
        onError: (error: any) => alert(error.response?.data?.message || 'Failed to update employee'),
      });
    } else {
      createEmployeeMutation.mutate(employeeData, {
        onSuccess: () => { setShowEmployeeModal(false); setNewEmployee({ ...EMPTY_FORM }); refetch(); },
        onError: (error: any) => alert(error.response?.data?.message || 'Failed to create employee'),
      });
    }
  };

  const toggleRowExpansion = (id: number) => {
    const s = new Set(expandedRows);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedRows(s);
  };

  const getDepartmentColor = (dept: string) => {
    const colors: Record<string, string> = {
      Engineering: 'bg-blue-100 text-blue-700', Design: 'bg-pink-100 text-pink-700',
      Marketing: 'bg-green-100 text-green-700', Sales: 'bg-purple-100 text-purple-700',
      HR: 'bg-orange-100 text-orange-700', Finance: 'bg-teal-100 text-teal-700',
      Operations: 'bg-indigo-100 text-indigo-700',
    };
    return colors[dept] || 'bg-gray-100 text-gray-700';
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  const modalVariants: Variants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 300 } }, exit: { opacity: 0, scale: 0.95 } };

  const EmployeeGridItem = ({ employee }: { employee: Employee }) => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
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
        <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-600 truncate">{employee.email || 'No email'}</span></div>
        <div className="flex items-center gap-2 text-sm"><Building className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{employee.department || 'N/A'}</span></div>
        <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span></div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {employee.isActive ? 'Active' : 'Inactive'}
        </span>
        <div className="flex items-center gap-1">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEditEmployee(employee)}
            className="p-1 text-yellow-600 hover:bg-yellow-100 rounded-lg transition cursor-pointer"><Edit className="w-4 h-4" /></motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteEmployee(employee.id)}
            className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"><Trash2 className="w-4 h-4" /></motion.button>
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading employees...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
      <h3 className="text-red-800 font-semibold">Error loading employees</h3>
      <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer">Retry</button>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
          <p className="text-gray-500">Manage all employee records and information</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddEmployee}
          disabled={createEmployeeMutation.isPending}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50">
          <UserPlus className="w-5 h-5" />
          {createEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: processedEmployees.length, cls: 'blue', icon: Users },
          { label: 'Position Types', value: positionsState.length, cls: 'amber', icon: Briefcase },
          { label: 'Total Departments', value: departmentsState.length, cls: 'purple', icon: Building },
          { label: 'Leave Requests', value: leaveRequests.length, cls: 'orange', icon: Calendar },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -5 }}
            className={`bg-gradient-to-br from-${s.cls}-50 to-${s.cls}-100 border-l-4 border-${s.cls}-500 rounded-xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{s.label}</p>
                <p className={`text-3xl font-bold text-${s.cls}-600 mt-1`}>{s.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br from-${s.cls}-500 to-${s.cls}-400 rounded-xl flex items-center justify-center shadow-lg`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search employees..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6B8DA2] focus:ring-2 focus:ring-[#6B8DA2]/20" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none bg-white cursor-pointer">
                <option value="all">All Departments</option>
                {departmentsState.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <select value={filters.position} onChange={(e) => setFilters({ ...filters, position: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none bg-white cursor-pointer">
              <option value="all">All Positions</option>
              {positionsState.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="relative">
              <DatePicker selectsRange startDate={startDate} endDate={endDate}
                onChange={(update: DateRange) => setDateRange(update)}
                dateFormat="MMM d, yyyy" placeholderText="Join Date Range"
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none bg-white cursor-pointer pr-10" />
              {(startDate || endDate) && (
                <button onClick={() => setDateRange([null, null])}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 cursor-pointer ${viewMode === 'list' ? 'bg-[#6B8DA2] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>List</button>
              <button onClick={() => setViewMode('grid')} className={`px-4 py-2 cursor-pointer ${viewMode === 'grid' ? 'bg-[#6B8DA2] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Grid</button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* List / Grid */}
      {viewMode === 'list' ? (
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6B8DA2]" />
              Employee Directory
              <span className="text-sm font-normal text-gray-500 ml-2">({filteredEmployees.length} employees)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee','Department','Position','Phone Number','Join Date','Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-gray-600 font-medium text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredEmployees.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 opacity-30" />
                      <p className="text-gray-500">No employees found</p>
                    </td></tr>
                  ) : filteredEmployees.map((emp, index) => {
                    const isExpanded = expandedRows.has(emp.id);
                    return (
                      <React.Fragment key={emp.id}>
                        <motion.tr initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }} transition={{ delay: index * 0.05 }}
                          className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {getEmployeeAvatar(emp)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">{emp.name || `${emp.firstName} ${emp.lastName}`}</div>
                                <div className="text-gray-500 text-xs">{emp.employeeId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getDepartmentColor(emp.department || '')}`}>
                              {emp.department || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{emp.position || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-600">{emp.phone || 'No phone'}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => toggleRowExpansion(emp.id)}
                                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => handleViewEmployee(emp)}
                                className="p-2 text-[#6B8DA2] hover:bg-[#6B8DA2]/10 rounded-lg transition cursor-pointer">
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditEmployee(emp)}
                                className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition cursor-pointer">
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                        {isExpanded && (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-gray-50">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2"><Phone className="w-4 h-4" /> Contact</h4>
                                  {[
                                    [Mail, emp.email], [Lock, emp.orgEmail], [PhoneCall, emp.phone],
                                    [MapPin, emp.location], [PhoneMissed, emp.emergencyContact ? `Emergency: ${emp.emergencyContact}` : null],
                                  ].filter(([, v]) => v).map(([Icon, val], i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <BoxIcon className="w-4 h-4 text-gray-400" /><span className="text-sm">{val as string}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Job</h4>
                                  {[['Department', emp.department], ['Position', emp.position], ['Join Date', emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A']].map(([l, v]) => (
                                    <div key={l} className="flex justify-between"><span className="text-sm text-gray-600">{l}:</span><span className="text-sm font-medium">{v || 'N/A'}</span></div>
                                  ))}
                                </div>
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2"><Calendar className="w-4 h-4" /> Paid Leave Balance</h4>
                                  <PaidLeaveBalanceMini employeeId={emp.id} />
                                  <p className="text-xs text-gray-400">Earned / Used / Remaining</p>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredEmployees.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 opacity-30" />
                <p className="text-gray-500 text-lg font-medium">No employees found</p>
              </div>
            ) : filteredEmployees.map(emp => <EmployeeGridItem key={emp.id} employee={emp} />)}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showEmployeeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                  {isEditing ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button onClick={() => { setShowEmployeeModal(false); setNewEmployee({ ...EMPTY_FORM }); }}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Tabs — only in edit mode */}
              {isEditing && selectedEmployee && (
                <div className="flex border-b border-gray-200 px-6">
                  {[
                    { id: 'info', icon: User, label: 'Employee Information' },
                    { id: 'leave', icon: Calendar, label: 'Leave Balance' },
                    { id: 'access', icon: Shield, label: 'Access Control' },
                  ].map(tab => (
                    <button key={tab.id}
                      className={`py-3 px-6 border-b-2 cursor-pointer transition flex items-center gap-2 ${activeEditTab === tab.id ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveEditTab(tab.id)}>
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6">
                {/* ✅ FIX: each tab renders exclusively — no overlap */}
                {activeEditTab === 'info' && (
                  <EmployeeInfoTab
                    newEmployee={newEmployee} setNewEmployee={setNewEmployee}
                    departments={departmentsState} positions={positionsState}
                    showCustomDepartment={showCustomDepartment} setShowCustomDepartment={setShowCustomDepartment}
                    showCustomPosition={showCustomPosition} setShowCustomPosition={setShowCustomPosition}
                    customDepartment={customDepartment} setCustomDepartment={setCustomDepartment}
                    customPosition={customPosition} setCustomPosition={setCustomPosition}
                    handleAddCustomDepartment={handleAddCustomDepartment}
                    handleAddCustomPosition={handleAddCustomPosition}
                    isEditing={isEditing}
                  />
                )}
                {isEditing && activeEditTab === 'leave' && selectedEmployee && (
                  <LeaveBalanceTab employee={selectedEmployee} />
                )}
                {isEditing && activeEditTab === 'access' && selectedEmployee && (
                  <AccessControlTab
                    employee={selectedEmployee}
                    allDepartments={departmentsState}
                    allEmployees={processedEmployees}
                    adminId={adminId}
                  />
                )}

                {/* Action buttons — hide on access tab (AccessControlTab has its own save) */}
                {activeEditTab !== 'access' && (
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleSaveEmployee}
                      disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50">
                      {isEditing
                        ? (updateEmployeeMutation.isPending ? 'Updating...' : 'Update Employee')
                        : (createEmployeeMutation.isPending ? 'Adding...' : 'Add Employee')}
                    </motion.button>
                    <button onClick={() => { setShowEmployeeModal(false); setNewEmployee({ ...EMPTY_FORM }); }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><Trash2 className="w-6 h-6 text-red-600" /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Delete Employee</h3>
                  <p className="text-gray-600">This cannot be undone.</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {getEmployeeAvatar(selectedEmployee)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{selectedEmployee.name || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}</p>
                  <p className="text-gray-600 text-sm">{selectedEmployee.position || 'N/A'} • {selectedEmployee.department || 'N/A'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={confirmDelete}
                  disabled={deleteEmployeeMutation.isPending}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition cursor-pointer disabled:opacity-50">
                  {deleteEmployeeMutation.isPending ? 'Deleting...' : 'Delete Employee'}
                </motion.button>
                <button onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Are you sure?</h3>
              <p className="text-gray-500 text-sm text-center mb-1">
                You are about to permanently delete
              </p>
              <p className="text-gray-800 font-semibold text-center mb-5">
                {selectedEmployee.name || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
              </p>
              <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl py-2 px-3 mb-6">
                ⚠️ This action cannot be undone. All data will be permanently removed.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  disabled={deleteEmployeeMutation.isPending}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={executeDelete}
                  disabled={deleteEmployeeMutation.isPending}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {deleteEmployeeMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Yes, Delete
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {showEmployeeDetailsModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {getEmployeeAvatar(selectedEmployee)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedEmployee.name || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}</h3>
                    <p className="text-gray-600">{selectedEmployee.position} • {selectedEmployee.department}</p>
                  </div>
                </div>
                <button onClick={() => setShowEmployeeDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex border-b border-gray-200 px-6">
                {[
                  { id: 'info', icon: User, label: 'Employee Information' },
                  { id: 'leave', icon: Calendar, label: 'Leave Balance & History' },
                  { id: 'attendance', icon: Clock, label: 'Attendance History' },
                ].map(tab => (
                  <button key={tab.id}
                    className={`py-4 px-6 border-b-2 cursor-pointer transition flex items-center gap-2 ${viewModalTab === tab.id ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setViewModalTab(tab.id)}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {viewModalTab === 'info' && <EmployeeFullInfoTab employee={selectedEmployee} />}
                {viewModalTab === 'leave' && <EmployeeLeaveHistoryTab employee={selectedEmployee} />}
                {viewModalTab === 'attendance' && <EmployeeAttendanceTab employee={selectedEmployee} />}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EmployeesPage;