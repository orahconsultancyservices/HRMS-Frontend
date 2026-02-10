// src/hooks/useEmployees.ts - ENHANCED VERSION
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../services/api';

// Employee interface
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  orgEmail?: string;
  orgPassword?: string;
  phone?: string;
  department: string;
  position: string;
  joinDate: string;
  leaveDate?: string;
  birthday?: string;
  location?: string;
  emergencyContact?: string;
  avatar?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Create employee data interface
export interface CreateEmployeeData {
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
  birthday?: string;
  location: string;
  emergencyContact: string;
  avatar?: string;
}

// Update employee data interface
export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  isActive?: boolean;
}

// Leave balance interface
export interface LeaveBalance {
  casual: number;
  sick: number;
  earned: number;
  maternity?: number;
  paternity?: number;
  bereavement?: number;
}

/**
 * Hook to fetch all employees
 * Auto-refetches every minute and on window focus
 */
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        console.log('📥 Fetching all employees...');
        const response = await employeeApi.getAll();
        console.log('📊 useEmployees API response:', response);

        // Handle different response formats
        let employeesData: Employee[] = [];

        // Case 1: Direct array response
        if (Array.isArray(response)) {
          employeesData = response;
        }
        // Case 2: Response with data property (array)
        else if (response && response.data && Array.isArray(response.data)) {
          employeesData = response.data;
        }
        // Case 3: Response with success flag and data
        else if (response && response.success && Array.isArray(response.data)) {
          employeesData = response.data;
        }
        // Case 4: Axios response with nested data
        else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
          employeesData = response.data.data;
        }

        if (employeesData.length === 0) {
          console.warn('⚠️ No employees found or invalid response format:', response);
        } else {
          console.log(`✅ Found ${employeesData.length} employees`);
        }

        return employeesData;
      } catch (error) {
        console.error('❌ Error fetching employees:', error);
        // Return empty array on error to prevent app crash
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true,
    retry: 2, // Retry failed requests twice
  });
};

/**
 * Hook to fetch a single employee by ID
 */
export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      try {
        console.log(`📥 Fetching employee with ID: ${id}`);
        const response = await employeeApi.getById(id);
        console.log('📊 useEmployee response:', response);

        // Handle different response formats
        if (response && response.data) {
          return response.data;
        } else if (response) {
          return response;
        }

        return null;
      } catch (error) {
        console.error(`❌ Error fetching employee ${id}:`, error);
        return null;
      }
    },
    enabled: !!id && id > 0, // Only run query if valid ID
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new employee
 * Invalidates employees cache on success
 */
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeData) => {
      console.log('📤 Creating employee:', data);
      const response = await employeeApi.create(data);
      console.log('✅ Employee created:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Employee creation successful, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      // Optionally set the new employee data in cache
      if (data && data.data && data.data.id) {
        queryClient.setQueryData(['employee', data.data.id], data.data);
      }
    },
    onError: (error: any) => {
      console.error('❌ Error creating employee:', error);
    },
  });
};

/**
 * Hook to update an existing employee
 * Invalidates both employees list and individual employee cache
 */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateEmployeeData }) => {
      console.log(`📤 Updating employee ${id}:`, data);
      const response = await employeeApi.update(id, data);
      console.log('✅ Employee updated:', response);
      return response;
    },
    onSuccess: (data, variables) => {
      console.log(`✅ Employee ${variables.id} update successful, invalidating cache`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      
      // Update cache with new data if available
      if (data && data.data) {
        queryClient.setQueryData(['employee', variables.id], data.data);
      }
    },
    onError: (error: any, variables) => {
      console.error(`❌ Error updating employee ${variables.id}:`, error);
    },
  });
};

/**
 * Hook to delete an employee
 * Invalidates employees cache on success
 */
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      console.log(`📤 Deleting employee ${id}`);
      const response = await employeeApi.delete(id);
      console.log('✅ Employee deleted:', response);
      return response;
    },
    onSuccess: (data, id) => {
      console.log(`✅ Employee ${id} deletion successful, invalidating cache`);
      
      // Invalidate and remove from cache
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.removeQueries({ queryKey: ['employee', id] });
    },
    onError: (error: any, id) => {
      console.error(`❌ Error deleting employee ${id}:`, error);
    },
  });
};

/**
 * Hook to fetch all departments
 */
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        console.log('📥 Fetching departments...');
        const response = await employeeApi.getDepartments();
        console.log('📊 Departments response:', response);

        if (response && response.data) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        }

        return [];
      } catch (error) {
        console.error('❌ Error fetching departments:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (departments change less frequently)
  });
};

/**
 * Hook to fetch all positions
 */
export const usePositions = () => {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      try {
        console.log('📥 Fetching positions...');
        const response = await employeeApi.getPositions();
        console.log('📊 Positions response:', response);

        if (response && response.data) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        }

        return [];
      } catch (error) {
        console.error('❌ Error fetching positions:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch leave balance for an employee
 */
export const useLeaveBalance = (employeeId: number) => {
  return useQuery({
    queryKey: ['leaveBalance', employeeId],
    queryFn: async () => {
      try {
        console.log(`📥 Fetching leave balance for employee ${employeeId}`);
        const response = await employeeApi.getLeaveBalance(employeeId);
        console.log('📊 Leave balance response:', response);

        if (response && response.data) {
          return response.data as LeaveBalance;
        }

        return null;
      } catch (error) {
        console.error(`❌ Error fetching leave balance for employee ${employeeId}:`, error);
        return null;
      }
    },
    enabled: !!employeeId && employeeId > 0,
    staleTime: 30000, // 30 seconds (leave balance changes frequently)
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });
};

/**
 * Hook to update leave balance for an employee
 */
export const useUpdateLeaveBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: number; data: Partial<LeaveBalance> }) => {
      console.log(`📤 Updating leave balance for employee ${employeeId}:`, data);
      const response = await employeeApi.updateLeaveBalance(employeeId, data);
      console.log('✅ Leave balance updated:', response);
      return response;
    },
    onSuccess: (data, variables) => {
      console.log(`✅ Leave balance update successful for employee ${variables.employeeId}`);
      
      // Invalidate leave balance cache
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', variables.employeeId] });
      
      // Also invalidate employee data as it might include leave balance
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      
      // Update cache with new data if available
      if (data && data.data) {
        queryClient.setQueryData(['leaveBalance', variables.employeeId], data.data);
      }
    },
    onError: (error: any, variables) => {
      console.error(`❌ Error updating leave balance for employee ${variables.employeeId}:`, error);
    },
  });
};

// Export types
export type { CreateEmployeeData, UpdateEmployeeData, LeaveBalance };