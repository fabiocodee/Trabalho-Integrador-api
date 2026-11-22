// Cliente HTTP com renovacao automatica de token (Axios). Copie para jwt-app/src/services/api.js
// Requer: npm install axios
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

export const session = {
  get access() { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  get user() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  save({ accessToken, refreshToken, user }) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  },
  clear() {
    ['accessToken', 'refreshToken', 'user'].forEach((k) => localStorage.removeItem(k));
  },
};

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (session.access) config.headers.Authorization = `Bearer ${session.access}`;
  return config;
});

let refreshing = false;
let queue = [];

const flush = (error, token) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (error.response?.status !== 401 || original._retry || isAuthCall) return Promise.reject(error);
    original._retry = true;

    // outras requisicoes 401 aguardam na fila enquanto um unico refresh acontece
    if (refreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    refreshing = true;
    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: session.refresh });
      session.save(data);
      flush(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (e) {
      flush(e, null);
      session.clear();
      window.location.href = '/login';
      return Promise.reject(e);
    } finally {
      refreshing = false;
    }
  }
);

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  session.save(data);
  return data.user;
};

export const logout = async () => {
  try { await api.post('/auth/logout', { refreshToken: session.refresh }); } finally { session.clear(); }
};
