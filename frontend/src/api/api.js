import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.114:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
