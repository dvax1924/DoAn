import axios from 'axios';
import { API_BASE_URL } from './apiBaseUrl';

const LOCKED_MSG_KEY = 'accountLockedMessage';
const DEFAULT_LOCKED_MESSAGE =
  'Tài khoản của bạn đã bị vô hiệu hóa hoặc không tồn tại. Vui lòng liên hệ quản trị viên 0975959982';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token tự động vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_LOCKED') {
      const message = error.response.data.message || DEFAULT_LOCKED_MESSAGE;
      sessionStorage.setItem(LOCKED_MSG_KEY, message);
      localStorage.removeItem('token');

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
