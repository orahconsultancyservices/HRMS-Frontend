import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Building2, Users, User, Crown, BarChart3,
  Plus, X, Loader2, RefreshCw, LayoutGrid, Eye,
} from 'lucide-react';
import OrgChart, { type OrgChartNode } from '../common/OrgChart';
import DepartmentCards from './DepartmentCards';
import OrgOverview from './OrgOverview';
import { useOrganization } from '../../hooks/useOrganization';
import {
  useCreateDepartment,
  useAssignDepartmentManager,
  useAssignTeamLead,
  useAssignTeamMember,
} from '../../hooks/useOrganizationMutations';
import { useEmployees } from '../../hooks/useEmployees';
import { employeeApi } from '../../services/api';

type AssignMode = 'manager' | 'teamlead' | 'employee';

interface AssignContext {
  mode: AssignMode;
  departmentId: number;
  departmentName: string;
  teamLeadId?: number;
}

const OrganizationManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('departments');
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [assignContext, setAssignContext] = useState<AssignContext | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [formError, setFormError] = useState('');
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });

  const {
    departments,
    orgStats,
    isLoading,
    hasError,
    refetchAll,
  } = useOrganization();

  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  const createDept    = useCreateDepartment();
  const assignManager = useAssignDepartmentManager();
  const assignTeamLead = useAssignTeamLead();
  const assignMember  = useAssignTeamMember();

  const isMutating =
    createDept.isPending ||
    assignManager.isPending ||
    assignTeamLead.isPending ||
    assignMember.isPending;

  const [backfilling, setBackfilling] = React.useState(false);

  // Run backfill then refresh — safe to call many times (idempotent)
  const handleRefresh = async () => {
    setBackfilling(true);
    try { await employeeApi.backfillDepartmentIds(); } catch { /* ignore — non-fatal */ }
    finally { setBackfilling(false); }
    refetchAll();
  };

  // ─── Enrich departments with allEmployees list ───────────────────────────
  const enrichedDepartments = useMemo(() => {
    return departments.map(dept => {
      const deptName = dept.name.toLowerCase();
      const allEmployees = employees
        .filter(e =>
          (e.departmentId === dept.id ||
            (e.department || '').toLowerCase() === deptName) &&
          e.isActive !== false
        )
        .map(e => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          position: e.position || 'Employee',
          role: e.role,
          avatar: e.avatar,
          teamLeadId: e.reportTo ?? null,
        }));
      return { ...dept, allEmployees };
    });
  }, [departments, employees]);

  // ─── Build org chart from department structure ───────────────────────────────
  // Works even when employees have no reportTo set: departments → managers
  // → team leads → their members → any remaining unassigned employees.
  const orgChartFromDepts = useMemo((): OrgChartNode | null => {
    if (!enrichedDepartments.length) return null;

    // Top-level admin employee (if any)
    const adminEmp = employees.find(
      (e) =>
        e.role === 'admin' ||
        e.employeeId === 'ADMIN001' ||
        (e.position || '').toLowerCase() === 'admin' ||
        (e.position || '').toLowerCase().includes('administrator'),
    );

    const activeDepts = enrichedDepartments.filter((d) => d.isActive !== false);
    if (!activeDepts.length) return null;

    const deptNodes: OrgChartNode[] = activeDepts.map((dept, deptIdx) => {
      const mgr = dept.manager; // { id, name, email } | undefined

      // Team lead sub-trees
      const tlNodes: OrgChartNode[] = (dept.teamLeads || []).map((tl) => ({
        id: tl.id,
        name: tl.name,
        subtitle: 'Team Lead',
        role: 'teamlead' as const,
        department: dept.name,
        reports: (tl.employees || []).length,
        children: (tl.employees || []).map(
          (e): OrgChartNode => ({
            id: e.id,
            name: e.name,
            subtitle: e.position || 'Employee',
            role: 'employee',
            department: dept.name,
            children: [],
          }),
        ),
      }));

      // Employees not yet placed in the tree
      const placedIds = new Set<number>([
        ...(mgr ? [mgr.id] : []),
        ...(dept.teamLeads || []).map((t) => t.id),
        ...(dept.teamLeads || []).flatMap((t) => (t.employees || []).map((e) => e.id)),
      ]);
      const unassigned: OrgChartNode[] = (dept.allEmployees || [])
        .filter((e) => !placedIds.has(e.id))
        .map(
          (e): OrgChartNode => ({
            id: e.id,
            name: e.name,
            subtitle: e.position || 'Employee',
            role: e.role === 'teamlead' ? 'teamlead' : 'employee',
            department: dept.name,
            children: [],
          }),
        );

      // If a manager exists, TLs + unassigned hang under them; otherwise flat
      const deptChildren: OrgChartNode[] = mgr
        ? [
            {
              id: mgr.id,
              name: mgr.name,
              subtitle: 'Dept Manager',
              role: 'manager' as const,
              department: dept.name,
              reports: tlNodes.length + unassigned.length,
              children: [...tlNodes, ...unassigned],
            },
          ]
        : [...tlNodes, ...unassigned];

      const memberCount = dept.employeeCount || deptChildren.length;
      return {
        id: -(dept.id + 10_000), // negative to avoid collision with employee IDs
        name: dept.name,
        subtitle: `${memberCount} member${memberCount !== 1 ? 's' : ''}`,
        role: 'department',
        deptIndex: deptIdx,
        department: dept.code || dept.name,
        reports: memberCount,
        children: deptChildren,
      };
    });

    // Root: real admin employee OR synthetic "Company" node
    if (adminEmp) {
      return {
        id: adminEmp.id,
        name: `${adminEmp.firstName} ${adminEmp.lastName}`,
        subtitle: adminEmp.position || 'Administrator',
        role: 'admin',
        reports: deptNodes.length,
        children: deptNodes,
      };
    }

    return {
      id: 0,
      name: 'Company',
      subtitle: `${activeDepts.length} department${activeDepts.length !== 1 ? 's' : ''}`,
      role: 'admin',
      reports: activeDepts.length,
      children: deptNodes,
    };
  }, [enrichedDepartments, employees]);

  // ─── Assign helpers ──────────────────────────────────────────────────────
  const activeDepartment = useMemo(
    () => departments.find(d => d.id === assignContext?.departmentId),
    [departments, assignContext]
  );

  const assignableEmployees = useMemo(() => {
    if (!assignContext) return [];
    const active = employees.filter(e => e.isActive !== false);

    if (assignContext.mode === 'manager') {
      return active.filter(e => e.id !== activeDepartment?.manager?.id);
    }
    if (assignContext.mode === 'teamlead') {
      const existingLeadIds = new Set(activeDepartment?.teamLeads.map(t => t.id) ?? []);
      return active.filter(e => !existingLeadIds.has(e.id) && e.role !== 'manager');
    }
    if (assignContext.mode === 'employee') {
      const teamLead = activeDepartment?.teamLeads.find(t => t.id === assignContext.teamLeadId);
      const memberIds = new Set(teamLead?.employees.map(m => m.id) ?? []);
      return active.filter(e => !memberIds.has(e.id));
    }
    return active;
  }, [employees, assignContext, activeDepartment]);

  const openAssign = (ctx: AssignContext) => {
    setAssignContext(ctx);
    setSelectedEmployeeId('');
    setFormError('');
  };

  const closeModals = () => {
    setShowCreateDept(false);
    setAssignContext(null);
    setSelectedEmployeeId('');
    setFormError('');
    setDeptForm({ name: '', code: '', description: '' });
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      setFormError('Department name and code are required.');
      return;
    }
    try {
      await createDept.mutateAsync({
        name: deptForm.name,
        code: deptForm.code,
        description: deptForm.description,
      });
      closeModals();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create department');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!assignContext || selectedEmployeeId === '') {
      setFormError('Please select an employee.');
      return;
    }
    const payload = {
      employeeId: Number(selectedEmployeeId),
      departmentId: assignContext.departmentId,
      departmentName: assignContext.departmentName,
      managerId: activeDepartment?.manager?.id ?? null,
      teamLeadId: assignContext.teamLeadId ?? null,
    };
    try {
      if (assignContext.mode === 'manager')       await assignManager.mutateAsync(payload);
      else if (assignContext.mode === 'teamlead') await assignTeamLead.mutateAsync(payload);
      else                                        await assignMember.mutateAsync(payload);
      closeModals();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || (err instanceof Error ? err.message : 'Assignment failed'));
    }
  };

  const assignModalTitle =
    assignContext?.mode === 'manager'  ? 'Assign Department Manager' :
    assignContext?.mode === 'teamlead' ? 'Assign Team Lead' :
                                         'Assign Team Member';

  const plainEmployees =
    (orgStats?.totalEmployees || 0) -
    (orgStats?.totalAdmins    || 0) -
    (orgStats?.totalManagers  || 0) -
    (orgStats?.totalTeamLeads || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading organization data</p>
        <Button onClick={() => refetchAll()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
          <p className="text-gray-600 text-sm">Manage departments, teams, and your org structure</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isMutating || backfilling}>
            <RefreshCw className={`w-4 h-4 mr-2 ${(isMutating || backfilling) ? 'animate-spin' : ''}`} />
            {backfilling ? 'Syncing…' : 'Refresh'}
          </Button>
          <Button onClick={() => setShowCreateDept(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} color="blue"   label="Departments"  value={orgStats?.totalDepartments || 0} />
        <StatCard icon={Crown}     color="amber"  label="Managers"     value={orgStats?.totalManagers    || 0} />
        <StatCard icon={Users}     color="red"    label="Team Leads"   value={orgStats?.totalTeamLeads   || 0} />
        <StatCard icon={User}      color="gray"   label="Employees"    value={Math.max(0, plainEmployees)}     />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="departments" className="flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="chart" className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Org Chart</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Statistics</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Departments tab ────────────────────────────────────────────── */}
        <TabsContent value="departments" className="pt-4">
          <DepartmentCards
            departments={enrichedDepartments}
            onAddManager={(deptId) => {
              const dept = departments.find(d => d.id === deptId);
              if (dept) openAssign({ mode: 'manager', departmentId: deptId, departmentName: dept.name });
            }}
            onAddTeamLead={(deptId) => {
              const dept = departments.find(d => d.id === deptId);
              if (dept) openAssign({ mode: 'teamlead', departmentId: deptId, departmentName: dept.name });
            }}
            onAddEmployee={(teamLeadId) => {
              const dept = departments.find(d => d.teamLeads.some(t => t.id === teamLeadId));
              if (dept) openAssign({ mode: 'employee', departmentId: dept.id, departmentName: dept.name, teamLeadId });
            }}
            onCreateDept={() => setShowCreateDept(true)}
            onClickDept={(deptId) => navigate(`/organization/dept/${deptId}`)}
          />
        </TabsContent>

        {/* ── Overview tab ───────────────────────────────────────────────── */}
        <TabsContent value="overview" className="pt-4">
          <OrgOverview
            departments={enrichedDepartments}
            allEmployees={employees}
          />
        </TabsContent>

        {/* ── Org Chart tab ──────────────────────────────────────────────── */}
        <TabsContent value="chart" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Organizational Chart
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {orgChartFromDepts ? (
                <OrgChart data={orgChartFromDepts} className="min-h-[400px]" />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Building2 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No org structure yet</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Create departments and add employees — the chart builds automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Statistics tab ─────────────────────────────────────────────── */}
        <TabsContent value="stats" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {orgStats?.departmentBreakdown?.length ? (
                  <div className="space-y-3">
                    {orgStats.departmentBreakdown.map(dept => (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="font-medium text-sm">{dept.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{dept.employeeCount} employees</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${
                                  orgStats.totalEmployees > 0
                                    ? (dept.employeeCount / orgStats.totalEmployees) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4">No departments yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <RoleRow icon={Crown}     label="Managers"   count={orgStats?.totalManagers   || 0} bg="amber"  />
                <RoleRow icon={Users}     label="Team Leads" count={orgStats?.totalTeamLeads   || 0} bg="red"    />
                <RoleRow icon={User}      label="Employees"  count={Math.max(0, plainEmployees)}     bg="gray"   />
                <RoleRow icon={Building2} label="Admins"     count={orgStats?.totalAdmins      || 0} bg="purple" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Create Department Modal ─────────────────────────────────────────── */}
      {showCreateDept && (
        <Modal title="Create Department" onClose={closeModals}>
          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <Field label="Name *">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={deptForm.name}
                onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Marketing"
              />
            </Field>
            <Field label="Code *">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={deptForm.code}
                onChange={e => setDeptForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. MKT"
                maxLength={20}
              />
            </Field>
            <Field label="Description">
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={deptForm.description}
                onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </Field>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <ModalActions onCancel={closeModals} submitLabel="Create" loading={createDept.isPending} />
          </form>
        </Modal>
      )}

      {/* ── Assign Employee Modal ───────────────────────────────────────────── */}
      {assignContext && (
        <Modal title={assignModalTitle} onClose={closeModals}>
          <form onSubmit={handleAssign} className="space-y-4">
            <p className="text-sm text-gray-600">
              Department: <strong>{assignContext.departmentName}</strong>
            </p>
            <Field label="Select employee *">
              {employeesLoading ? (
                <p className="text-sm text-gray-500">Loading employees…</p>
              ) : (
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Choose an employee</option>
                  {assignableEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId}) — {emp.department || 'No dept'}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            {assignableEmployees.length === 0 && !employeesLoading && (
              <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                No eligible employees. Add employees from the Employees page first.
              </p>
            )}
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <ModalActions onCancel={closeModals} submitLabel="Assign" loading={isMutating} />
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, color, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'purple' | 'amber' | 'red' | 'gray';
  label: string;
  value: number;
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    amber:  'bg-amber-100 text-amber-600',
    red:    'bg-red-100 text-red-600',
    gray:   'bg-gray-100 text-gray-600',
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-600">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoleRow({
  icon: Icon, label, count, bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  bg: 'purple' | 'amber' | 'red' | 'gray';
}) {
  const styles: Record<string, { wrap: string; text: string }> = {
    purple: { wrap: 'bg-purple-50', text: 'text-purple-600' },
    amber:  { wrap: 'bg-amber-50',  text: 'text-amber-600'  },
    red:    { wrap: 'bg-red-50',    text: 'text-red-600'    },
    gray:   { wrap: 'bg-gray-50',   text: 'text-gray-600'   },
  };
  const s = styles[bg];
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg mb-2 ${s.wrap}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${s.text}`} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <span className={`font-bold ${s.text}`}>{count}</span>
    </div>
  );
}

function Modal({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ModalActions({
  onCancel, submitLabel, loading,
}: {
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
        Cancel
      </Button>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}

export default OrganizationManagement;
