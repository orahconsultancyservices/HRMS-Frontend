// src/hooks/useLeaves.ts - COMPLETE VERSION
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../services/api';

export interface LeaveRequest {
  id: number;
  empId: number;
  employeeId?: number;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  contactDuringLeave?: string;
  addressDuringLeave?: string;
  managerNotes?: string;
  isHalfDay?: boolean;
  isPaid?: boolean;
  paidDays?: number;
  department?: string;
  empName?: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
    position: string;
    email?: string;
    phone?: string;
  };
}

export const useLeaves = () => {
  return useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      try {
        console.log('📥 Fetching all leaves...');
        const response = await leaveApi.getAll();
        console.log('📥 useLeaves API response:', response);
        
        // Handle different response formats
        let leavesData;
        
        if (response && response.data) {
          // If response has a data property
          if (response.data.success && Array.isArray(response.data.data)) {
            leavesData = response.data.data;
          } else if (Array.isArray(response.data)) {
            leavesData = response.data;
          } else if (response.success && Array.isArray(response.data)) {
            leavesData = response.data;
          }
        } else if (Array.isArray(response)) {
          leavesData = response;
        }
        
        if (!leavesData || !Array.isArray(leavesData)) {
          console.warn('⚠️ Unexpected response format, returning empty array');
          return [];
        }
        
        console.log(`✅ Found ${leavesData.length} leave requests`);
        
        // Transform the data to match component needs
        const transformedData = leavesData.map((leave: any) => ({
          id: leave.id,
          empId: leave.empId,
          employeeId: leave.employee?.id || leave.empId,
          type: leave.type,
          from: leave.from,
          to: leave.to,
          days: leave.days,
          reason: leave.reason,
          status: leave.status,
          appliedDate: leave.appliedDate,
          contactDuringLeave: leave.contactDuringLeave,
          addressDuringLeave: leave.addressDuringLeave,
          managerNotes: leave.managerNotes,
          isHalfDay: leave.isHalfDay || false,
          isPaid: leave.isPaid || false,
          paidDays: leave.paidDays || 0,
          department: leave.employee?.department,
          empName: leave.employee 
            ? `${leave.employee.firstName} ${leave.employee.lastName}`
            : `Employee ${leave.empId}`,
          employee: leave.employee
        }));
        
        return transformedData;
      } catch (error) {
        console.error('❌ Error fetching leaves:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useLeavesByEmployee = (empId: number | string) => {
  return useQuery({
    queryKey: ['leaves', empId],
    queryFn: async () => {
      try {
        const response = await leaveApi.getByEmployee(empId as number);
        console.log('📥 Employee leaves response:', response);
        
        // Fix: Check the response structure properly
        // Assuming the API returns { success: boolean, data: any[] }
        if (response && response.data) {
          // Check if response.data has success property
          if (response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
          }
          // If response.data is directly an array
          else if (Array.isArray(response.data)) {
            return response.data;
          }
        }
        // If response itself has success property
        else if (response && (response as any).success && Array.isArray((response as any).data)) {
          return (response as any).data;
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error fetching employee leaves:', error);
        return [];
      }
    },
    enabled: !!empId,
  });
};

export const useCreateLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      console.log('📤 Creating leave request:', data);
      const response = await leaveApi.create(data);
      console.log('✅ Leave created:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['paidLeaveBalance'] });
    },
    onError: (error: any) => {
      console.error('❌ Error creating leave:', error);
    }
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      console.log('📤 Updating leave status:', { id, status, notes });
      
      // Call the API with proper payload
      const response = await leaveApi.updateStatus(id, status);
      console.log('✅ Leave status updated:', response);
      
      return response;
    },
    onSuccess: () => {
      // Invalidate all leave-related queries
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['paidLeaveBalance'] });
      queryClient.invalidateQueries({ queryKey: ['leaveStatistics'] });
    },
    onError: (error: any) => {
      console.error('❌ Error updating leave status:', error);
    }
  });
};

export const useUpdateLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => leaveApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

export const useDeleteLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      console.log('📤 Deleting leave:', id);
      return leaveApi.delete(id);
    },
    onSuccess: () => {
      console.log('✅ Leave deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['paidLeaveBalance'] });
    },
    onError: (error: any) => {
      console.error('❌ Error deleting leave:', error);
    }
  });
};

export const useLeaveStatistics = () => {
  return useQuery({
    queryKey: ['leaveStatistics'],
    queryFn: async () => {
      try {
        const response = await leaveApi.getStatistics();
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching leave statistics:', error);
        return null;
      }
    },
  });
};