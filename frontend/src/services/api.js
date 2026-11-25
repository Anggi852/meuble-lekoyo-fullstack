import axios from 'axios';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
).replace(/\/$/, '');

export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/v1$/, '');
export const SWAGGER_DOCS_URL = `${API_ROOT_URL}/api-docs`;
export const STREAMLIT_ENV_URL = (import.meta.env.VITE_STREAMLIT_URL || '').trim();

const TOKEN_KEY = 'lekoyo_auth_token';
const USER_KEY = 'lekoyo_auth_user';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('lekoyo_admin_token') || '';
  } catch {
    return '';
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem('lekoyo_admin_token', token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem('lekoyo_admin_token');
    }
  } catch {
    /* abaikan */
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* abaikan */
  }
};

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Otomatis kirim token Bearer (Customer maupun Owner)
http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Pesan error yang jelas dan mudah dipahami pelanggan / owner
export function extractApiError(err, fallback = 'Terjadi kendala saat menghubungi server.') {
  if (!err) return fallback;
  if (err.code === 'ECONNABORTED') {
    return 'Server terlalu lama merespons (timeout). Mohon coba lagi sebentar.';
  }
  if (!err.response) {
    return 'Tidak dapat terhubung ke server backend. Pastikan server Express sedang berjalan.';
  }
  const status = err.response.status;
  const data = err.response.data;
  if (status === 400 && Array.isArray(data?.details) && data.details.length > 0) {
    return `${data.message || 'Data tidak valid:'} (${data.details[0].message})`;
  }
  if (status === 401) {
    return data?.message || 'Sesi berakhir. Silakan login kembali.';
  }
  if (status === 429) {
    return 'Permintaan sedang padat atau batas kuota layanan tercapai. Coba lagi sebentar.';
  }
  return data?.message || fallback;
}

export const api = {
  // System & Bootstrap
  health: () => http.get('/health').then((r) => r.data),
  bootstrap: () => http.get('/bootstrap').then((r) => r.data.data),

  // Auth (Owner Password & Google Customer/Owner)
  login: (password) => http.post('/auth/login', { password }).then((r) => r.data.data),
  loginGoogle: (credential) => http.post('/auth/google', { credential }).then((r) => r.data.data),
  me: () => http.get('/auth/me').then((r) => r.data.data),

  // Wishlist per Akun (Sinkron Database)
  getMyWishlist: () => http.get('/wishlist/me').then((r) => r.data.data),
  toggleWishlist: (productId) =>
    http.post('/wishlist/toggle', { productId }).then((r) => r.data.data),

  // Aktivitas Akun (Pelanggan, Owner & AI/Data Science)
  getMyActivities: (limit = 50) =>
    http.get('/activities/me', { params: { limit } }).then((r) => r.data.data),
  recordActivity: (payload) => http.post('/activities', payload).then((r) => r.data.data),
  getAllActivities: (params) => http.get('/activities', { params }).then((r) => r.data.data),

  // Products
  getProducts: (params) => http.get('/products', { params }).then((r) => r.data.data),
  createProduct: (payload) => http.post('/products', payload).then((r) => r.data.data),
  updateProduct: (id, payload) => http.put(`/products/${id}`, payload).then((r) => r.data.data),
  updateProductStock: (id, stockStatus) =>
    http.patch(`/products/${id}/stock`, { stockStatus }).then((r) => r.data.data),
  deleteProduct: (id) => http.delete(`/products/${id}`).then((r) => r.data),

  // Custom Portfolio (Pernah Dicustom)
  getCustomPortfolio: () => http.get('/custom-portfolio').then((r) => r.data.data),
  createCustomPortfolio: (payload) => http.post('/custom-portfolio', payload).then((r) => r.data.data),
  updateCustomPortfolio: (id, payload) =>
    http.put(`/custom-portfolio/${id}`, payload).then((r) => r.data.data),
  deleteCustomPortfolio: (id) => http.delete(`/custom-portfolio/${id}`).then((r) => r.data),

  // Orders
  getOrders: () => http.get('/orders').then((r) => r.data.data),
  getMyOrders: () => http.get('/orders/me').then((r) => r.data.data),
  createOrder: (payload) => http.post('/orders', payload).then((r) => r.data.data),
  updateOrder: (id, patch) => http.patch(`/orders/${id}`, patch).then((r) => r.data.data),
  deleteOrder: (id) => http.delete(`/orders/${id}`).then((r) => r.data),

  // Sales
  getSales: () => http.get('/sales').then((r) => r.data.data),
  createSale: (payload) => http.post('/sales', payload).then((r) => r.data.data),
  deleteSale: (id) => http.delete(`/sales/${id}`).then((r) => r.data),

  // FAQs
  getFaqs: () => http.get('/faqs').then((r) => r.data.data),
  createFaq: (payload) => http.post('/faqs', payload).then((r) => r.data.data),
  updateFaq: (id, payload) => http.put(`/faqs/${id}`, payload).then((r) => r.data.data),
  deleteFaq: (id) => http.delete(`/faqs/${id}`).then((r) => r.data),

  // Testimonials & Reviews
  getTestimonials: () => http.get('/testimonials').then((r) => r.data.data),
  createTestimonial: (payload) => http.post('/testimonials', payload).then((r) => r.data.data),
  updateTestimonial: (id, payload) =>
    http.put(`/testimonials/${id}`, payload).then((r) => r.data.data),
  deleteTestimonial: (id) => http.delete(`/testimonials/${id}`).then((r) => r.data),
  submitOrderReview: (payload) =>
    http.post('/testimonials/review', payload).then((r) => r.data.data),

  // Gen AI Chat (melalui Backend, tersimpan di DB)
  getChatLogs: () => http.get('/chats').then((r) => r.data.data),
  sendChat: ({ message, activeProductId = null, sessionId = 'web-guest', logOnly = false, intent }) =>
    http.post('/chats', { message, activeProductId, sessionId, logOnly, intent }).then((r) => r.data.data),
  clearChatLogs: () => http.delete('/chats').then((r) => r.data),

  // Metrics & Data Science Analytics
  recordVisit: () => http.post('/metrics/visit').then((r) => r.data.data),
  recordView: (productId) => http.post('/metrics/view', { productId }).then((r) => r.data.data),
  getAnalyticsSummary: () => http.get('/analytics/summary').then((r) => r.data.data),

  // Admin Reset
  resetAll: () => http.post('/admin/reset').then((r) => r.data.data),
};