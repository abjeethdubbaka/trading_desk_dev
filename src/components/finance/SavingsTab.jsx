import React, { useMemo, useState } from 'react';
import { PlusCircle, Trash2, Pencil, Check, X, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSavingsGoals, useSavingsContributions, useSavingsMutations } from '@/lib/hooks/useFinance';
import { fmt, fmtK, todayISO } from './constants';

const GOAL_COLORS = [
  { id: 'emerald', label: 'Emerald', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', bar: 'bg-emerald-500/70' },
  { id: 'blue',    label: 'Blue',    color: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500/30',    bar: 'bg-blue-500/70'    },
  { id: 'violet',  label: 'Violet',  color: 'text-violet-400',  bg: 'bg-violet-500/15',  border: 'border-violet-500/30',  bar: 'bg-violet-500/70'  },
  { id: 'cyan',    label: 'Cyan',    color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    border: 'border-cyan-500/30',    bar: 'bg-cyan-500/70'    },
  { id: 'orange',  label: 'Orange',  color: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/30',  bar: 'bg-orange-500/70'  },
  { id: 'pink',    label: 'Pink',    color: 'text-pink-400',    bg: 'bg-pink-500/15',    border: 'border-pink-500/30',    bar: 'bg-pink-500/70'    },
  { id: 'yellow',  label: 'Yellow',  color: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30',  bar: 'bg-yellow-500/70'  },
];
const COLOR_MAP = Object.fromEntries(GOAL_COLORS.map(c => [c.id, c]));
const DEFAULT_COLOR = GOAL_COLORS[0];

const BLANK_GOAL = { name: '', target_amount: '', notes: '', color: 'emerald', target_date: '' };
const BLANK_CONTRIB = { amount: '', date: todayISO(), notes: '' };

export default function SavingsTab() {
  const { data: goals = [], isLoading: goalsLoading } = useSavingsGoals();
  const { data: contributions = [], isLoading: contribLoading } = useSavingsContributions();
  const { addGoal, editGoal, deleteGoal, addContribution, deleteContribution } = useSavingsMutations();

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState(BLANK_GOAL);
  const [editGoalId, setEditGoalId] = useState(null);
  const [editGoalValues, setEditGoalValues] = useState({});

  const [activeGoalId, setActiveGoalId] = useState(null);
  const [contribForm, setContribForm] = useState(BLANK_CONTRIB);
  const [expandedGoalId, setExpandedGoalId] = useState(null);

  const setGf = (k, v) => setGoalForm(p => ({ ...p, [k]: v }));
  const setEg = (k, v) => setEditGoalValues(p => ({ ...p, [k]: v }));
  const setCf = (k, v) => setContribForm(p => ({ ...p, [k]: v }));

  const savedByGoal = useMemo(() => {
    const map = {};
    for (const c of contributions) {
      map[c.goal_id] = (map[c.goal_id] || 0) + Number(c.amount || 0);
    }
    return map;
  }, [contributions]);

  const totalSaved  = Object.values(savedByGoal).reduce((s, v) => s + v, 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount || 0), 0);

  const handleAddGoal = async () => {
    if (!goalForm.name.trim()) { toast.error('Enter a goal name'); return; }
    const target = parseFloat(goalForm.target_amount);
    if (!Number.isFinite(target) || target <= 0) { toast.error('Enter a target amount'); return; }
    try {
      await addGoal.mutateAsync({ ...goalForm, target_amount: target });
      setGoalForm(BLANK_GOAL);
      setShowGoalForm(false);
      toast.success('Goal created');
    } catch { toast.error('Failed to create goal'); }
  };

  const startEditGoal = (g) => {
    setEditGoalId(g.id);
    setEditGoalValues({ name: g.name, target_amount: g.target_amount, notes: g.notes || '', color: g.color || 'emerald', target_date: g.target_date || '' });
  };

  const handleEditGoalSave = async () => {
    if (!editGoalValues.name?.trim()) { toast.error('Enter a goal name'); return; }
    const target = parseFloat(editGoalValues.target_amount);
    if (!Number.isFinite(target) || target <= 0) { toast.error('Enter a target amount'); return; }
    try {
      await editGoal.mutateAsync({ id: editGoalId, ...editGoalValues, target_amount: target });
      setEditGoalId(null);
      toast.success('Goal updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleDeleteGoal = async (id) => {
    try { await deleteGoal.mutateAsync(id); toast.success('Goal removed'); }
    catch { toast.error('Failed to remove'); }
  };

  const handleAddContribution = async (goalId) => {
    const amount = parseFloat(contribForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await addContribution.mutateAsync({ ...contribForm, amount, goal_id: goalId });
      setContribForm(BLANK_CONTRIB);
      setActiveGoalId(null);
      toast.success('Contribution added');
    } catch { toast.error('Failed to add'); }
  };

  const handleDeleteContribution = async (id) => {
    try { await deleteContribution.mutateAsync(id); toast.success('Removed'); }
    catch { toast.error('Failed to remove'); }
  };

  const isLoading = goalsLoading || contribLoading;
  if (isLoading) return <div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />;

  return (
    <div className="space-y-6">

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 mb-1">Total Saved</p>
            <p className="text-2xl font-bold text-emerald-400">{fmtK(totalSaved)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Target</p>
            <p className="text-2xl font-bold text-white/80">{fmtK(totalTarget)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Remaining</p>
            <p className="text-2xl font-bold text-white/60">{fmtK(Math.max(0, totalTarget - totalSaved))}</p>
          </div>
        </div>
      )}

      {/* Add goal button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">Savings Goals</h3>
        <button type="button" onClick={() => setShowGoalForm(p => !p)}
          className="text-[10px] text-emerald-400/70 hover:text-emerald-400 font-semibold">
          {showGoalForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {/* Add goal form */}
      {showGoalForm && (
        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Goal Name</Label>
              <Input value={goalForm.name} onChange={e => setGf('name', e.target.value)}
                placeholder="Emergency Fund" className="h-9 bg-white/[0.03] border-white/12 text-sm" autoFocus />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Target Amount ($)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <Input type="number" value={goalForm.target_amount} onChange={e => setGf('target_amount', e.target.value)}
                  placeholder="10,000" className="pl-6 h-9 bg-white/[0.03] border-white/12 text-sm" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Target Date (optional)</Label>
              <Input type="date" value={goalForm.target_date} onChange={e => setGf('target_date', e.target.value)}
                className="h-9 bg-white/[0.03] border-white/12 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Notes</Label>
              <Input value={goalForm.notes} onChange={e => setGf('notes', e.target.value)}
                placeholder="optional" className="h-9 bg-white/[0.03] border-white/12 text-sm" />
            </div>
          </div>
          {/* Color picker */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-white/40">Color</Label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c.id} type="button" onClick={() => setGf('color', c.id)}
                  className={cn('h-7 w-7 rounded-full border-2 transition-all', c.bar,
                    goalForm.color === c.id ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100')} />
              ))}
            </div>
          </div>
          <Button onClick={handleAddGoal} disabled={addGoal.isPending}
            className="w-full h-9 bg-emerald-500/90 hover:bg-emerald-500 text-black font-semibold text-sm">
            <Target className="w-4 h-4 mr-2" />
            {addGoal.isPending ? 'Creating…' : 'Create Goal'}
          </Button>
        </div>
      )}

      {/* Goal cards */}
      {goals.length === 0 && !showGoalForm && (
        <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <Target className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/40">No savings goals yet</p>
          <p className="text-xs text-white/25 mt-1">Create your first goal to start tracking</p>
        </div>
      )}

      <div className="space-y-4">
        {goals.map(goal => {
          const c = COLOR_MAP[goal.color] ?? DEFAULT_COLOR;
          const saved = savedByGoal[goal.id] || 0;
          const target = Number(goal.target_amount || 0);
          const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
          const isComplete = pct >= 100;
          const goalContribs = contributions.filter(x => x.goal_id === goal.id).sort((a, b) => b.date.localeCompare(a.date));
          const isExpanded = expandedGoalId === goal.id;
          const isAddingContrib = activeGoalId === goal.id;
          const isEditing = editGoalId === goal.id;

          return (
            <div key={goal.id} className={cn('rounded-2xl border p-5 space-y-4', c.border, c.bg)}>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Goal Name</Label>
                      <Input value={editGoalValues.name} onChange={e => setEg('name', e.target.value)}
                        className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Target ($)</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                        <Input type="number" value={editGoalValues.target_amount} onChange={e => setEg('target_amount', e.target.value)}
                          className="pl-6 h-8 bg-white/[0.03] border-white/12 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Target Date</Label>
                      <Input type="date" value={editGoalValues.target_date} onChange={e => setEg('target_date', e.target.value)}
                        className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40">Notes</Label>
                      <Input value={editGoalValues.notes} onChange={e => setEg('notes', e.target.value)}
                        className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {GOAL_COLORS.map(gc => (
                      <button key={gc.id} type="button" onClick={() => setEg('color', gc.id)}
                        className={cn('h-6 w-6 rounded-full border-2 transition-all', gc.bar,
                          editGoalValues.color === gc.id ? 'border-white scale-110' : 'border-transparent opacity-60')} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditGoalSave} disabled={editGoal.isPending}
                      className="h-8 bg-emerald-500/90 hover:bg-emerald-500 text-black text-xs font-semibold">
                      <Check className="w-3.5 h-3.5 mr-1" />{editGoal.isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditGoalId(null)}
                      className="h-8 text-white/40 hover:text-white text-xs">
                      <X className="w-3.5 h-3.5 mr-1" />Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={cn('text-base font-bold', c.color)}>{goal.name}</h4>
                        {isComplete && <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">COMPLETE</span>}
                      </div>
                      {goal.notes && <p className="text-[11px] text-white/40 mt-0.5">{goal.notes}</p>}
                      {goal.target_date && <p className="text-[10px] text-white/30 mt-0.5">Target: {goal.target_date}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => startEditGoal(goal)}
                        className="p-1.5 text-white/20 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 text-white/20 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <span className={cn('text-2xl font-bold', c.color)}>{fmt(saved)}</span>
                      <span className="text-sm text-white/40">of {fmt(target)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-black/30 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', c.bar)}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <span>{pct.toFixed(0)}% complete</span>
                      <span>{fmt(Math.max(0, target - saved))} remaining</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setActiveGoalId(isAddingContrib ? null : goal.id); setContribForm(BLANK_CONTRIB); }}
                      className={cn('h-8 text-xs font-semibold flex-1', isAddingContrib ? 'bg-white/10 text-white/60' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400')}>
                      <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      {isAddingContrib ? 'Cancel' : 'Add Contribution'}
                    </Button>
                    {goalContribs.length > 0 && (
                      <button type="button" onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                        className="h-8 px-3 text-[10px] text-white/35 hover:text-white/60 flex items-center gap-1 rounded-lg hover:bg-white/5 transition-colors">
                        {goalContribs.length} entries
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Contribution form */}
                  {isAddingContrib && (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-widest text-white/40">Amount ($)</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                            <Input type="number" value={contribForm.amount} onChange={e => setCf('amount', e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAddContribution(goal.id)}
                              placeholder="0.00" className="pl-6 h-8 bg-white/[0.03] border-white/12 text-sm" autoFocus />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-widest text-white/40">Date</Label>
                          <Input type="date" value={contribForm.date} onChange={e => setCf('date', e.target.value)}
                            className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-white/40">Notes (optional)</Label>
                        <Input value={contribForm.notes} onChange={e => setCf('notes', e.target.value)}
                          placeholder="Monthly deposit…" className="h-8 bg-white/[0.03] border-white/12 text-sm" />
                      </div>
                      <Button size="sm" onClick={() => handleAddContribution(goal.id)}
                        disabled={addContribution.isPending}
                        className="w-full h-8 bg-emerald-500/90 hover:bg-emerald-500 text-black text-xs font-semibold">
                        {addContribution.isPending ? 'Saving…' : 'Add'}
                      </Button>
                    </div>
                  )}

                  {/* Contribution history */}
                  {isExpanded && goalContribs.length > 0 && (
                    <div className="space-y-1.5">
                      {goalContribs.map(contrib => (
                        <div key={contrib.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-white/40">{contrib.date}</span>
                            {contrib.notes && <span className="ml-2 text-[10px] text-white/30 truncate">{contrib.notes}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn('text-sm font-semibold', c.color)}>+{fmt(contrib.amount)}</span>
                            <button type="button" onClick={() => handleDeleteContribution(contrib.id)}
                              className="p-0.5 text-white/15 hover:text-rose-400 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
