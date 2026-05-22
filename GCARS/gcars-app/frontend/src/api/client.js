import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gcars_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors — do NOT hard-redirect on 401 (causes loops)
// The AuthContext / PrivateRoute handles unauthenticated state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear credentials — let React Router handle the redirect via PrivateRoute
      const token = localStorage.getItem('gcars_token');
      if (token) {
        localStorage.removeItem('gcars_token');
        localStorage.removeItem('gcars_user');
        // Soft reload only if we're not already on login
        if (!window.location.pathname.includes('/login')) {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
