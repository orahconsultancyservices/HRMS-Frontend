 
import React, { useState, useEffect } from 'react';
import {
  Shield, User, Building, Users, ChevronDown,
  AlertTriangle, Check
} from 'lucide-react';
 
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  role?: string;
  reportTo?: number;
  managesDepartment?: number;
}
 
interface EmployeeRoleTabProps {
  employee: Employee;
  allEmployees: Employee[];
  allDepartments: string[];
  onSave: (data: {
    role: string;
    reportTo: number | null;
    managesDepartment: number | null;
  }) => void;
  isSaving?: boolean;
}
 
const ROLE_CONFIG = {
  employee: {
    label: 'Employee',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dot: 'bg-gray-400',
    desc: 'Standard employee. Can only see their own data.'
  },
  teamlead: {
    label: 'Team Lead',
    color: 'bg-red-100 text-red-700 border-red-300',
    dot: 'bg-red-500',
    desc: 'Can see and manage their direct report\'s tasks, attendance and leaves within their department.'
  },
  manager: {
    label: 'Manager',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    dot: 'bg-amber-500',
    desc: 'Department-level access. Can see all teams in their managed department including team leads.'
  },
  hr: {
    label: 'HR',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    dot: 'bg-emerald-500',
    desc: 'Human Resources access. Can create, edit and delete all employees, manage attendance and leaves across all departments.'
  },
  employer: {
    label: 'Admin',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    dot: 'bg-purple-600',
    desc: 'Full system access. Cannot be set here — only via admin account.'
  }
};
 
export const EmployeeRoleTab: React.FC<EmployeeRoleTabProps> = ({
  employee, allEmployees, allDepartments, onSave, isSaving
}) => {
  const [role, setRole] = useState<string>(employee.role || 'employee');
  const [reportTo, setReportTo] = useState<number | null>(employee.reportTo || null);
  const [managesDepartment, setManagesDepartment] = useState<number | null>(employee.managesDepartment || null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
 
  useEffect(() => {
    setRole(employee.role || 'employee');
    setReportTo(employee.reportTo || null);
    setManagesDepartment(employee.managesDepartment || null);
    setIsDirty(false);
  }, [employee]);
 
  // Potential managers (employees with manager role in same or any department)
  const potentialManagers = allEmployees.filter(e =>
    e.id !== employee.id &&
    (e.role === 'manager' || (e.position || '').toLowerCase().includes('manager'))
  );
 
  // Potential team leads (for reporting)
  const potentialTeamLeads = allEmployees.filter(e =>
    e.id !== employee.id &&
    (e.role === 'teamlead' || (e.position || '').toLowerCase().includes('team lead'))
  );
 
  const reportToOptions = role === 'teamlead' ? potentialManagers : potentialTeamLeads;
 
  const handleSave = () => {
    onSave({ role, reportTo, managesDepartment });
    setIsDirty(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };
 
  const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.employee;
 
  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Role Assignment
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['employee', 'teamlead', 'manager', 'hr'] as const).map(r => {
            const c = ROLE_CONFIG[r];
            return (
              <button
                key={r}
                onClick={() => { setRole(r); setIsDirty(true); }}
                className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                  role === r
                    ? `${c.color} border-current shadow-sm`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                  <span className="font-semibold text-sm">{c.label}</span>
                  {role === r && <Check className="w-3.5 h-3.5 ml-auto" />}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
 
      {/* Manager: which department they manage */}
      {role === 'manager' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Building className="w-4 h-4 inline mr-1 text-amber-600" />
            Manages Department
          </label>
          <select
            value={managesDepartment ?? ''}
            onChange={e => {
              setManagesDepartment(e.target.value ? parseInt(e.target.value) : null);
              setIsDirty(true);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer text-sm"
          >
            <option value="">— Select department to manage —</option>
            {allDepartments.map((dept, idx) => (
              <option key={dept} value={idx}>{dept}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1.5">
            The manager can see all team leads and employees in this department.
          </p>
        </div>
      )}
 
      {/* Reports To */}
      {(role === 'teamlead' || role === 'employee') && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1 text-gray-500" />
            Reports To {role === 'teamlead' ? '(Manager)' : '(Team Lead / Manager)'}
          </label>
          <select
            value={reportTo ?? ''}
            onChange={e => {
              setReportTo(e.target.value ? parseInt(e.target.value) : null);
              setIsDirty(true);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white cursor-pointer text-sm"
          >
            <option value="">— None / Direct to Admin —</option>
            {allEmployees
              .filter(e => e.id !== employee.id)
              .map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.role || e.position || 'employee'}) – {e.department}
                </option>
              ))}
          </select>
          <p className="text-xs text-gray-400 mt-1.5">
            {role === 'teamlead'
              ? 'The manager above this team lead will be able to see all their team\'s activity.'
              : 'The team lead/manager above this employee can see and manage their tasks.'}
          </p>
        </div>
      )}
 
      {/* Current Access Summary */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Access Summary</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-gray-700">Role: <strong>{cfg.label}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700">
              Own department: <strong>{employee.department || 'Not assigned'}</strong>
            </span>
          </div>
          {role === 'manager' && managesDepartment !== null && (
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-gray-700">
                Manages: <strong>{allDepartments[managesDepartment] || '—'}</strong>
              </span>
            </div>
          )}
          {reportTo && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-700">
                Reports to: <strong>
                  {(() => {
                    const mgr = allEmployees.find(e => e.id === reportTo);
                    return mgr ? `${mgr.firstName} ${mgr.lastName}` : 'Unknown';
                  })()}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>
 
      {/* Warning for role changes */}
      {isDirty && role !== (employee.role || 'employee') && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Changing the role will update what this employee can see when they log in. This takes effect immediately after saving.</p>
        </div>
      )}
 
      {/* Save */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <Check className="w-4 h-4" />
            Saved!
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Shield className="w-4 h-4" />
          {isSaving ? 'Saving…' : 'Save Role Settings'}
        </button>
      </div>
    </div>
  );
};
 
export default EmployeeRoleTab;