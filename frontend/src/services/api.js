import axios from 'axios';

const API_BASE = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
  '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
});

// Cookie reader helper for CSRF protection
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

// Attach guest session ID, CSRF token, and optional backup token
api.interceptors.request.use((config) => {
  // If a token is in session or memory, attach it as Bearer header
  const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('kc_auth_token')) || 
                (typeof localStorage !== 'undefined' && localStorage.getItem('kc_token')) || 
                null;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach double-submit CSRF cookie token if present
  const csrfToken = getCookie('csrf_access_token');
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }

  const sessionId = getOrCreateSessionId();
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }

  return config;
});

// Centralized error message extractor
export function extractErrorMessage(err, defaultMsg = 'An unexpected error occurred. Please try again.') {
  if (!err) return defaultMsg;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message === 'Network Error') {
    return 'Unable to reach the server. Please verify the Flask backend is running on port 5000.';
  }
  if (err.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  return defaultMsg;
}


// Global response interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only clear stored tokens if the /auth/me endpoint explicitly rejects us
    // (token expired/revoked). Do NOT clear for other 401s (e.g., protected cart
    // endpoint, unauthenticated product access) — those do not mean the session is invalid.
    const url = err.config?.url || '';
    const isSessionEndpoint = url.includes('/auth/me') || url.includes('/auth/logout');
    if (err.response?.status === 401 && isSessionEndpoint) {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('kc_auth_token');
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('kc_token');
        localStorage.removeItem('kc_user');
      }
    }
    return Promise.reject(err);
  }
);

function getOrCreateSessionId() {
  if (typeof localStorage === 'undefined') return 'sess_test_env';
  let sid = localStorage.getItem('kc_session');
  if (!sid) {
    // Use cryptographically secure random ID to prevent guest cart enumeration
    sid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? `sess_${crypto.randomUUID().replace(/-/g, '')}`
      : `sess_${Date.now()}_${Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,'0')).join('')}`;
    localStorage.setItem('kc_session', sid);
  }
  return sid;
}


// Products
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getCategories: () => api.get('/categories'),
};

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${encodeURIComponent(token)}`),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Addresses
export const addressesApi = {
  getAll: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.patch(`/addresses/${id}/default`),
};

// Cart
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (id, data) => api.patch(`/cart/items/${id}`, data),
  removeItem: (id) => api.delete(`/cart/items/${id}`),
  clear: () => api.delete('/cart/clear'),
};

// Orders
export const ordersApi = {
  create: (data, config = {}) => api.post('/orders', data, config),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getByNumber: (orderNumber, guestToken) => {
    const params = guestToken ? { token: guestToken } : {};
    return api.get(`/orders/lookup/${orderNumber}`, { params });
  },
  getQuote: (data) => api.post('/orders/quote', data),
};

export default api;

