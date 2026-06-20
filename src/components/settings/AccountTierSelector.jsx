import React, { useState, useCallback } from 'react';
import {
  ACCOUNT_TIERS,
  ACCOUNT_TIER_IDS,
  getTierSettingsWithCustomizations,
  detectTierFromSettings,
  getTierSettingsFields,
  saveTierCustomizations,
  sanitizeTierSettingsPayload,
} from '@/lib/config/accountTypes';
import { useSettings } from '@/lib/context/SettingsContext';
import { useSettingsPresets, useSettingsPresetsMutations } from '@/lib/hooks/useSettingsPresets';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Check, ChevronDown, BookmarkPlus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const areValuesEqual = (left, right) => {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i++) if (!areValuesEqual(left[i], right[i])) return false;
    return true;
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    const lk = Object.keys(left); const rk = Object.keys(right);
    if (lk.length !== rk.length) return false;
    for (const k of lk) {
      if (!Object.prototype.hasOwnProperty.call(right, k)) return false;
      if (!areValuesEqual(left[k], right[k])) return false;
    }
    return true;
  }
  return false;
};

const toGlobalSetupTypes = (setupTypes) => (
  Array.isArray(setupTypes)
    ? [...new Set(setupTypes.map((s) => String(s || '').trim()).filter(Boolean))]
    : []
);

const fmt = (v) => Number.isFinite(Number(v)) ? `$${Number(v).toLocaleString()}` : null;

export default function AccountTierSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const { settings, updateFields, saveImmediately, isLoading } = useSettings();
  const { data: savedAccounts = [] } = useSettingsPresets();
  const { save, remove } = useSettingsPresetsMutations();

  const currentTierId = (settings?.account_tier && ACCOUNT_TIERS[settings.account_tier])
    ? settings.account_tier
    : detectTierFromSettings(settings) || '25K';

  const currentTier = ACCOUNT_TIERS[currentTierId];
  const isCustom = currentTierId === 'custom';

  const handleTierSelect = useCallback(async (tierId) => {
    try {
      if (currentTierId && currentTierId !== 'custom') {
        const baseTier = getTierSettingsFields(currentTierId);
        const normalizedCurrent = sanitizeTierSettingsPayload(settings || {});
        const customizations = {};
        Object.keys(baseTier).forEach((key) => {
          if (key === 'account_tier') return;
          if (normalizedCurrent?.[key] !== undefined && !areValuesEqual(normalizedCurrent[key], baseTier[key])) {
            customizations[key] = normalizedCurrent[key];
          }
        });
        saveTierCustomizations(currentTierId, customizations);
      }

      const globalSetupTypes = toGlobalSetupTypes(settings?.journal_preferences?.default_setup_types);
      const nextBase = tierId === 'custom'
        ? { account_tier: 'custom' }
        : getTierSettingsWithCustomizations(tierId);
      const shouldCarry = Boolean(nextBase?.journal_preferences) || globalSetupTypes.length > 0;
      const nextSettings = shouldCarry
        ? { ...nextBase, journal_preferences: { ...(nextBase?.journal_preferences || {}), ...(globalSetupTypes.length > 0 ? { default_setup_types: globalSetupTypes } : {}) } }
        : nextBase;

      updateFields(nextSettings);
      await saveImmediately(nextSettings);
      setIsOpen(false);
    } catch {
      // silent
    }
  }, [currentTierId, settings, updateFields, saveImmediately]);

  const handleApplyPreset = useCallback(async (preset) => {
    const snapshot = preset.snapshot || preset;
    const { id: _id, name: _n, created_date: _cd, updated_date: _ud, ...fields } = snapshot;
    try {
      updateFields(fields);
      await saveImmediately(fields);
      setIsOpen(false);
      toast.success(`Applied "${preset.name}"`);
    } catch {
      toast.error('Failed to apply account');
    }
  }, [updateFields, saveImmediately]);

  const handleDeletePreset = useCallback(async (e, id, name) => {
    e.stopPropagation();
    try {
      await remove.mutateAsync(id);
      toast.success(`Deleted "${name}"`);
    } catch {
      toast.error('Failed to delete');
    }
  }, [remove]);

  const handleSaveAccount = async () => {
    const trimmed = saveName.trim();
    if (!trimmed) { toast.error('Enter an account name'); return; }
    setIsSavingPreset(true);
    try {
      await save.mutateAsync({ name: trimmed, snapshot: settings });
      setSaveName('');
      toast.success(`Saved as "${trimmed}"`);
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSavingPreset(false);
    }
  };

  const displayLabel = isCustom
    ? (fmt(settings?.account_size) ?? 'Custom')
    : currentTier?.display;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-white/80">
        <Settings className="w-4 h-4" />
        Account Tier
      </label>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isLoading}
            className="w-full h-9 rounded-lg px-2.5 justify-between bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentTier?.icon}</span>
              <span>{displayLabel}</span>
              <Badge variant="secondary" className="text-xs">{currentTier?.badge}</Badge>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-72 bg-gray-900 border-white/10" align="start">
          <div className="p-2 space-y-1">
            {/* Built-in tiers */}
            {ACCOUNT_TIER_IDS.filter(id => id !== 'custom').map((tierId) => {
              const tier = ACCOUNT_TIERS[tierId];
              const isSelected = tierId === currentTierId;
              return (
                <DropdownMenuItem
                  key={tierId}
                  onClick={() => handleTierSelect(tierId)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-white'}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-xl">{tier.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tier.display}</span>
                        <Badge variant="outline" className="text-xs">{tier.badge}</Badge>
                        {isSelected && <Check className="w-4 h-4 text-blue-400 ml-auto" />}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-white/50">
                        <span>Target ${tier.daily_profit_target}</span>
                        <span>Risk ${tier.risk_amount}/trade</span>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}

            {/* Custom tier */}
            <DropdownMenuItem
              onClick={() => handleTierSelect('custom')}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${isCustom && !savedAccounts.find(a => a.id === settings?._preset_id) ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-white'}`}
            >
              <div className="flex items-center gap-3 w-full">
                <span className="text-xl">⚙️</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Custom</span>
                    <Badge variant="outline" className="text-xs">Custom</Badge>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">Configure every parameter manually</p>
                </div>
              </div>
            </DropdownMenuItem>

            {/* Saved custom accounts */}
            {savedAccounts.length > 0 && (
              <>
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                <p className="text-[10px] uppercase tracking-widest text-white/30 px-2 py-1">Saved Accounts</p>
                {savedAccounts.map((acct) => {
                  const s = acct.snapshot || acct;
                  return (
                    <DropdownMenuItem
                      key={acct.id}
                      onClick={() => handleApplyPreset(acct)}
                      className="p-3 rounded-lg cursor-pointer hover:bg-white/5 text-white group"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xl">📋</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{acct.name}</p>
                          <div className="flex gap-3 mt-0.5 text-xs text-white/45">
                            {fmt(s.account_size) && <span>{fmt(s.account_size)}</span>}
                            {fmt(s.risk_amount) && <span>Risk {fmt(s.risk_amount)}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeletePreset(e, acct.id, acct.name)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-rose-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}

            {/* Save current custom as named account */}
            {isCustom && (
              <>
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                <div className="p-2 space-y-1.5" onClick={e => e.stopPropagation()}>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 px-1">Save Current as Named Account</p>
                  <div className="flex gap-1.5">
                    <Input
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveAccount(); } }}
                      placeholder='e.g. "Small Acct $5K"'
                      className="flex-1 h-8 text-xs bg-white/5 border-white/10"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveAccount}
                      disabled={isSavingPreset || !saveName.trim()}
                      className="h-8 px-2.5 bg-emerald-500/80 hover:bg-emerald-500 text-black font-semibold text-xs flex-shrink-0"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
