// src/components/employer/AccessControlTab.tsx
// Manages cross-department/team visibility permissions for Team Leads and Managers
// Drop this into EmployeesPage.tsx or import it there

import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, X, ChevronDown, Check,
  Eye, Settings, Users, Building,
  AlertCircle, Info, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AccessPermission {
  id?: number;
  targetType: 'department' | 'team';
  targetId: number;
  targetName: string;
  accessLevel: 'view' | 'manage';
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  role?: string;
}

interface AccessControlTabProps {
  employee: Employee;
  allDepartments: string[];
  allEmployees: Employee[]; // For listing other team leads
  adminId: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API HOOKS
// ─────────────────────────────────────────────────────────────────────────────

const useEmployeePermissions = (employeeId: number) => {
  return useQuery({
    queryKey: ['accessPermissions', employeeId],
    queryFn: async () => {
      try {
        const res = await api.get(`/access-permissions/employee/${employeeId}`);
        return (res.data?.data || []) as AccessPermission[];
      } catch {
        return [] as AccessPermission[];
      }
    },
    enabled: !!employeeId,
  });
};

const useUpdatePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, permissions, grantedBy }: {
      employeeId: number;
      permissions: AccessPermission[];
      grantedBy: number;
    }) => {
      const res = await api.put(`/access-permissions/employee/${employeeId}`, {
        permissions,
        grantedBy
      });
      return res.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['accessPermissions', vars.employeeId] });
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AccessControlTab: React.FC<AccessControlTabProps> = ({
  employee,
  allDepartments,
  allEmployees,
  adminId
}) => {
  const { data: savedPermissions = [], isLoading } = useEmployeePermissions(employee.id);
  const updateMutation = useUpdatePermissions();
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync from DB
  useEffect(() => {
    if (savedPermissions.length >= 0) {
      setPermissions(savedPermissions);
      setIsDirty(false);
    }
  }, [savedPermissions]);

  // Other team leads (for team-level permissions)
  const otherTeamLeads = allEmployees.filter(e =>
    e.id !== employee.id &&
    (e.role === 'teamlead' ||
      (e.position || '').toLowerCase().includes('team lead') ||
      (e.position || '').toLowerCase().includes('tl'))
  );

  // Departments employee doesn't own
  const ownDept = employee.department || '';
  const otherDepartments = allDepartments.filter(d => d !== ownDept);

  const isRole = (role: string) =>
    employee.role === role ||
    (role === 'teamlead' && (employee.position || '').toLowerCase().includes('team lead')) ||
    (role === 'manager' && (employee.position || '').toLowerCase().includes('manager'));

  const isHR = employee.role === 'hr';
  const isLeadOrManager = isRole('teamlead') || isRole('manager') || isHR;

  const addDepartmentPermission = (deptName: string) => {
    if (permissions.some(p => p.targetType === 'department' && p.targetName === deptName)) return;
    setPermissions(prev => [
      ...prev,
      { targetType: 'department', targetId: allDepartments.indexOf(deptName), targetName: deptName, accessLevel: 'view' }
    ]);
    setIsDirty(true);
  };

  const addTeamPermission = (lead: Employee) => {
    if (permissions.some(p => p.targetType === 'team' && p.targetId === lead.id)) return;
    setPermissions(prev => [
      ...prev,
      { targetType: 'team', targetId: lead.id, targetName: `${lead.firstName} ${lead.lastName}'s team`, accessLevel: 'view' }
    ]);
    setIsDirty(true);
  };

  const removePermission = (idx: number) => {
    setPermissions(prev => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const setAccessLevel = (idx: number, level: 'view' | 'manage') => {
    setPermissions(prev => prev.map((p, i) => i === idx ? { ...p, accessLevel: level } : p));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        employeeId: employee.id,
        permissions,
        grantedBy: adminId
      });
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      alert('Failed to save permissions');
    }
  };

  if (!isLeadOrManager) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">Access control is only available for Team Leads, Managers, and HR</p>
        <p className="text-sm text-gray-400 mt-2">
          Change this employee's role to Team Lead, Manager, or HR to manage their department/team visibility.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const deptPerms = permissions.filter(p => p.targetType === 'department');
  const teamPerms = permissions.filter(p => p.targetType === 'team');
  const availableDepts = otherDepartments.filter(
    d => !permissions.some(p => p.targetType === 'department' && p.targetName === d)
  );
  const availableLeads = otherTeamLeads.filter(
    l => !permissions.some(p => p.targetType === 'team' && p.targetId === l.id)
  );

  return (
    <div className="space-y-6">
      {/* Header info */}
      {isHR ? (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Shield className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">HR — Organisation-Wide Access</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              <strong>{employee.firstName}</strong> has the <strong>HR</strong> role and can already see{' '}
              <strong>all employees, attendance, and leaves</strong> across every department by default.
              You can optionally grant additional explicit permissions below, but they are not required.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {isRole('manager') ? 'Manager' : 'Team Lead'} Access Control
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              By default, <strong>{employee.firstName}</strong> can only see employees and tasks in the{' '}
              <strong>{ownDept || 'their'}</strong> department.
              Use the controls below to grant access to other departments or specific teams.
            </p>
          </div>
        </div>
      )}

      {/* Own department badge */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Own Department (always visible)</p>
        <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl w-fit">
          <Building className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">{ownDept || 'Not assigned'}</span>
          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full ml-1">Full Access</span>
        </div>
      </div>

      {/* Department Permissions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Department Visibility</p>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{deptPerms.length}</span>
          </div>
          {/* Add dept dropdown */}
          {availableDepts.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                Add Department
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-xl z-20 w-56 py-1 hidden group-hover:block">
                {availableDepts.map(dept => (
                  <button
                    key={dept}
                    onClick={() => addDepartmentPermission(dept)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {deptPerms.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <Building className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No extra department access granted</p>
            <p className="text-xs text-gray-300 mt-1">Click "Add Department" to grant cross-department visibility</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deptPerms.map((perm, globalIdx) => {
              const idx = permissions.indexOf(perm);
              return (
                <div key={`dept-${perm.targetName}`}
                  className="flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{perm.targetName}</p>
                    <p className="text-xs text-gray-400">Department</p>
                  </div>
                  {/* Access level toggle */}
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setAccessLevel(idx, 'view')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        perm.accessLevel === 'view'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() => setAccessLevel(idx, 'manage')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        perm.accessLevel === 'manage'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Settings className="w-3 h-3" />
                      Manage
                    </button>
                  </div>
                  <button
                    onClick={() => removePermission(idx)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Permissions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Team Visibility</p>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{teamPerms.length}</span>
          </div>
          {availableLeads.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                Add Team
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-xl z-20 w-64 py-1 hidden group-hover:block">
                {availableLeads.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => addTeamPermission(lead)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {lead.firstName[0]}
                    </div>
                    <div>
                      <span className="font-medium">{lead.firstName} {lead.lastName}</span>
                      <span className="text-xs text-gray-400 block">{lead.department}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {teamPerms.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No specific team access granted</p>
            <p className="text-xs text-gray-300 mt-1">Grant access to another team lead's team</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teamPerms.map((perm) => {
              const idx = permissions.indexOf(perm);
              const lead = allEmployees.find(e => e.id === perm.targetId);
              return (
                <div key={`team-${perm.targetId}`}
                  className="flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {lead?.firstName?.[0] || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{perm.targetName}</p>
                    <p className="text-xs text-gray-400">
                      {lead ? `${lead.department} · ${lead.position}` : 'Team'}
                    </p>
                  </div>
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setAccessLevel(idx, 'view')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        perm.accessLevel === 'view'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() => setAccessLevel(idx, 'manage')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        perm.accessLevel === 'manage'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Settings className="w-3 h-3" />
                      Manage
                    </button>
                  </div>
                  <button
                    onClick={() => removePermission(idx)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Access Level Legend */}
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p><span className="font-semibold text-blue-600">View</span> — Can see employees, attendance, leaves and tasks in that dept/team but cannot create/edit tasks for them.</p>
          <p><span className="font-semibold text-purple-600">Manage</span> — Full authority: can assign tasks, approve leaves, and edit records for that dept/team.</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <Check className="w-4 h-4" />
            Permissions saved!
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={!isDirty || updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Shield className="w-4 h-4" />
          {updateMutation.isPending ? 'Saving…' : 'Save Permissions'}
        </button>
      </div>
    </div>
  );
};

export default AccessControlTab;