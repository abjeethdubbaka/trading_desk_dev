import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETUP_TYPES, sanitizeSetupTypes } from '@/components/journal/AddTradeModal/constants/tradeConstants';

const normalizeStrategySteps = (steps) => (
  Array.isArray(steps)
    ? steps.map((step) => String(step ?? '').trim()).filter(Boolean)
    : []
);

const toStrategyStepDraft = (steps) => {
  if (!Array.isArray(steps) || steps.length === 0) return [''];
  return steps.map((step) => String(step ?? ''));
};

const normalizeConfiguredSetupTypes = (setupTypes) => sanitizeSetupTypes(setupTypes, []);

const toStrategySetupDraft = (setupTypes) => {
  const normalized = normalizeConfiguredSetupTypes(setupTypes);
  return normalized.length > 0 ? normalized : [...DEFAULT_SETUP_TYPES];
};

const findMapKeyIgnoreCase = (map, setupName) => {
  if (!map || typeof map !== 'object') return null;
  const normalizedSetup = String(setupName || '').trim().toLowerCase();
  if (!normalizedSetup) return null;

  return Object.keys(map).find((key) => String(key || '').trim().toLowerCase() === normalizedSetup) || null;
};

const getStepsForSetup = (stepsBySetup, setupName, fallback = []) => {
  const matchedKey = findMapKeyIgnoreCase(stepsBySetup, setupName);
  if (!matchedKey) return normalizeStrategySteps(fallback);
  return normalizeStrategySteps(stepsBySetup?.[matchedKey]);
};

const normalizeStepsBySetup = (stepsBySetup, setupTypes, legacySteps = []) => {
  const source = stepsBySetup && typeof stepsBySetup === 'object' && !Array.isArray(stepsBySetup)
    ? stepsBySetup
    : {};

  const result = {};
  setupTypes.forEach((setupType) => {
    result[setupType] = getStepsForSetup(source, setupType, legacySteps);
  });

  return result;
};

const remapStepsBySetupByIndex = (previousSetups, nextSetups, previousMap, legacySteps = []) => {
  const result = {};

  nextSetups.forEach((setupName, index) => {
    const previousSetupName = previousSetups[index];
    const candidateSteps = previousSetupName
      ? getStepsForSetup(previousMap, previousSetupName, legacySteps)
      : legacySteps;

    result[setupName] = normalizeStrategySteps(candidateSteps);
  });

  return result;
};

export function useStrategySettingsDraft({ settings, updateFields }) {
  const [strategySetupsDraft, setStrategySetupsDraft] = useState([...DEFAULT_SETUP_TYPES]);
  const [selectedStrategySetupIndex, setSelectedStrategySetupIndex] = useState(0);
  const [strategyStepsBySetupDraft, setStrategyStepsBySetupDraft] = useState({});
  const [strategyStepsDraft, setStrategyStepsDraft] = useState(['']);
  const [newStrategySetupDraft, setNewStrategySetupDraft] = useState('');

  useEffect(() => {
    const nextSetups = toStrategySetupDraft(settings?.journal_preferences?.default_setup_types);
    const legacySteps = normalizeStrategySteps(settings?.strategy_steps);
    const nextStepsBySetup = normalizeStepsBySetup(
      settings?.strategy_steps_by_setup,
      nextSetups,
      legacySteps
    );

    setStrategySetupsDraft(nextSetups);
    setStrategyStepsBySetupDraft(nextStepsBySetup);
    setSelectedStrategySetupIndex((prev) => Math.min(prev, nextSetups.length - 1));
  }, [
    settings?.journal_preferences?.default_setup_types,
    settings?.strategy_steps,
    settings?.strategy_steps_by_setup,
  ]);

  useEffect(() => {
    const selectedSetupName = strategySetupsDraft[selectedStrategySetupIndex];
    const selectedSteps = selectedSetupName
      ? getStepsForSetup(strategyStepsBySetupDraft, selectedSetupName)
      : [];

    setStrategyStepsDraft(toStrategyStepDraft(selectedSteps));
  }, [selectedStrategySetupIndex, strategyStepsBySetupDraft]);

  const commitStrategySteps = useCallback((steps = strategyStepsDraft) => {
    const selectedSetupName = strategySetupsDraft[selectedStrategySetupIndex];
    if (!selectedSetupName) return;

    const normalized = normalizeStrategySteps(steps);
    const nextStepsBySetup = {
      ...strategyStepsBySetupDraft,
      [selectedSetupName]: normalized,
    };

    updateFields({
      strategy_steps_by_setup: nextStepsBySetup,
      strategy_steps: normalized, // legacy compatibility
    });

    setStrategyStepsBySetupDraft(nextStepsBySetup);
    setStrategyStepsDraft(toStrategyStepDraft(normalized));
  }, [
    selectedStrategySetupIndex,
    strategySetupsDraft,
    strategyStepsBySetupDraft,
    strategyStepsDraft,
    updateFields,
  ]);

  const commitStrategySetups = useCallback((setups = strategySetupsDraft, selectedIndexOverride = null) => {
    const normalized = normalizeConfiguredSetupTypes(setups);
    const savedSetups = toStrategySetupDraft(settings?.journal_preferences?.default_setup_types);
    const safeSetups = normalized.length > 0
      ? normalized
      : savedSetups;

    const currentSelectedSetupName = strategySetupsDraft[selectedStrategySetupIndex];
    const baseStepsBySetup = currentSelectedSetupName
      ? {
          ...strategyStepsBySetupDraft,
          [currentSelectedSetupName]: normalizeStrategySteps(strategyStepsDraft),
        }
      : strategyStepsBySetupDraft;

    const legacySteps = normalizeStrategySteps(settings?.strategy_steps);
    const nextStepsBySetup = remapStepsBySetupByIndex(
      strategySetupsDraft,
      safeSetups,
      baseStepsBySetup,
      legacySteps
    );
    const hasSelectedOverride = Number.isInteger(selectedIndexOverride);
    const nextSelectedIndex = hasSelectedOverride
      ? Math.min(Math.max(selectedIndexOverride, 0), safeSetups.length - 1)
      : Math.min(selectedStrategySetupIndex, safeSetups.length - 1);
    const nextSelectedSetupName = safeSetups[nextSelectedIndex];
    const nextSelectedSteps = getStepsForSetup(nextStepsBySetup, nextSelectedSetupName, legacySteps);

    updateFields({
      journal_preferences: {
        ...(settings?.journal_preferences || {}),
        default_setup_types: safeSetups,
      },
      strategy_steps_by_setup: nextStepsBySetup,
      strategy_steps: nextSelectedSteps, // legacy compatibility
    });

    setStrategySetupsDraft(safeSetups);
    setStrategyStepsBySetupDraft(nextStepsBySetup);
    setSelectedStrategySetupIndex(nextSelectedIndex);
    setStrategyStepsDraft(toStrategyStepDraft(nextSelectedSteps));
  }, [
    selectedStrategySetupIndex,
    settings?.journal_preferences,
    settings?.strategy_steps,
    strategySetupsDraft,
    strategyStepsDraft,
    strategyStepsBySetupDraft,
    updateFields,
  ]);

  const handleStrategySetupSelect = useCallback((value) => {
    const index = Number.parseInt(value, 10);
    if (!Number.isFinite(index)) return;
    commitStrategySteps(strategyStepsDraft);
    setSelectedStrategySetupIndex(index);
  }, [commitStrategySteps, strategyStepsDraft]);

  const handleNewStrategySetupDraftChange = useCallback((value) => {
    setNewStrategySetupDraft(value);
  }, []);

  const handleAddStrategySetup = useCallback(() => {
    const nextSetupName = String(newStrategySetupDraft || '').trim();
    if (!nextSetupName) return;

    const existingIndex = strategySetupsDraft.findIndex(
      (setup) => String(setup || '').trim().toLowerCase() === nextSetupName.toLowerCase()
    );
    if (existingIndex >= 0) {
      setSelectedStrategySetupIndex(existingIndex);
      setNewStrategySetupDraft('');
      return;
    }

    const nextSetups = [...strategySetupsDraft, nextSetupName];
    commitStrategySetups(nextSetups, nextSetups.length - 1);
    setNewStrategySetupDraft('');
  }, [
    commitStrategySetups,
    newStrategySetupDraft,
    strategySetupsDraft,
  ]);

  const handleRemoveStrategySetup = useCallback((index = selectedStrategySetupIndex) => {
    if (strategySetupsDraft.length <= 1) return;

    const nextSetups = strategySetupsDraft.filter((_, setupIndex) => setupIndex !== index);
    const nextSelectedIndex = selectedStrategySetupIndex > index
      ? selectedStrategySetupIndex - 1
      : Math.min(selectedStrategySetupIndex, nextSetups.length - 1);
    const legacySteps = normalizeStrategySteps(settings?.strategy_steps);
    const nextStepsBySetup = remapStepsBySetupByIndex(
      strategySetupsDraft,
      nextSetups,
      strategyStepsBySetupDraft,
      legacySteps
    );
    const nextSelectedSetupName = nextSetups[nextSelectedIndex];
    const nextSelectedSteps = getStepsForSetup(nextStepsBySetup, nextSelectedSetupName, legacySteps);

    updateFields({
      journal_preferences: {
        ...(settings?.journal_preferences || {}),
        default_setup_types: nextSetups,
      },
      strategy_steps_by_setup: nextStepsBySetup,
      strategy_steps: nextSelectedSteps, // legacy compatibility
    });

    setStrategySetupsDraft(nextSetups);
    setStrategyStepsBySetupDraft(nextStepsBySetup);
    setSelectedStrategySetupIndex(nextSelectedIndex);
    setStrategyStepsDraft(toStrategyStepDraft(nextSelectedSteps));
  }, [
    selectedStrategySetupIndex,
    settings?.journal_preferences,
    settings?.strategy_steps,
    strategySetupsDraft,
    strategyStepsBySetupDraft,
    updateFields,
  ]);

  const handleStrategyStepChange = useCallback((index, value) => {
    setStrategyStepsDraft((prev) => prev.map((step, i) => (i === index ? value : step)));
  }, []);

  const handleStrategyStepBlur = useCallback(() => {
    commitStrategySteps();
  }, [commitStrategySteps]);

  const handleAddStrategyStep = useCallback(() => {
    setStrategyStepsDraft((prev) => [...prev, '']);
  }, []);

  const handleRemoveStrategyStep = useCallback((index) => {
    const next = strategyStepsDraft.filter((_, i) => i !== index);
    const safeNext = next.length > 0 ? next : [''];
    setStrategyStepsDraft(safeNext);
    commitStrategySteps(safeNext);
  }, [strategyStepsDraft, commitStrategySteps]);

  const strategyStepCount = useMemo(
    () => normalizeStrategySteps(strategyStepsDraft).length,
    [strategyStepsDraft]
  );

  const strategySetupCount = useMemo(
    () => normalizeConfiguredSetupTypes(strategySetupsDraft).length,
    [strategySetupsDraft]
  );

  const selectedStrategySetupName = strategySetupsDraft[selectedStrategySetupIndex] || '';

  return {
    strategySetupsDraft,
    selectedStrategySetupIndex,
    selectedStrategySetupName,
    handleStrategySetupSelect,
    newStrategySetupDraft,
    handleNewStrategySetupDraftChange,
    handleAddStrategySetup,
    handleRemoveStrategySetup,
    strategySetupCount,
    strategyStepsDraft,
    handleStrategyStepChange,
    handleStrategyStepBlur,
    handleAddStrategyStep,
    handleRemoveStrategyStep,
    strategyStepCount,
  };
}
