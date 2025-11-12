import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem("access_token", access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  }) => {
    const response = await api.post("/auth/register/", data);
    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
    }
    return response.data;
  },

  login: async (username: string, password: string) => {
    const response = await api.post("/token/", { username, password });
    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
    }
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      await api.post("/logout/", { refresh_token: refreshToken });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  },
};

// Profile API
export const profileAPI = {
  get: () => api.get("/profile/"),
  update: (data: any) => api.patch("/profile/update_profile/", data),
  changePassword: (data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => api.post("/profile/change_password/", data),
};

// Contracts/Commitments API
export const contractsAPI = {
  list: () => api.get("/contracts/"),
  get: (id: number) => api.get(`/contracts/${id}/`),
  create: (data: any) => api.post("/contracts/", data),
  update: (id: number, data: any) => api.patch(`/contracts/${id}/`, data),
  delete: (id: number) => api.delete(`/contracts/${id}/`),

  // Actions
  activate: (id: number) => api.post(`/contracts/${id}/activate/`),
  pause: (id: number) => api.post(`/contracts/${id}/pause/`),
  resume: (id: number) => api.post(`/contracts/${id}/resume/`),
  cancel: (id: number) => api.post(`/contracts/${id}/cancel/`),
  markCompleted: (id: number, data: any) =>
    api.post(`/contracts/${id}/mark_completed/`, data),
  markFailed: (id: number, data: any) =>
    api.post(`/contracts/${id}/mark_failed/`, data),
  flagComplaint: (id: number, complaint: string) =>
    api.post(`/contracts/${id}/flag_complaint/`, { complaint_text: complaint }),

  // Filters
  active: () => api.get("/contracts/active/"),
  overdue: () => api.get("/contracts/overdue/"),
  completed: () => api.get("/contracts/completed/"),
  failed: () => api.get("/contracts/failed/"),
  statistics: () => api.get("/contracts/statistics/"),
};

export default api;
