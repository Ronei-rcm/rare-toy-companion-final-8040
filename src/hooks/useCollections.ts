import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollections, reorderCollections, createCollection as apiCreate, updateCollection as apiUpdate, deleteCollection as apiDelete } from '../api/collections-api';

export function useCollections() {
  const qc = useQueryClient();
  const state = (window as any).__collectionsState || ((window as any).__collectionsState = { page: 1, pageSize: 12, q: '' });

  const query = useQuery({
    queryKey: ['collections', state.page, state.pageSize, state.q],
    queryFn: () => getCollections({ page: state.page, pageSize: state.pageSize, q: state.q, sort: 'nome', order: 'ASC', withMeta: true }),
    keepPreviousData: true,
  });

  const mutateReorder = useMutation({
    mutationFn: (ids: string[]) => reorderCollections(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collections'] }),
  });

  return {
    collections: (query.data as any)?.items ?? (query.data as any) ?? [],
    page: (query.data as any)?.page ?? state.page,
    pageSize: (query.data as any)?.pageSize ?? state.pageSize,
    total: (query.data as any)?.total ?? 0,
    hasMore: (query.data as any)?.hasMore ?? false,
    loading: query.isLoading,
    error: (query.error as any)?.message ?? null,
    refetch: () => query.refetch(),
    setPage: (p: number) => { state.page = p; qc.invalidateQueries({ queryKey: ['collections'] }); },
    setQuery: (s: string) => { state.q = s; state.page = 1; qc.invalidateQueries({ queryKey: ['collections'] }); },
    reorderCollections: mutateReorder.mutateAsync,
    createCollection: async (data: any) => {
      const created = await apiCreate(data);
      qc.invalidateQueries({ queryKey: ['collections'] });
      return created;
    },
    updateCollection: async (id: string, data: any) => {
      const updated = await apiUpdate(id, data);
      qc.invalidateQueries({ queryKey: ['collections'] });
      return updated;
    },
    deleteCollection: async (id: string) => {
      await apiDelete(id);
      qc.invalidateQueries({ queryKey: ['collections'] });
    },
  };
}

export default useCollections;