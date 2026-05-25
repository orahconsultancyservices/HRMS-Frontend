// src/services/api.ts - FIXED: removed Cache-Control/Pragma/Expires from request headers
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://hrms-backend-624104167591.asia-southeast1.run.app/api';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    
    try {
      const sessionData = localStorage.getItem('hrms_session');
      if (sessionData) {
        const user = JSON.parse(sessionData);
        if (user?.id) {
          config.headers['x-user'] = JSON.stringify({ id: user.id, role: user.role });
        }
      }
    } catch (err) {
      console.warn('Could not parse session from localStorage', err);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  verifySession: (data: { email: string; role: string }) => 
    api.post('/auth/verify', data),
  changePassword: (data: { email: string; oldPassword: string; newPassword: string }) => 
    api.post('/auth/change-password', data),
};

export const employeeApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },
  getById: (id: number, params?: any) => api.get(`/employees/${id}`, { params }),
  create: (data: any) => api.post('/employees', data),
  update: (id: number, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
  getDepartments: () => api.get('/employees/departments'),
  getPositions: () => api.get('/employees/positions'),
  getLeaveBalance: (id: number) => api.get(`/employees/${id}/leave-balance`),
  updateLeaveBalance: (id: number, data: any) => api.put(`/employees/${id}/leave-balance`, data),
  // One-time backfill: auto-link departmentId for existing employees created before this fix
  backfillDepartmentIds: async () => {
    const response = await api.post('/employees/backfill-department-ids');
    return response.data;
  },
};

export const leaveApi = {
  getAll: async () => {
    const response = await api.get('/leaves');
    return response.data;
  },
  getById: (id: number) => api.get(`/leaves/${id}`),
  getByEmployee: (empId: number) => api.get(`/leaves/employee/${empId}`),
  create: async (data: any) => {
    const response = await api.post('/leaves', data);
    return response.data;
  },
  update: (id: number, data: any) => api.put(`/leaves/${id}`, data),
  updateStatus: async (id: number, status: string, notes?: string) => {
    const response = await api.patch(`/leaves/${id}/status`, { status, managerNotes: notes });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/leaves/${id}`);
    return response.data;
  },
  getStatistics: () => api.get('/leaves/statistics'),
  getPaidLeaveBalance: async (empId: number) => {
    try {
      const response = await api.get(`/leaves/employee/${empId}/paid-balance`, {
        params: { _t: Date.now() }
        // ← removed Cache-Control/Pragma/Expires headers
      });
      return response.data;
    } catch (error: any) {
      return { success: false, data: { earned: 0, consumed: 0, available: 0 } };
    }
  },
};

export const birthdayApi = {
  getAll: () => api.get('/birthdays'),
  getUpcoming: () => api.get('/birthdays/upcoming'),
  getToday: () => api.get('/birthdays/today'),
  getByMonth: (month: number) => api.get(`/birthdays/month/${month}`),
};

export const attendanceApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },
  getById: (id: number) => api.get(`/attendance/${id}`),
  markAttendance: (data: any) => api.post('/attendance/mark', data),
  bulkMark: (data: any) => api.post('/attendance/bulk', data),
  delete: (id: number) => api.delete(`/attendance/${id}`),
  getStats: () => api.get('/attendance/stats'),

  clockIn: async (employeeId: number, data?: any) => {
    const response = await api.post(`/attendance/employee/${employeeId}/clock-in`, data);
    return response.data;
  },
  clockOut: async (employeeId: number, data?: any) => {
    const response = await api.post(`/attendance/employee/${employeeId}/clock-out`, data);
    return response.data;
  },
  startBreak: async (employeeId: number, data?: any) => {
    const response = await api.post(`/attendance/employee/${employeeId}/break/start`, data);
    return response.data;
  },
  endBreak: async (employeeId: number, breakId: number) => {
    const response = await api.post(`/attendance/employee/${employeeId}/break/${breakId}/end`);
    return response.data;
  },

  // ← _t param busts the cache; no need for Cache-Control request headers
  getBreaks: async (employeeId: number) => {
    try {
      const response = await api.get(`/attendance/employee/${employeeId}/breaks`, {
        params: { _t: Date.now() }
      });
      return response.data;
    } catch (error: any) {
      return { success: false, data: [] };
    }
  },

  getTodayStatus: async (employeeId: number) => {
    try {
      const response = await api.get(`/attendance/employee/${employeeId}/today`, {
        params: { _t: Date.now() }
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Get today status API error:', error);
      return { success: false, data: null };
    }
  },

  getByEmployee: async (employeeId: number, params?: any) => {
    const response = await api.get(`/attendance/employee/${employeeId}`, {
      params: { ...params, _t: Date.now() }
    });
    return response.data;
  },

  updateAttendance: async (id: number, data: {
    checkIn?: string;
    checkOut?: string;
    notes?: string;
    status?: string;
  }) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },

  exportMonthlyAll: async (params: { month: number; year: number; department?: string }) => {
    const response = await api.get('/attendance/export/monthly', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};

export const performanceApi = {
  getDailyActivities: (employeeId: number, params?: any) =>
    api.get(`/performance/employees/${employeeId}/daily-activities`, { params }),
  upsertDailyActivity: (data: any) =>
    api.post('/performance/daily-activities', data),
  getMonthlyPerformance: (employeeId: number, params?: any) =>
    api.get(`/performance/employees/${employeeId}/monthly-performance`, { params }),
  generateMonthlyPerformance: (data: { employeeId: number; year: number; month: number }) =>
    api.post('/performance/monthly-performance/generate', data),
  addPerformanceRemarks: (id: number, data: { teamLeadRemarks: string; remarkedBy: number }) =>
    api.put(`/performance/monthly-performance/${id}/remarks`, data),
  lockMonthlyPerformance: (id: number, data: { lockedBy: number }) =>
    api.put(`/performance/monthly-performance/${id}/lock`, data),
  getTeamPerformanceSummary: (params?: any) =>
    api.get('/performance/team/performance-summary', { params }),
  getCompanyPerformance: (params?: any) =>
    api.get('/performance/company/performance', { params }),
};

export const departmentApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/departments', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },
  delete: (id: number) => api.delete(`/departments/${id}`),
  getDesignations: async (departmentId?: number) => {
    const response = await api.get('/departments/designations', { params: { departmentId } });
    return response.data;
  },
  getDefaultKPIs: async (designationId: number) => {
    const response = await api.get(`/departments/designations/${designationId}/kpis`);
    return response.data;
  },
  createDefaultKPI: async (data: any) => {
    const response = await api.post('/departments/kpis', data);
    return response.data;
  },
  updateDefaultKPI: async (id: number, data: any) => {
    const response = await api.put(`/departments/kpis/${id}`, data);
    return response.data;
  },
  deleteDefaultKPI: (id: number) => api.delete(`/departments/kpis/${id}`),
};

export const taskAssignmentApi = {
  getEmployeeDefaultKPIs: (employeeId: number, params?: any) =>
    api.get(`/task-assignment/employees/${employeeId}/default-kpis`, { params }),
  createTasksFromDefaults: (data: any) =>
    api.post('/task-assignment/create-from-defaults', data),
  adjustTaskTarget: (taskId: number, data: any) =>
    api.put(`/task-assignment/tasks/${taskId}/adjust-target`, data),
  getTeamTasks: (params?: any) =>
    api.get('/task-assignment/team/tasks', { params }),
};

export const settingsApi = {
  getAll: async (): Promise<{ success: boolean; data: Record<string, string> }> => {
    const res = await api.get('/settings');
    return res.data;
  },
  update: async (data: Record<string, string>): Promise<{ success: boolean; data: Record<string, string> }> => {
    const res = await api.put('/settings', data);
    return res.data;
  },
  reset: async (category?: string): Promise<{ success: boolean; data: Record<string, string> }> => {
    const path = category ? `/settings/reset/${category}` : '/settings/reset';
    const res = await api.delete(path);
    return res.data;
  },
};

export default api;