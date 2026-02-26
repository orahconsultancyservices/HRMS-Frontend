// src/hooks/useAttendance.ts - ENHANCED VERSION
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../services/api';

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  breaks?: number;
  location?: string;
  notes?: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
    position?: string;
    avatar?: string;
  };
}

export interface TodayStatus {
  id?: number;
  employeeId: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number | null;
  status: string;
  isOnBreak?: boolean;
  activeBreak?: {
    id: number;
    startTime: string;
  };
}

export interface BreakRecord {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  reason?: string;
  status: 'active' | 'completed' | 'cancelled';
}

// Get all attendance records with filters
export const useAttendance = (params?: {
  employeeId?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  month?: number;
  year?: number;
}) => {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      try {
        console.log('📥 Fetching attendance with params:', params);
        const response = await attendanceApi.getAll(params);
        console.log('📊 Attendance response:', response);

        // Handle different response formats
        let attendanceData = [];
        
        if (response && response.success) {
          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            attendanceData = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            attendanceData = response.data;
          }
        } else if (Array.isArray(response)) {
          attendanceData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          attendanceData = response.data;
        }

        console.log(`✅ Found ${attendanceData.length} attendance records`);
        return attendanceData;
      } catch (error) {
        console.error('❌ Error fetching attendance:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
};

// Get employee attendance
export const useEmployeeAttendance = (employeeId: number, params?: {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}) => {
  return useQuery({
    queryKey: ['attendance', 'employee', employeeId, params],
    queryFn: async () => {
      try {
        console.log('📥 Fetching employee attendance:', { employeeId, params });
        const response = await attendanceApi.getByEmployee(employeeId, params);
        console.log('📊 Employee attendance response:', response);

        // Handle different response formats
        let attendanceData = [];
        
        if (response && response.success) {
          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            attendanceData = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            attendanceData = response.data;
          }
        } else if (Array.isArray(response)) {
          attendanceData = response;
        }

        console.log(`✅ Found ${attendanceData.length} employee attendance records`);
        return attendanceData;
      } catch (error) {
        console.error('❌ Error fetching employee attendance:', error);
        return [];
      }
    },
    enabled: !!employeeId && employeeId > 0,
    refetchInterval: 30000,
  });
};

// Get today's status
export const useTodayStatus = (employeeId: number) => {
  return useQuery({
    queryKey: ['attendance', 'today', employeeId],
    queryFn: async () => {
      try {
        console.log('📥 Fetching today status for employee:', employeeId);
        const response = await attendanceApi.getTodayStatus(employeeId);
        console.log('📊 Today status response:', response);

        if (response && response.success) {
          return response.data as TodayStatus | null;
        }

        return null;
      } catch (error) {
        console.error('❌ Error fetching today status:', error);
        return null;
      }
    },
    enabled: !!employeeId && employeeId > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
};

// Clock in mutation
export const useClockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: number; data?: any }) => {
      console.log('📤 Clocking in:', { employeeId, data });
      const response = await attendanceApi.clockIn(employeeId, data);
      console.log('✅ Clock in response:', response);
      return response;
    },
    onSuccess: (_data, variables) => {
      console.log('✅ Clock in successful, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'employee', variables.employeeId] });
    },
    onError: (error: any) => {
      console.error('❌ Clock in error:', error);
    }
  });
};

// Clock out mutation
export const useClockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: number; data?: any }) => {
      console.log('📤 Clocking out:', { employeeId, data });
      const response = await attendanceApi.clockOut(employeeId, data);
      console.log('✅ Clock out response:', response);
      return response;
    },
    onSuccess: (_data, variables) => {
      console.log('✅ Clock out successful, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'employee', variables.employeeId] });
    },
    onError: (error: any) => {
      console.error('❌ Clock out error:', error);
    }
  });
};

// Start break mutation
export const useStartBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, reason }: { employeeId: number; reason?: string }) => {
      console.log('📤 Starting break:', { employeeId, reason });
      const response = await attendanceApi.startBreak(employeeId, { reason });
      console.log('✅ Start break response:', response);
      return response;
    },
    onSuccess: (_data, variables) => {
      console.log('✅ Break started, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['breaks', variables.employeeId] });
    },
    onError: (error: any) => {
      console.error('❌ Start break error:', error);
    }
  });
};

// End break mutation
export const useEndBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, breakId }: { employeeId: number; breakId: number }) => {
      console.log('📤 Ending break:', { employeeId, breakId });
      const response = await attendanceApi.endBreak(employeeId, breakId);
      console.log('✅ End break response:', response);
      return response;
    },
    onSuccess: (_data, variables) => {
      console.log('✅ Break ended, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['breaks', variables.employeeId] });
    },
    onError: (error: any) => {
      console.error('❌ End break error:', error);
    }
  });
};

// Get breaks
export const useBreaks = (employeeId: number, date?: string) => {
  return useQuery({
    queryKey: ['breaks', employeeId, date],
    queryFn: async () => {
      try {
        console.log('📥 Fetching breaks for employee:', employeeId);
        const response = await attendanceApi.getBreaks(employeeId);
        console.log('📊 Breaks response:', response);

        if (response && response.success && response.data) {
          return response.data as BreakRecord[];
        }

        return [];
      } catch (error) {
        console.error('❌ Error fetching breaks:', error);
        return [];
      }
    },
    enabled: !!employeeId && employeeId > 0,
    refetchInterval: 30000,
  });
};

// Mark attendance (admin)
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employeeId: number;
      date: string;
      status: string;
      checkIn?: string;
      checkOut?: string;
      notes?: string;
    }) => {
      console.log('📤 Marking attendance:', data);
      const response = await attendanceApi.markAttendance(data);
      console.log('✅ Mark attendance response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('✅ Attendance marked, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      console.error('❌ Mark attendance error:', error);
    }
  });
};

// Bulk mark attendance (admin)
export const useBulkMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employees: number[];
      date: string;
      status: string;
      notes?: string;
    }) => {
      console.log('📤 Bulk marking attendance:', data);
      const response = await attendanceApi.bulkMark(data);
      console.log('✅ Bulk mark response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('✅ Bulk attendance marked, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      console.error('❌ Bulk mark error:', error);
    }
  });
};

// Delete attendance
export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      console.log('📤 Deleting attendance:', id);
      const response = await attendanceApi.delete(id);
      console.log('✅ Delete response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('✅ Attendance deleted, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      console.error('❌ Delete error:', error);
    }
  });
};

// Get attendance statistics
// Get attendance statistics
export const useAttendanceStats = (params?: {
  department?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['attendanceStats', params],
    queryFn: async () => {
      try {
        console.log('📥 Fetching attendance stats:', params);
        const response = await attendanceApi.getStats();
        console.log('📊 Stats response:', response);

        // Fix: Check response structure properly
        // Check if response.data has success property
        if (response && response.data) {
          if ((response.data as any).success && (response.data as any).data) {
            return (response.data as any).data;
          }
          // If response.data itself is the data
          else {
            return response.data;
          }
        }
        // Check if response itself has success property
        else if (response && (response as any).success && (response as any).data) {
          return (response as any).data;
        }

        return null;
      } catch (error) {
        console.error('❌ Error fetching stats:', error);
        return null;
      }
    },
    staleTime: 60000, // 1 minute
  });
};