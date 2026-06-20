import React, { useMemo, useState } from 'react';
import { PlusCircle, Trash2, Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHoldings, useHoldingsMutations } from '@/lib/hooks/useFinance';
import { HOLDING_TYPES, fmt, fmtK } from './constants';

const TYPE_COLORS = {
  stock:       { color: 'text-blue-400',    bg: 'bg-blue-500/15'    },
  etf:         { color: 'text-cyan-400',     bg: 'bg-cyan-500/15'    },
  crypto:      { color: 'text-orange-400',  bg: 'bg-orange-500/15'  },
  bond:        { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  real_estate: { color: 'text-violet-400',  bg: 'bg-violet-500/15'  },
  cash:        { color: 'text-white/70',    bg: 'bg-white/10'       },
  other:       { color: 'text-white/50',    bg: 'bg-white/8'        },
};

const BLANK = { symbol: '', name: '', type: 'stock', shares: '', cost_basis: '', current_price: '', notes: '' };

export default function PortfolioTab() {
  const { data: holdings = [], isLoading } = useHoldings();
  const { add, edit, remove } = useHoldingsMutations();
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const totalValue = useMemo(() =>
    holdings.reduce((s, h) => s + (Number(h.shares || 0) * Number(h.current_price || 0)), 0),
    [holdings]);

  const totalCost = useMemo(() =>
    holdings.reduce((s, h) => s + (Number(h.shares || 0) * Number(h.cost_basis || 0)), 0),
    [holdings]);

  const byType = useMemo(() => {
    const groups = {};
    for (const h of holdings) {
      const val = Number(h.shares || 0) * Number(h.current_price || 0);
      groups[h.type] = (groups[h.type] || 0) + val;
    }
    return Object.entries(groups)
      .map(([type, val]) => ({ type, val, label: HOLDING_TYPES.find(t => t.id === type)?.label || type }))
      .sort((a, b) => b.val - a.val);
  }, [holdings]);

  const handleAdd = async () => {
    const shares = parseFloat(form.shares);
    if (!form.symbol) { toast.error('Enter a symbol or name'); return; }
    if (!Number.isFinite(shares) || shares <= 0) { toast.error('Enter valid shares'); return; }
    try {
      await add.mutateAsync({ ...form, shares, cost_basis: parseFloat(form.cost_basis) || 0, current_price: parseFloat(form.current_price) || 0 });
      setForm(BLANK);
      setShowForm(false);
      toast.success('Holding added');
    } catch { toast.error('Failed to add'); }
  };

  const handleEdit = async (id) => {
    try {
      const v = editValues;
      await edit.mutateAsync({ id, ...v, shares: parseFloat(v.shares) || 0, cost_basis: parseFloat(v.cost_basis) || 0, current_price: parseFloat(v.current_price) || 0 });
      setEditId(null);
      toast.success('Updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    try { await remove.mutateAsync(id); toast.success('Removed'); }
    catch { toast.error('Failed to remove'); }
  };

  const startEdit = (h) => {
    setEditId(h.id);
    setEditValues({ symbol: h.symbol, name: h.name, type: h.type, shares: h.shares, cost_basis: h.cost_basis, current_price: h.current_price, notes: h.notes });
  };

  if (isLoading) return <div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />;

  return (
    <div className="space-y-6">

      {/* Summary */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Portfolio Value</p>
            <p className="text-2xl font-bold text-white">{fmtK(totalValue)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-white/70">{fmtK(totalCost)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Gain / Loss</p>
            <p className={cn('text-2xl font-bold', totalValue - totalCost >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {totalValue - totalCost >= 0 ? '+' : ''}{fmtK(totalValue - totalCost)}
            </p>
          </div>
        </div>
      )}

      {/* Allocation by type */}
      {byType.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-4">Allocation</h3>
          <div className="space-y-2.5">
            {byType.map(({ type, val, label }) => {
              const tc = TYPE_COLORS[type] ?? TYPE_COLORS.other;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={tc.color}>{label}</span>
                    <div className="flex items-center gap-2 text-white/50">
                      <span>{fmtK(val)}</span>
                      <span className="text-white/30">{totalValue > 0 ? `${((val / totalValue) * 100).toFixed(0)}%` : '0%'}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className={cn('h-full rounded-full', tc.bg)} style={{ width: totalValue > 0 ? `${(val / totalValue) * 100}%` : '0%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add form */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/70">Holdings</h3>
          <button type="button" onClick={() => setShowForm(p => !p)} className="text-[10px] text-white/40 hover:text-white/70">
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showForm && (
          <div className="mb-5 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Symbol</Label>
                <Input value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} placeholder="AAPL" className="h-9 bg-white/[0.03] border-white/12 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Name</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Apple Inc." className="h-9 bg-white/[0.03] border-white/12 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Type</Label>
                <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full h-9 rounded-lg border border-white/12 bg-[#0d1520] px-2.5 text-sm text-white/80 outline-none">
                  {HOLDING_TYPES.map(t => <option key={t.id} value={t.id} style={{ backgroundColor: '#0d1520' }}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Shares / Units</Label>
                <Input type="number" value={form.shares} onChange={e => set('shares', e.target.value)} placeholder="10" className="h-9 bg-white/[0.03] border-white/12 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Cost Basis ($)</Label>
                <Input type="number" value={form.cost_basis} onChange={e => set('cost_basis', e.target.value)} placeholder="150.00" className="h-9 bg-white/[0.03] border-white/12 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Current Price ($)</Label>
                <Input type="number" value={form.current_price} onChange={e => set('current_price', e.target.value)} placeholder="175.00" className="h-9 bg-white/[0.03] border-white/12 text-sm" />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={add.isPending} className="w-full h-9 bg-emerald-500/90 hover:bg-emerald-500 text-black font-semibold text-sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              {add.isPending ? 'Saving…' : 'Add Holding'}
            </Button>
          </div>
        )}

        {/* Table */}
        {holdings.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-8">No holdings yet</p>
        ) : (
          <div className="space-y-1.5">
            {holdings.map(h => {
              const tc = TYPE_COLORS[h.type] ?? TYPE_COLORS.other;
              const value = Number(h.shares || 0) * Number(h.current_price || 0);
              const cost  = Number(h.shares || 0) * Number(h.cost_basis  || 0);
              const gain  = value - cost;
              const isEditing = editId === h.id;

              if (isEditing) {
                return (
                  <div key={h.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input size="sm" value={editValues.shares} onChange={e => setEditValues(p => ({ ...p, shares: e.target.value }))} placeholder="Shares" className="h-8 bg-white/[0.03] border-white/12 text-xs" />
                      <Input size="sm" value={editValues.cost_basis} onChange={e => setEditValues(p => ({ ...p, cost_basis: e.target.value }))} placeholder="Cost $" className="h-8 bg-white/[0.03] border-white/12 text-xs" />
                      <Input size="sm" value={editValues.current_price} onChange={e => setEditValues(p => ({ ...p, current_price: e.target.value }))} placeholder="Price $" className="h-8 bg-white/[0.03] border-white/12 text-xs" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(h.id)} className="h-7 bg-emerald-500/90 text-black text-xs"><Check className="w-3 h-3 mr-1" />Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-7 text-white/40 text-xs"><X className="w-3 h-3 mr-1" />Cancel</Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={h.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-2.5 hover:border-white/15 transition-colors">
                  <span className={cn('text-[10px] font-bold font-mono w-14 shrink-0', tc.color)}>{h.symbol || '—'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white/80 truncate">{h.name || h.symbol}</span>
                      <span className={cn('text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', tc.bg, tc.color)}>
                        {HOLDING_TYPES.find(t => t.id === h.type)?.label || h.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/35">
                      <span>{h.shares} units</span>
                      <span>@ {fmt(h.current_price)}</span>
                      <span className={gain >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}>{gain >= 0 ? '+' : ''}{fmt(gain)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-white/85">{fmtK(value)}</span>
                    <button type="button" onClick={() => startEdit(h)} className="p-1 text-white/20 hover:text-white/60 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => handleDelete(h.id)} className="p-1 text-white/20 hover:text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
