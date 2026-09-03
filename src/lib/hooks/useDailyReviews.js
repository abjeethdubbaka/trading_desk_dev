import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

const QUERY_KEY = ['daily-reviews'];

export function useDailyReviews() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => db.dailyReviews.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDailyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => db.dailyReviews.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateDailyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => db.dailyReviews.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteDailyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => db.dailyReviews.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
