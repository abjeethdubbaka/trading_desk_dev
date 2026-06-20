import React, { useMemo, useState } from 'react';
import { PlusCircle, Trash2, Receipt, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useExpenses, useExpenseMutations, useIncome } from '@/lib/hooks/useFinance';
import { EXPENSE_CATEGORIES, CATEGORY_MAP, PAYMENT_METHODS, fmt, todayISO, getIncomeDisplay } from './constants';

const BLANK = { amount: '', category: 'food', custom_category: '', merchant: '', notes: '', payment_method: 'Credit Card', date: todayISO() };

const getCatDisplay = (exp) =>
  exp.category === 'other' && exp.custom_category?.trim()
    ? { label: exp.custom_category.trim(), color: CATEGORY_MAP.other.color, bg: CATEGORY_MAP.other.bg, border: CATEGORY_MAP.other.border }
    : (CATEGORY_MAP[exp.category] ?? CATEGORY_MAP.other);

export default function TodayTab() {
  const { data: all = [], isLoading } = useExpenses();
  const { data: allIncome = [] } = useIncome();
  const { add, edit, remove } = useExpenseMutations();
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const selectedDate = form.date;
  const todayExpenses = all.filter(e => e.date === selectedDate);
  const todayTotal = todayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const todayIncome = allIncome.filter(e => e.date === selectedDate);
  const todayIncomeTotal = todayIncome.reduce((s, e) => s + Number(e.amount || 0), 0);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleAdd = async () => {
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!form.category) { toast.error('Select a category'); return; }
    try {
      await add.mutateAsync({ ...form, amount });
      setForm({ ...BLANK, category: form.category, payment_method: form.payment_method, date: form.date });
      toast.success('Expense logged');
    } catch {
      toast.error('Failed to log expense');
    }
  };

  const handleDelete = async (id) => {
    try { await remove.mutateAsync(id); toast.success('Removed'); }
    catch { toast.error('Failed to remove'); }
  };

  const startEdit = (exp) => {
    setEditId(exp.id);
    setEditValues({ amount: exp.amount, category: exp.category, custom_category: exp.custom_category || '', merchant: exp.merchant || '', notes: exp.notes || '', payment_method: exp.payment_method || 'Credit Card', date: exp.date });
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

  const setEv = (k, v) => setEditValues(p => ({ ...p, [k]: v }));

  const merchants       = useMemo(() => [...new Set(all.map(e => e.merchant).filter(Boolean))].sort(), [all]);
  const notes           = useMemo(() => [...new Set(all.map(e => e.notes).filter(Boolean))].sort(), [all]);
  const customCategories = useMemo(() => [...new Set(all.filter(e => e.category === 'other').map(e => e.custom_category).filter(Boolean))].sort(), [all]);

  const catBySpend = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: todayExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + Number(e.amount || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">

      {/* ── Quick Add Form ── */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Log Expense</h3>
            <span className="text-[10px] text-white/35">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>

          {/* Amount — hero input */}
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-widest text-white/40">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-lg">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="0.00"
                className="pl-7 h-12 text-xl font-bold bg-white/[0.03] border-white/12 focus-visible:ring-emerald-500/30"
                autoFocus
              />
            </div>
          </div>

          {/* Category dropdown */}
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-widest text-white/40">Category</Label>
            <select
              value={form.category}
              onChange={e => { set('category', e.target.value); if (e.target.value !== 'other') set('custom_category', ''); }}
              className={cn(
                'w-full h-9 rounded-lg border px-2.5 text-sm font-semibold outline-none transition-colors',
                CATEGORY_MAP[form.category]
                  ? `${CATEGORY_MAP[form.category].color} ${CATEGORY_MAP[form.category].bg} ${CATEGORY_MAP[form.category].border}`
                  : 'text-white/80 bg-white/[0.03] border-white/12',
              )}
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id} style={{ backgroundColor: '#0d1520', color: '#ffffffcc' }}>
                  {cat.label}
                </option>
              ))}
            </select>
            {form.category === 'other' && (
              <>
                <Input
                  list="custom-category-suggestions"
                  value={form.custom_category}
                  onChange={e => set('custom_category', e.target.value)}
                  onInput={e => set('custom_category', e.target.value)}
                  placeholder="Name this category…"
                  className="h-8 mt-1.5 bg-white/[0.03] border-white/12 text-sm"
                  autoFocus
                />
                <datalist id="custom-category-suggestions">
                  {customCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="h-9 bg-white/[0.03] border-white/12 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Merchant</Label>
              <Input
                list="merchant-suggestions"
                value={form.merchant}
                onChange={e => set('merchant', e.target.value)}
                onInput={e => set('merchant', e.target.value)}
                placeholder="Starbucks"
                className="h-9 bg-white/[0.03] border-white/12 text-sm"
              />
              <datalist id="merchant-suggestions">
                {merchants.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Payment</Label>
              <select
                value={form.payment_method}
                onChange={e => set('payment_method', e.target.value)}
                className="w-full h-9 rounded-lg border border-white/12 bg-[#0d1520] px-2.5 text-sm text-white/80 outline-none"
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m} style={{ backgroundColor: '#0d1520' }}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Note (optional)</Label>
              <Input
                list="notes-suggestions"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                onInput={e => set('notes', e.target.value)}
                placeholder="What was this for?"
                className="h-9 bg-white/[0.03] border-white/12 text-sm"
              />
              <datalist id="notes-suggestions">
                {notes.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={add.isPending}
            className="w-full h-10 bg-emerald-500/90 hover:bg-emerald-500 text-black font-semibold"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {add.isPending ? 'Saving…' : 'Add Expense'}
          </Button>
        </div>

        {/* Today summary */}
        {catBySpend.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/40">Today by Category</span>
              <span className="text-sm font-bold text-white">{fmt(todayTotal)}</span>
            </div>
            {catBySpend.map(cat => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={cat.color}>{cat.label}</span>
                  <span className="text-white/70">{fmt(cat.total)}</span>
                </div>
                <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', cat.bg.replace('/10', '/60'))}
                    style={{ width: `${(cat.total / todayTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Today's list ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">
            {selectedDate === todayISO() ? "Today's Expenses" : selectedDate}
            {todayExpenses.length > 0 && <span className="ml-2 text-white/35">({todayExpenses.length})</span>}
          </h3>
          {todayTotal > 0 && (
            <span className="text-base font-bold text-white">{fmt(todayTotal)}</span>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />)}
          </div>
        )}

        {!isLoading && todayExpenses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <Receipt className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">No expenses for {selectedDate === todayISO() ? 'today' : selectedDate}</p>
            <p className="text-xs text-white/25 mt-1">Add your first expense above</p>
          </div>
        )}

        <div className="space-y-2">
          {todayExpenses.map(exp => {
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
                        <Input list="custom-category-suggestions" value={editValues.custom_category} onChange={e => setEv('custom_category', e.target.value)} onInput={e => setEv('custom_category', e.target.value)} placeholder="Name this category…" className="h-7 mt-1 bg-white/[0.03] border-white/12 text-xs" />
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
                      <Input list="merchant-suggestions" value={editValues.merchant} onChange={e => setEv('merchant', e.target.value)} onInput={e => setEv('merchant', e.target.value)} placeholder="Starbucks" className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Note</Label>
                      <Input list="notes-suggestions" value={editValues.notes} onChange={e => setEv('notes', e.target.value)} onInput={e => setEv('notes', e.target.value)} placeholder="optional" className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditSave} disabled={edit.isPending} className="h-8 bg-emerald-500/90 hover:bg-emerald-500 text-black text-xs font-semibold">
                      <Check className="w-3.5 h-3.5 mr-1" />{edit.isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-8 text-white/40 hover:text-white text-xs">
                      <X className="w-3.5 h-3.5 mr-1" />Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            const disp = getCatDisplay(exp);
            return (
              <div key={exp.id} className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', disp.border, disp.bg)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide', disp.color)}>{disp.label}</span>
                    {exp.payment_method && <span className="text-[9px] text-white/25">{exp.payment_method}</span>}
                  </div>
                  <p className="text-sm font-semibold text-white/90 mt-0.5">{exp.merchant || 'Unnamed'}</p>
                  {exp.notes && <p className="text-[11px] text-white/40 mt-0.5 truncate">{exp.notes}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-base font-bold text-white">{fmt(exp.amount)}</span>
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

        {/* Today's income */}
        {todayIncome.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-emerald-400/80">Income Today</h3>
              <span className="text-sm font-bold text-emerald-400">+{fmt(todayIncomeTotal)}</span>
            </div>
            {todayIncome.map(entry => {
              const disp = getIncomeDisplay(entry);
              return (
                <div key={entry.id} className={cn('flex items-center gap-3 rounded-xl border px-4 py-2.5', disp.border, disp.bg)}>
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide', disp.color)}>{disp.label}</span>
                    <p className="text-sm font-semibold text-white/85">{entry.source || 'Income'}</p>
                  </div>
                  <span className={cn('text-sm font-bold', disp.color)}>+{fmt(entry.amount)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Net cash flow for the day */}
        {(todayTotal > 0 || todayIncomeTotal > 0) && (
          <div className={cn('mt-3 rounded-xl border px-4 py-3 flex items-center justify-between',
            todayIncomeTotal - todayTotal >= 0 ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-amber-500/20 bg-amber-500/5')}>
            <span className="text-xs text-white/50">Net for {selectedDate === todayISO() ? 'today' : selectedDate}</span>
            <span className={cn('text-sm font-bold', todayIncomeTotal - todayTotal >= 0 ? 'text-cyan-400' : 'text-amber-400')}>
              {todayIncomeTotal - todayTotal >= 0 ? '+' : ''}{fmt(todayIncomeTotal - todayTotal)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
