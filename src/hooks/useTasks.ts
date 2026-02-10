// src/hooks/useTasks.ts - React Query Hooks for Task Management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi,type CreateTaskData, type SubmitProgressData } from '../services/Taskapi';

// ============================================
// GET ALL TASKS
// ============================================
export const useTasks = (params?: any) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const response = await taskApi.getAll(params);
      return response.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// ============================================
// GET TASK BY ID
// ============================================
export const useTask = (id: number) => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await taskApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

// ============================================
// GET TASKS BY EMPLOYEE
// ============================================
export const useEmployeeTasks = (employeeId: number, params?: any) => {
  return useQuery({
    queryKey: ['tasks', 'employee', employeeId, params],
    queryFn: async () => {
      const response = await taskApi.getByEmployee(employeeId, params);
      return response.data || [];
    },
    enabled: !!employeeId,
    staleTime: 30 * 1000,
  });
};

// ============================================
// CREATE TASK
// ============================================
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => taskApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// ============================================
// UPDATE TASK
// ============================================
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTaskData> }) =>
      taskApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
    },
  });
};

// ============================================
// DELETE TASK
// ============================================
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => taskApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// ============================================
// SUBMIT TASK PROGRESS
// ============================================
export const useSubmitTaskProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: SubmitProgressData }) =>
      taskApi.submitProgress(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['taskSubmissions', variables.taskId] });
    },
  });
};

// ============================================
// GET TASK SUBMISSIONS
// ============================================
export const useTaskSubmissions = (taskId: number, params?: any) => {
  return useQuery({
    queryKey: ['taskSubmissions', taskId, params],
    queryFn: async () => {
      const response = await taskApi.getSubmissions(taskId, params);
      return response.data || [];
    },
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
};

// ============================================
// VERIFY SUBMISSION
// ============================================
export const useVerifySubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, verifiedBy }: { submissionId: number; verifiedBy?: number }) =>
      taskApi.verifySubmission(submissionId, verifiedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// ============================================
// DELETE SUBMISSION
// ============================================
export const useDeleteSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: number) => taskApi.deleteSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// ============================================
// GET TASK ANALYTICS
// ============================================
export const useTaskAnalytics = (taskId: number, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['taskAnalytics', taskId, startDate, endDate],
    queryFn: async () => {
      const response = await taskApi.getAnalytics(taskId, startDate, endDate);
      return response.data;
    },
    enabled: !!taskId,
  });
};

// ============================================
// GET EMPLOYEE TASK STATISTICS
// ============================================
export const useEmployeeTaskStats = (employeeId: number) => {
  return useQuery({
    queryKey: ['employeeTaskStats', employeeId],
    queryFn: async () => {
      const response = await taskApi.getEmployeeStats(employeeId);
      return response.data;
    },
    enabled: !!employeeId,
    staleTime: 60 * 1000, // 1 minute
  });
};