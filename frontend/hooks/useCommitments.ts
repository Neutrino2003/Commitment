import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commitmentsApi } from '@/lib/api';

export function useCommitments() {
    return useQuery({
        queryKey: ['commitments'],
        queryFn: async () => {
            const response = await commitmentsApi.getAll();
            return response.data;
        }
    });
}

export function useCommitmentMutations() {
    const queryClient = useQueryClient();

    const createCommitment = useMutation({
        mutationFn: async (data: any) => {
            const response = await commitmentsApi.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commitments'] });
        },
    });

    const updateCommitment = useMutation({
        mutationFn: async ({ id, ...data }: { id: number } & any) => {
            const response = await commitmentsApi.update(id, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commitments'] });
        },
    });

    const deleteCommitment = useMutation({
        mutationFn: async (id: number) => {
            await commitmentsApi.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commitments'] });
        },
    });

    return { createCommitment, updateCommitment, deleteCommitment };
}
