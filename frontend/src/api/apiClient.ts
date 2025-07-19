import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/';

const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Attach the access token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // your access token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and not retry yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh token API
        const refreshToken = localStorage.getItem('refresh_token'); // get refresh token
        if (!refreshToken) {
          // No refresh token, redirect to login or logout user
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${BASE_URL}token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        // Update token in localStorage
        localStorage.setItem('token', newAccessToken);

        // Update Authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
