import React, { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useExpenses } from '@/lib/hooks/useFinance';
import { useBudget, useBudgetMutations } from '@/lib/hooks/useFinance';
import { EXPENSE_CATEGORIES, CATEGORY_MAP, fmt } from './constants';

export default function BudgetTab({ year, month }) {
  const { data: budgets = [], isLoading: budgetLoading } = useBudget();
  const { data: expenses = [], isLoading: expenseLoading } = useExpenses();
  const { upsert, remove } = useBudgetMutations();

  const [editCat, setEditCat] = useState(null);
  const [limitInput, setLimitInput] = useState('');

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

  const monthExpenses = useMemo(
    () => expenses.filter(e => String(e.date || '').startsWith(monthPrefix)),
    [expenses, monthPrefix],
  );

  const spendByCategory = useMemo(() => {
    const map = {};
    for (const e of monthExpenses) {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
    }
    return map;
  }, [monthExpenses]);

  const budgetByCategory = useMemo(() => {
    const map = {};
    for (const b of budgets) {
      if (b.year === year && b.month === month) map[b.category] = b;
    }
    return map;
  }, [budgets, year, month]);

  const totalBudgeted = Object.values(budgetByCategory).reduce((s, b) => s + Number(b.limit || 0), 0);
  const totalSpent = Object.values(spendByCategory).reduce((s, v) => s + v, 0);

  const handleSave = async (catId) => {
    const limit = parseFloat(limitInput);
    if (!Number.isFinite(limit) || limit < 0) { toast.error('Enter a valid amount'); return; }
    try {
      await upsert.mutateAsync({ category: catId, year, month, limit });
      setEditCat(null);
      setLimitInput('');
      toast.success('Budget saved');
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    try { await remove.mutateAsync(id); toast.success('Removed'); }
    catch { toast.error('Failed to remove'); }
  };

  const isLoading = budgetLoading || expenseLoading;
  if (isLoading) return <div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />;

  const rows = EXPENSE_CATEGORIES.map(cat => {
    const spent = spendByCategory[cat.id] || 0;
    const budget = budgetByCategory[cat.id];
    const limit = budget ? Number(budget.limit) : null;
    const pct = limit ? Math.min((spent / limit) * 100, 100) : null;
    const over = limit != null && spent > limit;
    const nearLimit = limit != null && !over && pct != null && pct >= 80;
    return { ...cat, spent, limit, budget, pct, over, nearLimit };
  }).filter(r => r.spent > 0 || r.limit != null);

  const untracked = EXPENSE_CATEGORIES.filter(cat => !rows.find(r => r.id === cat.id));

  return (
    <div className="space-y-6">

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Budgeted</p>
          <p className="text-2xl font-bold text-white/85">{fmt(totalBudgeted)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Spent</p>
          <p className="text-2xl font-bold text-white">{fmt(totalSpent)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Remaining</p>
          <p className={cn('text-2xl font-bold', totalBudgeted - totalSpent >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {fmt(Math.abs(totalBudgeted - totalSpent))}
            {totalBudgeted - totalSpent < 0 && <span className="text-sm ml-1">over</span>}
          </p>
        </div>
      </div>

      {/* Category budget rows */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/70">By Category</h3>

        {rows.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">No spending or budget limits set yet</p>
        )}

        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-semibold', row.color)}>{row.label}</span>
                  {row.over && <span className="text-[9px] font-semibold text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded">OVER</span>}
                  {row.nearLimit && !row.over && <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">NEAR LIMIT</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-bold', row.over ? 'text-rose-400' : 'text-white/80')}>{fmt(row.spent)}</span>
                  {row.limit != null && <span className="text-[11px] text-white/35">/ {fmt(row.limit)}</span>}
                  {editCat === row.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={limitInput}
                        onChange={e => setLimitInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(row.id); if (e.key === 'Escape') setEditCat(null); }}
                        placeholder="limit"
                        className="h-7 w-24 bg-white/[0.05] border-white/15 text-xs"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSave(row.id)} className="h-7 px-2 bg-emerald-500/90 text-black text-xs">Set</Button>
                      <button type="button" onClick={() => setEditCat(null)} className="text-[10px] text-white/35 hover:text-white/60">Cancel</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditCat(row.id); setLimitInput(row.limit != null ? String(row.limit) : ''); }}
                      className="text-[10px] text-white/30 hover:text-white/60 underline"
                    >
                      {row.limit != null ? 'edit' : 'set limit'}
                    </button>
                  )}
                  {row.budget && (
                    <button type="button" onClick={() => handleDelete(row.budget.id)} className="p-1 text-white/15 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {row.limit != null && (
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', row.over ? 'bg-rose-500/70' : row.nearLimit ? 'bg-amber-500/70' : row.bg.replace('/10', '/60'))}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick-add budgets for untracked categories */}
        {untracked.length > 0 && (
          <div className="pt-3 border-t border-white/8">
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Set limits for other categories</p>
            <div className="flex flex-wrap gap-2">
              {untracked.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setEditCat(cat.id); setLimitInput(''); }}
                  className={cn('text-[10px] font-semibold px-2 py-1 rounded-md border transition-colors', cat.color, 'border-white/10 hover:border-white/25 bg-white/[0.02]')}
                >
                  + {cat.label}
                </button>
              ))}
            </div>
            {editCat && !rows.find(r => r.id === editCat) && (
              <div className="mt-3 flex items-center gap-2">
                <span className={cn('text-sm font-semibold', CATEGORY_MAP[editCat]?.color)}>{CATEGORY_MAP[editCat]?.label}</span>
                <Input
                  type="number"
                  value={limitInput}
                  onChange={e => setLimitInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(editCat); if (e.key === 'Escape') setEditCat(null); }}
                  placeholder="monthly limit"
                  className="h-8 w-32 bg-white/[0.03] border-white/12 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleSave(editCat)} className="h-8 bg-emerald-500/90 text-black text-xs">Save</Button>
                <button type="button" onClick={() => setEditCat(null)} className="text-[10px] text-white/35 hover:text-white/60">Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
