import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const useSettings = () => {
  const { data: settings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const firstSettings = settings[0] || null;

  return {
    settings,
    isLoading,
    error,
    firstSettings,
    refetch
  };
};
