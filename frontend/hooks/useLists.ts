import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { List } from '@/lib/types';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export function useLists() {
    return useQuery({
        queryKey: ['lists'],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<List>>('/lists/');
            return data.results || data;
        },
    });
}

export function useListMutations() {
    const queryClient = useQueryClient();

    const createList = useMutation({
        mutationFn: async (listData: Partial<List>) => {
            const { data } = await api.post<List>('/lists/', listData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
        },
    });

    const updateList = useMutation({
        mutationFn: async ({ id, ...listData }: Partial<List> & { id: number }) => {
            const { data } = await api.patch<List>(`/lists/${id}/`, listData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
        },
    });

    const deleteList = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/lists/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    return { createList, updateList, deleteList };
}
