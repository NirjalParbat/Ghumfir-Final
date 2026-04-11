import API from './axios.js';

/**
 * API methods for authentication
 * - register: Create new user account
 * - login: Authenticate user and get JWT token
 * - forgotPassword: Request password reset email
 * - resetPassword: Set new password using reset token
 * - getMe: Fetch current user profile
 * - updateProfile: Update user profile details
 * - changePassword: Change password (requires old password)
 */
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.put('/auth/reset-password', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/update-profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// Packages
export const packageAPI = {
  getAll: (params) => API.get('/packages', { params }),
  getAdminAll: () => API.get('/packages/admin/all'),
  getFeatured: () => API.get('/packages/featured'),
  getById: (id) => API.get(`/packages/${id}`),
  create: (data) => API.post('/packages', data),
  update: (id, data) => API.put(`/packages/${id}`, data),
  delete: (id) => API.delete(`/packages/${id}`),
};

// Bookings
export const bookingAPI = {
  create: (data) => API.post('/bookings', data),
  getMyBookings: () => API.get('/bookings/my'),
  getById: (id) => API.get(`/bookings/${id}`),
  cancel: (id) => API.put(`/bookings/${id}/cancel`),
  getAll: (params) => API.get('/bookings/admin/all', { params }),
  getStats: () => API.get('/bookings/admin/stats'),
  updateStatus: (id, data) => API.put(`/bookings/${id}/status`, data),
};

// Reviews
export const reviewAPI = {
  create: (data) => API.post('/reviews', data),
  getByPackage: (packageId) => API.get(`/reviews/package/${packageId}`),
  getAll: () => API.get('/reviews/admin/all'),
  delete: (id) => API.delete(`/reviews/${id}`),
};

// Users (admin)
export const userAPI = {
  getAll: () => API.get('/users'),
  toggleStatus: (id) => API.put(`/users/${id}/toggle-status`),
  delete: (id) => API.delete(`/users/${id}`),
};

// Payments
export const paymentAPI = {
  verifyKhalti: (data) => API.post('/payments/khalti/verify', data),
  simulateCard: (data) => API.post('/payments/card/simulate', data),
};

// Image Upload (Cloudinary)
export const uploadAPI = {
  uploadImages: (formData) =>
    API.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
