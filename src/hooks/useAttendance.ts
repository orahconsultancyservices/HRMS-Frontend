// src/hooks/useAttendance.ts
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

// Get all attendance records
export const useAttendance = (params?: {
  employeeId?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      const response = await attendanceApi.getAll(params);
      return response.data.data || [];
    },
  });
};

// Get employee attendance
export const useEmployeeAttendance = (employeeId: number) => {
  return useQuery({
    queryKey: ['attendance', 'employee', employeeId],
    queryFn: async () => {
      const response = await attendanceApi.getByEmployee(employeeId);
      return response.data.data || [];
    },
    enabled: !!employeeId,
  });
};

// Get today's status
export const useTodayStatus = (employeeId: number) => {
  return useQuery({
    queryKey: ['attendance', 'today', employeeId],
    queryFn: async () => {
      const response = await attendanceApi.getTodayStatus(employeeId);
      return response.data.data as TodayStatus | null;
    },
    enabled: !!employeeId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Clock in mutation
export const useClockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: number; data?: any }) =>
      attendanceApi.clockIn(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'employee', variables.employeeId] });
    },
  });
};

// Clock out mutation
export const useClockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: number; data?: any }) =>
      attendanceApi.clockOut(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'employee', variables.employeeId] });
    },
  });
};

// Start break mutation
export const useStartBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, reason }: { employeeId: number; reason?: string }) =>
      attendanceApi.startBreak(employeeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['breaks', variables.employeeId] });
    },
  });
};

// End break mutation
export const useEndBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, breakId }: { employeeId: number; breakId: number }) =>
      attendanceApi.endBreak(employeeId, breakId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['breaks', variables.employeeId] });
    },
  });
};

// Get breaks
export const useBreaks = (employeeId: number) => {
  return useQuery({
    queryKey: ['breaks', employeeId],
    queryFn: async () => {
      const response = await attendanceApi.getBreaks(employeeId);
      return response.data.data || [];
    },
    enabled: !!employeeId,
  });
};