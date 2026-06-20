import React, { useState } from 'react';
import { BookmarkPlus, Trash2, Download, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettingsPresets, useSettingsPresetsMutations } from '@/lib/hooks/useSettingsPresets';
import { useSettings } from '@/lib/context/SettingsContext';

const fmt = (v) => Number.isFinite(Number(v)) ? `$${Number(v).toLocaleString()}` : '—';
const fmtPct = (v) => Number.isFinite(Number(v)) ? `${Number(v)}%` : '—';
const fmtDate = (v) => {
  try { return new Date(v?.toDate?.() ?? v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
};

function PresetCard({ preset, onApply, onDelete }) {
  const s = preset.snapshot || preset;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{preset.name}</h3>
          <p className="text-[10px] text-white/35 flex items-center gap-1 mt-0.5">
            <Clock className="w-2.5 h-2.5" />
            {fmtDate(preset.created_date)}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => onApply(preset)}
            className="h-7 px-2.5 text-[11px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
          >
            <Download className="w-3 h-3 mr-1" />
            Apply
          </Button>
          <button
            type="button"
            onClick={() => onDelete(preset.id)}
            className="h-7 w-7 flex items-center justify-center rounded border border-white/10 text-white/30 hover:border-rose-500/30 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Account', value: fmt(s.account_size) },
          { label: 'Risk / Trade', value: fmt(s.risk_amount) },
          { label: 'Position %', value: fmtPct(s.position_sizing_percent) },
          { label: 'Max Trades', value: s.max_daily_trades ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-white/35">{label}</p>
            <p className="mt-0.5 text-xs font-semibold text-white/80 tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPresetsPanel() {
  const { data: presets = [], isLoading } = useSettingsPresets();
  const { save, remove } = useSettingsPresetsMutations();
  const { settings, updateFields, saveImmediately } = useSettings();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error('Enter a preset name'); return; }
    setSaving(true);
    try {
      await save.mutateAsync({ name: trimmed, snapshot: settings });
      setName('');
      toast.success(`Preset "${trimmed}" saved`);
    } catch {
      toast.error('Failed to save preset');
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async (preset) => {
    const snapshot = preset.snapshot || preset;
    const { id, name: _n, created_date, updated_date, ...fields } = snapshot;
    try {
      updateFields(fields);
      await saveImmediately(fields);
      toast.success(`Preset "${preset.name}" applied`);
    } catch {
      toast.error('Failed to apply preset');
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id);
      toast.success('Preset deleted');
    } catch {
      toast.error('Failed to delete preset');
    }
  };

  return (
    <div className="space-y-6">
      {/* Save current */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Save Current Settings as Preset</h2>
        <p className="text-[11px] text-white/40 mb-4">
          Snapshot your current account size, risk amounts, and trade limits so you can switch between configurations instantly.
        </p>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder='e.g. "Small Account $5K" or "High Risk Mode"'
            className="flex-1 h-9 bg-white/[0.03] border-white/12 text-sm"
          />
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="h-9 px-4 bg-emerald-500/90 hover:bg-emerald-500 text-black font-semibold text-sm flex-shrink-0"
          >
            <BookmarkPlus className="w-4 h-4 mr-1.5" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Preset list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Saved Presets ({presets.length})
        </h3>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />)}
          </div>
        )}

        {!isLoading && presets.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <BookmarkPlus className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">No presets yet</p>
            <p className="text-[11px] text-white/25 mt-1">Save your current settings above to create your first preset.</p>
          </div>
        )}

        {presets.map(preset => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onApply={handleApply}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
