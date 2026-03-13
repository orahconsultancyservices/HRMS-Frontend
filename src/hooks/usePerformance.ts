// src/hooks/usePerformance.ts - React Query Hooks for Performance Management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../services/taskApi';

// ============================================
// GET MONTHLY PERFORMANCE FOR EMPLOYEE
// ============================================
export const useMonthlyPerformance = (employeeId: number, params?: any) => {
  return useQuery({
    queryKey: ['monthlyPerformance', employeeId, params],
    queryFn: async () => {
      const response = await taskApi.getMonthlyPerformance(employeeId, params);
      return response.data || [];
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================
// GET TEAM PERFORMANCE SUMMARY
// ============================================
export const useTeamPerformanceSummary = (params?: any) => {
  return useQuery({
    queryKey: ['teamPerformanceSummary', params],
    queryFn: async () => {
      const response = await taskApi.getTeamPerformanceSummary(params);
      return response.data || {};
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================
// GET COMPANY PERFORMANCE
// ============================================
export const useCompanyPerformance = (params?: any) => {
  return useQuery({
    queryKey: ['companyPerformance', params],
    queryFn: async () => {
      const response = await taskApi.getCompanyPerformance(params);
      return response.data || {};
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
