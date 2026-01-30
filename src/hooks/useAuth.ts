// src/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';


interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: string;
  empId: string;
  name: string;
  email: string;
  role: 'employer' | 'employee';
  department?: string;
  position?: string;
  avatar?: string;
  joinDate?: string;
  leaveBalance?: {
    casual: number;
    sick: number;
    earned: number;
  };
}

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user: (email: string) => [...authKeys.all, 'user', email] as const,
};

// Hook to get current user from session
// In useAuth.ts - update useCurrentUser
// In useCurrentUser function, update the return data:

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const savedSession = localStorage.getItem('hrms_session');
      
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          
          // Log what we're getting from localStorage
          console.log('🔍 Current user session from localStorage:', session);
          
          if (session.email && session.role && session.name) {
            // Return enhanced session with proper ID mapping
            return {
              ...session,
              // Make sure we have both id and empId
              id: session.id || session.empId, // Use id if exists, otherwise empId
              empId: session.empId || session.id?.toString(), // Use empId if exists
              employeeId: session.employeeId || session.empId // Use employeeId if exists
            };
          }
        } catch (error) {
          localStorage.removeItem('hrms_session');
          throw error;
        }
      }
      
      throw new Error('No session found');
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials);
      
      console.log('useLogin mutationFn - response:', response);
      
      // Since authApi.login returns res.data directly, response is already the data object
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }
      
      return response;
    },
    onSuccess: (data) => {
      console.log('useLogin onSuccess - data:', data);
      
      if (data.success) {
        const userData = data.data;
        
        // Store in localStorage
        const sessionData = {
          ...userData,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('hrms_session', JSON.stringify(sessionData));
        
        // Update React Query cache
        queryClient.setQueryData(authKeys.session(), userData);
        
        console.log('Login successful, user data:', userData);
      }
    },
    onError: (error: any) => {
      console.error('useLogin onError:', error);
      console.error('Error message:', error.message);
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Call logout API if you have one
      // await authApi.logout();
      return { success: true };
    },
    onSuccess: () => {
      // Clear all auth-related data
      localStorage.removeItem('hrms_session');
      localStorage.removeItem('remembered_email');
      
      // Clear React Query cache
      queryClient.clear();
      queryClient.removeQueries();
      
      // Optional: Clear all cached data
      queryClient.invalidateQueries();
    },
  });
};
// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: {
      email: string;
      oldPassword: string;
      newPassword: string;
    }) => {
      const response = await authApi.changePassword(data);
      return response.data;
    },
  });
};