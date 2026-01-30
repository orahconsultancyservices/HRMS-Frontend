// src/hooks/useLeaves.ts - COMPLETE VERSION
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../services/api';

export interface LeaveRequest {
  id: number;
  empId: number;
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
        const response = await leaveApi.getAll();
        console.log('📥 useLeaves API response:', response);
        
        // The API returns {success: true, count: X, data: Array}
        if (response && response.success && Array.isArray(response.data)) {
          console.log(`✅ Found ${response.data.length} leave requests`);
          
          // Transform the data to match your component's needs
          const transformedData = response.data.map((leave: any) => ({
            id: leave.id,
            empId: leave.empId,
            employeeId: leave.employee?.id,
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
            isHalfDay: leave.isHalfDay,
            isPaid: leave.isPaid,
            paidDays: leave.paidDays,
            // Include employee data if available
            ...(leave.employee && {
              department: leave.employee.department,
              // You can also add empName for easier access
              empName: `${leave.employee.firstName} ${leave.employee.lastName}`
            })
          }));
          
          return transformedData;
        }
        
        console.warn('⚠️ Unexpected response format, returning empty array');
        return [];
      } catch (error) {
        console.error('❌ Error fetching leaves:', error);
        return [];
      }
    },
  });
};

export const useCreateLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => leaveApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

// ADD THIS EXPORT
export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      leaveApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

// You might also want to add these for completeness:
export const useDeleteLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => leaveApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};