// src/hooks/useBirthdaysQuery.ts
import { useQuery } from '@tanstack/react-query';
import { birthdayApi } from '../services/api';

interface Employee {
  id: string;
  name: string;
  avatar: string;
  department: string;
  position: string;
  birthday: string;
  email: string;
  phone: string;
  joinDate: string;
  leaveBalance: {
    casual: number;
    sick: number;
    earned: number;
  };
}

// Query Keys
export const birthdayKeys = {
  all: ['birthdays'] as const,
  list: () => [...birthdayKeys.all, 'list'] as const,
  upcoming: () => [...birthdayKeys.all, 'upcoming'] as const,
  today: () => [...birthdayKeys.all, 'today'] as const,
  month: (month: number) => [...birthdayKeys.all, 'month', month] as const,
};

// Get all birthdays
export const useBirthdays = () => {
  return useQuery({
    queryKey: birthdayKeys.list(),
    queryFn: async () => {
      try {
        const response = await birthdayApi.getAll();
        if (response.data.success) {
          return response.data.data as Employee[];
        }
        throw new Error('Failed to fetch birthdays');
      } catch (error: any) {
        console.error('Error fetching birthdays:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch birthdays');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Get upcoming birthdays (next 30 days)
export const useUpcomingBirthdays = () => {
  return useQuery({
    queryKey: birthdayKeys.upcoming(),
    queryFn: async () => {
      const response = await birthdayApi.getUpcoming();
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch upcoming birthdays');
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Get today's birthdays
export const useTodayBirthdays = () => {
  return useQuery({
    queryKey: birthdayKeys.today(),
    queryFn: async () => {
      const response = await birthdayApi.getToday();
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch today\'s birthdays');
    },
    staleTime: 1 * 60 * 1000, // 1 minute (refresh more often for today's birthdays)
  });
};

// Get birthdays by month
export const useBirthdaysByMonth = (month: number) => {
  return useQuery({
    queryKey: birthdayKeys.month(month),
    queryFn: async () => {
      const response = await birthdayApi.getByMonth(month);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch month birthdays');
    },
    staleTime: 5 * 60 * 1000,
    enabled: month >= 1 && month <= 12, // Only run if valid month
  });
};