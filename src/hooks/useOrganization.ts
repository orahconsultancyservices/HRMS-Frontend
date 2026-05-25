import { useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentApi, employeeApi } from '../services/api';

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  managerId?: number;
  manager?: {
    id: number;
    name: string;
    email: string;
  };
  isActive: boolean;
  employeeCount: number;
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
}

export interface OrgChartNode {
  id: number;
  name: string;
  role: 'admin' | 'manager' | 'teamlead' | 'employee';
  department?: string;
  avatar?: string;
  children?: OrgChartNode[];
  reports?: number;
}

function empInDepartment(emp: { departmentId?: number; department?: string }, dept: { id: number; name: string }) {
  if (emp.departmentId === dept.id) return true;
  if (emp.department && dept.name) {
    return emp.department.trim().toLowerCase() === dept.name.trim().toLowerCase();
  }
  return false;
}

function isAdminEmployee(emp: { role?: string; employeeId?: string; position?: string }) {
  const pos = (emp.position || '').toLowerCase();
  return (
    emp.role === 'admin' ||
    emp.employeeId === 'ADMIN001' ||
    pos.includes('administrator') ||
    pos.includes('admin')
  );
}

function mapChartRole(role?: string): OrgChartNode['role'] {
  if (role === 'admin' || role === 'manager' || role === 'teamlead') return role;
  return 'employee';
}

function buildOrgChart(employee: any, employees: any[]): OrgChartNode {
  const directReports = employees.filter(
    (emp) => emp.reportTo === employee.id && emp.isActive !== false
  );

  return {
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`,
    role: isAdminEmployee(employee) ? 'admin' : mapChartRole(employee.role),
    department: employee.department || employee.dept?.name,
    avatar: employee.avatar,
    reports: directReports.length,
    children: directReports.map((child) => buildOrgChart(child, employees)),
  };
}

function findOrgChartRoot(employees: any[]) {
  const active = employees.filter((e) => e.isActive !== false);
  if (active.length === 0) return null;

  const admin = active.find(isAdminEmployee);
  if (admin) return admin;

  const topLevel = active.filter((e) => !e.reportTo);
  const managerRoot = topLevel.find((e) => e.role === 'manager');
  if (managerRoot) return managerRoot;

  if (topLevel.length === 1) return topLevel[0];
  if (topLevel.length > 1) {
    return {
      id: 0,
      firstName: 'Organization',
      lastName: 'Root',
      role: 'admin',
      department: 'Company',
      isActive: true,
      reportTo: null,
      _synthetic: true,
    };
  }

  return active[0];
}

export const useOrganization = () => {
  const queryClient = useQueryClient();

  const {
    data: departments = [],
    isLoading: departmentsLoading,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useQuery({
    queryKey: ['departments', 'hierarchy'],
    queryFn: async () => {
      const [departmentsResponse, employeesResponse] = await Promise.all([
        departmentApi.getAll({ includeHierarchy: true }),
        employeeApi.getAll({ includeHierarchy: true }),
      ]);

      const deptList = departmentsResponse?.data ?? [];
      const allEmployees = employeesResponse?.data ?? [];

      return deptList.map((dept: any) => {
        // ── Primary source: employees enriched by backend (FK + string-matched) ──
        // Backend now returns dept.employees for all active employees in the dept.
        // Fall back to manual matching from allEmployees for older API versions.
        const rawDeptEmps: any[] = dept.employees ?? [];
        const deptEmps: any[] =
          rawDeptEmps.length > 0
            ? rawDeptEmps
            : allEmployees.filter(
                (e: any) => empInDepartment(e, dept) && e.isActive !== false
              );

        // ── Manager: first employee with managesDepartment === dept.id ─────────
        const managerRaw =
          deptEmps.find((e: any) => e.managesDepartment === dept.id) ??
          allEmployees.find((e: any) => e.managesDepartment === dept.id);

        // ── Team leads: employees with role === 'teamlead' in this dept ─────────
        const teamLeads = deptEmps
          .filter((e: any) => e.role === 'teamlead')
          .map((tl: any) => ({
            id: tl.id,
            name: `${tl.firstName} ${tl.lastName}`,
            email: tl.email,
            // Members linked via reportTo OR teamLeadId
            employees: deptEmps
              .filter(
                (e: any) =>
                  (e.reportTo === tl.id || e.teamLeadId === tl.id) &&
                  e.id !== tl.id &&
                  e.role !== 'manager'
              )
              .map((e: any) => ({
                id: e.id,
                name: `${e.firstName} ${e.lastName}`,
                email: e.email,
                position: e.position || 'Employee',
              })),
          }));

        const employeeCount = deptEmps.filter(
          (e: any) => e.isActive !== false
        ).length;

        return {
          ...dept,
          manager: managerRaw
            ? {
                id: managerRaw.id,
                name: `${managerRaw.firstName} ${managerRaw.lastName}`,
                email: managerRaw.email,
              }
            : undefined,
          teamLeads,
          employeeCount,
        };
      });
    },
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: orgChartData,
    isLoading: orgChartLoading,
    error: orgChartError,
    refetch: refetchOrgChart,
  } = useQuery({
    queryKey: ['organization', 'chart'],
    queryFn: async () => {
      const employeesResponse = await employeeApi.getAll({ includeHierarchy: true });
      const employees = employeesResponse?.data ?? [];
      const root = findOrgChartRoot(employees);
      if (!root) return null;

      if (root._synthetic) {
        const topLevel = employees.filter((e: { reportTo?: number; isActive?: boolean }) => !e.reportTo && e.isActive !== false);
        return {
          id: 0,
          name: 'Organization',
          role: 'admin' as const,
          department: 'Company',
          reports: topLevel.length,
          children: topLevel.map((emp: unknown) => buildOrgChart(emp, employees)),
        };
      }

      return buildOrgChart(root, employees);
    },
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: orgStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['organization', 'stats'],
    queryFn: async () => {
      const employeesResponse = await employeeApi.getAll();
      const departmentsResponse = await departmentApi.getAll();

      const employees = employeesResponse?.data ?? [];
      const deptList = departmentsResponse?.data ?? [];
      const active = employees.filter((emp: { isActive?: boolean }) => emp.isActive !== false);

      const totalAdmins = active.filter(isAdminEmployee).length;
      const totalManagers = active.filter((emp: { role?: string }) => emp.role === 'manager').length;
      const totalTeamLeads = active.filter((emp: { role?: string }) => emp.role === 'teamlead').length;
      const totalEmployees = active.length;

      return {
        totalEmployees,
        totalDepartments: deptList.filter((dept: { isActive?: boolean }) => dept.isActive !== false).length,
        totalManagers,
        totalTeamLeads,
        totalAdmins,
        departmentBreakdown: deptList.map((dept: { id: number; name: string }) => ({
          id: dept.id,
          name: dept.name,
          employeeCount: active.filter((emp: unknown) => empInDepartment(emp as { departmentId?: number; department?: string }, dept)).length,
        })),
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  const refetchAll = () => {
    refetchDepartments();
    refetchOrgChart();
    queryClient.invalidateQueries({ queryKey: ['organization', 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  return {
    departments,
    departmentsLoading,
    departmentsError,
    refetchDepartments,
    orgChartData,
    orgChartLoading,
    orgChartError,
    refetchOrgChart,
    orgStats,
    statsLoading,
    statsError,
    isLoading: departmentsLoading || orgChartLoading || statsLoading,
    hasError: !!(departmentsError || orgChartError || statsError),
    refetchAll,
  };
};
