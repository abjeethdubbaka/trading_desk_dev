/**
 * @file src/pages/Settings.jsx
 *
 * Settings page composition.
 */

import React, { useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/lib/context/SettingsContext';
import { useAuth } from '@/lib/context/AuthContext';
import FloatCategoriesSettings from '@/components/settings/FloatCategoriesSettings';
import FloatTargetSettings from '@/components/settings/FloatTargetSettings';
import SettingsHeader from '@/components/settings/SettingsHeader';
import AccountSettingsTab from '@/components/settings/AccountSettingsTab';
import RiskSettingsTab from '@/components/settings/RiskSettingsTab';
import DataManagementTab from '@/components/settings/DataManagementTab';
import { useTradesMutation } from '@/lib/hooks/useTrades';
import {
  SETTINGS_INPUT_FIELDS,
  useSettingsFieldDrafts,
} from '@/components/settings/hooks/useSettingsFieldDrafts';
import { useExitStrategyDraft } from '@/components/settings/hooks/useExitStrategyDraft';
import { useStrategySettingsDraft } from '@/components/settings/hooks/useStrategySettingsDraft';
import { useSettingsMaintenanceActions } from '@/components/settings/hooks/useSettingsMaintenanceActions';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, isLoading, isSaving, hasPendingChanges, updateFields, savePending, refetch } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const { user, signOut } = useAuth();
  const { bulkCreateTrades, isBulkCreating } = useTradesMutation();
  const fieldDrafts = useSettingsFieldDrafts({ settings, updateFields });
  const exitStrategyDraft = useExitStrategyDraft({ settings, updateFields });
  const strategyDraft = useStrategySettingsDraft({ settings, updateFields });
  const flushStrategyStepDraft = strategyDraft.flushStrategyStepDraft;
  const maintenanceActions = useSettingsMaintenanceActions({ signOut, refetch });

  const handleSave = useCallback(async () => {
    if (fieldDrafts.hasLocalDraftChanges) {
      fieldDrafts.commitDraftFields(SETTINGS_INPUT_FIELDS);
    }

    flushStrategyStepDraft();

    try {
      await savePending();
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error(`Failed to save: ${error.message}`);
    }
  }, [fieldDrafts, flushStrategyStepDraft, savePending]);

  return (
    <div className="space-y-6 max-w-[1040px]">
      <SettingsHeader
        handleSave={handleSave}
        isSaving={isSaving}
        hasChanges={hasPendingChanges || fieldDrafts.hasLocalDraftChanges || strategyDraft.hasLocalStepDraftChanges}
        user={user}
        handleSignOut={maintenanceActions.handleSignOut}
      />

      <Tabs defaultValue="account">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="float">Float</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-5 max-w-[860px]">
          <AccountSettingsTab
            getDisplayValue={fieldDrafts.getDisplayValue}
            handleFieldChange={fieldDrafts.handleFieldChange}
            commitDraftField={fieldDrafts.commitDraftField}
            isLoading={isLoading}
            strategySetupsDraft={strategyDraft.strategySetupsDraft}
            selectedStrategySetupIndex={strategyDraft.selectedStrategySetupIndex}
            selectedStrategySetupName={strategyDraft.selectedStrategySetupName}
            handleStrategySetupSelect={strategyDraft.handleStrategySetupSelect}
            handleAddStrategySetupWithName={strategyDraft.handleAddStrategySetupWithName}
            handleRemoveStrategySetup={strategyDraft.handleRemoveStrategySetup}
            strategySetupCount={strategyDraft.strategySetupCount}
            strategyStepsDraft={strategyDraft.strategyStepsDraft}
            handleStrategyStepChange={strategyDraft.handleStrategyStepChange}
            handleStrategyStepBlur={strategyDraft.handleStrategyStepBlur}
            handleAddStrategyStep={strategyDraft.handleAddStrategyStep}
            handleRemoveStrategyStep={strategyDraft.handleRemoveStrategyStep}
            handleStrategyRelativeGradeChange={strategyDraft.handleStrategyRelativeGradeChange}
            handleAddStrategyRelativeGrade={strategyDraft.handleAddStrategyRelativeGrade}
            handleRemoveStrategyRelativeGrade={strategyDraft.handleRemoveStrategyRelativeGrade}
            strategyStepCount={strategyDraft.strategyStepCount}
          />
        </TabsContent>

        <TabsContent value="risk" className="mt-5 max-w-[980px]">
          <RiskSettingsTab
            settings={settings}
            updateFields={updateFields}
            getDisplayValue={fieldDrafts.getDisplayValue}
            handleFieldChange={fieldDrafts.handleFieldChange}
            commitDraftField={fieldDrafts.commitDraftField}
            isLoading={isLoading}
            riskMeterSettings={fieldDrafts.riskMeterSettings}
            exitDraft={exitStrategyDraft.exitDraft}
            handleAddExitLevel={exitStrategyDraft.handleAddExitLevel}
            handleRemoveExitLevel={exitStrategyDraft.handleRemoveExitLevel}
            handleExitFieldChange={exitStrategyDraft.handleExitFieldChange}
            handleExitFieldBlur={exitStrategyDraft.handleExitFieldBlur}
            handleExitTrailingToggle={exitStrategyDraft.handleExitTrailingToggle}
            exitPercentTotal={exitStrategyDraft.exitPercentTotal}
          />
        </TabsContent>

        <TabsContent value="float" className="mt-5 space-y-5 max-w-[980px]">
          <FloatTargetSettings />
          <FloatCategoriesSettings />
        </TabsContent>

        <TabsContent value="data" className="mt-5 max-w-[860px]">
          <DataManagementTab
            accountTier={currentTier}
            onImportPastedTrades={bulkCreateTrades}
            isImportingPastedTrades={isBulkCreating}
            handleReEnrichTrades={maintenanceActions.handleReEnrichTrades}
            handleClearAndReinit={maintenanceActions.handleClearAndReinit}
            handleClearLocalCache={maintenanceActions.handleClearLocalCache}
            isReEnriching={maintenanceActions.isReEnrichingTrades}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
