import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Habit, HabitLog } from '@/lib/types';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export function useHabits() {
    return useQuery({
        queryKey: ['habits'],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<Habit>>('/habits/');
            return data.results || data; // Handle both paginated and non-paginated responses
        },
    });
}

export function useHabitMutations() {
    const queryClient = useQueryClient();

    const createHabit = useMutation({
        mutationFn: async (habitData: Partial<Habit>) => {
            const { data } = await api.post<Habit>('/habits/', habitData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
        },
    });

    const updateHabit = useMutation({
        mutationFn: async ({ id, ...habitData }: Partial<Habit> & { id: number }) => {
            const { data } = await api.patch<Habit>(`/habits/${id}/`, habitData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
        },
    });

    const deleteHabit = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/habits/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
        },
    });

    const logCompletion = useMutation({
        mutationFn: async (logData: { habit: number; date: string; completed: boolean; notes?: string }) => {
            const { data } = await api.post<HabitLog>('/habit-logs/', logData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
        },
    });

    return { createHabit, updateHabit, deleteHabit, logCompletion };
}
