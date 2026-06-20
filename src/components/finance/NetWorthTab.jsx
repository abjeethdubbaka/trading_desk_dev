import React, { useMemo, useState } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNetWorth, useNetWorthMutations } from '@/lib/hooks/useFinance';
import { fmt, fmtK, todayISO } from './constants';

const BLANK = { date: todayISO(), assets: '', liabilities: '', notes: '' };

export default function NetWorthTab() {
  const { data: snapshots = [], isLoading } = useNetWorth();
  const { add, remove } = useNetWorthMutations();
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  const sorted = useMemo(
    () => [...snapshots].sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    [snapshots],
  );

  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const latestNW = latest ? Number(latest.assets || 0) - Number(latest.liabilities || 0) : null;
  const prevNW = prev ? Number(prev.assets || 0) - Number(prev.liabilities || 0) : null;
  const delta = latestNW != null && prevNW != null ? latestNW - prevNW : null;
  const pctChange = prevNW && prevNW !== 0 ? (delta / Math.abs(prevNW)) * 100 : null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    const assets = parseFloat(form.assets);
    const liabilities = parseFloat(form.liabilities || 0);
    if (!Number.isFinite(assets) || assets < 0) { toast.error('Enter valid assets'); return; }
    try {
      await add.mutateAsync({ ...form, assets, liabilities: Number.isFinite(liabilities) ? liabilities : 0 });
      setForm(BLANK);
      setShowForm(false);
      toast.success('Snapshot saved');
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    try { await remove.mutateAsync(id); toast.success('Removed'); }
    catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 items-start">

      {/* Left column: hero + add snapshot */}
      <div className="space-y-4">
        {latestNW != null && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-6">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Current Net Worth</p>
            <p className={cn('text-4xl font-bold', latestNW >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{fmtK(latestNW)}</p>
            {delta != null && (
              <div className={cn('flex items-center gap-1.5 mt-2 text-sm', delta >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {delta >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{delta >= 0 ? '+' : ''}{fmt(delta)}</span>
                {pctChange != null && <span className="text-white/35 text-xs">({pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%)</span>}
                <span className="text-white/30 text-xs">vs previous</span>
              </div>
            )}
            {latest && (
              <p className="text-[10px] text-white/30 mt-2">
                Assets {fmt(latest.assets)} · Liabilities {fmt(latest.liabilities || 0)} · {latest.date}
              </p>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/70">Add Snapshot</h3>
            <button type="button" onClick={() => setShowForm(p => !p)} className="text-[10px] text-white/40 hover:text-white/70">
              {showForm ? 'Cancel' : 'New'}
            </button>
          </div>
          {showForm && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Date</Label>
                  <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="h-9 bg-white/[0.03] border-white/12 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Total Assets ($)</Label>
                  <Input type="number" value={form.assets} onChange={e => set('assets', e.target.value)} placeholder="0" className="h-9 bg-white/[0.03] border-white/12 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Liabilities ($)</Label>
                  <Input type="number" value={form.liabilities} onChange={e => set('liabilities', e.target.value)} placeholder="0" className="h-9 bg-white/[0.03] border-white/12 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Notes</Label>
                  <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="optional" className="h-9 bg-white/[0.03] border-white/12 text-sm" />
                </div>
              </div>
              <Button onClick={handleAdd} disabled={add.isPending} className="w-full h-9 bg-emerald-500/90 hover:bg-emerald-500 text-black font-semibold text-sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                {add.isPending ? 'Saving…' : 'Save Snapshot'}
              </Button>
            </div>
          )}
          {!showForm && latestNW == null && (
            <p className="text-sm text-white/30 text-center py-4">No snapshots yet. Add your first one.</p>
          )}
        </div>
        {isLoading && <div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />}
      </div>

      {/* Right column: history */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/70">History</h3>
        {sorted.length === 0 && !isLoading && (
          <p className="text-sm text-white/30 text-center py-8">No snapshots yet</p>
        )}
        {[...sorted].reverse().map(s => {
          const nw = Number(s.assets || 0) - Number(s.liabilities || 0);
          return (
            <div key={s.id} className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/50">{s.date}</span>
                  {s.notes && <span className="text-[10px] text-white/30 truncate">{s.notes}</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-white/40">
                  <span>Assets {fmt(s.assets)}</span>
                  <span>·</span>
                  <span>Liabilities {fmt(s.liabilities || 0)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={cn('text-base font-bold', nw >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{fmtK(nw)}</span>
                <button type="button" onClick={() => handleDelete(s.id)} className="p-1 text-white/20 hover:text-rose-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
