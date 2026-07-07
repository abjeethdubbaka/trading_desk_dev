/**
 * @file src/pages/Settings.jsx
 *
 * Settings page composition.
 */

import React, { useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/lib/context/SettingsContext';
import { useAuth } from '@/lib/context/AuthContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import AccountSettingsTab from '@/components/settings/AccountSettingsTab';
import RiskSettingsTab from '@/components/settings/RiskSettingsTab';
import DataManagementTab from '@/components/settings/DataManagementTab';
import { useTradesMutation } from '@/lib/hooks/useTrades';
import {
  SETTINGS_INPUT_FIELDS,
  useSettingsFieldDrafts,
} from '@/components/settings/hooks/useSettingsFieldDrafts';
import { useSettingsMaintenanceActions } from '@/components/settings/hooks/useSettingsMaintenanceActions';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, isLoading, isSaving, hasPendingChanges, updateFields, savePending, saveImmediately, refetch } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const { user, signOut } = useAuth();
  const { bulkCreateTrades, isBulkCreating } = useTradesMutation();
  const [confirm, confirmDialog] = useConfirm();
  const fieldDrafts = useSettingsFieldDrafts({ settings, updateFields });
  const maintenanceActions = useSettingsMaintenanceActions({ signOut, refetch, confirmFn: confirm });

  const handleSave = useCallback(async () => {
    if (fieldDrafts.hasLocalDraftChanges) {
      fieldDrafts.commitDraftFields(SETTINGS_INPUT_FIELDS);
    }

    try {
      await savePending();
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error(`Failed to save: ${error.message}`);
    }
  }, [fieldDrafts, savePending]);

  return (
    <div className="space-y-6 w-full">
      <SettingsHeader
        handleSave={handleSave}
        isSaving={isSaving}
        hasChanges={hasPendingChanges || fieldDrafts.hasLocalDraftChanges}
        user={user}
        handleSignOut={maintenanceActions.handleSignOut}
      />

      <Tabs defaultValue="account">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="risk">Defaults</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-5 max-w-[860px]">
          <AccountSettingsTab
            getDisplayValue={fieldDrafts.getDisplayValue}
            handleFieldChange={fieldDrafts.handleFieldChange}
            commitDraftField={fieldDrafts.commitDraftField}
            clearAllDrafts={fieldDrafts.clearAllDrafts}
            isLoading={isLoading}
            riskMeterSettings={fieldDrafts.riskMeterSettings}
          />
        </TabsContent>

        <TabsContent value="risk" className="mt-5">
          <RiskSettingsTab
            settings={settings}
            updateFields={updateFields}
            saveImmediately={saveImmediately}
            getDisplayValue={fieldDrafts.getDisplayValue}
            handleFieldChange={fieldDrafts.handleFieldChange}
            commitDraftField={fieldDrafts.commitDraftField}
            isLoading={isLoading}
          />
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
      {confirmDialog}
    </div>
  );
}
