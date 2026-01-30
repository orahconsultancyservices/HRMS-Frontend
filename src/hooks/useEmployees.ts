// src/hooks/useEmployees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../services/api';

interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  orgEmail: string;
  orgPassword: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  leaveDate?: string;
  birthday?: string; // Added birthday field
  location: string;
  emergencyContact: string;
}

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await employeeApi.getAll();
      console.log('📊 useEmployees response:', response);

      // Check if response is an array or has data property
      if (Array.isArray(response)) {
        return response; // Direct array response
      } else if (response && response.data && Array.isArray(response.data)) {
        return response.data; // Response with data property
      } else if (response && response.success && Array.isArray(response.data)) {
        return response.data; // Response with success and data properties
      }

      console.error('❌ Invalid response format from employees API:', response);
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
};
export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await employeeApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeData) => employeeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateEmployeeData> }) =>
      employeeApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => employeeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await employeeApi.getDepartments();
      return response.data;
    },
  });
};

export const usePositions = () => {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await employeeApi.getPositions();
      return response.data;
    },
  });
};

export const useLeaveBalance = (employeeId: number) => {
  return useQuery({
    queryKey: ['leaveBalance', employeeId],
    queryFn: async () => {
      const response = await employeeApi.getLeaveBalance(employeeId);
      return response.data;
    },
    enabled: !!employeeId,
  });
};

export const useUpdateLeaveBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: number; data: any }) =>
      employeeApi.updateLeaveBalance(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', variables.employeeId] });
    },
  });
};

export type { CreateEmployeeData };