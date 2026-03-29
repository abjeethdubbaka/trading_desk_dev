import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

export default function SaveSettingsButton() {
  const { saving, saveSettings } = useSettings();

  return (
    <Button 
      onClick={saveSettings}
      disabled={saving}
      className="w-full bg-emerald-600 hover:bg-emerald-700"
    >
      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      <Save className="w-4 h-4 mr-2" />
      Save Settings
    </Button>
  );
}


