import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
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

export const complaintsApi = {
    getAll: () => api.get('/complaints/'),
    create: (data: FormData) => api.post('/complaints/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    get: (id: number) => api.get(`/complaints/${id}/`),
};

export default api;
