// src/services/taskApi.ts - Frontend API Service

import api from './api';

export interface Task {
  id: number;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: 'applications' | 'interviews' | 'assessments';
  target: number;
  achieved: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'overdue';
  assignedDate: string;
  priority: 'low' | 'medium' | 'high';
  assignedToId: number;
  assignedById: number;
  notes?: string;
  recurring: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    department: string;
    position: string;
    avatar?: string;
  };
  assignedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  submissions?: TaskSubmission[];
}

export interface TaskSubmission {
  id: number;
  taskId: number;
  employeeId: number;
  count: number;
  date: string;
  notes?: string;
  verified: boolean;
  verifiedBy?: number;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  task?: {
    id: number;
    title: string;
    type: string;
    category: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: 'applications' | 'interviews' | 'assessments';
  target: number;
  unit: string;
  deadline: string;
  priority?: 'low' | 'medium' | 'high';
  assignedToId: number;
  assignedById: string;
  notes?: string;
  recurring?: boolean;
  recurrence?: 'daily' | 'weekly' | 'monthly';
}

export interface SubmitProgressData {
  employeeId: number;
  count: number;
  notes?: string;
}

export interface TaskAnalytics {
  task: {
    id: number;
    title: string;
    type: string;
    target: number;
    achieved: number;
  };
  submissions: TaskSubmission[];
  analytics: {
    totalSubmitted: number;
    avgDaily: number;
    peakSubmission: {
      count: number;
      date: string;
    };
    completionRate: number;
  };
}

export interface EmployeeTaskStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: string;
  totalSubmissions: number;
  verifiedSubmissions: number;
  tasks: Task[];
}

// Task API calls
export const taskApi = {
  // Get all tasks
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/tasks', { params });
      console.log('📋 Task API getAll response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API getAll error:', error.response?.data || error);
      throw error;
    }
  },

  // Get task by ID
  getById: async (id: number) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      console.log('📋 Task API getById response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API getById error:', error.response?.data || error);
      throw error;
    }
  },

  // Get tasks by employee
  getByEmployee: async (employeeId: number, params?: any) => {
    try {
      const response = await api.get(`/tasks/employee/${employeeId}`, { params });
      console.log('📋 Task API getByEmployee response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API getByEmployee error:', error.response?.data || error);
      throw error;
    }
  },

  // Create task
  create: async (data: CreateTaskData) => {
    try {
      console.log('📤 Task API create request:', data);
      const response = await api.post('/tasks', data);
      console.log('📋 Task API create response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API create error:', error.response?.data || error);
      throw error;
    }
  },

  // Update task
  update: async (id: number, data: Partial<CreateTaskData>) => {
    try {
      console.log('📤 Task API update request:', { id, data });
      const response = await api.put(`/tasks/${id}`, data);
      console.log('📋 Task API update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API update error:', error.response?.data || error);
      throw error;
    }
  },

  // Delete task
  delete: async (id: number) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      console.log('📋 Task API delete response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API delete error:', error.response?.data || error);
      throw error;
    }
  },

  // Submit task progress
  submitProgress: async (taskId: number, data: SubmitProgressData) => {
    try {
      console.log('📤 Task API submitProgress request:', { taskId, data });
      const response = await api.post(`/tasks/${taskId}/submit`, data);
      console.log('📋 Task API submitProgress response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API submitProgress error:', error.response?.data || error);
      throw error;
    }
  },

  // Get task submissions
  getSubmissions: async (taskId: number, params?: any) => {
    try {
      const response = await api.get(`/tasks/${taskId}/submissions`, { 
        params: {
          ...params,
          _t: Date.now() // Cache busting
        }
      });
      console.log('📋 Task API getSubmissions response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API getSubmissions error:', error.response?.data || error);
      throw error;
    }
  },

  // Verify submission
  verifySubmission: async (submissionId: number, verifiedBy?: number) => {
    try {
      const response = await api.patch(`/tasks/submissions/${submissionId}/verify`, {
        verifiedBy
      });
      console.log('📋 Task API verifySubmission response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API verifySubmission error:', error.response?.data || error);
      throw error;
    }
  },

  // Delete submission
  deleteSubmission: async (submissionId: number) => {
    try {
      const response = await api.delete(`/tasks/submissions/${submissionId}`);
      console.log('📋 Task API deleteSubmission response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API deleteSubmission error:', error.response?.data || error);
      throw error;
    }
  },

  // Get task analytics
  getAnalytics: async (taskId: number, startDate?: string, endDate?: string) => {
    try {
      const response = await api.get(`/tasks/${taskId}/analytics`, {
        params: { startDate, endDate }
      });
      console.log('📋 Task API getAnalytics response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API getAnalytics error:', error.response?.data || error);
      throw error;
    }
  },

  // Get employee task statistics
  getEmployeeStats: async (employeeId: number) => {
    try {
      const response = await api.get(`/tasks/employee/${employeeId}/stats`);
      console.log('📋 Task API getEmployeeStats response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Task API getEmployeeStats error:', error.response?.data || error);
      throw error;
    }
  }
};