/**
 * @file src/pages/Settings.jsx
 *
 * Phase 2 — wired to useSettings() (Firebase, debounced auto-save).
 * Cleaner UI with a sync status indicator.
 */

import React, { useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Check, AlertTriangle, Cloud, CloudOff } from 'lucide-react';
import { useSettings }           from '@/lib/SettingsContext';
import { useAuth }               from '@/lib/AuthContext';
import { IS_REMOTE }             from '@/lib/db';
import { createSettingsService } from '@/lib/services/SettingsService.js';
import { db }                    from '@/lib/db';
import FloatCategoriesSettings   from '@/components/settings/FloatCategoriesSettings';
import FloatTargetSettings       from '@/components/settings/FloatTargetSettings';
import AccountTierSelector       from '@/components/settings/AccountTierSelector';
import { cn }                    from '@/lib/utils';
import { toast }                 from 'sonner';

function RiskMeter({ settings }) {
  const pct  = parseFloat(settings.position_sizing_percent) || 0.01; // Already in decimal
  const stop = parseFloat(settings.default_stop_loss_percent) || 0.04; // Already in decimal
  const score = Math.min(100, (pct * 1500) + (stop * 400)); // Adjusted for decimal values
  const label = score < 30 ? 'Conservative' : score < 60 ? 'Moderate' : score < 80 ? 'Aggressive' : 'Very aggressive';
  const color = score < 30 ? 'text-blue-400' : score < 60 ? 'text-amber-400' : 'text-red-400';
  const tip   = score < 30
    ? 'Professional range: 0.5–1% risk per trade.'
    : score < 60
    ? 'Moderate — most professionals stay under 1%.'
    : 'High risk — consider reducing position sizing.';

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Risk profile</p>
      <div className="relative">
        <div className="h-3 rounded-full" style={{ background:'linear-gradient(90deg,rgba(96,165,250,.6),rgba(245,158,11,.6),rgba(248,113,113,.8))' }}>
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-white/80 transition-all duration-300"
            style={{ left: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/30 mt-1.5">
          <span>Conservative</span><span>Moderate</span><span>Aggressive</span>
        </div>
      </div>
      <p className="text-xs"><span className={cn('font-semibold', color)}>{label}</span> — <span className="text-white/40">{tip}</span></p>
    </div>
  );
}

function SyncBadge() {
  if (!IS_REMOTE) return (
    <span className="flex items-center gap-1.5 text-xs text-amber-400">
      <CloudOff className="w-3.5 h-3.5" />Local only
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
      <Cloud className="w-3.5 h-3.5" />Synced to Firebase
    </span>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-white/60">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-white/30">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, isLoading, isSaving, updateFields, savePending, refetch } = useSettings({ autoSave: false });
  const { user, signOut } = useAuth();
  
  // Create settings service instance
  const settingsService = createSettingsService(db);

  const handle = (key) => (e) => {
    const value = e.target.value;
    
    // Convert percentage inputs to decimal format
    if (key === 'position_sizing_percent' || key === 'default_stop_loss_percent') {
      const percentValue = parseFloat(value) || 0;
      const decimalValue = percentValue / 100;
      updateFields({ [key]: decimalValue });
    } else {
      updateFields({ [key]: value });
    }
  };

  const handleSave = async () => {
    try {
      const result = await savePending();
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  const handleMigrateTrades = async () => {
    if (window.confirm('This will migrate all existing trades to the 25K account tier. Are you sure?')) {
      try {
        const { createTradeService } = await import('@/lib/services/TradeService.js');
        const tradeService = createTradeService(db);
        await tradeService.migrateTradesToAccountTier();
        toast.success('Trade migration completed successfully!');
      } catch (error) {
        console.error('Migration failed:', error);
        toast.error('Failed to migrate trades');
      }
    }
  };

  const handleClearAndReinit = async () => {
    if (window.confirm('This will reset all settings to defaults. Are you sure?')) {
      try {
        await settingsService.clearAndReinit();
        toast.success('Settings cleared and reinitialized!');
        // Refetch settings
        refetch();
      } catch (error) {
        console.error('Clear and reinit failed:', error);
        toast.error('Failed to clear settings');
      }
    }
  };

  const exportCSV = () => {
    // Still reads local for now — Phase 3 will stream from Firebase
    const trades = JSON.parse(localStorage.getItem('trades') || '[]');
    const rows   = [
      ['date','symbol','direction','entry','exit','size','pnl','r_multiple','setup','emotions','followed_plan'],
      ...trades.map(t => [
        (t.entry_time || t.created_date || '').slice(0, 10),
        t.symbol||'', t.direction||'', t.entry_price||'', t.exit_price||'',
        t.position_size||'', t.pnl||'', t.r_multiple||'',
        t.setup_type||'', t.emotions||'', t.followed_plan||'',
      ]),
    ];
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], { type:'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `trades_${new Date().toISOString().slice(0,10)}.csv` });
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
          <SyncBadge />
          {user && (
            <button
              onClick={() => { if (window.confirm('Sign out?')) signOut(); }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Sign out ({user.email})
            </button>
          )}
        </div>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="float">Float</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-5">
          <div className="space-y-4">
            <AccountTierSelector />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Account size ($)" hint="Starting capital for all calculations">
                <Input 
                  type="number" 
                  value={settings.account_size || ''} 
                  onChange={handle('account_size')}
                  placeholder="50000" 
                  className="bg-white/5 border-white/10" 
                  disabled={isLoading} 
                />
              </Field>
              <Field label="Daily profit target ($)" hint="Shown as progress bar on dashboard">
                <Input type="number" step="50" value={settings.target_profit_dollars || ''} onChange={handle('target_profit_dollars')}
                  placeholder="500" className="bg-white/5 border-white/10" disabled={isLoading} />
              </Field>
              <Field label="Max daily loss ($)" hint="Dashboard warns when this is hit">
                <Input type="number" step="50" value={settings.max_dollars || ''} onChange={handle('max_dollars')}
                  placeholder="250" className="bg-white/5 border-white/10" disabled={isLoading} />
              </Field>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white/70">Risk parameters</h2>
              <Field label="Position sizing (% of account)">
                <Input type="number" step="0.1" 
                  value={((settings.position_sizing_percent || 0.01) * 100).toFixed(1)} 
                  onChange={handle('position_sizing_percent')}
                  placeholder="1" 
                  className="bg-white/5 border-white/10" 
                  disabled={isLoading} 
                />
              </Field>
              <Field label="Default stop loss (%)">
                <Input type="number" step="0.1" 
                  value={((settings.default_stop_loss_percent || 0.04) * 100).toFixed(1)} 
                  onChange={handle('default_stop_loss_percent')}
                  placeholder="4" 
                  className="bg-white/5 border-white/10" 
                  disabled={isLoading} 
                />
              </Field>
              <Field label="Risk amount ($)" hint="Dollar risk per trade used in calculator">
                <Input type="number" step="50" value={settings.risk_amount || ''} onChange={handle('risk_amount')}
                  placeholder="1000" className="bg-white/5 border-white/10" disabled={isLoading} />
              </Field>
            </div>
            <div className="space-y-4">
              <RiskMeter settings={settings} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="float" className="mt-5 space-y-5">
          <FloatTargetSettings />
          <FloatCategoriesSettings />
        </TabsContent>

        <TabsContent value="data" className="mt-5 space-y-4">
          <h2 className="text-sm font-semibold text-white/70">Data management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={exportCSV} className="flex flex-col items-start gap-1 border border-white/10 bg-white/5 hover:bg-white/8 rounded-xl p-4 transition-colors text-left">
              <span className="text-sm font-semibold text-white">Export trades CSV</span>
              <span className="text-xs text-white/40">All journal trades as spreadsheet</span>
            </button>

            <button
              onClick={handleMigrateTrades}
              className="flex flex-col items-start gap-1 bg-blue-500/8 hover:bg-blue-500/12 border border-blue-500/20 rounded-xl p-4 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-blue-300">Migrate Trades to 25K</span>
              <span className="text-xs text-white/40">Assign existing trades to 25K account tier</span>
            </button>

            <button
              onClick={handleClearAndReinit}
              className="flex flex-col items-start gap-1 bg-orange-500/8 hover:bg-orange-500/12 border border-orange-500/20 rounded-xl p-4 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-orange-300">Reset Settings</span>
              <span className="text-xs text-white/40">Clear all settings and reinitialize with defaults</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Delete ALL local trades? Firebase data is unaffected.')) {
                  const confirmation = window.confirm('Are you absolutely sure? This cannot be undone.');
                  if (confirmation) {
                    localStorage.removeItem('trades');
                    window.dispatchEvent(new CustomEvent('trades-updated', { detail: { action:'reset' } }));
                    toast.success('Local cache cleared');
                  }
                }
              }}
              className="flex flex-col items-start gap-1 bg-red-500/8 hover:bg-red-500/12 border border-red-500/20 rounded-xl p-4 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-red-300">Clear local cache</span>
              <span className="text-xs text-white/40">Removes localStorage — Firebase data stays safe</span>
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
