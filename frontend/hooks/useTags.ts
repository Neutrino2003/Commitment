import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Tag } from '@/lib/types';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export function useTags() {
    return useQuery({
        queryKey: ['tags'],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<Tag>>('/tags/');
            return data.results || data;
        },
    });
}

export function useTagMutations() {
    const queryClient = useQueryClient();

    const createTag = useMutation({
        mutationFn: async (tagData: Partial<Tag>) => {
            const { data } = await api.post<Tag>('/tags/', tagData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });

    const updateTag = useMutation({
        mutationFn: async ({ id, ...tagData }: Partial<Tag> & { id: number }) => {
            const { data } = await api.patch<Tag>(`/tags/${id}/`, tagData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });

    const deleteTag = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/tags/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    return { createTag, updateTag, deleteTag };
}
