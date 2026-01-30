// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// Auth API calls
export const authApi = {
    login: async (data: { email: string; password: string }) => {
    console.log('📤 Sending login request:', data.email);
    try {
      const response = await api.post('/auth/login', data);
      console.log('📥 Login response received:', response.data);
      return response.data; // Return data directly
    } catch (error) {
      console.error('❌ Login request failed:', error);
      throw error;
    }
  },
  verifySession: (data: { email: string; role: string }) => 
    api.post('/auth/verify', data),
  changePassword: (data: { email: string; oldPassword: string; newPassword: string }) => 
    api.post('/auth/change-password', data),
};

// Employee API calls
export const employeeApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/employees', { params });
      console.log('👥 Employee API getAll response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Employee API getAll error:', error.response?.data || error);
      throw error;
    }
  },
  getById: (id: number, params?: any) => api.get(`/employees/${id}`, { params }),
  create: (data: any) => api.post('/employees', data),
  update: (id: number, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
  getDepartments: () => api.get('/employees/departments'),
  getPositions: () => api.get('/employees/positions'),
  getLeaveBalance: (id: number) => api.get(`/employees/${id}/leave-balance`),
  updateLeaveBalance: (id: number, data: any) => api.put(`/employees/${id}/leave-balance`, data),
};

// Leave API calls
export const leaveApi = {
  getAll: () => api.get('/leaves'),
  getById: (id: number) => api.get(`/leaves/${id}`),
  getByEmployee: (empId: number) => api.get(`/leaves/employee/${empId}`),
  create: (data: any) => api.post('/leaves', data),
  update: (id: number, data: any) => api.put(`/leaves/${id}`, data),
  updateStatus: (id: number, status: string) => api.patch(`/leaves/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/leaves/${id}`),
  getStatistics: () => api.get('/leaves/statistics'),
   getPaidLeaveBalance: async (empId: number) => {
    try {
      console.log('📤 API: Requesting paid leave balance for employee ID:', empId);
      
      const response = await api.get(`/leaves/employee/${empId}/paid-balance`, {
        params: {
          _t: Date.now() // Cache busting
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('📥 API: Paid leave balance response:', response.data);
      
      // Return the response data directly
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Error fetching paid leave balance:', error.response?.data || error);
      
      // Return a default response instead of throwing
      return {
        success: false,
        data: {
          earned: 0,
          consumed: 0,
          available: 0
        }
      };
    }
  },
};

// Birthday API calls
export const birthdayApi = {
  getAll: () => api.get('/birthdays'),
  getUpcoming: () => api.get('/birthdays/upcoming'),
  getToday: () => api.get('/birthdays/today'),
  getByMonth: (month: number) => api.get(`/birthdays/month/${month}`),
};

// Attendance API calls
export const attendanceApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/attendance', { params });
      console.log('📊 Attendance API getAll response:', {
        status: response.status,
        data: response.data
      });
      return response.data; // Return the full response data
    } catch (error: any) {
      console.error('❌ Attendance API getAll error:', error.response?.data || error);
      throw error;
    }
  },
  getById: (id: number) => api.get(`/attendance/${id}`),
  markAttendance: (data: any) => api.post('/attendance/mark', data),
  bulkMark: (data: any) => api.post('/attendance/bulk', data),
  delete: (id: number) => api.delete(`/attendance/${id}`),
  getStats: () => api.get('/attendance/stats'),
  clockIn: async (employeeId: number, data?: any) => {
    try {
      const response = await api.post(`/attendance/employee/${employeeId}/clock-in`, data);
      console.log('✅ Clock in API response:', response.data);
      // Return the full response data which contains { success, message, data }
      return response.data;
    } catch (error: any) {
      console.error('❌ Clock in API error:', error.response?.data || error);
      throw error;
    }
  },

 clockOut: async (employeeId: number, data?: any) => {
    try {
      const response = await api.post(`/attendance/employee/${employeeId}/clock-out`, data);
      console.log('✅ Clock out API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Clock out API error:', error.response?.data || error);
      throw error;
    }
  },

  startBreak: async (employeeId: number, data?: any) => {
    try {
      const response = await api.post(`/attendance/employee/${employeeId}/break/start`, data);
      console.log('✅ Start break API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Start break API error:', error.response?.data || error);
      throw error;
    }
  },


  endBreak: async (employeeId: number, breakId: number) => {
    try {
      const response = await api.post(`/attendance/employee/${employeeId}/break/${breakId}/end`);
      console.log('✅ End break API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ End break API error:', error.response?.data || error);
      throw error;
    }
  },

 getBreaks: async (employeeId: number) => {
    try {
      const response = await api.get(`/attendance/employee/${employeeId}/breaks`, {
        params: {
          _t: Date.now()
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('✅ Get breaks API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get breaks API error:', error.response?.data || error);
      return { success: false, data: [] };
    }
  },


 getTodayStatus: async (employeeId: number) => {
    try {
      const response = await api.get(`/attendance/employee/${employeeId}/today`, {
        params: {
          _t: Date.now() // Cache-busting timestamp
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('✅ Get today status API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get today status API error:', error.response?.data || error);
      // ✅ FIX: Return null response instead of throwing
      return { success: false, data: null };
    }
  },

  getByEmployee: async (employeeId: number, params?: any) => {
    try {
      const response = await api.get(`/attendance/employee/${employeeId}`, { 
        params: {
          ...params,
          _t: Date.now() // Cache busting
        }
      });
      
      console.log('📅 Monthly attendance API response:', {
        status: response.status,
        data: response.data
      });
      
      // Return the full response data
      return response.data;
    } catch (error: any) {
      console.error('❌ Monthly attendance API error:', error.response?.data || error);
      throw error;
    }
  },
};

export default api;