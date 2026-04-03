import { useCallback, useMemo, useState } from 'react';

const PERCENT_FIELDS = new Set(['position_sizing_percent', 'default_stop_loss_percent']);

export const SETTINGS_INPUT_FIELDS = [
  'account_size',
  'target_profit_dollars',
  'max_dollars',
  'position_sizing_percent',
  'default_stop_loss_percent',
  'risk_amount',
  'analysis_timer_seconds',
];

export function useSettingsFieldDrafts({ settings, updateFields }) {
  const [draftValues, setDraftValues] = useState({});

  const hasLocalDraftChanges = useMemo(
    () => Object.keys(draftValues).length > 0,
    [draftValues]
  );

  const toPersistedValue = useCallback((field, rawValue) => {
    if (PERCENT_FIELDS.has(field)) {
      const percentValue = parseFloat(rawValue);
      return Number.isFinite(percentValue) ? percentValue / 100 : 0;
    }

    if (rawValue === '') return 0;
    const parsed = parseFloat(rawValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  const getDisplayValue = useCallback((field, fallback = '') => {
    if (Object.prototype.hasOwnProperty.call(draftValues, field)) {
      return draftValues[field];
    }

    const raw = settings?.[field];
    if (field === 'position_sizing_percent') {
      const numericRaw = raw == null ? NaN : Number(raw);
      return String((Number.isFinite(numericRaw) ? numericRaw : 0.01) * 100);
    }
    if (field === 'default_stop_loss_percent') {
      const numericRaw = raw == null ? NaN : Number(raw);
      return String((Number.isFinite(numericRaw) ? numericRaw : 0.04) * 100);
    }

    return raw == null ? fallback : String(raw);
  }, [draftValues, settings]);

  const handleFieldChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setDraftValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const commitDraftFields = useCallback((fields) => {
    const updates = {};

    fields.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(draftValues, field)) return;
      updates[field] = toPersistedValue(field, draftValues[field]);
    });

    if (Object.keys(updates).length === 0) return;

    updateFields(updates);
    setDraftValues((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        delete next[field];
      });
      return next;
    });
  }, [draftValues, toPersistedValue, updateFields]);

  const commitDraftField = useCallback((field) => {
    commitDraftFields([field]);
  }, [commitDraftFields]);

  const riskMeterSettings = useMemo(() => ({
    ...settings,
    position_sizing_percent: toPersistedValue(
      'position_sizing_percent',
      getDisplayValue('position_sizing_percent', '1')
    ),
    default_stop_loss_percent: toPersistedValue(
      'default_stop_loss_percent',
      getDisplayValue('default_stop_loss_percent', '4')
    ),
  }), [settings, getDisplayValue, toPersistedValue]);

  return {
    hasLocalDraftChanges,
    getDisplayValue,
    handleFieldChange,
    commitDraftField,
    commitDraftFields,
    riskMeterSettings,
  };
}

