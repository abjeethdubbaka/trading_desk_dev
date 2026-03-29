import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from '@/lib/context/SettingsContext';

export default function FloatTargetSettings() {
  const { settings, loading, saving, updateSettings } = useSettings();

  return (
    <div className="glass-card rounded-2xl p-5 gradient-border max-w-md">
      <h3 className="text-sm font-medium text-white/80 mb-3">Float-Based Target Profit (R:R Ratios)</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-white/60">&lt;10M Float Min R</Label>
            <Input
              type="number"
              step="0.5"
              value={settings.float_10m_min_r || ''}
              onChange={(e) => updateSettings({ float_10m_min_r: e.target.value })}
              placeholder="4"
              className="bg-white/5 border-white/10 text-sm"
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-white/60">&lt;10M Float Max R</Label>
            <Input
              type="number"
              step="0.5"
              value={settings.float_10m_max_r || ''}
              onChange={(e) => updateSettings({ float_10m_max_r: e.target.value })}
              placeholder="7"
              className="bg-white/5 border-white/10 text-sm"
              disabled={loading || saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-white/60">10-50M Float Min R</Label>
            <Input
              type="number"
              step="0.5"
              value={settings.float_10_50m_min_r || ''}
              onChange={(e) => updateSettings({ float_10_50m_min_r: e.target.value })}
              placeholder="3"
              className="bg-white/5 border-white/10 text-sm"
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-white/60">10-50M Float Max R</Label>
            <Input
              type="number"
              step="0.5"
              value={settings.float_10_50m_max_r || ''}
              onChange={(e) => updateSettings({ float_10_50m_max_r: e.target.value })}
              placeholder="5"
              className="bg-white/5 border-white/10 text-sm"
              disabled={loading || saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-white/60">50-200M Float Min R</Label>
            <Input
              type="number"
              step="0.5"
              value={settings.float_50_200m_min_r || ''}
              onChange={(e) => updateSettings({ float_50_200m_min_r: e.target.value })}
              placeholder="2"
              className="bg-white/5 border-white/10 text-sm"
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-white/60">50-200M Float Max R</Label>
            <Input
              type="number"
              step="0.5"
              value={settings.float_50_200m_max_r || ''}
              onChange={(e) => updateSettings({ float_50_200m_max_r: e.target.value })}
              placeholder="3"
              className="bg-white/5 border-white/10 text-sm"
              disabled={loading || saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-white/60">&gt;200M Float Min R</Label>
            <Input
              type="number"
              step="0.5"
              value={settings.float_200m_min_r || ''}
              onChange={(e) => updateSettings({ float_200m_min_r: e.target.value })}
              placeholder="1"
              className="bg-white/5 border-white/10 text-sm"
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-white/60">&gt;200M Float Max R</Label>
            <Input
              type="number"
              step="0.5"
              value={settings.float_200m_max_r || ''}
              onChange={(e) => updateSettings({ float_200m_max_r: e.target.value })}
              placeholder="2"
              className="bg-white/5 border-white/10 text-sm"
              disabled={loading || saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


