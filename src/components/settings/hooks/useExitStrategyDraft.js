import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_EXIT_LEVELS, normalizeExitStrategyLevels } from '@/components/settings/exitStrategy';

export function useExitStrategyDraft({ settings, updateFields }) {
  const [exitDraft, setExitDraft] = useState(
    DEFAULT_EXIT_LEVELS.map((level) => ({
      r: String(level.r),
      percent: String(level.percent),
      trailingStop: Boolean(level.trailingStop),
    }))
  );

  useEffect(() => {
    const normalized = normalizeExitStrategyLevels(settings?.exit_strategy?.levels);
    setExitDraft(
      normalized.map((level) => ({
        r: String(level.r),
        percent: String(level.percent),
        trailingStop: Boolean(level.trailingStop),
      }))
    );
  }, [settings?.exit_strategy]);

  const commitExitDraft = useCallback((levels = exitDraft) => {
    const normalized = normalizeExitStrategyLevels(
      levels.map((level) => ({
        r: level.r,
        percent: level.percent,
        trailingStop: level.trailingStop,
      }))
    );

    updateFields({
      exit_strategy: {
        levels: normalized.map((level) => ({
          r: Number(level.r),
          percent: Number(level.percent),
          trailingStop: Boolean(level.trailingStop),
        })),
      },
    });

    setExitDraft(
      normalized.map((level) => ({
        r: String(level.r),
        percent: String(level.percent),
        trailingStop: Boolean(level.trailingStop),
      }))
    );
  }, [exitDraft, updateFields]);

  const handleExitFieldChange = useCallback((index, field, value) => {
    setExitDraft((prev) => prev.map((level, i) => (
      i === index ? { ...level, [field]: value } : level
    )));
  }, []);

  const handleExitFieldBlur = useCallback(() => {
    commitExitDraft();
  }, [commitExitDraft]);

  const handleExitTrailingToggle = useCallback((index, checked) => {
    const next = exitDraft.map((level, i) => (
      i === index ? { ...level, trailingStop: checked } : level
    ));
    setExitDraft(next);
    commitExitDraft(next);
  }, [exitDraft, commitExitDraft]);

  const handleAddExitLevel = useCallback(() => {
    const lastR = Number(exitDraft[exitDraft.length - 1]?.r);
    const nextR = Number.isFinite(lastR) && lastR > 0 ? (lastR + 1) : (exitDraft.length + 1);
    const next = [
      ...exitDraft,
      { r: String(nextR), percent: '10', trailingStop: false },
    ];
    setExitDraft(next);
    commitExitDraft(next);
  }, [exitDraft, commitExitDraft]);

  const handleRemoveExitLevel = useCallback((index) => {
    if (exitDraft.length <= 1) return;
    const next = exitDraft.filter((_, i) => i !== index);
    setExitDraft(next);
    commitExitDraft(next);
  }, [exitDraft, commitExitDraft]);

  const exitPercentTotal = useMemo(
    () => exitDraft.reduce((sum, level) => sum + (Number(level.percent) || 0), 0),
    [exitDraft]
  );

  return {
    exitDraft,
    handleAddExitLevel,
    handleRemoveExitLevel,
    handleExitFieldChange,
    handleExitFieldBlur,
    handleExitTrailingToggle,
    exitPercentTotal,
  };
}

