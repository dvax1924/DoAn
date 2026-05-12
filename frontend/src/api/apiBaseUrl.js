const DEFAULT_API_URL = 'https://doan-wld6.onrender.com/api';

const normalizedApiUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL)
  .replace(/\/$/, '');

export const API_BASE_URL = normalizedApiUrl;
export const SOCKET_BASE_URL = normalizedApiUrl.replace(/\/api\/?$/, '');
