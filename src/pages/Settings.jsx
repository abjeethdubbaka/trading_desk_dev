import React, { useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, AlertTriangle } from 'lucide-react';
import { useSettings } from '@/components/settings/SettingsProvider';
import FloatCategoriesSettings from '@/components/settings/FloatCategoriesSettings';
import FloatTargetSettings from '@/components/settings/FloatTargetSettings';
import { cn } from '@/lib/utils';

function LivePreview({ settings }) {
  const entry = 180;
  const acct = parseFloat(settings.account_size) || 50000;
  const sizePct = (parseFloat(settings.position_sizing_percent) || 1) / 100;
  const stopPct = (parseFloat(settings.default_stop_loss_percent) || 4) / 100;
  const riskAmt = parseFloat(settings.risk_amount) || 1000;
  const maxDol = parseFloat(settings.max_dollars) || 0;
  const target = parseFloat(settings.target_profit_dollars) || 500;
  const pos = acct * sizePct;
  const finalPos = maxDol > 0 ? Math.min(pos, maxDol) : pos;
  const shares = Math.floor(finalPos / entry);
  const risk = shares * entry * stopPct;

  return (
    <div className="bg-[#0e0e18] border border-purple-500/20 rounded-xl p-4">
      <p className="text-xs font-semibold text-purple-300/70 uppercase tracking-wider mb-3">Live preview — $180 stock</p>
      <div className="space-y-1.5">
        {[['Shares', `${shares}`], ['Position value', `$${Math.round(finalPos).toLocaleString()}`], ['Risk $', `$${risk.toFixed(0)}`], ['2R target', `$${(risk * 2).toFixed(0)}`], ['Daily goal', `$${target}`], ['% of account', `${(finalPos / acct * 100).toFixed(1)}%`]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-white/40">{k}</span>
            <span className="font-mono font-semibold text-white/80">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskMeter({ settings }) {
  const pct = parseFloat(settings.position_sizing_percent) || 1;
  const stop = parseFloat(settings.default_stop_loss_percent) || 4;
  const score = Math.min(100, Math.max(0, (pct * 15) + (stop * 4)));
  const label = score < 30 ? 'Conservative' : score < 60 ? 'Moderate' : score < 80 ? 'Aggressive' : 'Very aggressive';
  const color = score < 30 ? 'text-blue-400' : score < 60 ? 'text-amber-400' : 'text-red-400';
  const tip = score < 30 ? 'Professional range: 0.5–1% risk per trade.' : score < 60 ? 'Moderate — most professionals use 0.5–1%.' : 'High risk — consider reducing position size.';

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Risk profile</p>
      <div className="relative">
        <div className="h-3 rounded-full" style={{ background: 'linear-gradient(90deg,rgba(96,165,250,0.6),rgba(245,158,11,0.6),rgba(248,113,113,0.8))' }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-white/80 transition-all duration-300" style={{ left: `${score}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-white/30 mt-1.5"><span>Conservative</span><span>Moderate</span><span>Aggressive</span></div>
      </div>
      <p className="text-xs"><span className={cn('font-semibold', color)}>{label}</span> — <span className="text-white/40">{tip}</span></p>
    </div>
  );
}

function SaveStatus({ status }) {
  if (status === 'saving') return <span className="text-xs text-white/40">Saving…</span>;
  if (status === 'saved') return <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>;
  return null;
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

export default function Settings() {
  const { settings, loading, saveSettings, updateSettings } = useSettings();
  const [saveStatus, setSaveStatus] = useState(null);
  const timerRef = useRef(null);

  const triggerSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveStatus('saving');
    timerRef.current = setTimeout(async () => {
      await saveSettings();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    }, 800);
  }, [saveSettings]);

  const handle = (key) => (e) => {
    updateSettings({ [key]: e.target.value });
    triggerSave();
  };

  const exportCSV = () => {
    const trades = JSON.parse(localStorage.getItem('trades') || '[]');
    const rows = [
      ['date', 'symbol', 'direction', 'entry', 'exit', 'size', 'pnl', 'r_multiple', 'setup', 'emotions', 'followed_plan'],
      ...trades.map((t) => [
        (t.entry_time || t.created_date || '').slice(0, 10),
        t.symbol || '',
        t.direction || '',
        t.entry_price || '',
        t.exit_price || '',
        t.position_size || '',
        t.pnl || '',
        t.r_multiple || '',
        t.setup_type || '',
        t.emotions || '',
        t.followed_plan || ''
      ])
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `trades_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const exportJSON = () => {
    const data = {
      trades: JSON.parse(localStorage.getItem('trades') || '[]'),
      settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
      calcHistory: JSON.parse(localStorage.getItem('calcHistory') || '[]'),
      exportedAt: new Date().toISOString()
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `tradedesk_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Settings</h1><p className="text-white/40 text-xs mt-0.5">Changes save automatically</p></div>
        <SaveStatus status={saveStatus} />
      </div>

      <Tabs defaultValue="account">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="float">Float</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white/70">Account</h2>
              <Field label="Account size ($)" hint="Starting capital for all calculations">
                <Input type="number" value={settings.account_size || ''} onChange={handle('account_size')} placeholder="50000" className="bg-white/5 border-white/10" disabled={loading} />
              </Field>
              <Field label="Daily profit target ($)" hint="Shown as progress bar on dashboard">
                <Input type="number" step="50" value={settings.target_profit_dollars || ''} onChange={handle('target_profit_dollars')} placeholder="500" className="bg-white/5 border-white/10" disabled={loading} />
              </Field>
              <Field label="Max daily loss ($)" hint="Dashboard warns when this is hit">
                <Input type="number" step="50" value={settings.max_dollars || ''} onChange={handle('max_dollars')} placeholder="250" className="bg-white/5 border-white/10" disabled={loading} />
              </Field>
            </div>
            <LivePreview settings={settings} />
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white/70">Risk parameters</h2>
              <Field label="Position sizing (% of account)">
                <Input type="number" step="0.1" value={settings.position_sizing_percent || ''} onChange={handle('position_sizing_percent')} placeholder="1" className="bg-white/5 border-white/10" disabled={loading} />
              </Field>
              <Field label="Default stop loss (%)">
                <Input type="number" step="0.1" value={settings.default_stop_loss_percent || ''} onChange={handle('default_stop_loss_percent')} placeholder="4" className="bg-white/5 border-white/10" disabled={loading} />
              </Field>
              <Field label="Risk amount ($)" hint="Dollar risk per trade used in calculator">
                <Input type="number" step="50" value={settings.risk_amount || ''} onChange={handle('risk_amount')} placeholder="1000" className="bg-white/5 border-white/10" disabled={loading} />
              </Field>
            </div>
            <div className="space-y-4">
              <RiskMeter settings={settings} />
              <LivePreview settings={settings} />
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
            {[
              { label: 'Export trades CSV', sub: 'All journal trades as spreadsheet', fn: exportCSV, style: 'bg-white/5 hover:bg-white/8 border-white/10 text-white' },
              { label: 'Export full backup', sub: 'JSON backup including settings', fn: exportJSON, style: 'bg-white/5 hover:bg-white/8 border-white/10 text-white' },
            ].map(({ label, sub, fn, style }) => (
              <button key={label} onClick={fn} className={cn('flex flex-col items-start gap-1 border rounded-xl p-4 transition-colors text-left', style)}>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-white/40">{sub}</span>
              </button>
            ))}

            <button
              onClick={() => {
                if (confirm('Delete ALL trades? This cannot be undone.') && prompt('Type DELETE to confirm:') === 'DELETE') {
                  localStorage.removeItem('trades');
                  window.dispatchEvent(new CustomEvent('trades-updated', { detail: { action: 'reset' } }));
                  alert('Done.');
                }
              }}
              className="flex flex-col items-start gap-1 bg-red-500/8 hover:bg-red-500/12 border border-red-500/20 rounded-xl p-4 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-red-400 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />Delete all trades</span>
              <span className="text-xs text-red-400/50">Permanently removes all journal entries</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Reset all settings to defaults?')) {
                  localStorage.removeItem('userSettings');
                  window.location.reload();
                }
              }}
              className="flex flex-col items-start gap-1 bg-amber-500/8 hover:bg-amber-500/12 border border-amber-500/20 rounded-xl p-4 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-amber-400">Reset settings</span>
              <span className="text-xs text-amber-400/50">Restore all settings to defaults</span>
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}