import axios from 'axios';

// ============================================================================
// 🔧 API CONFIGURATION - Easy Switch Between Local & Production
// ============================================================================

// CHANGE THIS TO SWITCH BETWEEN LOCAL AND PRODUCTION
const USE_LOCAL = true;

// PRODUCTION URL (Deployed backend on Render)
const PRODUCTION_URL = 'https://milkproject.onrender.com/api';

const LOCAL_URL = 'http://192.168.0.103:5000/api';

const API_BASE_URL = USE_LOCAL ? LOCAL_URL : PRODUCTION_URL;

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📍 Mode:', USE_LOCAL ? '💻 LOCAL DEVELOPMENT' : '🚀 PRODUCTION');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error';

    error.message = message;

    return Promise.reject(error);
  }
);

export const apiBaseUrl = API_BASE_URL;


export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  updateProfile: (data, token) => api.put('/auth/profile', data, { headers: { Authorization: `Bearer ${token}` } }),
  changePassword: (data, token) => api.post('/auth/change-password', data, { headers: { Authorization: `Bearer ${token}` } })
};

export const centerApi = {
  getAll: (token) => api.get('/centers', { headers: { Authorization: `Bearer ${token}` } }),
  add: (data, token) => api.post('/centers', data, { headers: { Authorization: `Bearer ${token}` } }),
  update: (id, data, token) => api.put(`/centers/${id}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  remove: (id, token) => api.delete(`/centers/${id}`, { headers: { Authorization: `Bearer ${token}` } })
};

export const farmerApi = {
  getAll: (token, params) => api.get('/farmers', { headers: { Authorization: `Bearer ${token}` }, params }),
  add: (data, token) => api.post('/farmers', data, { headers: { Authorization: `Bearer ${token}` } }),
  update: (id, data, token) => api.put(`/farmers/${id}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  remove: (id, token) => api.delete(`/farmers/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  getByCenter: (centerId, token) => api.get(`/farmers/center/${centerId}`, { headers: { Authorization: `Bearer ${token}` } })
};

export const rateChartApi = {
  get:    (token, centerId, animalType = 'Cow') => api.get('/admin/rate-chart',  { headers: { Authorization: `Bearer ${token}` }, params: { centerId, animalType } }),
  update: (data, token, centerId, animalType = 'Cow') => api.put('/admin/rate-chart', data, { headers: { Authorization: `Bearer ${token}` }, params: { centerId, animalType } })
};

export const annualBonusApi = {
  getEligible: (token) => api.get('/admin/annual-bonus', { headers: { Authorization: `Bearer ${token}` } }),
  notify: (token) => api.post('/admin/annual-bonus/notify', {}, { headers: { Authorization: `Bearer ${token}` } })
};

export const milkApi = {
  add: (data, token) => api.post('/milk', data, { headers: { Authorization: `Bearer ${token}` } }),
  getAll: (token, params) => api.get('/milk', { headers: { Authorization: `Bearer ${token}` }, params })
};

export const notificationApi = {
  // Admin
  getRecipients: (token, params) =>
    api.get('/notifications/admin/recipients', { headers: { Authorization: `Bearer ${token}` }, params }),
  send: (data, token) =>
    api.post('/notifications/admin/send', data, { headers: { Authorization: `Bearer ${token}` } }),
  getAll: (token, params) =>
    api.get('/notifications/admin/all', { headers: { Authorization: `Bearer ${token}` }, params }),
  // Farmer
  getMy: (token, params) =>
    api.get('/notifications/my', { headers: { Authorization: `Bearer ${token}` }, params }),
  getUnreadCount: (token) =>
    api.get('/notifications/my/unread-count', { headers: { Authorization: `Bearer ${token}` } }),
  markRead: (token, notificationId) =>
    api.put(`/notifications/my/${notificationId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }),
  markAllRead: (token) =>
    api.put('/notifications/my/all/read', {}, { headers: { Authorization: `Bearer ${token}` } })
};

export const farmerDashboardApi = {
  getProfile: (token) =>
    api.get('/farmer-dashboard/profile', { headers: { Authorization: `Bearer ${token}` } }),
  getMilk: (token, params) =>
    api.get('/farmer-dashboard/milk', { headers: { Authorization: `Bearer ${token}` }, params }),
  getFood: (token, params) =>
    api.get('/farmer-dashboard/food', { headers: { Authorization: `Bearer ${token}` }, params }),
  getReport: (token, params) =>
    api.get('/farmer-dashboard/report', { headers: { Authorization: `Bearer ${token}` }, params })
};

export const farmerAuthApi = {
  setPassword: (data, token) =>
    api.post('/auth/farmer-password', data, { headers: { Authorization: `Bearer ${token}` } }),
  toggleLogin: (farmerId, data, token) =>
    api.put(`/auth/farmer-login/${farmerId}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  enableAll: (token) =>
    api.post('/auth/farmer-login/enable-all', {}, { headers: { Authorization: `Bearer ${token}` } })
};

export const foodApi = {
  getAll: (token, params) => api.get('/food', { headers: { Authorization: `Bearer ${token}` }, params }),
  add: (data, token) => api.post('/food', data, { headers: { Authorization: `Bearer ${token}` } }),
  update: (id, data, token) => api.put(`/food/${id}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  remove: (id, token) => api.delete(`/food/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  getByCenter: (centerId, token, params) => api.get(`/food/center/${centerId}`, { headers: { Authorization: `Bearer ${token}` }, params }),
  getByFarmer: (farmerId, token) => api.get(`/food/farmer/${farmerId}`, { headers: { Authorization: `Bearer ${token}` } }),
  getMonthlyReports: (token, params) => api.get('/food/reports/monthly', { headers: { Authorization: `Bearer ${token}` }, params })
};

export const advanceApi = {
  getAll: (token, params) => api.get('/advances', { headers: { Authorization: `Bearer ${token}` }, params }),
  add: (data, token) => api.post('/advances', data, { headers: { Authorization: `Bearer ${token}` } }),
  addAmount: (id, data, token) => api.post(`/advances/${id}/add-amount`, data, { headers: { Authorization: `Bearer ${token}` } }),
  update: (id, data, token) => api.put(`/advances/${id}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  remove: (id, token) => api.delete(`/advances/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  getFarmerDetails: (farmerId, token) => api.get(`/advances/farmer/${farmerId}`, { headers: { Authorization: `Bearer ${token}` } })
};

export const payableApi = {
  getAll: (token, params) => api.get('/payable', { headers: { Authorization: `Bearer ${token}` }, params }),
  generate: (data, token) => api.post('/payable/generate', data, { headers: { Authorization: `Bearer ${token}` } }),
  forward: (id, token) => api.put(`/payable/${id}/forward`, {}, { headers: { Authorization: `Bearer ${token}` } }),
  // Both /clear and /mark-paid are supported by backend
  clear: (id, token) => api.put(`/payable/${id}/mark-paid`, {}, { headers: { Authorization: `Bearer ${token}` } }),
  markPaid: (id, token) => api.put(`/payable/${id}/mark-paid`, {}, { headers: { Authorization: `Bearer ${token}` } }),
  remove: (id, token) => api.delete(`/payable/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  getFarmerDetails: (farmerId, token, params) => api.get(`/payable/farmer/${farmerId}`, { headers: { Authorization: `Bearer ${token}` }, params }),
  getCenterReport: (centerId, token, params) => api.get(`/payable/center/${centerId}/report`, { headers: { Authorization: `Bearer ${token}` }, params })
};

export const reportApi = {
  getCenterReport: (centerId, token, params) =>
    api.get(`/reports/center/${centerId}`, { headers: { Authorization: `Bearer ${token}` }, params }),
  getAllCentersSummary: (token, params) =>
    api.get('/reports/centers/summary', { headers: { Authorization: `Bearer ${token}` }, params }),
  getFarmerReport: (farmerId, token, params) =>
    api.get(`/reports/farmer/${farmerId}`, { headers: { Authorization: `Bearer ${token}` }, params }),
  getFarmerAnalytics: (farmerId, token) =>
    api.get(`/reports/farmer/${farmerId}/analytics`, { headers: { Authorization: `Bearer ${token}` } })
};

export default api;
