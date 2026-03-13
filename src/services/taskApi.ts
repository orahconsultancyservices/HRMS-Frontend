// src/services/taskApi.ts — UPDATED with all categories and new endpoints

import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TaskType     = 'daily' | 'weekly' | 'monthly';
export type TaskStatus   = 'active' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';

// All valid categories (expanded)
export type TaskCategory =
  | 'applications'
  | 'interviews'
  | 'assessments'
  | 'calls'
  | 'meetings'
  | 'closures'
  | 'screenings'
  | 'submissions'
  | 'placements';

export interface Task {
  id:           number;
  title:        string;
  description:  string;
  type:         TaskType;
  category:     TaskCategory;
  target:       number;
  achieved:     number;
  unit:         string;
  deadline:     string;
  status:       TaskStatus;
  assignedDate: string;
  priority:     TaskPriority;
  assignedToId: number;
  assignedById: number;
  notes?:       string;
  recurring:    boolean;
  recurrence?:  TaskType;
  isLocked:     boolean;
  lockDate?:    string;
  createdAt:    string;
  updatedAt:    string;
  assignedTo?: {
    id: number; firstName: string; lastName: string;
    employeeId: string; email: string; department: string;
    position: string; avatar?: string;
  };
  assignedBy?: {
    id: number; firstName: string; lastName: string; employeeId: string;
  };
  submissions?: TaskSubmission[];
}

export interface TaskSubmission {
  id:             number;
  taskId:         number;
  employeeId:     number;
  count:          number;
  date:           string;
  notes?:         string;
  profileComment?: string;
  verified:       boolean;
  verifiedBy?:    number;
  verifiedAt?:    string;
  createdAt:      string;
  updatedAt:      string;
  employee?: {
    id: number; firstName: string; lastName: string; employeeId: string;
  };
  task?: {
    id: number; title: string; type: string; category: string;
  };
}

export interface CreateTaskData {
  title:        string;
  description?: string;
  type:         TaskType;
  category:     TaskCategory;
  target:       number;
  unit:         string;
  deadline:     string;
  priority?:    TaskPriority;
  assignedToId: number;
  assignedById: string;
  notes?:       string;
  recurring?:   boolean;
  recurrence?:  TaskType;
}

export interface SubmitProgressData {
  employeeId:      number;
  count:           number;
  notes?:          string;
  profileComment?: string;
}

export interface TeamPerformance {
  employee:          { id: number; name: string; empId: string; department: string; position: string; };
  totalTasks:        number;
  activeTasks:       number;
  completedTasks:    number;
  overdueTasks:      number;
  totalTarget:       number;
  totalAchieved:     number;
  completionRate:    number;
  totalSubmissions:  number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

export const taskApi = {

  getAll: async (params?: any) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  getByEmployee: async (employeeId: number, params?: any) => {
    const response = await api.get(`/tasks/employee/${employeeId}`, { params });
    return response.data;
  },

  create: async (data: CreateTaskData) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateTaskData>) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  lock: async (id: number, lockedBy?: number) => {
    const response = await api.patch(`/tasks/${id}/lock`, { lockedBy });
    return response.data;
  },

  submitProgress: async (taskId: number, data: SubmitProgressData) => {
    const response = await api.post(`/tasks/${taskId}/submit`, data);
    return response.data;
  },

  getSubmissions: async (taskId: number, params?: any) => {
    const response = await api.get(`/tasks/${taskId}/submissions`, {
      params: { ...params, _t: Date.now() }
    });
    return response.data;
  },

  verifySubmission: async (submissionId: number, verifiedBy?: number) => {
    const response = await api.patch(`/tasks/submissions/${submissionId}/verify`, { verifiedBy });
    return response.data;
  },

  deleteSubmission: async (submissionId: number) => {
    const response = await api.delete(`/tasks/submissions/${submissionId}`);
    return response.data;
  },

  getAnalytics: async (taskId: number, startDate?: string, endDate?: string) => {
    const response = await api.get(`/tasks/${taskId}/analytics`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getEmployeeStats: async (employeeId: number) => {
    const response = await api.get(`/tasks/employee/${employeeId}/stats`);
    return response.data;
  },

  getTeamPerformance: async (params?: { month?: number; year?: number; department?: string }) => {
    const response = await api.get('/tasks/team/performance', { params });
    return response.data;
  },

  // Performance endpoints
  getMonthlyPerformance: async (employeeId: number, params?: any) => {
    const response = await api.get(`/performance/employees/${employeeId}/monthly-performance`, { params });
    return response.data;
  },

  getTeamPerformanceSummary: async (params?: any) => {
    const response = await api.get('/performance/team/performance-summary', { params });
    return response.data;
  },

  getCompanyPerformance: async (params?: any) => {
    const response = await api.get('/performance/company/performance', { params });
    return response.data;
  },
};