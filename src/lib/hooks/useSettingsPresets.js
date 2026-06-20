import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

const KEY = ['settingsPresets'];

export function useSettingsPresets() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => db.settingsPresets.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSettingsPresetsMutations() {
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: (data) => db.settingsPresets.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: (id) => db.settingsPresets.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return { save, remove };
}
