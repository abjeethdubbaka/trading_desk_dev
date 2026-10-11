import { useState, useCallback } from 'react';
import { JournalPresetsService } from '@/lib/services/JournalPresetsService';

export function useJournalPresets() {
  const [presets, setPresets] = useState(() => JournalPresetsService.getAll());

  const applyPreset = useCallback((id, applyFilters) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    applyFilters(preset.filters);
  }, [presets]);

  const savePreset = useCallback((name, currentFilters) => {
    const updated = JournalPresetsService.save(name, currentFilters);
    setPresets([...JournalPresetsService.getAll()]);
    return updated;
  }, []);

  const deletePreset = useCallback((id) => {
    JournalPresetsService.delete(id);
    setPresets(JournalPresetsService.getAll());
  }, []);

  const setDefaultPreset = useCallback((id) => {
    JournalPresetsService.setDefault(id);
    setPresets(JournalPresetsService.getAll());
  }, []);

  const getDefaultPreset = useCallback(() => JournalPresetsService.getDefault(), []);

  return {
    presets,
    applyPreset,
    savePreset,
    deletePreset,
    setDefaultPreset,
    getDefaultPreset,
  };
}
