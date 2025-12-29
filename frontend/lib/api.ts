import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor for JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                        refresh: refreshToken
                    });

                    const { access } = response.data;
                    localStorage.setItem('accessToken', access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// ============================================================================
// AUTH API
// ============================================================================
export const authApi = {
    login: (username: string, password: string) =>
        api.post('/auth/login/', { username, password }),

    register: (data: { username: string; email: string; password: string; password2: string }) =>
        api.post('/auth/register/', data),

    getProfile: () => api.get('/auth/profile/'),

    updateProfile: (data: any) => api.patch('/auth/profile/', data),

    refreshToken: (refreshToken: string) =>
        api.post('/auth/token/refresh/', { refresh: refreshToken }),

    // Google OAuth
    getGoogleAuthUrl: () => api.get('/auth/google/'),

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('accessToken');
    },

    setTokens: (access: string, refresh: string) => {
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
    }
};

// ============================================================================
// TASKS API
// ============================================================================
export const tasksApi = {
    getAll: () => api.get('/tasks/'),
    get: (id: number) => api.get(`/tasks/${id}/`),
    create: (data: any) => api.post('/tasks/', data),
    update: (id: number, data: any) => api.patch(`/tasks/${id}/`, data),
    delete: (id: number) => api.delete(`/tasks/${id}/`),

    getTree: () => api.get('/tasks/tree/'),
    completeRecurring: (id: number) => api.post(`/tasks/${id}/complete_recurring/`),
    reorder: (orders: { id: number; order: number }[]) => api.post('/tasks/reorder/', orders),
};

// ============================================================================
// LISTS API
// ============================================================================
export const listsApi = {
    getAll: () => api.get('/lists/'),
    get: (id: number) => api.get(`/lists/${id}/`),
    create: (data: any) => api.post('/lists/', data),
    update: (id: number, data: any) => api.patch(`/lists/${id}/`, data),
    delete: (id: number) => api.delete(`/lists/${id}/`),
};

// ============================================================================
// TAGS API
// ============================================================================
export const tagsApi = {
    getAll: () => api.get('/tags/'),
    get: (id: number) => api.get(`/tags/${id}/`),
    create: (data: any) => api.post('/tags/', data),
    update: (id: number, data: any) => api.patch(`/tags/${id}/`, data),
    delete: (id: number) => api.delete(`/tags/${id}/`),
};

// ============================================================================
// HABITS API
// ============================================================================
export const habitsApi = {
    getAll: () => api.get('/habits/'),
    get: (id: number) => api.get(`/habits/${id}/`),
    create: (data: any) => api.post('/habits/', data),
    update: (id: number, data: any) => api.patch(`/habits/${id}/`, data),
    delete: (id: number) => api.delete(`/habits/${id}/`),
};

// ============================================================================
// HABIT LOGS API
// ============================================================================
export const habitLogsApi = {
    getAll: () => api.get('/habit-logs/'),
    create: (data: any) => api.post('/habit-logs/', data),
    update: (id: number, data: any) => api.patch(`/habit-logs/${id}/`, data),
};

// ============================================================================
// COMMITMENTS API
// ============================================================================
export const commitmentsApi = {
    getAll: () => api.get('/commitments/'),
    get: (id: number) => api.get(`/commitments/${id}/`),
    create: (data: any) => api.post('/commitments/', data),
    update: (id: number, data: any) => api.patch(`/commitments/${id}/`, data),
    delete: (id: number) => api.delete(`/commitments/${id}/`),

    getDashboard: () => api.get('/commitments/dashboard/'),

    activate: (id: number) => api.post(`/commitments/${id}/activate/`),
    submitEvidence: (id: number, formData: FormData) => api.post(`/commitments/${id}/submit_evidence/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    complete: (id: number) => api.post(`/commitments/${id}/complete/`),
    fail: (id: number, reason: string) => api.post(`/commitments/${id}/fail/`, { reason }),
    pause: (id: number) => api.post(`/commitments/${id}/pause/`),
    resume: (id: number) => api.post(`/commitments/${id}/resume/`),
    cancel: (id: number) => api.post(`/commitments/${id}/cancel/`),
};

// ============================================================================
// COMPLAINTS API
// ============================================================================
export const complaintsApi = {
    getAll: () => api.get('/complaints/'),
    create: (data: FormData) => api.post('/complaints/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    get: (id: number) => api.get(`/complaints/${id}/`),
};

// ============================================================================
// TASK ATTACHMENTS API
// ============================================================================
export const taskAttachmentsApi = {
    getAll: () => api.get('/task-attachments/'),
    getForTask: (taskId: number) => api.get(`/task-attachments/for_task/?task_id=${taskId}`),
    get: (id: number) => api.get(`/task-attachments/${id}/`),

    upload: (taskId: number, file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('task', taskId.toString());
        formData.append('file', file);

        return api.post('/task-attachments/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            }
        });
    },

    delete: (id: number) => api.delete(`/task-attachments/${id}/`),
};

// ============================================================================
// COMMITMENT ATTACHMENTS API
// ============================================================================
export const commitmentAttachmentsApi = {
    getAll: () => api.get('/commitment-attachments/'),
    getForCommitment: (commitmentId: number) =>
        api.get(`/commitment-attachments/for_commitment/?commitment_id=${commitmentId}`),
    get: (id: number) => api.get(`/commitment-attachments/${id}/`),

    upload: (
        commitmentId: number,
        file: File,
        attachmentType: 'evidence' | 'document' | 'other' = 'evidence',
        description: string = '',
        onProgress?: (progress: number) => void
    ) => {
        const formData = new FormData();
        formData.append('commitment', commitmentId.toString());
        formData.append('file', file);
        formData.append('attachment_type', attachmentType);
        if (description) {
            formData.append('description', description);
        }

        return api.post('/commitment-attachments/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            }
        });
    },

    delete: (id: number) => api.delete(`/commitment-attachments/${id}/`),
};

// ============================================================================
// SYNC API
// ============================================================================
export const syncApi = {
    getAll: () => api.get('/sync/'),
};

// ============================================================================
// CALENDAR API
// ============================================================================
export const calendarApi = {
    getByDateRange: (startDate: string, endDate: string) =>
        api.get('/calendar/', { params: { start_date: startDate, end_date: endDate } }),
};

export default api;

