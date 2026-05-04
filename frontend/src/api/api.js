import axios from 'axios';
import Constants from 'expo-constants';

const DEV_HOST = '192.168.0.104';
const APP_CONFIG_URL = Constants.expoConfig?.extra?.apiUrl || Constants.manifest?.extra?.apiUrl;
const DEFAULT_API_URL = APP_CONFIG_URL || `http://${DEV_HOST}:5000/api`;

const API_BASE_URL = DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error';
    error.message = message;
    return Promise.reject(error);
  }
);

export const apiBaseUrl = API_BASE_URL;


export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials)
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
  get: (token) => api.get('/admin/rate-chart', { headers: { Authorization: `Bearer ${token}` } }),
  update: (data, token) => api.put('/admin/rate-chart', data, { headers: { Authorization: `Bearer ${token}` } })
};

export const annualBonusApi = {
  getEligible: (token) => api.get('/admin/annual-bonus', { headers: { Authorization: `Bearer ${token}` } }),
  notify: (token) => api.post('/admin/annual-bonus/notify', {}, { headers: { Authorization: `Bearer ${token}` } })
};

export const milkApi = {
  add: (data, token) => api.post('/milk', data, { headers: { Authorization: `Bearer ${token}` } })
};

export const smsApi = {
  getRecipients: (token, params) =>
    api.get('/admin/sms/recipients', {
      headers: { Authorization: `Bearer ${token}` },
      params
    }),
  send: (data, token) => api.post('/admin/sms/send', data, { headers: { Authorization: `Bearer ${token}` } })
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

export default api;
