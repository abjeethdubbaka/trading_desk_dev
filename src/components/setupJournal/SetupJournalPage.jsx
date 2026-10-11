import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Link2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/general';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSetupJournal } from '@/lib/hooks/useSetupJournal';
import {
  getEntryCompletion,
  filterTradesOnDate,
  EXECUTION_GRADE_FIELD_ID,
  getExecutionGradeFromTrade,
  getJournalableTrades,
  getTemplateForEntry,
  mergeEntryWithTrade,
  normalizeJournalEntry,
  tradeToJournalDefaults,
} from '@/lib/setupJournal/utils';

const todayISO = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  trade_id: '',
  traded_on: todayISO(),
  symbol: '',
  answers: {},
  responses: {},
  r_multiple: '',
  mfe_r: '',
  mae_r: '',
  note: '',
};

function rTone(r) {
  if (r == null) return 'text-white/40';
  if (r >= 1) return 'text-emerald-300';
  if (r > 0) return 'text-emerald-400/70';
  return 'text-rose-400';
}

export default function SetupJournalPage() {
  const { playbookEntries } = usePlaybook();
  const { data: allTrades = [] } = useTrades();
  const {
    journalEntries,
    isLoading,
    addJournalEntry,
    isAdding,
    updateJournalEntry,
    isUpdating,
    deleteJournalEntry,
  } = useSetupJournal();

  const [confirm, confirmDialog] = useConfirm();
  // Only used by a study entry, which has no trade to take its setup from.
  const [fallbackStrategy, setFallbackStrategy] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [isFormOpen, setIsFormOpen] = useState(false);
  // The entry being rewritten, if any — empty means the form creates a new one.
  const [editingId, setEditingId] = useState('');
  // A debrief is normally written the same day, so the picker starts on
  // today's trades and opens up to the whole history on request.
  const [todayOnly, setTodayOnly] = useState(true);

  const activeStrategies = useMemo(
    () => playbookEntries.filter((entry) => entry.is_active !== false),
    [playbookEntries]
  );

  useEffect(() => {
    if (!fallbackStrategy && activeStrategies.length > 0) {
      setFallbackStrategy(activeStrategies[0].name);
    }
  }, [activeStrategies, fallbackStrategy]);

  // Each setup is debriefed with its own prompts, so an entry is always read
  // back through the template of the setup it was filed under.
  const templatesByStrategy = useMemo(() => new Map(
    playbookEntries.map((entry) => [entry.name.trim().toLowerCase(), getTemplateForEntry(entry)])
  ), [playbookEntries]);

  const templateFor = useCallback((strategyName) => (
    templatesByStrategy.get(String(strategyName || '').trim().toLowerCase()) || getTemplateForEntry(null)
  ), [templatesByStrategy]);

  const tradesById = useMemo(
    () => new Map(allTrades.map((trade) => [String(trade?.id || ''), trade])),
    [allTrades]
  );

  // A debrief written against a trade reads its result from that trade, so
  // correcting the trade corrects the journal rather than leaving a stale copy.
  const allEntries = useMemo(() => journalEntries.map((entry) => (
    mergeEntryWithTrade(
      entry,
      tradesById.get(String(entry?.trade_id || '')),
      templateFor(entry?.strategy)
    )
  )), [journalEntries, tradesById, templateFor]);

  // Every trade still waiting on a debrief, whatever setup it was taken on —
  // the entry takes its setup from the trade, so there is nothing to pick first.
  const pendingTrades = useMemo(
    () => getJournalableTrades(allTrades, journalEntries),
    [allTrades, journalEntries]
  );

  const todaysPendingTrades = useMemo(
    () => filterTradesOnDate(pendingTrades, todayISO()),
    [pendingTrades]
  );

  const linkedTrade = form.trade_id ? tradesById.get(form.trade_id) : null;

  // The trade an edited entry is attached to is already journaled, so it is
  // missing from the pending list — put it back or the picker would appear
  // to have forgotten it.
  const journalableTrades = useMemo(() => {
    const base = todayOnly ? todaysPendingTrades : pendingTrades;
    if (!linkedTrade || base.some((trade) => String(trade.id) === String(linkedTrade.id))) return base;
    return [linkedTrade, ...base];
  }, [todayOnly, todaysPendingTrades, pendingTrades, linkedTrade]);

  // A linked entry is filed under the trade's own setup, and answers that
  // setup's template — templates differ from one setup to the next.
  const formStrategy = String(linkedTrade?.setup_type || fallbackStrategy || '').trim();
  const formTemplate = templateFor(formStrategy);

  // Execution quality is already scored out of 10 by Add Trade, so a linked
  // entry answers that prompt from the trade rather than asking twice.
  const executionField = formTemplate.fields.find((field) => field.id === EXECUTION_GRADE_FIELD_ID);
  const derivedExecutionGrade = linkedTrade
    ? getExecutionGradeFromTrade(linkedTrade, executionField?.options || null)
    : '';

  const setAnswer = useCallback((fieldId, option) => {
    setForm((prev) => ({
      ...prev,
      // Tapping the selected answer again clears it, so a mis-tap does not
      // force a choice to stay recorded.
      answers: { ...prev.answers, [fieldId]: prev.answers[fieldId] === option ? '' : option },
    }));
  }, []);

  /** Linking a trade fills in everything the trade already knows. */
  const selectTrade = useCallback((tradeId) => {
    setForm((prev) => {
      if (!tradeId) return { ...prev, trade_id: '' };
      const trade = allTrades.find((t) => String(t?.id) === String(tradeId));
      if (!trade) return { ...prev, trade_id: '' };

      const defaults = tradeToJournalDefaults(trade);
      return {
        ...prev,
        trade_id: defaults.trade_id,
        symbol: defaults.symbol,
        traded_on: defaults.traded_on || prev.traded_on,
        r_multiple: defaults.r_multiple == null ? '' : String(defaults.r_multiple),
        mfe_r: defaults.mfe_r == null ? '' : String(defaults.mfe_r),
      };
    });
  }, [allTrades]);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingId('');
    setForm(EMPTY_FORM);
  }, []);

  /** Reopens a saved debrief in the same form that wrote it. */
  const startEdit = useCallback((entry) => {
    setEditingId(entry.id);
    if (entry.strategy) setFallbackStrategy(entry.strategy);
    setForm({
      trade_id: entry.trade_id || '',
      traded_on: entry.traded_on || todayISO(),
      symbol: entry.symbol || '',
      answers: { ...entry.answers },
      responses: { ...entry.responses },
      r_multiple: entry.r_multiple == null ? '' : String(entry.r_multiple),
      mfe_r: entry.mfe_r == null ? '' : String(entry.mfe_r),
      mae_r: entry.mae_r == null ? '' : String(entry.mae_r),
      note: entry.note || '',
    });
    setIsFormOpen(true);
  }, []);

  const handleSave = async () => {
    if (!formStrategy) {
      toast.error('Pick a trade, or a setup to file this entry under');
      return;
    }
    const answered = Object.values(form.answers).filter(Boolean).length
      + Object.values(form.responses).filter(Boolean).length;
    if (answered === 0) {
      toast.error('Answer at least one prompt before saving');
      return;
    }

    const payload = normalizeJournalEntry({
      ...form,
      strategy: formStrategy,
      answers: derivedExecutionGrade
        ? { ...form.answers, [EXECUTION_GRADE_FIELD_ID]: derivedExecutionGrade }
        : form.answers,
    });

    try {
      if (editingId) {
        const { id: _ignored, ...changes } = payload;
        await updateJournalEntry(editingId, changes);
        toast.success('Journal entry updated');
      } else {
        await addJournalEntry(payload);
        toast.success('Journal entry saved');
      }
      closeForm();
    } catch (error) {
      toast.error(`Unable to save entry: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (entry) => {
    const shouldDelete = await confirm({
      title: 'Delete this journal entry?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!shouldDelete) return;

    try {
      await deleteJournalEntry(entry.id);
      toast.success('Entry deleted');
    } catch (error) {
      toast.error(`Unable to delete: ${error?.message || 'Unknown error'}`);
    }
  };

  if (playbookEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
        <BookOpenCheck className="mx-auto h-6 w-6 text-white/30" />
        <p className="mt-3 text-sm font-semibold text-white/80">No strategies yet</p>
        <p className="mt-1 text-xs text-white/45">Create a Playbook setup first — the journal is kept per setup.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Summary ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white/85">Setup Journal</h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 bg-cyan-600/80 text-xs font-semibold text-white hover:bg-cyan-600"
            onClick={() => (isFormOpen ? closeForm() : setIsFormOpen(true))}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />{isFormOpen ? 'Close' : 'New entry'}
          </Button>
        </div>
      </div>

      {/* ── New entry ──────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] p-4">
          {editingId ? (
            <p className="rounded-lg border border-amber-400/25 bg-amber-500/[0.08] px-2.5 py-1.5 text-[11px] text-amber-200/85">
              Editing a saved entry. Cancel leaves it as it was.
            </p>
          ) : null}

          {/* A debrief is normally about a trade you took — pick it and the
              result, symbol and date come from the trade itself. */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">
                Trade · {todayOnly ? 'today' : 'all dates'}
              </Label>
              <button
                type="button"
                onClick={() => setTodayOnly((prev) => !prev)}
                className="text-[11px] text-cyan-300/80 hover:text-cyan-200"
              >
                {todayOnly
                  ? `Show earlier trades (${pendingTrades.length - todaysPendingTrades.length})`
                  : 'Show today only'}
              </button>
            </div>
            <select
              value={form.trade_id}
              onChange={(e) => selectTrade(e.target.value)}
              className="h-9 w-full rounded-md border border-white/12 bg-white/[0.03] px-2.5 text-xs text-white/85 outline-none"
            >
              <option value="" style={{ backgroundColor: '#0d1520' }}>
                Not linked — a study entry
              </option>
              {journalableTrades.map((trade) => {
                const defaults = tradeToJournalDefaults(trade);
                return (
                  <option key={trade.id} value={trade.id} style={{ backgroundColor: '#0d1520' }}>
                    {defaults.traded_on || 'undated'} · {defaults.symbol || '—'}
                    {defaults.r_multiple == null ? '' : ` · ${defaults.r_multiple}R`}
                    {` · ${trade.setup_type}`}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-white/35">
              {journalableTrades.length === 0
                ? (todayOnly
                  ? 'No trades logged today are waiting on a debrief.'
                  : 'Every logged trade has been debriefed.')
                : `${journalableTrades.length} trade(s) waiting on a debrief.`}
              {linkedTrade ? ` Filed under ${formStrategy}, using its template.` : ''}
            </p>
          </div>

          {/* A study entry has no trade to take a setup from, so it says
              which setup's prompts it is answering. */}
          {!linkedTrade && (
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Setup</Label>
              <select
                value={fallbackStrategy}
                onChange={(e) => setFallbackStrategy(e.target.value)}
                className="h-9 w-full rounded-md border border-white/12 bg-white/[0.03] px-2.5 text-xs text-white/85 outline-none"
              >
                {activeStrategies.map((entry) => (
                  <option key={entry.id} value={entry.name} style={{ backgroundColor: '#0d1520' }}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formTemplate.fields.map((field) => {
            const isDerived = field.id === EXECUTION_GRADE_FIELD_ID && Boolean(derivedExecutionGrade);
            const answer = isDerived ? derivedExecutionGrade : form.answers[field.id];

            return (
              <div key={field.id} className="flex flex-wrap items-center gap-2">
                <span className="w-32 shrink-0 text-[11px] font-medium text-white/50">{field.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {field.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isDerived}
                      onClick={() => setAnswer(field.id, option)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                        answer === option
                          ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-100'
                          : 'border-white/12 bg-white/[0.03] text-white/50',
                        isDerived ? 'cursor-default opacity-70' : 'hover:text-white/85'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {isDerived ? (
                  <span className="text-[10px] text-white/35">
                    from the trade's rating ({linkedTrade?.overall_rating}/10)
                  </span>
                ) : null}
              </div>
            );
          })}

          {formTemplate.questions.map((question) => (
            <div key={question.id} className="space-y-1.5">
              <Label className="text-xs font-medium text-amber-200/80">{question.prompt}</Label>
              <Textarea
                value={form.responses[question.id] || ''}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  responses: { ...prev.responses, [question.id]: e.target.value },
                }))}
                rows={2}
                className="border-white/12 bg-white/[0.03] text-xs"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-white/40">Note</Label>
            <Textarea
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              rows={2}
              className="border-white/12 bg-white/[0.03] text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="text-xs text-white/45" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isAdding || isUpdating}
              className="bg-cyan-600/80 text-xs hover:bg-cyan-600"
            >
              {isAdding || isUpdating
                ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</>
                : (editingId ? 'Save changes' : 'Save entry')}
            </Button>
          </div>
        </div>
      )}

      {/* ── Entries ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />Loading journal…
        </div>
      ) : allEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-10 text-center">
          <BookOpenCheck className="mx-auto h-5 w-5 text-white/25" />
          <p className="mt-2 text-sm text-white/55">No journal entries yet</p>
          <p className="mt-1 text-xs text-white/35">Debrief a trade right after you take it, while the chart is still fresh.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allEntries.map((entry) => {
            const entryTemplate = templateFor(entry.strategy);
            const completion = getEntryCompletion(entry, entryTemplate);
            return (
              <div key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-white/45">{entry.traded_on || '—'}</span>
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-500/[0.08] px-2 py-0.5 text-[10px] font-semibold text-cyan-100/85">
                      {entry.strategy}
                    </span>
                    {entry.symbol ? (
                      <span className="rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
                        {entry.symbol}
                      </span>
                    ) : null}
                    <span className={cn('font-mono text-xs font-semibold', rTone(entry.r_multiple))}>
                      {entry.r_multiple == null ? 'no result' : `${entry.r_multiple > 0 ? '+' : ''}${entry.r_multiple}R`}
                    </span>
                    {entry.trade_id ? (
                      <span
                        className="inline-flex items-center gap-1 rounded border border-cyan-500/25 bg-cyan-500/[0.08] px-1.5 py-0.5 text-[9px] text-cyan-200/80"
                        title="Linked to a logged trade — its result comes from that trade"
                      >
                        <Link2 className="h-2.5 w-2.5" />trade
                      </span>
                    ) : null}
                    {entry.mfe_r != null ? <span className="text-[10px] text-white/40">MFE {entry.mfe_r}R</span> : null}
                    {entry.mae_r != null ? <span className="text-[10px] text-white/40">MAE {entry.mae_r}R</span> : null}
                    {!completion.isComplete ? (
                      <span className="rounded border border-amber-400/25 bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-200/80">
                        {completion.answered}/{completion.required} answered
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      className="text-white/25 hover:text-cyan-300"
                      aria-label="Edit entry"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      className="text-white/25 hover:text-rose-300"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entryTemplate.fields.map((field) => {
                    const answer = entry.answers[field.id];
                    if (!answer) return null;
                    return (
                      <span key={field.id} className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-white/65">
                        <span className="text-white/35">{field.label}:</span> {answer}
                      </span>
                    );
                  })}
                </div>

                {entryTemplate.questions.map((question) => {
                  const response = entry.responses[question.id];
                  if (!response) return null;
                  return (
                    <div key={question.id} className="mt-2 rounded-lg border-l-2 border-amber-400/35 bg-white/[0.02] px-2.5 py-1.5">
                      <p className="text-[10px] text-amber-200/60">{question.prompt}</p>
                      <p className="mt-0.5 text-xs text-white/75">{response}</p>
                    </div>
                  );
                })}

                {entry.note ? <p className="mt-2 text-xs text-white/55">{entry.note}</p> : null}
              </div>
            );
          })}
        </div>
      )}

      {confirmDialog}
    </div>
  );
}
