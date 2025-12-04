import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Task } from '@/lib/types';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export function useTasks() {
    return useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<Task>>('/tasks/');
            return data.results; // Extract results array from paginated response
        },
    });
}

export function useTaskMutations() {
    const queryClient = useQueryClient();

    const createTask = useMutation({
        mutationFn: async (taskData: Partial<Task>) => {
            const { data } = await api.post<Task>('/tasks/', taskData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const updateTask = useMutation({
        mutationFn: async ({ id, ...taskData }: Partial<Task> & { id: number }) => {
            const { data } = await api.patch<Task>(`/tasks/${id}/`, taskData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const deleteTask = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/tasks/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const completeTask = useMutation({
        mutationFn: async (id: number) => {
            await api.patch(`/tasks/${id}/`, { status: 'COMPLETED' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    return { createTask, updateTask, deleteTask, completeTask };
}
