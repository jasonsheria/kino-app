import axios from 'axios';
import { config } from '../config/api.config';

// Create axios instance with default config
const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ndaku_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('ndaku_auth_token');
      localStorage.removeItem('ndaku_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post(config.API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (data) => api.post(config.API_ENDPOINTS.AUTH.REGISTER, data),
  googleLogin: (data) => api.post(config.API_ENDPOINTS.AUTH.GOOGLE_LOGIN, data),
  getProfile: () => api.get(config.API_ENDPOINTS.AUTH.PROFILE),
};

export const userAPI = {
  getProfile: () => api.get(config.API_ENDPOINTS.USER.PROFILE),
  updateProfile: (data) => api.put(config.API_ENDPOINTS.USER.UPDATE, data),
};

export const propertyAPI = {
  getAll: (params) => api.get(config.API_ENDPOINTS.PROPERTY.LIST, { params }),
  getById: (id) => api.get(config.API_ENDPOINTS.PROPERTY.DETAILS(id)),
  create: (data) => api.post(config.API_ENDPOINTS.PROPERTY.CREATE, data),
  update: (id, data) => api.put(config.API_ENDPOINTS.PROPERTY.UPDATE(id), data),
  delete: (id) => api.delete(config.API_ENDPOINTS.PROPERTY.DELETE(id)),
};

export const agencyAPI = {
  getAll: () => api.get(config.API_ENDPOINTS.AGENCY.LIST),
  getById: (id) => api.get(config.API_ENDPOINTS.AGENCY.DETAILS(id)),
  create: (data) => api.post(config.API_ENDPOINTS.AGENCY.CREATE, data),
  update: (id, data) => api.put(config.API_ENDPOINTS.AGENCY.UPDATE(id), data),
  delete: (id) => api.delete(config.API_ENDPOINTS.AGENCY.DELETE(id)),
  login: (credentials) => api.post(config.API_ENDPOINTS.AGENCY.LOGIN, credentials),
};

export const ownerAPI = {
  getProfile: () => api.get(config.API_ENDPOINTS.OWNER.PROFILE),
  updateProfile: (data) => api.put(config.API_ENDPOINTS.OWNER.UPDATE, data),
  getProperties: () => api.get(config.API_ENDPOINTS.OWNER.PROPERTIES),
};

export default api;
