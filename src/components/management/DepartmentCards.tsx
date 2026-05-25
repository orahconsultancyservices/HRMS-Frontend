import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, Crown, ChevronDown, ChevronRight,
  Plus, Shield, User, Briefcase, Hash
} from 'lucide-react';
import type { Department } from '../../hooks/useOrganization';

// ─── Colour palette per department index ─────────────────────────────────────
const DEPT_PALETTES = [
  { header: 'bg-blue-600',   badge: 'bg-blue-100 text-blue-800',   icon: 'text-blue-600',   ring: 'ring-blue-200'  },
  { header: 'bg-violet-600', badge: 'bg-violet-100 text-violet-800', icon: 'text-violet-600', ring: 'ring-violet-200' },
  { header: 'bg-pink-600',   badge: 'bg-pink-100 text-pink-800',   icon: 'text-pink-600',   ring: 'ring-pink-200'  },
  { header: 'bg-teal-600',   badge: 'bg-teal-100 text-teal-800',   icon: 'text-teal-600',   ring: 'ring-teal-200'  },
  { header: 'bg-amber-600',  badge: 'bg-amber-100 text-amber-800', icon: 'text-amber-600',  ring: 'ring-amber-200' },
  { header: 'bg-emerald-600',badge: 'bg-emerald-100 text-emerald-800',icon:'text-emerald-600',ring:'ring-emerald-200'},
];
const palette = (i: number) => DEPT_PALETTES[i % DEPT_PALETTES.length];

// ─── Prop types ───────────────────────────────────────────────────────────────
interface DeptWithEmployees extends Department {
  allEmployees?: Array<{
    id: number;
    name: string;
    position: string;
    role?: string;
    avatar?: string;
    teamLeadId?: number | null;
  }>;
}

interface Props {
  departments: DeptWithEmployees[];
  onAddManager: (deptId: number) => void;
  onAddTeamLead: (deptId: number) => void;
  onAddEmployee: (teamLeadId: number) => void;
  onCreateDept: () => void;
  onClickDept?: (deptId: number) => void;
}

// ─── Avatar helper ────────────────────────────────────────────────────────────
function Avatar({ name, small }: { name: string; small?: boolean }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sz = small ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-semibold shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role?: string }) {
  const map: Record<string, string> = {
    manager:  'bg-amber-100 text-amber-700',
    teamlead: 'bg-red-100 text-red-700',
    hr:       'bg-emerald-100 text-emerald-700',
    employee: 'bg-gray-100 text-gray-600',
  };
  const label = role === 'teamlead' ? 'Team Lead' : role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Employee';
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${map[role ?? 'employee'] ?? map.employee}`}>
      {label}
    </span>
  );
}

// ─── Single Department Card ───────────────────────────────────────────────────
function DepartmentCard({
  dept,
  idx,
  onAddManager,
  onAddTeamLead,
  onAddEmployee,
  onClickDept,
}: {
  dept: DeptWithEmployees;
  idx: number;
  onAddManager: () => void;
  onAddTeamLead: () => void;
  onAddEmployee: (tlId: number) => void;
  onClickDept?: () => void;
}) {
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [showUnassigned, setShowUnassigned] = useState(false);
  const pal = palette(idx);

  const toggleTeam = (id: number) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Employees not under any team lead (unassigned)
  const assignedIds = new Set(
    dept.teamLeads.flatMap(tl => tl.employees.map(e => e.id))
  );
  const unassigned = (dept.allEmployees ?? []).filter(
    e => !assignedIds.has(e.id) && e.role !== 'manager' && e.role !== 'teamlead'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
    >
      {/* Coloured header */}
      <div className={`${pal.header} px-5 py-4 text-white`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 opacity-90" />
              <h3 className="font-bold text-lg leading-tight">{dept.name}</h3>
            </div>
            <div className="flex items-center gap-3 mt-1 text-white/75 text-xs">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{dept.code}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{dept.employeeCount} employees</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onClickDept && (
              <button
                onClick={onClickDept}
                title="View department details"
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 transition text-xs font-semibold flex items-center gap-1"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onAddTeamLead}
              title="Add Team Lead"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Manager row */}
        <div className="mt-3 flex items-center gap-2">
          {dept.manager ? (
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 text-xs font-medium">
              <Crown className="w-3.5 h-3.5" />
              <span>{dept.manager.name}</span>
              <span className="opacity-70">· Manager</span>
            </div>
          ) : (
            <button
              onClick={onAddManager}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-medium transition"
            >
              <Plus className="w-3 h-3" />
              Assign Manager
            </button>
          )}
        </div>
      </div>

      {/* Body — teams */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[420px]">
        {dept.teamLeads.length === 0 && unassigned.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No teams yet</p>
            <button onClick={onAddTeamLead} className={`mt-3 text-xs font-semibold ${pal.icon} hover:underline`}>
              + Add first team lead
            </button>
          </div>
        )}

        {dept.teamLeads.map((tl) => (
          <div key={tl.id} className="border border-gray-100 rounded-xl overflow-hidden">
            {/* TL row */}
            <button
              className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
              onClick={() => toggleTeam(tl.id)}
            >
              <Avatar name={tl.name} small />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{tl.name}</p>
                <p className="text-xs text-gray-500">{tl.employees.length} members</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  TL
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddEmployee(tl.id); }}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition"
                  title="Add member"
                >
                  <Plus className="w-3 h-3 text-gray-600" />
                </button>
                {expandedTeams.has(tl.id)
                  ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
              </div>
            </button>

            {/* Team members */}
            <AnimatePresence>
              {expandedTeams.has(tl.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 space-y-1 bg-white">
                    {tl.employees.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">No members assigned</p>
                    )}
                    {tl.employees.map(emp => (
                      <div key={emp.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{emp.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{emp.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Unassigned employees */}
        {unassigned.length > 0 && (
          <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
              onClick={() => setShowUnassigned(v => !v)}
            >
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600">Unassigned ({unassigned.length})</p>
              </div>
              {showUnassigned ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            <AnimatePresence>
              {showUnassigned && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 space-y-1 bg-white">
                    {unassigned.map(emp => (
                      <div key={emp.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{emp.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{emp.position}</p>
                        </div>
                        <RoleBadge role={emp.role} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          {dept.teamLeads.length} team{dept.teamLeads.length !== 1 ? 's' : ''}
        </span>
        {onClickDept ? (
          <button
            onClick={onClickDept}
            className={`flex items-center gap-1 font-semibold ${pal.icon} hover:underline`}
          >
            Manage
            <ChevronRight className="w-3 h-3" />
          </button>
        ) : (
          <span className={`font-semibold ${pal.icon}`}>
            {dept.employeeCount} members total
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
const DepartmentCards: React.FC<Props> = ({
  departments,
  onAddManager,
  onAddTeamLead,
  onAddEmployee,
  onCreateDept,
  onClickDept,
}) => {
  if (departments.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 font-medium mb-2">No departments yet</p>
        <p className="text-sm text-gray-400 mb-6">Create your first department to build the org structure.</p>
        <button
          onClick={onCreateDept}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create Department
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {departments.map((dept, i) => (
        <DepartmentCard
          key={dept.id}
          dept={dept}
          idx={i}
          onAddManager={() => onAddManager(dept.id)}
          onAddTeamLead={() => onAddTeamLead(dept.id)}
          onAddEmployee={onAddEmployee}
          onClickDept={onClickDept ? () => onClickDept(dept.id) : undefined}
        />
      ))}
    </div>
  );
};

export default DepartmentCards;
