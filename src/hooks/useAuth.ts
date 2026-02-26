// src/hooks/useAuth.ts
// UPDATED - Added teamlead role support

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: number;
  empId: string;
  employeeId?: string;
  name: string;
  email: string;
  role: 'employer' | 'employee' | 'teamlead';
  department?: string;
  position?: string;
  avatar?: string;
  joinDate?: string;
  isTeamLead?: boolean;
  leaveBalance?: {
    casual: number;
    sick: number;
    earned: number;
  };
}

export const authKeys = {
  all:     ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user:    (email: string) => [...authKeys.all, 'user', email] as const,
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const savedSession = localStorage.getItem('hrms_session');

      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);

          if (session.email && session.role && session.name) {
            return {
              ...session,
              id:         session.id || session.empId,
              empId:      session.empId || session.id?.toString(),
              employeeId: session.employeeId || session.empId,
              // Ensure role is one of the three valid values
              role: (['employer', 'employee', 'teamlead'] as const).includes(session.role)
                ? session.role
                : 'employee',
            };
          }
        } catch {
          localStorage.removeItem('hrms_session');
        }
      }

      throw new Error('No session found');
    },
    retry:     false,
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials);
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        const userData = data.data;
        const sessionData = {
          ...userData,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('hrms_session', JSON.stringify(sessionData));
        queryClient.setQueryData(authKeys.session(), userData);
      }
    },
    onError: (error: any) => {
      console.error('useLogin error:', error.message);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => ({ success: true }),
    onSuccess: () => {
      localStorage.removeItem('hrms_session');
      localStorage.removeItem('remembered_email');
      queryClient.clear();
      queryClient.removeQueries();
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: { email: string; oldPassword: string; newPassword: string }) => {
      const response = await authApi.changePassword(data);
      return response.data;
    },
  });
};