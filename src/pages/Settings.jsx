/**
 * @file src/pages/Settings.jsx
 *
 * Phase 2 - wired to useSettings() (Firebase, debounced auto-save).
 * Cleaner UI with a sync status indicator.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/lib/context/SettingsContext';
import { useAuth } from '@/lib/context/AuthContext';
import { createSettingsService } from '@/lib/services/SettingsService.js';
import { db } from '@/lib/db';
import FloatCategoriesSettings from '@/components/settings/FloatCategoriesSettings';
import FloatTargetSettings from '@/components/settings/FloatTargetSettings';
import SettingsHeader from '@/components/settings/SettingsHeader';
import AccountSettingsTab from '@/components/settings/AccountSettingsTab';
import RiskSettingsTab from '@/components/settings/RiskSettingsTab';
import DataManagementTab from '@/components/settings/DataManagementTab';
import { DEFAULT_EXIT_LEVELS, normalizeExitStrategyLevels } from '@/components/settings/exitStrategy';
import { toast } from 'sonner';

const settingsService = createSettingsService(db);
const PERCENT_FIELDS = new Set(['position_sizing_percent', 'default_stop_loss_percent']);
const INPUT_FIELDS = [
  'account_size',
  'target_profit_dollars',
  'max_dollars',
  'position_sizing_percent',
  'default_stop_loss_percent',
  'risk_amount',
];

export default function SettingsPage() {
  const { settings, isLoading, isSaving, hasPendingChanges, updateFields, savePending, refetch } = useSettings();
  const { user, signOut } = useAuth();

  const [draftValues, setDraftValues] = useState({});
  const [exitDraft, setExitDraft] = useState(
    DEFAULT_EXIT_LEVELS.map((level) => ({
      r: String(level.r),
      percent: String(level.percent),
      trailingStop: Boolean(level.trailingStop),
    }))
  );
  const hasLocalDraftChanges = useMemo(() => Object.keys(draftValues).length > 0, [draftValues]);

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

  const handleFieldChange = useCallback((field) => (e) => {
    const value = e.target.value;
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

  const handleSave = useCallback(async () => {
    if (hasLocalDraftChanges) {
      commitDraftFields(INPUT_FIELDS);
    }

    try {
      await savePending();
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error(`Failed to save: ${error.message}`);
    }
  }, [hasLocalDraftChanges, commitDraftFields, savePending]);

  const handleMigrateTrades = useCallback(async () => {
    if (window.confirm('This will migrate all existing trades to the 25K account tier. Are you sure?')) {
      try {
        const { createTradeService } = await import('@/lib/services/TradeService.js');
        const tradeService = createTradeService(db);
        await tradeService.migrateTradesToAccountTier();
        toast.success('Trade migration completed successfully!');
      } catch (error) {
        toast.error('Failed to migrate trades');
      }
    }
  }, []);

  const handleClearAndReinit = useCallback(async () => {
    if (window.confirm('This will reset all settings to defaults. Are you sure?')) {
      try {
        await settingsService.clearAndReinit();
        toast.success('Settings cleared and reinitialized!');
        refetch();
      } catch (error) {
        toast.error('Failed to clear settings');
      }
    }
  }, [refetch]);

  const handleSignOut = useCallback(() => {
    if (window.confirm('Sign out?')) signOut();
  }, [signOut]);

  const handleClearLocalCache = useCallback(() => {
    if (window.confirm('Delete ALL local trades? Firebase data is unaffected.')) {
      const confirmation = window.confirm('Are you absolutely sure? This cannot be undone.');
      if (confirmation) {
        localStorage.removeItem('trades');
        window.dispatchEvent(new CustomEvent('trades-updated', { detail: { action: 'reset' } }));
        toast.success('Local cache cleared');
      }
    }
  }, []);

  const exportCSV = useCallback(() => {
    const trades = JSON.parse(localStorage.getItem('trades') || '[]');
    const rows = [
      ['date', 'symbol', 'direction', 'entry', 'exit', 'size', 'pnl', 'r_multiple', 'setup', 'emotions', 'followed_plan'],
      ...trades.map((t) => [
        (t.entry_time || t.created_date || '').slice(0, 10),
        t.symbol || '', t.direction || '', t.entry_price || '', t.exit_price || '',
        t.position_size || '', t.pnl || '', t.r_multiple || '',
        t.setup_type || '', t.emotions || '', t.followed_plan || '',
      ]),
    ];

    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `trades_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
  }, []);

  const riskMeterSettings = useMemo(() => ({
    ...settings,
    position_sizing_percent: toPersistedValue('position_sizing_percent', getDisplayValue('position_sizing_percent', '1')),
    default_stop_loss_percent: toPersistedValue('default_stop_loss_percent', getDisplayValue('default_stop_loss_percent', '4')),
  }), [settings, getDisplayValue, toPersistedValue]);

  return (
    <div className="space-y-6">
      <SettingsHeader
        handleSave={handleSave}
        isSaving={isSaving}
        hasChanges={hasPendingChanges || hasLocalDraftChanges}
        user={user}
        handleSignOut={handleSignOut}
      />

      <Tabs defaultValue="account">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="float">Float</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-5">
          <AccountSettingsTab
            getDisplayValue={getDisplayValue}
            handleFieldChange={handleFieldChange}
            commitDraftField={commitDraftField}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="risk" className="mt-5">
          <RiskSettingsTab
            getDisplayValue={getDisplayValue}
            handleFieldChange={handleFieldChange}
            commitDraftField={commitDraftField}
            isLoading={isLoading}
            riskMeterSettings={riskMeterSettings}
            exitDraft={exitDraft}
            handleAddExitLevel={handleAddExitLevel}
            handleRemoveExitLevel={handleRemoveExitLevel}
            handleExitFieldChange={handleExitFieldChange}
            handleExitFieldBlur={handleExitFieldBlur}
            handleExitTrailingToggle={handleExitTrailingToggle}
            exitPercentTotal={exitPercentTotal}
          />
        </TabsContent>

        <TabsContent value="float" className="mt-5 space-y-5">
          <FloatTargetSettings />
          <FloatCategoriesSettings />
        </TabsContent>

        <TabsContent value="data" className="mt-5">
          <DataManagementTab
            exportCSV={exportCSV}
            handleMigrateTrades={handleMigrateTrades}
            handleClearAndReinit={handleClearAndReinit}
            handleClearLocalCache={handleClearLocalCache}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
