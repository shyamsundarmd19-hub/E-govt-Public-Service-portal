import axios from 'axios';

// Create base Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloudgov_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Authentication Expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we're already on login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('cloudgov_token');
        localStorage.removeItem('cloudgov_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ==========================================
// API Service Methods
// ==========================================

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export const servicesAPI = {
  list: (params) => api.get('/services/', { params }),
  getById: (id) => api.get(`/services/${id}`),
};

export const applicationsAPI = {
  list: (params) => api.get('/applications/', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications/', data),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
};

export const documentsAPI = {
  requestUpload: (data) => api.post('/documents/upload', data),
  recordDocument: (data) => api.post('/documents/record', data),
  uploadLocalFile: (fileKey, formData) =>
    api.post(`/documents/local-upload?file_key=${fileKey}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const grievancesAPI = {
  list: (params) => api.get('/grievances/', { params }),
  create: (data) => api.post('/grievances/', data),
  updateStatus: (id, data) => api.put(`/grievances/${id}/status`, data),
};

export const verifyAPI = {
  verifyCertificate: (certId) => api.get(`/verify/certificate/${certId}`),
  getDownloadUrl: (certNumber) => `/api/v1/verify/download-certificate/${certNumber}`,
};

export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getAuditLogs: (limit = 50) => api.get('/admin/audit-logs', { params: { limit } }),
};
