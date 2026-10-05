import axios from 'axios';

// All requests go to the LavaLust API. The frontend never talks to the database.
export const API_URL = (
  import.meta.env.VITE_API_URL || 'https://adarlofeyback.onrender.com'
).replace(/\/$/, '');

const KEYS = { access: 'pm_access_token', refresh: 'pm_refresh_token', user: 'pm_user' };

export const session = {
  get access() { return localStorage.getItem(KEYS.access); },
  get refresh() { return localStorage.getItem(KEYS.refresh); },
  get user() {
    try { return JSON.parse(localStorage.getItem(KEYS.user)); } catch { return null; }
  },
  save({ tokens, user }) {
    if (tokens) {
      localStorage.setItem(KEYS.access, tokens.access_token);
      localStorage.setItem(KEYS.refresh, tokens.refresh_token);
    }
    if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
  },
  clear() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

const api = axios.create({ baseURL: `${API_URL}/api` });

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = session.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the access token expired (401), swap the refresh token for a new pair and retry once.
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.startsWith('/auth/');

    if (status === 401 && original && !original._retry && !isAuthCall && session.refresh) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios
            .post(`${API_URL}/api/auth/refresh`, { refresh_token: session.refresh })
            .then((r) => {
              session.save({ tokens: r.data.tokens });
              return r.data.tokens.access_token;
            })
            .finally(() => { refreshing = null; });

        const newAccess = await refreshing;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        session.clear();
        window.dispatchEvent(new Event('auth:logout'));
      }
    } else if (status === 401 && !isAuthCall) {
      session.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

/** Turn any axios error into { message, fields } for the UI. */
export function parseError(err) {
  const data = err.response?.data;
  if (!err.response) {
    return { message: 'Cannot reach the server. Check your connection or the API URL.', fields: {} };
  }
  return { message: data?.error || data?.message || 'Something went wrong.', fields: data?.errors || {} };
}

// ---- Auth ----
export const login = (username, password) => api.post('/auth/login', { username, password });
export const register = (payload) => api.post('/auth/register', payload);
export const logout = () => api.post('/auth/logout', { refresh_token: session.refresh });

// ---- Products ----
export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

export default api;
