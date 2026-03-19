import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { 
  GeneralSettings,
  FloatTargetSettings,
  FloatCategoriesSettings,
  SaveSettingsButton
} from '@/components/settings';

export default function Settings() {
  return (
    <div className="space-y-5">
      {/* Compact header */}
      <div className="flex items-center gap-2 mb-1">
        <SettingsIcon className="w-4 h-4 text-emerald-400" />
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      </div>

      {/* General Settings */}
      <GeneralSettings />

      {/* Float Target Settings */}
      <FloatTargetSettings />

      {/* Float Categories Settings */}
      <FloatCategoriesSettings />

      {/* Save Button */}
      <SaveSettingsButton />
    </div>
  );
}