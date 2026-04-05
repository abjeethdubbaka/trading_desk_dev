import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETUP_TYPES, sanitizeSetupTypes } from '@/components/journal/AddTradeModal/constants/tradeConstants';

const normalizeStrategyStepGrade = (value) => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!normalized) return '';
  if (normalized === 'A++' || normalized === 'A+' || ['A', 'B', 'C', 'D', 'F'].includes(normalized)) return normalized;
  return normalized;
};

const normalizeRelativeGradeDefinition = (mapping) => {
  if (mapping && typeof mapping === 'object' && !Array.isArray(mapping)) {
    const label = String(mapping.label ?? mapping.step ?? '').trim();
    const grade = normalizeStrategyStepGrade(mapping.grade);
    if (!label && !grade) return null;

    return {
      label,
      grade,
    };
  }

  const label = String(mapping ?? '').trim();
  if (!label) return null;

  return {
    label,
    grade: '',
  };
};

const normalizeRelativeGradeDefinitions = (mappings) => (
  Array.isArray(mappings)
    ? mappings.map((mapping) => normalizeRelativeGradeDefinition(mapping)).filter(Boolean)
    : []
);

const toRelativeGradeDraft = (mappings) => (
  Array.isArray(mappings)
    ? mappings.map((mapping) => {
      if (mapping && typeof mapping === 'object' && !Array.isArray(mapping)) {
        return {
          label: String(mapping.label ?? mapping.step ?? ''),
          grade: normalizeStrategyStepGrade(mapping.grade),
        };
      }

      return {
        label: String(mapping ?? ''),
        grade: '',
      };
    })
    : []
);

const normalizeStrategyStepDefinition = (step) => {
  if (step && typeof step === 'object' && !Array.isArray(step)) {
    const label = String(step.label ?? step.step ?? '').trim();
    if (!label) return null;
    const relativeGrades = normalizeRelativeGradeDefinitions(
      step.relativeGrades
      ?? step.relative_grades
      ?? step.relatedGrades
      ?? step.related_grades
      ?? []
    );

    return {
      label,
      grade: normalizeStrategyStepGrade(step.grade),
      relativeGrades,
    };
  }

  const label = String(step ?? '').trim();
  if (!label) return null;

  return {
    label,
    grade: '',
    relativeGrades: [],
  };
};

const normalizeStrategyStepDefinitions = (steps) => (
  Array.isArray(steps)
    ? steps.map((step) => normalizeStrategyStepDefinition(step)).filter(Boolean)
    : []
);

const toStrategyStepDraft = (steps) => {
  const normalized = normalizeStrategyStepDefinitions(steps);
  if (normalized.length === 0) return [{ label: '', grade: '', relativeGrades: [] }];
  return normalized.map((step) => ({
    label: String(step.label ?? ''),
    grade: String(step.grade ?? ''),
    relativeGrades: normalizeRelativeGradeDefinitions(step.relativeGrades),
  }));
};

const getStrategyStepLabels = (steps) => normalizeStrategyStepDefinitions(steps).map((step) => step.label);
const serializeStepDefinitions = (steps) => JSON.stringify(normalizeStrategyStepDefinitions(steps));

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
  if (!matchedKey) return normalizeStrategyStepDefinitions(fallback);
  return normalizeStrategyStepDefinitions(stepsBySetup?.[matchedKey]);
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

const remapStepsBySetupByName = (nextSetups, previousMap, legacySteps = []) => {
  const result = {};
  const hasPersistedMap = previousMap && typeof previousMap === 'object'
    && !Array.isArray(previousMap)
    && Object.keys(previousMap).length > 0;
  const normalizedLegacySteps = normalizeStrategyStepDefinitions(legacySteps);

  nextSetups.forEach((setupName, index) => {
    if (hasPersistedMap) {
      result[setupName] = getStepsForSetup(previousMap, setupName, []);
      return;
    }

    // Legacy migration path: seed only the first setup with legacy steps.
    result[setupName] = index === 0 ? normalizedLegacySteps : [];
  });

  return result;
};

export function useStrategySettingsDraft({ settings, updateFields }) {
  const [strategySetupsDraft, setStrategySetupsDraft] = useState([...DEFAULT_SETUP_TYPES]);
  const [selectedStrategySetupIndex, setSelectedStrategySetupIndex] = useState(0);
  const [strategyStepsBySetupDraft, setStrategyStepsBySetupDraft] = useState({});
  const [strategyStepsDraft, setStrategyStepsDraft] = useState([{ label: '', grade: '', relativeGrades: [] }]);
  const [newStrategySetupDraft, setNewStrategySetupDraft] = useState('');
  const strategyStepsDraftRef = useRef(strategyStepsDraft);
  const skipLocalSettingsHydrationRef = useRef(false);
  const skipNextDraftSyncRef = useRef(false);

  const syncStrategyStepsDraft = useCallback((steps) => {
    strategyStepsDraftRef.current = steps;
    setStrategyStepsDraft(steps);
  }, []);

  useEffect(() => {
    strategyStepsDraftRef.current = strategyStepsDraft;
  }, [strategyStepsDraft]);

  useEffect(() => {
    if (skipLocalSettingsHydrationRef.current) {
      skipLocalSettingsHydrationRef.current = false;
      return;
    }

    const nextSetups = toStrategySetupDraft(settings?.journal_preferences?.default_setup_types);
    const legacySteps = normalizeStrategyStepDefinitions(settings?.strategy_steps);
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
    if (skipNextDraftSyncRef.current) {
      skipNextDraftSyncRef.current = false;
      return;
    }

    const selectedSetupName = strategySetupsDraft[selectedStrategySetupIndex];
    const selectedSteps = selectedSetupName
      ? getStepsForSetup(strategyStepsBySetupDraft, selectedSetupName)
      : [];

    syncStrategyStepsDraft(toStrategyStepDraft(selectedSteps));
  }, [selectedStrategySetupIndex, strategyStepsBySetupDraft, strategySetupsDraft, syncStrategyStepsDraft]);

  const commitStrategySteps = useCallback((steps = null) => {
    const selectedSetupName = strategySetupsDraft[selectedStrategySetupIndex];
    if (!selectedSetupName) return;

    const sourceSteps = Array.isArray(steps) ? steps : strategyStepsDraftRef.current;
    const normalized = normalizeStrategyStepDefinitions(sourceSteps);
    const nextStepsBySetup = {
      ...strategyStepsBySetupDraft,
      [selectedSetupName]: normalized,
    };

    skipLocalSettingsHydrationRef.current = true;
    updateFields({
      strategy_steps_by_setup: nextStepsBySetup,
      strategy_steps: getStrategyStepLabels(normalized), // legacy compatibility
    });

    skipNextDraftSyncRef.current = true;
    setStrategyStepsBySetupDraft(nextStepsBySetup);
  }, [
    selectedStrategySetupIndex,
    strategySetupsDraft,
    strategyStepsBySetupDraft,
    syncStrategyStepsDraft,
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
          [currentSelectedSetupName]: normalizeStrategyStepDefinitions(strategyStepsDraftRef.current),
        }
      : strategyStepsBySetupDraft;

    const legacySteps = normalizeStrategyStepDefinitions(settings?.strategy_steps);
    const nextStepsBySetup = remapStepsBySetupByName(safeSetups, baseStepsBySetup, legacySteps);
    const hasSelectedOverride = Number.isInteger(selectedIndexOverride);
    const nextSelectedIndex = hasSelectedOverride
      ? Math.min(Math.max(selectedIndexOverride, 0), safeSetups.length - 1)
      : Math.min(selectedStrategySetupIndex, safeSetups.length - 1);
    const nextSelectedSetupName = safeSetups[nextSelectedIndex];
    const nextSelectedSteps = getStepsForSetup(nextStepsBySetup, nextSelectedSetupName, legacySteps);

    skipLocalSettingsHydrationRef.current = true;
    updateFields({
      journal_preferences: {
        ...(settings?.journal_preferences || {}),
        default_setup_types: safeSetups,
      },
      strategy_steps_by_setup: nextStepsBySetup,
      strategy_steps: getStrategyStepLabels(nextSelectedSteps), // legacy compatibility
    });

    setStrategySetupsDraft(safeSetups);
    skipNextDraftSyncRef.current = true;
    setStrategyStepsBySetupDraft(nextStepsBySetup);
    setSelectedStrategySetupIndex(nextSelectedIndex);
    syncStrategyStepsDraft(toStrategyStepDraft(nextSelectedSteps));
  }, [
    selectedStrategySetupIndex,
    settings?.journal_preferences,
    settings?.strategy_steps,
    strategySetupsDraft,
    strategyStepsBySetupDraft,
    syncStrategyStepsDraft,
    updateFields,
  ]);

  const handleStrategySetupSelect = useCallback((value) => {
    const index = Number.parseInt(value, 10);
    if (!Number.isFinite(index)) return;
    commitStrategySteps();
    setSelectedStrategySetupIndex(index);
  }, [commitStrategySteps]);

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
    const legacySteps = normalizeStrategyStepDefinitions(settings?.strategy_steps);
    const currentSelectedSetupName = strategySetupsDraft[selectedStrategySetupIndex];
    const baseStepsBySetup = currentSelectedSetupName
      ? {
          ...strategyStepsBySetupDraft,
          [currentSelectedSetupName]: normalizeStrategyStepDefinitions(strategyStepsDraftRef.current),
        }
      : strategyStepsBySetupDraft;
    const nextStepsBySetup = remapStepsBySetupByName(nextSetups, baseStepsBySetup, legacySteps);
    const nextSelectedSetupName = nextSetups[nextSelectedIndex];
    const nextSelectedSteps = getStepsForSetup(nextStepsBySetup, nextSelectedSetupName, legacySteps);

    skipLocalSettingsHydrationRef.current = true;
    updateFields({
      journal_preferences: {
        ...(settings?.journal_preferences || {}),
        default_setup_types: nextSetups,
      },
      strategy_steps_by_setup: nextStepsBySetup,
      strategy_steps: getStrategyStepLabels(nextSelectedSteps), // legacy compatibility
    });

    setStrategySetupsDraft(nextSetups);
    skipNextDraftSyncRef.current = true;
    setStrategyStepsBySetupDraft(nextStepsBySetup);
    setSelectedStrategySetupIndex(nextSelectedIndex);
    syncStrategyStepsDraft(toStrategyStepDraft(nextSelectedSteps));
  }, [
    selectedStrategySetupIndex,
    settings?.journal_preferences,
    settings?.strategy_steps,
    strategySetupsDraft,
    strategyStepsBySetupDraft,
    syncStrategyStepsDraft,
    updateFields,
  ]);

  const handleStrategyStepChange = useCallback((index, value, field = 'label') => {
    const currentSteps = Array.isArray(strategyStepsDraftRef.current) && strategyStepsDraftRef.current.length > 0
      ? strategyStepsDraftRef.current
      : [{ label: '', grade: '', relativeGrades: [] }];
    const nextSteps = currentSteps.map((step, i) => {
      if (i !== index) return step;

      const normalizedStep = step && typeof step === 'object' && !Array.isArray(step)
        ? step
        : { label: String(step ?? ''), grade: '', relativeGrades: [] };

      if (field === 'grade') {
        return {
          ...normalizedStep,
          grade: normalizeStrategyStepGrade(value),
        };
      }

      return {
        ...normalizedStep,
        label: value,
      };
    });

    syncStrategyStepsDraft(nextSteps);
  }, [syncStrategyStepsDraft]);

  const handleStrategyStepBlur = useCallback(() => {
    commitStrategySteps();
  }, [commitStrategySteps]);

  const handleAddStrategyStep = useCallback(() => {
    const currentSteps = Array.isArray(strategyStepsDraftRef.current) && strategyStepsDraftRef.current.length > 0
      ? strategyStepsDraftRef.current
      : [{ label: '', grade: '', relativeGrades: [] }];
    syncStrategyStepsDraft([...currentSteps, { label: '', grade: '', relativeGrades: [] }]);
  }, [syncStrategyStepsDraft]);

  const handleRemoveStrategyStep = useCallback((index) => {
    const currentSteps = Array.isArray(strategyStepsDraftRef.current)
      ? strategyStepsDraftRef.current
      : [];
    const next = currentSteps.filter((_, i) => i !== index);
    const safeNext = next.length > 0 ? next : [{ label: '', grade: '', relativeGrades: [] }];
    syncStrategyStepsDraft(safeNext);
    commitStrategySteps(safeNext);
  }, [commitStrategySteps, syncStrategyStepsDraft]);

  const handleStrategyRelativeGradeChange = useCallback((stepIndex, mappingIndex, value, field = 'label') => {
    const currentSteps = Array.isArray(strategyStepsDraftRef.current) && strategyStepsDraftRef.current.length > 0
      ? strategyStepsDraftRef.current
      : [{ label: '', grade: '', relativeGrades: [] }];

    const nextSteps = currentSteps.map((step, currentStepIndex) => {
      if (currentStepIndex !== stepIndex) return step;

      const normalizedStep = step && typeof step === 'object' && !Array.isArray(step)
        ? step
        : { label: String(step ?? ''), grade: '', relativeGrades: [] };
      const relativeGrades = toRelativeGradeDraft(normalizedStep.relativeGrades);
      const nextRelativeGrades = relativeGrades.map((mapping, currentMappingIndex) => {
        if (currentMappingIndex !== mappingIndex) return mapping;
        if (field === 'grade') {
          return {
            ...mapping,
            grade: normalizeStrategyStepGrade(value),
          };
        }

        return {
          ...mapping,
          label: value,
        };
      });

      return {
        ...normalizedStep,
        relativeGrades: nextRelativeGrades,
      };
    });

    syncStrategyStepsDraft(nextSteps);
  }, [syncStrategyStepsDraft]);

  const handleAddStrategyRelativeGrade = useCallback((stepIndex) => {
    const currentSteps = Array.isArray(strategyStepsDraftRef.current) && strategyStepsDraftRef.current.length > 0
      ? strategyStepsDraftRef.current
      : [{ label: '', grade: '', relativeGrades: [] }];

    const nextSteps = currentSteps.map((step, currentStepIndex) => {
      if (currentStepIndex !== stepIndex) return step;

      const normalizedStep = step && typeof step === 'object' && !Array.isArray(step)
        ? step
        : { label: String(step ?? ''), grade: '', relativeGrades: [] };
      const relativeGrades = toRelativeGradeDraft(normalizedStep.relativeGrades);

      return {
        ...normalizedStep,
        relativeGrades: [...relativeGrades, { label: '', grade: '' }],
      };
    });

    syncStrategyStepsDraft(nextSteps);
  }, [syncStrategyStepsDraft]);

  const handleRemoveStrategyRelativeGrade = useCallback((stepIndex, mappingIndex) => {
    const currentSteps = Array.isArray(strategyStepsDraftRef.current) && strategyStepsDraftRef.current.length > 0
      ? strategyStepsDraftRef.current
      : [{ label: '', grade: '', relativeGrades: [] }];

    const nextSteps = currentSteps.map((step, currentStepIndex) => {
      if (currentStepIndex !== stepIndex) return step;

      const normalizedStep = step && typeof step === 'object' && !Array.isArray(step)
        ? step
        : { label: String(step ?? ''), grade: '', relativeGrades: [] };
      const relativeGrades = toRelativeGradeDraft(normalizedStep.relativeGrades);

      return {
        ...normalizedStep,
        relativeGrades: relativeGrades.filter((_, currentMappingIndex) => currentMappingIndex !== mappingIndex),
      };
    });

    syncStrategyStepsDraft(nextSteps);
  }, [syncStrategyStepsDraft]);

  const flushStrategyStepDraft = useCallback(() => {
    commitStrategySteps(strategyStepsDraftRef.current);
  }, [commitStrategySteps]);

  const strategyStepCount = useMemo(
    () => normalizeStrategyStepDefinitions(strategyStepsDraft).length,
    [strategyStepsDraft]
  );

  const strategySetupCount = useMemo(
    () => normalizeConfiguredSetupTypes(strategySetupsDraft).length,
    [strategySetupsDraft]
  );

  const selectedStrategySetupName = strategySetupsDraft[selectedStrategySetupIndex] || '';
  const hasLocalStepDraftChanges = useMemo(() => {
    if (!selectedStrategySetupName) return false;

    const persistedSteps = getStepsForSetup(strategyStepsBySetupDraft, selectedStrategySetupName);
    return serializeStepDefinitions(strategyStepsDraft) !== serializeStepDefinitions(persistedSteps);
  }, [
    selectedStrategySetupName,
    strategyStepsBySetupDraft,
    strategyStepsDraft,
  ]);

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
    handleStrategyRelativeGradeChange,
    handleAddStrategyRelativeGrade,
    handleRemoveStrategyRelativeGrade,
    flushStrategyStepDraft,
    hasLocalStepDraftChanges,
    strategyStepCount,
  };
}
