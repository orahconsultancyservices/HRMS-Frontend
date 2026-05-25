import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Building2, Users, Crown, Plus, Edit2,
  Shield, User, Hash, ChevronDown, ChevronRight,
  X, Loader2, UserMinus, UserPlus, Pencil, Check,
  AlertTriangle, Briefcase,
} from 'lucide-react';
import { useOrganization } from '../../hooks/useOrganization';
import { useEmployees, type Employee } from '../../hooks/useEmployees';
import {
  useAssignDepartmentManager,
  useAssignTeamLead,
  useAssignTeamMember,
  useRemoveDepartmentManager,
  useRemoveTeamLead,
  useRemoveTeamMember,
  useUpdateDepartmentInfo,
} from '../../hooks/useOrganizationMutations';

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTES = [
  { header: 'bg-blue-600',    light: 'bg-blue-50',    icon: 'text-blue-600',    badge: 'bg-blue-100 text-blue-800',    border: 'border-blue-200'    },
  { header: 'bg-violet-600',  light: 'bg-violet-50',  icon: 'text-violet-600',  badge: 'bg-violet-100 text-violet-800', border: 'border-violet-200'  },
  { header: 'bg-pink-600',    light: 'bg-pink-50',    icon: 'text-pink-600',    badge: 'bg-pink-100 text-pink-800',    border: 'border-pink-200'    },
  { header: 'bg-teal-600',    light: 'bg-teal-50',    icon: 'text-teal-600',    badge: 'bg-teal-100 text-teal-800',    border: 'border-teal-200'    },
  { header: 'bg-amber-600',   light: 'bg-amber-50',   icon: 'text-amber-600',   badge: 'bg-amber-100 text-amber-800',  border: 'border-amber-200'   },
  { header: 'bg-emerald-600', light: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?';
}

function Avatar({ name, size = 'md', color = 'slate' }: { name: string; size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  const bg =
    color === 'amber'   ? 'from-amber-400 to-amber-600'   :
    color === 'rose'    ? 'from-rose-400 to-rose-600'     :
    color === 'blue'    ? 'from-blue-400 to-blue-600'     :
    color === 'emerald' ? 'from-emerald-400 to-emerald-600' :
    'from-slate-400 to-slate-600';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${bg} flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}>
      {initials(name)}
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
}

function ConfirmModal({
  title, message, confirmLabel = 'Remove', danger = true,
  onConfirm, onCancel, loading,
}: {
  title: string; message: string; confirmLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} disabled={loading}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className={`px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'assign-manager' }
  | { type: 'add-teamlead' }
  | { type: 'add-member'; tlId: number; tlName: string }
  | { type: 'assign-unassigned'; empId: number; empName: string }
  | { type: 'edit-dept' }
  | { type: 'confirm-remove-manager'; managerId: number; managerName: string }
  | { type: 'confirm-remove-tl'; tlId: number; tlName: string }
  | { type: 'confirm-remove-member'; memberId: number; memberName: string }
  | null;

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { deptId: number }

const DepartmentDetailPage: React.FC<Props> = ({ deptId }) => {
  const navigate = useNavigate();
  const { departments, isLoading: orgLoading } = useOrganization();
  const { data: allEmpData = [], isLoading: empLoading } = useEmployees();

  // Coerce employees array (hook returns Employee[] directly)
  const allEmployees: Employee[] = Array.isArray(allEmpData) ? allEmpData : [];

  const [modal, setModal] = useState<ModalState>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<number | ''>('');
  const [formError, setFormError] = useState('');
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '' });
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set([/* start all expanded */]));

  // ── Find dept ──────────────────────────────────────────────────────────────
  const deptIndex = departments.findIndex(d => d.id === deptId);
  const dept = departments[deptIndex] ?? null;
  const pal = PALETTES[(deptIndex >= 0 ? deptIndex : deptId) % PALETTES.length];

  // ── Enrich: derive allDeptEmployees from full employee list ───────────────
  const deptEmployees = useMemo(() => {
    if (!dept) return [];
    const lc = dept.name.toLowerCase();
    return allEmployees.filter(e =>
      (e.departmentId === dept.id || (e.department || '').toLowerCase() === lc) &&
      e.isActive !== false
    );
  }, [dept, allEmployees]);

  // Unassigned = in dept, not manager, not TL, not under any TL
  const unassigned = useMemo(() => {
    if (!dept) return [];
    const placedIds = new Set<number>([
      ...(dept.manager ? [dept.manager.id] : []),
      ...(dept.teamLeads || []).map(tl => tl.id),
      ...(dept.teamLeads || []).flatMap(tl => tl.employees.map(e => e.id)),
    ]);
    return deptEmployees.filter(e => !placedIds.has(e.id));
  }, [dept, deptEmployees]);

  // Expand all teams on first load
  React.useEffect(() => {
    if (dept?.teamLeads?.length) {
      setExpandedTeams(new Set(dept.teamLeads.map(tl => tl.id)));
    }
  }, [dept?.id]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const assignManager   = useAssignDepartmentManager();
  const assignTL        = useAssignTeamLead();
  const assignMember    = useAssignTeamMember();
  const removeMgr       = useRemoveDepartmentManager();
  const removeTL        = useRemoveTeamLead();
  const removeMember    = useRemoveTeamMember();
  const updateDept      = useUpdateDepartmentInfo();

  const isMutating =
    assignManager.isPending || assignTL.isPending || assignMember.isPending ||
    removeMgr.isPending || removeTL.isPending || removeMember.isPending || updateDept.isPending;

  // ── Employee pools for dropdowns ──────────────────────────────────────────
  const activeEmployees = allEmployees.filter(e => e.isActive !== false);

  const managerPool = useMemo(() => {
    if (!dept) return activeEmployees;
    return activeEmployees.filter(e => e.id !== dept.manager?.id);
  }, [activeEmployees, dept]);

  const tlPool = useMemo(() => {
    if (!dept) return activeEmployees;
    const existingTLIds = new Set((dept.teamLeads || []).map(t => t.id));
    return activeEmployees.filter(e =>
      !existingTLIds.has(e.id) &&
      e.id !== dept.manager?.id
    );
  }, [activeEmployees, dept]);

  const memberPool = useMemo(() => {
    if (!dept) return activeEmployees;
    const placedIds = new Set<number>([
      ...(dept.manager ? [dept.manager.id] : []),
      ...(dept.teamLeads || []).map(t => t.id),
      ...(dept.teamLeads || []).flatMap(t => t.employees.map(e => e.id)),
    ]);
    return activeEmployees.filter(e => !placedIds.has(e.id));
  }, [activeEmployees, dept]);

  const tlForAssign = dept?.teamLeads || [];

  // ── Helpers ───────────────────────────────────────────────────────────────
  const closeModal = () => {
    setModal(null);
    setSelectedEmpId('');
    setFormError('');
  };

  const toggleTeam = (id: number) =>
    setExpandedTeams(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleAssignManager = async () => {
    if (!selectedEmpId || !dept) { setFormError('Please select an employee.'); return; }
    try {
      await assignManager.mutateAsync({
        employeeId: Number(selectedEmpId),
        departmentId: dept.id,
        departmentName: dept.name,
      });
      closeModal();
    } catch (e: unknown) {
      setFormError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleAssignTL = async () => {
    if (!selectedEmpId || !dept) { setFormError('Please select an employee.'); return; }
    try {
      await assignTL.mutateAsync({
        employeeId: Number(selectedEmpId),
        departmentId: dept.id,
        departmentName: dept.name,
        managerId: dept.manager?.id ?? null,
      });
      closeModal();
    } catch (e: unknown) {
      setFormError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleAddMember = async (tlId: number) => {
    if (!selectedEmpId || !dept) { setFormError('Please select an employee.'); return; }
    try {
      await assignMember.mutateAsync({
        employeeId: Number(selectedEmpId),
        departmentId: dept.id,
        departmentName: dept.name,
        teamLeadId: tlId,
      });
      closeModal();
    } catch (e: unknown) {
      setFormError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleAssignUnassigned = async (tlId: number) => {
    if (!dept || modal?.type !== 'assign-unassigned') return;
    try {
      await assignMember.mutateAsync({
        employeeId: modal.empId,
        departmentId: dept.id,
        departmentName: dept.name,
        teamLeadId: tlId,
      });
      closeModal();
    } catch (e: unknown) {
      setFormError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleRemoveManager = async () => {
    if (modal?.type !== 'confirm-remove-manager') return;
    try {
      await removeMgr.mutateAsync({ managerId: modal.managerId });
      closeModal();
    } catch { closeModal(); }
  };

  const handleRemoveTL = async () => {
    if (modal?.type !== 'confirm-remove-tl') return;
    try {
      await removeTL.mutateAsync({ tlId: modal.tlId, managerId: dept?.manager?.id });
      closeModal();
    } catch { closeModal(); }
  };

  const handleRemoveMember = async () => {
    if (modal?.type !== 'confirm-remove-member') return;
    try {
      await removeMember.mutateAsync({ memberId: modal.memberId });
      closeModal();
    } catch { closeModal(); }
  };

  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dept || !editForm.name.trim() || !editForm.code.trim()) {
      setFormError('Name and code are required.');
      return;
    }
    try {
      await updateDept.mutateAsync({ id: dept.id, data: editForm });
      closeModal();
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Update failed');
    }
  };

  // ── Loading / not found ───────────────────────────────────────────────────
  if (orgLoading || empLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Building2 className="w-14 h-14 text-gray-200" />
        <p className="text-gray-500 font-medium">Department not found</p>
        <button onClick={() => navigate('/organization')}
          className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Organization
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Back + title bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/organization')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Organization
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-semibold">{dept.name}</span>
      </div>

      {/* ── Department header card ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl overflow-hidden shadow-sm border border-white/20`}
      >
        <div className={`${pal.header} text-white px-6 py-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">{dept.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-white/75 text-sm">
                  <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{dept.code}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{dept.employeeCount} members</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{dept.teamLeads.length} team{dept.teamLeads.length !== 1 ? 's' : ''}</span>
                </div>
                {dept.description && (
                  <p className="text-white/70 text-sm mt-1">{dept.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setEditForm({ name: dept.name, code: dept.code, description: dept.description || '' });
                setFormError('');
                setModal({ type: 'edit-dept' });
              }}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-medium transition shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 divide-x bg-white border-t border-gray-100">
          {[
            { label: 'Manager', value: dept.manager ? 1 : 0, icon: Crown },
            { label: 'Team Leads', value: dept.teamLeads.length, icon: Shield },
            { label: 'Members', value: dept.employeeCount, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3">
              <div className={`p-1.5 rounded-lg ${pal.light}`}>
                <Icon className={`w-4 h-4 ${pal.icon}`} />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Manager section ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            Department Manager
          </h2>
          {!dept.manager && (
            <button
              onClick={() => { setSelectedEmpId(''); setFormError(''); setModal({ type: 'assign-manager' }); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Assign Manager
            </button>
          )}
        </div>

        {dept.manager ? (
          <div className="bg-white border border-amber-200 rounded-xl p-4 flex items-center gap-4">
            <Avatar name={dept.manager.name} size="lg" color="amber" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{dept.manager.name}</p>
              <p className="text-sm text-gray-500">{dept.manager.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                <Crown className="w-2.5 h-2.5" /> Department Manager
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setSelectedEmpId(''); setFormError(''); setModal({ type: 'assign-manager' }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-lg text-xs font-semibold transition"
              >
                <Edit2 className="w-3 h-3" /> Change
              </button>
              <button
                onClick={() => setModal({ type: 'confirm-remove-manager', managerId: dept.manager!.id, managerName: dept.manager!.name })}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition"
              >
                <UserMinus className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 border-dashed rounded-xl p-6 text-center">
            <Crown className="w-8 h-8 text-amber-300 mx-auto mb-2" />
            <p className="text-sm text-amber-700 font-medium">No manager assigned</p>
            <p className="text-xs text-amber-500 mt-0.5">Assign a manager to oversee this department</p>
          </div>
        )}
      </section>

      {/* ── Teams section ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500" />
            Teams ({dept.teamLeads.length})
          </h2>
          <button
            onClick={() => { setSelectedEmpId(''); setFormError(''); setModal({ type: 'add-teamlead' }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Team Lead
          </button>
        </div>

        {dept.teamLeads.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">No teams yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Add a team lead to create the first team</p>
            <button
              onClick={() => { setSelectedEmpId(''); setFormError(''); setModal({ type: 'add-teamlead' }); }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add Team Lead
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dept.teamLeads.map((tl) => (
              <motion.div
                key={tl.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* TL row */}
                <div className="flex items-center gap-3 p-4">
                  <Avatar name={tl.name} color="rose" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{tl.name}</p>
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Shield className="w-2 h-2" /> TL
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{tl.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tl.employees.length} member{tl.employees.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setSelectedEmpId(''); setFormError(''); setModal({ type: 'add-member', tlId: tl.id, tlName: tl.name }); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 rounded-lg text-xs font-semibold transition"
                    >
                      <UserPlus className="w-3 h-3" /> Add
                    </button>
                    <button
                      onClick={() => setModal({ type: 'confirm-remove-tl', tlId: tl.id, tlName: tl.name })}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition"
                    >
                      <UserMinus className="w-3 h-3" /> Remove TL
                    </button>
                    <button
                      onClick={() => toggleTeam(tl.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
                    >
                      {expandedTeams.has(tl.id)
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Members list */}
                <AnimatePresence>
                  {expandedTeams.has(tl.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 bg-gray-50/50 p-3 space-y-1">
                        {tl.employees.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">
                            No members yet — click "Add" to assign employees to this team
                          </p>
                        ) : (
                          tl.employees.map((emp) => (
                            <div key={emp.id}
                              className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-100">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {initials(emp.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{emp.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{emp.position}</p>
                              </div>
                              <button
                                onClick={() => setModal({ type: 'confirm-remove-member', memberId: emp.id, memberName: emp.name })}
                                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                                title="Remove from team"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Unassigned section ───────────────────────────────────────────── */}
      {unassigned.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-gray-400" />
            Unassigned Members ({unassigned.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {unassigned.map((emp, i) => (
              <div key={emp.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials(`${emp.firstName} ${emp.lastName}`)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{emp.position || 'Employee'}</p>
                </div>
                {dept.teamLeads.length > 0 ? (
                  <button
                    onClick={() => { setFormError(''); setModal({ type: 'assign-unassigned', empId: emp.id, empName: `${emp.firstName} ${emp.lastName}` }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                  >
                    <Plus className="w-3 h-3" /> Assign to Team
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 italic">Add a TL first</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>

        {/* Assign / Change Manager */}
        {(modal?.type === 'assign-manager') && (
          <Modal
            title={dept.manager ? 'Change Department Manager' : 'Assign Department Manager'}
            onClose={closeModal}
          >
            <p className="text-sm text-gray-500 mb-4">
              {dept.manager
                ? `Replacing <strong>${dept.manager.name}</strong> as manager of <strong>${dept.name}</strong>.`
                : `Select an employee to manage <strong>${dept.name}</strong>.`}
            </p>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Employee</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-1"
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Choose an employee…</option>
              {managerPool.map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeId}) — {e.department || 'No dept'}
                </option>
              ))}
            </select>
            {formError && <p className="text-xs text-red-600 mt-2">{formError}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssignManager} disabled={isMutating}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {assignManager.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {dept.manager ? 'Change Manager' : 'Assign Manager'}
              </button>
            </div>
          </Modal>
        )}

        {/* Add Team Lead */}
        {modal?.type === 'add-teamlead' && (
          <Modal title="Add Team Lead" onClose={closeModal}>
            <p className="text-sm text-gray-500 mb-4">
              Assign an employee as team lead in <strong>{dept.name}</strong>.
            </p>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Employee</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 mb-1"
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Choose an employee…</option>
              {tlPool.map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeId}) — {e.department || 'No dept'}
                </option>
              ))}
            </select>
            {formError && <p className="text-xs text-red-600 mt-2">{formError}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssignTL} disabled={isMutating}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {assignTL.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add Team Lead
              </button>
            </div>
          </Modal>
        )}

        {/* Add Member to Team */}
        {modal?.type === 'add-member' && (
          <Modal title={`Add Member to ${modal.tlName}'s Team`} onClose={closeModal}>
            <p className="text-sm text-gray-500 mb-4">
              Assign an employee under <strong>{modal.tlName}</strong>.
            </p>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Employee</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-1"
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Choose an employee…</option>
              {memberPool.map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeId}) — {e.department || 'No dept'}
                </option>
              ))}
            </select>
            {memberPool.length === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-1">
                All active employees are already assigned. Add more employees from Employee Management first.
              </p>
            )}
            {formError && <p className="text-xs text-red-600 mt-2">{formError}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleAddMember(modal.tlId)} disabled={isMutating}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {assignMember.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add Member
              </button>
            </div>
          </Modal>
        )}

        {/* Assign Unassigned Employee to a Team */}
        {modal?.type === 'assign-unassigned' && (
          <Modal title={`Assign ${modal.empName} to a Team`} onClose={closeModal}>
            <p className="text-sm text-gray-500 mb-4">
              Select which team <strong>{modal.empName}</strong> should join.
            </p>
            <div className="space-y-2">
              {tlForAssign.map(tl => (
                <button
                  key={tl.id}
                  onClick={() => handleAssignUnassigned(tl.id)}
                  disabled={isMutating}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition text-left disabled:opacity-50"
                >
                  <Avatar name={tl.name} size="sm" color="rose" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{tl.name}</p>
                    <p className="text-xs text-gray-400">{tl.employees.length} member{tl.employees.length !== 1 ? 's' : ''}</p>
                  </div>
                  {assignMember.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />}
                </button>
              ))}
            </div>
            {formError && <p className="text-xs text-red-600 mt-3">{formError}</p>}
            <button onClick={closeModal} className="w-full mt-4 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
          </Modal>
        )}

        {/* Edit Department */}
        {modal?.type === 'edit-dept' && (
          <Modal title="Edit Department" onClose={closeModal}>
            <form onSubmit={handleUpdateDept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Department name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Code *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.code}
                  onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. ENG"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  rows={2}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              {formError && <p className="text-xs text-red-600">{formError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={updateDept.isPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                  {updateDept.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Confirm: Remove Manager */}
        {modal?.type === 'confirm-remove-manager' && (
          <ConfirmModal
            title="Remove Manager"
            message={`Remove ${modal.managerName} as manager of ${dept.name}? They will be demoted to employee.`}
            confirmLabel="Remove Manager"
            onConfirm={handleRemoveManager}
            onCancel={closeModal}
            loading={removeMgr.isPending}
          />
        )}

        {/* Confirm: Remove Team Lead */}
        {modal?.type === 'confirm-remove-tl' && (
          <ConfirmModal
            title="Remove Team Lead"
            message={`Remove ${modal.tlName} as team lead? They will be demoted to employee. Their team members will become unassigned.`}
            confirmLabel="Remove Team Lead"
            onConfirm={handleRemoveTL}
            onCancel={closeModal}
            loading={removeTL.isPending}
          />
        )}

        {/* Confirm: Remove Member */}
        {modal?.type === 'confirm-remove-member' && (
          <ConfirmModal
            title="Remove from Team"
            message={`Remove ${modal.memberName} from this team? They will move to the unassigned pool but remain in the department.`}
            confirmLabel="Remove from Team"
            onConfirm={handleRemoveMember}
            onCancel={closeModal}
            loading={removeMember.isPending}
          />
        )}

      </AnimatePresence>
    </div>
  );
};

export default DepartmentDetailPage;
