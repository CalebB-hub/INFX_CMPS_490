const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || 'https://infx-cmps-490.onrender.com';
export const API_BASE = `${BACKEND_ORIGIN.replace(/\/$/, '')}/api`;
export const API_BASES = [API_BASE, '/api'];
