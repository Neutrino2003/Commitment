import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commitmentsApi } from "@/lib/api";
import { Commitment } from "@/lib/types";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function useCommitments() {
  return useQuery({
    queryKey: ["commitments"],
    queryFn: async () => {
      const response = await commitmentsApi.getAll();
      const data = response.data as PaginatedResponse<Commitment>;
      return data.results; // Extract results array from paginated response
    },
  });
}

export function useCommitmentMutations() {
  const queryClient = useQueryClient();

  const createCommitment = useMutation({
    mutationFn: async (data: Partial<Commitment>) => {
      const response = await commitmentsApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
    },
  });

  const updateCommitment = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: number } & Partial<Commitment>) => {
      const response = await commitmentsApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
    },
  });

  const deleteCommitment = useMutation({
    mutationFn: async (id: number) => {
      await commitmentsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
    },
  });

  return { createCommitment, updateCommitment, deleteCommitment };
}
