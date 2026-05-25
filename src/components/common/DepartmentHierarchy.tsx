import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, Users, User, Crown, Plus } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
  manager?: {
    id: number;
    name: string;
    email: string;
  };
  teamLeads: Array<{
    id: number;
    name: string;
    email: string;
    employees: Array<{
      id: number;
      name: string;
      email: string;
      position: string;
    }>;
  }>;
  employeeCount: number;
}

interface DepartmentHierarchyProps {
  departments: Department[];
  onAddManager?: (departmentId: number) => void;
  onAddTeamLead?: (departmentId: number) => void;
  onAddEmployee?: (teamLeadId: number) => void;
  className?: string;
}

const DepartmentHierarchy: React.FC<DepartmentHierarchyProps> = ({
  departments,
  onAddManager,
  onAddTeamLead,
  onAddEmployee,
  className = ''
}) => {
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());

  const toggleDepartment = (deptId: number) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const toggleTeam = (teamLeadId: number) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamLeadId)) {
      newExpanded.delete(teamLeadId);
    } else {
      newExpanded.add(teamLeadId);
    }
    setExpandedTeams(newExpanded);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {departments.map((department) => (
        <div key={department.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Department Header */}
          <div 
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
            onClick={() => toggleDepartment(department.id)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {expandedDepts.has(department.id) ? 
                  <ChevronDown className="w-4 h-4 text-gray-600" /> : 
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                }
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              
              <div>
                <div className="font-semibold text-gray-900">
                  {department.name}
                </div>
                <div className="text-sm text-gray-500">
                  {department.code} • {department.employeeCount} employees
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {department.manager && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full">
                  <Crown className="w-3 h-3 text-amber-600" />
                  <span className="text-xs font-medium text-amber-800">
                    {department.manager.name}
                  </span>
                </div>
              )}
              
              {onAddManager && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddManager(department.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                  title={department.manager ? 'Change Manager' : 'Add Manager'}
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Department Content */}
          {expandedDepts.has(department.id) && (
            <div className="p-4 space-y-3">
              {/* Team Leads */}
              {department.teamLeads.map((teamLead) => (
                <div key={teamLead.id} className="border border-gray-100 rounded-lg">
                  {/* Team Lead Header */}
                  <div 
                    className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 cursor-pointer"
                    onClick={() => toggleTeam(teamLead.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {expandedTeams.has(teamLead.id) ? 
                          <ChevronDown className="w-3 h-3 text-red-600" /> : 
                          <ChevronRight className="w-3 h-3 text-red-600" />
                        }
                        <Users className="w-4 h-4 text-red-600" />
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          {teamLead.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Team Lead • {teamLead.employees.length} team members
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onAddEmployee && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddEmployee(teamLead.id);
                          }}
                          className="p-1 hover:bg-red-200 rounded"
                          title="Add Employee"
                        >
                          <Plus className="w-3 h-3 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Team Members */}
                  {expandedTeams.has(teamLead.id) && (
                    <div className="p-3 space-y-2">
                      {teamLead.employees.map((employee) => (
                        <div key={employee.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <User className="w-4 h-4 text-gray-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {employee.position}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {employee.email}
                          </div>
                        </div>
                      ))}
                      
                      {teamLead.employees.length === 0 && (
                        <div className="text-center py-4 text-sm text-gray-500">
                          No team members assigned
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Team Lead Button */}
              {onAddTeamLead && (
                <button
                  onClick={() => onAddTeamLead(department.id)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Team Lead
                </button>
              )}

              {department.teamLeads.length === 0 && !onAddTeamLead && (
                <div className="text-center py-8 text-sm text-gray-500">
                  No team leads assigned to this department
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DepartmentHierarchy;
