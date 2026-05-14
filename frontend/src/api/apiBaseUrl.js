const DEFAULT_API_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://doan-wld6.onrender.com/api';

const normalizedApiUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL)
  .replace(/\/$/, '');

export const API_BASE_URL = normalizedApiUrl;
export const SOCKET_BASE_URL = normalizedApiUrl.replace(/\/api\/?$/, '');
