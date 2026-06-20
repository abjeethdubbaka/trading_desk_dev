import React, { useMemo, useState } from 'react';
import { PlusCircle, Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useIncome, useIncomeMutations } from '@/lib/hooks/useFinance';
import { useExpenses } from '@/lib/hooks/useFinance';
import { INCOME_CATEGORIES, INCOME_CATEGORY_MAP, getIncomeDisplay, fmt, fmtK, todayISO } from './constants';

const BLANK = { amount: '', category: 'salary', custom_category: '', source: '', notes: '', date: todayISO() };

export default function IncomeTab({ year, month }) {
  const { data: all = [], isLoading } = useIncome();
  const { data: expenses = [] } = useExpenses();
  const { add, edit, remove } = useIncomeMutations();

  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

  const monthIncome = useMemo(
    () => all.filter(e => String(e.date || '').startsWith(monthPrefix)),
    [all, monthPrefix],
  );
  const monthExpenses = useMemo(
    () => expenses.filter(e => String(e.date || '').startsWith(monthPrefix)),
    [expenses, monthPrefix],
  );

  const totalIncome   = monthIncome.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netCashFlow   = totalIncome - totalExpenses;

  const sources = useMemo(() => [...new Set(all.map(e => e.source).filter(Boolean))].sort(), [all]);

  const byCategory = useMemo(() => {
    return INCOME_CATEGORIES.map(cat => ({
      ...cat,
      total: monthIncome
        .filter(e => e.category === cat.id)
        .reduce((s, e) => s + Number(e.amount || 0), 0),
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [monthIncome]);

  const sorted = useMemo(
    () => [...monthIncome].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [monthIncome],
  );

  const set  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setEv = (k, v) => setEditValues(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await add.mutateAsync({ ...form, amount });
      setForm({ ...BLANK, category: form.category });
      setShowForm(false);
      toast.success('Income logged');
    } catch { toast.error('Failed to save'); }
  };

  const startEdit = (e) => {
    setEditId(e.id);
    setEditValues({ amount: e.amount, category: e.category, custom_category: e.custom_category || '', source: e.source || '', notes: e.notes || '', date: e.date });
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

  const handleDelete = async (id) => {
    try { await remove.mutateAsync(id); toast.success('Removed'); }
    catch { toast.error('Failed to remove'); }
  };

  if (isLoading) return <div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />;

  return (
    <div className="space-y-5">

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 mb-1">Income</p>
          <p className="text-2xl font-bold text-emerald-400">{fmtK(totalIncome)}</p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-rose-400/70 mb-1">Expenses</p>
          <p className="text-2xl font-bold text-rose-400">{fmtK(totalExpenses)}</p>
        </div>
        <div className={cn('rounded-2xl border p-4', netCashFlow >= 0 ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-amber-500/20 bg-amber-500/5')}>
          <p className={cn('text-[10px] uppercase tracking-widest mb-1', netCashFlow >= 0 ? 'text-cyan-400/70' : 'text-amber-400/70')}>Net Cash Flow</p>
          <p className={cn('text-2xl font-bold', netCashFlow >= 0 ? 'text-cyan-400' : 'text-amber-400')}>
            {netCashFlow >= 0 ? '+' : ''}{fmtK(netCashFlow)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 items-start">

        {/* Left: By source breakdown */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-4">By Source</h3>
          {byCategory.length === 0
            ? <p className="text-sm text-white/30 text-center py-4">No income this month</p>
            : (
              <div className="space-y-3">
                {byCategory.map(cat => (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={cn('font-semibold', cat.color)}>{cat.label}</span>
                      <div className="flex items-center gap-2 text-white/50">
                        <span className="font-semibold text-white/80">{fmt(cat.total)}</span>
                        <span className="text-white/30">{totalIncome > 0 ? `${((cat.total / totalIncome) * 100).toFixed(0)}%` : '0%'}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className={cn('h-full rounded-full', cat.bg.replace('/10', '/60'))}
                        style={{ width: totalIncome > 0 ? `${(cat.total / totalIncome) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Right: Add form + entries */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/70">Income Entries</h3>
            <button type="button" onClick={() => setShowForm(p => !p)}
              className="text-[10px] text-emerald-400/70 hover:text-emerald-400 font-semibold">
              {showForm ? 'Cancel' : '+ Add Income'}
            </button>
          </div>

          {showForm && (
            <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <Input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      placeholder="0.00" className="pl-6 h-9 bg-white/[0.03] border-white/12 text-sm" autoFocus />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Date</Label>
                  <Input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                    className="h-9 bg-white/[0.03] border-white/12 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Category</Label>
                  <select value={form.category}
                    onChange={e => { set('category', e.target.value); if (e.target.value !== 'other') set('custom_category', ''); }}
                    className={cn('w-full h-9 rounded-lg border px-2.5 text-sm font-semibold outline-none transition-colors',
                      INCOME_CATEGORY_MAP[form.category]?.color,
                      INCOME_CATEGORY_MAP[form.category]?.bg,
                      INCOME_CATEGORY_MAP[form.category]?.border,
                    )}>
                    {INCOME_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: '#0d1520', color: '#ffffffcc' }}>{c.label}</option>
                    ))}
                  </select>
                  {form.category === 'other' && (
                    <Input value={form.custom_category} onChange={e => set('custom_category', e.target.value)}
                      placeholder="Name this category…" className="h-8 mt-1.5 bg-white/[0.03] border-white/12 text-sm" />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Source</Label>
                  <Input list="income-source-suggestions" value={form.source} onChange={e => set('source', e.target.value)}
                    onInput={e => set('source', e.target.value)}
                    placeholder="Company / Client" className="h-9 bg-white/[0.03] border-white/12 text-sm" />
                  <datalist id="income-source-suggestions">
                    {sources.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Notes (optional)</Label>
                <Input value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Pay period, invoice #, etc." className="h-9 bg-white/[0.03] border-white/12 text-sm" />
              </div>
              <Button onClick={handleAdd} disabled={add.isPending}
                className="w-full h-9 bg-emerald-500/90 hover:bg-emerald-500 text-black font-semibold text-sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                {add.isPending ? 'Saving…' : 'Add Income'}
              </Button>
            </div>
          )}

          {sorted.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">No income recorded this month</p>
          ) : (
            <div className="space-y-1.5">
              {sorted.map(entry => {
                const disp = getIncomeDisplay(entry);
                if (editId === entry.id) {
                  const evCat = INCOME_CATEGORY_MAP[editValues.category] ?? INCOME_CATEGORY_MAP.other;
                  return (
                    <div key={entry.id} className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-widest text-white/40">Amount</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                            <Input type="number" value={editValues.amount} onChange={e => setEv('amount', e.target.value)}
                              className="pl-6 h-8 bg-white/[0.03] border-white/12 text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-widest text-white/40">Date</Label>
                          <Input type="date" value={editValues.date} onChange={e => setEv('date', e.target.value)}
                            className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-widest text-white/40">Category</Label>
                          <select value={editValues.category}
                            onChange={e => { setEv('category', e.target.value); if (e.target.value !== 'other') setEv('custom_category', ''); }}
                            className={cn('w-full h-8 rounded-lg border px-2 text-xs font-semibold outline-none', evCat.color, evCat.bg, evCat.border)}>
                            {INCOME_CATEGORIES.map(c => <option key={c.id} value={c.id} style={{ backgroundColor: '#0d1520', color: '#ffffffcc' }}>{c.label}</option>)}
                          </select>
                          {editValues.category === 'other' && (
                            <Input value={editValues.custom_category} onChange={e => setEv('custom_category', e.target.value)}
                              placeholder="Name this category…" className="h-7 mt-1 bg-white/[0.03] border-white/12 text-xs" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-widest text-white/40">Source</Label>
                          <Input list="income-source-suggestions" value={editValues.source}
                            onChange={e => setEv('source', e.target.value)} onInput={e => setEv('source', e.target.value)}
                            className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-white/40">Notes</Label>
                        <Input value={editValues.notes} onChange={e => setEv('notes', e.target.value)}
                          className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleEditSave} disabled={edit.isPending}
                          className="h-8 bg-emerald-500/90 hover:bg-emerald-500 text-black text-xs font-semibold">
                          <Check className="w-3.5 h-3.5 mr-1" />{edit.isPending ? 'Saving…' : 'Save'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)}
                          className="h-8 text-white/40 hover:text-white text-xs">
                          <X className="w-3.5 h-3.5 mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={entry.id} className={cn('flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors hover:border-white/20', disp.border, disp.bg)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] font-semibold uppercase tracking-wide', disp.color)}>{disp.label}</span>
                        <span className="text-[10px] text-white/30">{entry.date}</span>
                      </div>
                      <p className="text-sm font-semibold text-white/85 mt-0.5">{entry.source || 'Unnamed'}</p>
                      {entry.notes && <p className="text-[11px] text-white/40 mt-0.5 truncate">{entry.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn('text-base font-bold', disp.color)}>+{fmt(entry.amount)}</span>
                      <button type="button" onClick={() => startEdit(entry)} className="p-1 text-white/20 hover:text-white/60 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(entry.id)} className="p-1 text-white/20 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
