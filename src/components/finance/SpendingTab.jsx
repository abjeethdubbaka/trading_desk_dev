import React, { useMemo, useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useExpenses, useExpenseMutations } from '@/lib/hooks/useFinance';
import { EXPENSE_CATEGORIES, CATEGORY_MAP, PAYMENT_METHODS, fmt } from './constants';

const getCatDisplay = (exp) =>
  exp.category === 'other' && exp.custom_category?.trim()
    ? { label: exp.custom_category.trim(), color: CATEGORY_MAP.other.color, bg: CATEGORY_MAP.other.bg, border: CATEGORY_MAP.other.border }
    : (CATEGORY_MAP[exp.category] ?? CATEGORY_MAP.other);

export default function SpendingTab({ year, month }) {
  const { data: all = [], isLoading } = useExpenses();
  const { edit, remove } = useExpenseMutations();
  const [filterCat, setFilterCat] = useState('all');
  const [editId, setEditId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const setEv = (k, v) => setEditValues(p => ({ ...p, [k]: v }));
  const customCategories = useMemo(() => [...new Set(all.filter(e => e.category === 'other').map(e => e.custom_category).filter(Boolean))].sort(), [all]);

  const monthExpenses = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return all.filter(e => String(e.date || '').startsWith(prefix));
  }, [all, year, month]);

  const total = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const byCategory = useMemo(() => {
    return EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      total: monthExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + Number(e.amount || 0), 0),
      count: monthExpenses.filter(e => e.category === cat.id).length,
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [monthExpenses]);

  const filtered = filterCat === 'all' ? monthExpenses : monthExpenses.filter(e => e.category === filterCat);
  const sorted = [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleDelete = async (id) => {
    try { await remove.mutateAsync(id); toast.success('Removed'); }
    catch { toast.error('Failed to remove'); }
  };

  const startEdit = (exp) => {
    setEditId(exp.id);
    setEditValues({ amount: exp.amount, category: exp.category, custom_category: exp.custom_category || '', merchant: exp.merchant || '', notes: exp.notes || '', payment_method: exp.payment_method || '', date: exp.date });
  };

  const handleEditSave = async () => {
    const amount = parseFloat(editValues.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await edit.mutateAsync({ id: editId, ...editValues, amount });
      setEditId(null);
      toast.success('Updated');
    } catch { toast.error('Failed to update'); }
  };

  if (isLoading) return <div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 items-start">

      {/* Left: Category breakdown */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/70">This Month by Category</h3>
          <span className="text-base font-bold text-white">{fmt(total)}</span>
        </div>
        {byCategory.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-4">No spending recorded this month</p>
        ) : (
          <div className="space-y-3">
            {byCategory.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCat(filterCat === cat.id ? 'all' : cat.id)}
                className={cn(
                  'w-full text-left space-y-1.5 rounded-lg px-3 py-2.5 transition-colors',
                  filterCat === cat.id ? `${cat.bg} ${cat.border} border` : 'hover:bg-white/[0.04]',
                )}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className={cn('font-semibold', cat.color)}>{cat.label}</span>
                  <div className="flex items-center gap-3 text-white/50">
                    <span>{cat.count} item{cat.count !== 1 ? 's' : ''}</span>
                    <span className="font-semibold text-white/80">{fmt(cat.total)}</span>
                    <span className="text-white/30">{total > 0 ? `${((cat.total / total) * 100).toFixed(0)}%` : '0%'}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', cat.bg.replace('/10', '/70'))}
                    style={{ width: total > 0 ? `${(cat.total / total) * 100}%` : '0%' }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transaction list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">
            Transactions
            {filterCat !== 'all' && (
              <span className={cn('ml-2 text-[10px] font-normal', CATEGORY_MAP[filterCat]?.color)}>
                · {CATEGORY_MAP[filterCat]?.label}
              </span>
            )}
          </h3>
          {filterCat !== 'all' && (
            <button type="button" onClick={() => setFilterCat('all')} className="text-[10px] text-white/35 hover:text-white/60">
              Show all
            </button>
          )}
        </div>

        {sorted.length === 0 && (
          <p className="text-sm text-white/30 text-center py-8">No transactions</p>
        )}

        <div className="space-y-1.5">
          {sorted.map(exp => {
            const cat = CATEGORY_MAP[exp.category] ?? CATEGORY_MAP['other'];

            if (editId === exp.id) {
              const evCat = CATEGORY_MAP[editValues.category] ?? CATEGORY_MAP['other'];
              return (
                <div key={exp.id} className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                        <Input type="number" value={editValues.amount} onChange={e => setEv('amount', e.target.value)} className="pl-6 h-8 bg-white/[0.03] border-white/12 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Date</Label>
                      <Input type="date" value={editValues.date} onChange={e => setEv('date', e.target.value)} className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Category</Label>
                      <select value={editValues.category}
                        onChange={e => { setEv('category', e.target.value); if (e.target.value !== 'other') setEv('custom_category', ''); }}
                        className={cn('w-full h-8 rounded-lg border px-2 text-xs font-semibold outline-none', evCat.color, evCat.bg, evCat.border)}>
                        {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id} style={{ backgroundColor: '#0d1520', color: '#ffffffcc' }}>{c.label}</option>)}
                      </select>
                      {editValues.category === 'other' && (
                        <>
                          <Input list="custom-category-suggestions" value={editValues.custom_category} onChange={e => setEv('custom_category', e.target.value)} onInput={e => setEv('custom_category', e.target.value)} placeholder="Name this category…" className="h-7 mt-1 bg-white/[0.03] border-white/12 text-xs" />
                          <datalist id="custom-category-suggestions">
                            {customCategories.map(c => <option key={c} value={c} />)}
                          </datalist>
                        </>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Payment</Label>
                      <select value={editValues.payment_method} onChange={e => setEv('payment_method', e.target.value)}
                        className="w-full h-8 rounded-lg border border-white/12 bg-[#0d1520] px-2 text-xs text-white/80 outline-none">
                        {PAYMENT_METHODS.map(m => <option key={m} value={m} style={{ backgroundColor: '#0d1520' }}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Merchant</Label>
                      <Input list="merchant-suggestions" value={editValues.merchant} onChange={e => setEv('merchant', e.target.value)} onInput={e => setEv('merchant', e.target.value)} className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Note</Label>
                      <Input value={editValues.notes} onChange={e => setEv('notes', e.target.value)} className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditSave} disabled={edit.isPending} className="h-8 bg-emerald-500/90 hover:bg-emerald-500 text-black text-xs font-semibold">
                      {edit.isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-8 text-white/40 hover:text-white text-xs">Cancel</Button>
                  </div>
                </div>
              );
            }

            const disp = getCatDisplay(exp);
            return (
              <div key={exp.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-2.5 hover:border-white/15 transition-colors">
                <div className={cn('h-2 w-2 rounded-full flex-shrink-0', disp.bg.replace('/10', '/80'))} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/85">{exp.merchant || 'Unnamed'}</span>
                    <span className={cn('text-[9px] font-semibold uppercase tracking-wide', disp.color)}>{disp.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/30">{exp.date}</span>
                    {exp.notes && <span className="text-[10px] text-white/35 truncate">{exp.notes}</span>}
                    {exp.payment_method && <span className="text-[10px] text-white/25">{exp.payment_method}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-white/80">{fmt(exp.amount)}</span>
                  <button type="button" onClick={() => startEdit(exp)} className="p-1 text-white/20 hover:text-white/60 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(exp.id)} className="p-1 text-white/20 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
