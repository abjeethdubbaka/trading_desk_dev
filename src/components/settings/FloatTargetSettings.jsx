import React, { useEffect, useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from '@/lib/context/SettingsContext';

const FLOAT_TARGET_FIELDS = [
  'float_10m_min_r',
  'float_10m_max_r',
  'float_10_50m_min_r',
  'float_10_50m_max_r',
  'float_50_200m_min_r',
  'float_50_200m_max_r',
  'float_200m_min_r',
  'float_200m_max_r',
];

export default function FloatTargetSettings() {
  const { settings, loading, saving, updateSettings } = useSettings();
  const [draft, setDraft] = useState({});
  const compactInputClass = 'h-9 rounded-lg px-2.5 bg-white/5 border-white/10 text-sm';

  useEffect(() => {
    const nextDraft = {};
    FLOAT_TARGET_FIELDS.forEach((field) => {
      const raw = settings?.[field];
      nextDraft[field] = raw == null ? '' : String(raw);
    });
    setDraft(nextDraft);
  }, [settings]);

  const handleChange = useCallback((field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const commitField = useCallback((field, rawValue) => {
    const parsed = rawValue === '' ? 0 : parseFloat(rawValue);
    updateSettings({
      [field]: Number.isFinite(parsed) ? parsed : 0,
    });
  }, [updateSettings]);

  return (
    <div className="glass-card rounded-2xl p-4 gradient-border max-w-md">
      <h3 className="text-sm font-medium text-white/80 mb-3">Float-Based Target Profit (R:R Ratios)</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-white/60">&lt;10M Float Min R</Label>
            <Input
              type="number"
              step="0.5"
              value={draft.float_10m_min_r ?? ''}
              onChange={(e) => handleChange('float_10m_min_r', e.target.value)}
              onBlur={(e) => commitField('float_10m_min_r', e.target.value)}
              placeholder="4"
              className={compactInputClass}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-white/60">&lt;10M Float Max R</Label>
            <Input
              type="number"
              step="0.5"
              value={draft.float_10m_max_r ?? ''}
              onChange={(e) => handleChange('float_10m_max_r', e.target.value)}
              onBlur={(e) => commitField('float_10m_max_r', e.target.value)}
              placeholder="7"
              className={compactInputClass}
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
              value={draft.float_10_50m_min_r ?? ''}
              onChange={(e) => handleChange('float_10_50m_min_r', e.target.value)}
              onBlur={(e) => commitField('float_10_50m_min_r', e.target.value)}
              placeholder="3"
              className={compactInputClass}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-white/60">10-50M Float Max R</Label>
            <Input
              type="number"
              step="0.5"
              value={draft.float_10_50m_max_r ?? ''}
              onChange={(e) => handleChange('float_10_50m_max_r', e.target.value)}
              onBlur={(e) => commitField('float_10_50m_max_r', e.target.value)}
              placeholder="5"
              className={compactInputClass}
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
              value={draft.float_50_200m_min_r ?? ''}
              onChange={(e) => handleChange('float_50_200m_min_r', e.target.value)}
              onBlur={(e) => commitField('float_50_200m_min_r', e.target.value)}
              placeholder="2"
              className={compactInputClass}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-white/60">50-200M Float Max R</Label>
            <Input
              type="number"
              step="0.5"
              value={draft.float_50_200m_max_r ?? ''}
              onChange={(e) => handleChange('float_50_200m_max_r', e.target.value)}
              onBlur={(e) => commitField('float_50_200m_max_r', e.target.value)}
              placeholder="3"
              className={compactInputClass}
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
              value={draft.float_200m_min_r ?? ''}
              onChange={(e) => handleChange('float_200m_min_r', e.target.value)}
              onBlur={(e) => commitField('float_200m_min_r', e.target.value)}
              placeholder="1"
              className={compactInputClass}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-white/60">&gt;200M Float Max R</Label>
            <Input
              type="number"
              step="0.5"
              value={draft.float_200m_max_r ?? ''}
              onChange={(e) => handleChange('float_200m_max_r', e.target.value)}
              onBlur={(e) => commitField('float_200m_max_r', e.target.value)}
              placeholder="2"
              className={compactInputClass}
              disabled={loading || saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


