import { useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi } from '../services/api';
import { employeeApi } from '../services/api';

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
}

export interface AssignHierarchyInput {
  employeeId: number;
  departmentId: number;
  departmentName: string;
  managerId?: number | null;
  teamLeadId?: number | null;
}

function invalidateOrganization(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['departments'] });
  queryClient.invalidateQueries({ queryKey: ['organization'] });
  queryClient.invalidateQueries({ queryKey: ['employees'] });
}

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDepartmentInput) => {
      const res = await departmentApi.create({
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        description: input.description?.trim() || undefined,
      });
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to create department');
      }
      return res.data;
    },
    onSuccess: () => invalidateOrganization(queryClient),
  });
};

export const useAssignDepartmentManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, departmentId, departmentName }: AssignHierarchyInput) => {
      const employeesRes = await employeeApi.getAll();
      const employees = employeesRes?.data ?? [];

      const previousManager = employees.find(
        (e: { managesDepartment?: number; id: number }) =>
          e.managesDepartment === departmentId && e.id !== employeeId
      );

      if (previousManager) {
        await employeeApi.update(previousManager.id, {
          managesDepartment: null,
          role: 'employee',
        });
      }

      const res = await employeeApi.update(employeeId, {
        role: 'manager',
        managesDepartment: departmentId,
        departmentId,
        department: departmentName,
        reportTo: null,
      });
      return (res as { data?: unknown })?.data ?? res;
    },
    onSuccess: () => invalidateOrganization(queryClient),
  });
};

export const useAssignTeamLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      departmentId,
      departmentName,
      managerId,
    }: AssignHierarchyInput) => {
      const res = await employeeApi.update(employeeId, {
        role: 'teamlead',
        departmentId,
        department: departmentName,
        reportTo: managerId ?? null,
        managesDepartment: null,
      });
      return (res as { data?: unknown })?.data ?? res;
    },
    onSuccess: () => invalidateOrganization(queryClient),
  });
};

export const useAssignTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      departmentId,
      departmentName,
      teamLeadId,
    }: AssignHierarchyInput) => {
      const res = await employeeApi.update(employeeId, {
        role: 'employee',
        departmentId,
        department: departmentName,
        reportTo: teamLeadId ?? null,
        managesDepartment: null,
      });
      return (res as { data?: unknown })?.data ?? res;
    },
    onSuccess: () => invalidateOrganization(queryClient),
  });
};

// ─── Remove / demote mutations ────────────────────────────────────────────────

/** Remove the department manager — demotes them back to employee */
export const useRemoveDepartmentManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ managerId }: { managerId: number }) => {
      const res = await employeeApi.update(managerId, {
        managesDepartment: null,
        role: 'employee',
      });
      return (res as { data?: unknown })?.data ?? res;
    },
    onSuccess: () => invalidateOrganization(queryClient),
  });
};

/** Remove a team lead — demotes them back to employee; reports to manager (if any) */
export const useRemoveTeamLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tlId,
      managerId,
    }: {
      tlId: number;
      managerId?: number | null;
    }) => {
      const res = await employeeApi.update(tlId, {
        role: 'employee',
        reportTo: managerId ?? null,
      });
      return (res as { data?: unknown })?.data ?? res;
    },
    onSuccess: () => invalidateOrganization(queryClient),
  });
};

/** Remove a team member — moves them to the unassigned pool (clears reportTo / teamLeadId) */
export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId }: { memberId: number }) => {
      const res = await employeeApi.update(memberId, {
        reportTo: null,
        teamLeadId: null,
      });
      return (res as { data?: unknown })?.data ?? res;
    },
    onSuccess: () => invalidateOrganization(queryClient),
  });
};

/** Update department name / code / description */
export const useUpdateDepartmentInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; code?: string; description?: string };
    }) => {
      const res = await departmentApi.update(id, data);
      if (!res?.success) throw new Error(res?.message || 'Update failed');
      return res.data;
    },
    onSuccess: () => invalidateOrganization(queryClient),
  });
};
