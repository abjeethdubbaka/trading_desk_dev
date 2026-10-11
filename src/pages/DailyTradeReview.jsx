import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  useDailyReviews,
  useCreateDailyReview,
  useUpdateDailyReview,
  useDeleteDailyReview,
} from '@/lib/hooks/useDailyReviews';
import { toast } from 'sonner';
import {
  Plus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
} from 'lucide-react';
import { describeTrade, getLocalDateKey, getTradesForDay, partitionReviews } from '@/lib/reviews/utils';
import { useGuardian } from '@/lib/hooks/useGuardian';
import { useGuardianDays } from '@/lib/hooks/useGuardianDays';
import { useMorningBrief } from '@/lib/hooks/useMorningBrief';
import { toGuardianDayRecord } from '@/lib/guardian/days';
import { isUnanswered, suggestReportCard } from '@/lib/reviews/autofill';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { DEFAULT_MISTAKES } from '@/lib/constants/mistakes';
import { DEFAULT_IMPROVEMENTS } from '@/lib/constants/improvements';
import { DEFAULT_LEARNINGS } from '@/lib/constants/learnings';
import { usePlaybook } from '@/lib/hooks/usePlaybook';

// The trader's own day, not UTC: an evening card belongs to the day that was
// just traded, not to tomorrow.
const TODAY_STR = getLocalDateKey();

const EMPTY_DRAFT = {
  // Discipline — yes/no, so a day can be read at a glance and compared with
  // other days without parsing prose.
  followed_plan: null,      // true | false | null (unanswered)
  traded_off_plan: null,    // true | false | null (unanswered)
  followed_risk_plan: null,
  gave_back_profits: null,
  worse_after_loss: null,
  worse_when_tired: null,
  // The day's trades, picked from the journal rather than typed. A missed
  // trade is the exception: it was never taken, so there is nothing to link.
  best_trade_id: '',
  worst_trade_id: '',
  forced_trade_id: '',
  missed_trade: '',
  // Patterns worth carrying forward
  setup_that_worked: '',
  repeated_mistake: '',
  // Reflection
  what_went_well: '',
  needs_improvement: '',
  biggest_mistake: '',
  biggest_lesson: '',
  professional_score: null, // 0-10
};

/**
 * The card's fields in one place, so loading a saved card and reading one back
 * can never drift from what the form asks.
 */
export const YES_NO_FIELDS = [
  { field: 'followed_plan', label: 'Followed pre-market plan', goodAnswer: true },
  { field: 'traded_off_plan', label: 'Took a trade outside the plan', goodAnswer: false },
  { field: 'followed_risk_plan', label: 'Followed risk plan', goodAnswer: true },
  { field: 'gave_back_profits', label: 'Gave back profits', goodAnswer: false },
  { field: 'worse_after_loss', label: 'Traded worse after a loss', goodAnswer: false },
  { field: 'worse_when_tired', label: 'Traded worse when tired or distracted', goodAnswer: false },
];

/** Fields holding the id of a trade in the journal. */
export const TRADE_REF_FIELDS = [
  { field: 'best_trade_id', legacy: 'best_trade', label: 'Best trade', tone: 'text-emerald-300/50' },
  { field: 'worst_trade_id', legacy: 'worst_trade', label: 'Worst trade', tone: 'text-rose-300/50' },
  { field: 'forced_trade_id', legacy: 'forced_trade', label: 'Forced trade', tone: 'text-rose-300/50' },
];

export const TEXT_FIELDS = [
  { field: 'missed_trade', label: 'Missed trade', tone: 'text-cyan-300/50' },
  { field: 'setup_that_worked', label: 'Setup that worked', tone: 'text-emerald-300/50' },
  { field: 'repeated_mistake', label: 'Repeated mistake', tone: 'text-rose-300/50' },
  { field: 'what_went_well', label: 'What went well', tone: 'text-emerald-300/50' },
  { field: 'needs_improvement', label: 'What needs improvement', tone: 'text-amber-300/50' },
  { field: 'biggest_mistake', label: 'Biggest mistake', tone: 'text-rose-300/50' },
  { field: 'biggest_lesson', label: 'Biggest lesson', tone: 'text-amber-300/50' },
];

/**
 * Picks one of the day's trades. Referencing the journal rather than typing a
 * symbol means the card still means something months later, when "TSLA, the
 * bad one" no longer identifies anything.
 */
function TradeRefField({ label, labelColor, value, onChange, trades, emptyHint, auto }) {
  const colorClass = {
    emerald: 'text-emerald-200/70',
    rose: 'text-rose-200/70',
    cyan: 'text-cyan-200/70',
    amber: 'text-amber-200/70',
  }[labelColor] ?? 'text-white/45';

  return (
    <div className="space-y-1.5">
      <label className={cn('block text-[11px] font-semibold uppercase tracking-wider', colorClass)}>
        {label}
      </label>
      {trades.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-white/25">
          {emptyHint}
        </p>
      ) : (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 text-sm text-white/85 outline-none focus:border-white/25"
        >
          <option value="" style={{ backgroundColor: '#0d1117' }}>— none —</option>
          {trades.map((trade) => (
            <option key={trade.id} value={trade.id} style={{ backgroundColor: '#0d1117' }}>
              {describeTrade(trade)}
            </option>
          ))}
        </select>
      )}
      <AutoNote reason={auto} />
    </div>
  );
}

/**
 * Picks one of a fixed list of options kept elsewhere in the app — mistake
 * keywords from Settings, setups from the Playbook. Standardized wording is
 * what makes a pattern visible across days: free text describes the same
 * mistake five different ways and hides it.
 */
function OptionField({ label, labelColor, value, onChange, options, emptyHint, auto }) {
  const colorClass = {
    rose: 'text-rose-200/70',
    amber: 'text-amber-200/70',
    emerald: 'text-emerald-200/70',
  }[labelColor] ?? 'text-white/45';

  // Something saved before it was renamed or removed still has to show.
  const choices = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <div className="space-y-1.5">
      <label className={cn('block text-[11px] font-semibold uppercase tracking-wider', colorClass)}>
        {label}
      </label>
      {choices.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-white/25">
          {emptyHint}
        </p>
      ) : (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 text-sm text-white/85 outline-none focus:border-white/25"
      >
        <option value="" style={{ backgroundColor: '#0d1117' }}>— none —</option>
        {choices.map((option) => (
          <option key={option} value={option} style={{ backgroundColor: '#0d1117' }}>
            {option}
          </option>
        ))}
      </select>
      )}
      <AutoNote reason={auto} />
    </div>
  );
}

/**
 * Marks an answer the card filled in from Guardian, the journal or the
 * Morning Brief, with the reason — something to confirm, not to trust
 * blindly. Changing the answer removes the mark.
 */
function AutoNote({ reason }) {
  if (!reason) return null;
  return (
    <p className="flex items-start gap-1 text-[10px] leading-snug text-cyan-200/60" title={reason}>
      <span className="mt-px rounded bg-cyan-500/15 px-1 font-semibold uppercase tracking-wide text-cyan-200/80">auto</span>
      <span>{reason}</span>
    </p>
  );
}

/** A heading inside the card, so many fields read as a few groups. */
function SectionLabel({ children }) {
  return (
    <p className="border-t border-white/[0.06] pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
      {children}
    </p>
  );
}

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, i) => i);

function scoreColor(score) {
  if (score == null) return 'text-white/40';
  if (score >= 8) return 'text-emerald-400';
  if (score >= 5) return 'text-amber-400';
  return 'text-rose-400';
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}


// Yes/No answer. `goodAnswer` is the one that reflects discipline, so the
// colouring reads at a glance instead of Yes always being green.
function YesNoField({ label, value, onChange, goodAnswer = true, auto }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/45">
        {label}
      </label>
      <div className="flex gap-2">
        {[true, false].map((option) => {
          const isSelected = value === option;
          const isGood = option === goodAnswer;
          return (
            <button
              key={String(option)}
              type="button"
              onClick={() => onChange(isSelected ? null : option)}
              className={cn(
                'flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
                isSelected
                  ? isGood
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                    : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
                  : 'border-white/10 bg-white/[0.03] text-white/35 hover:border-white/20 hover:text-white/60',
              )}
            >
              {option ? 'YES' : 'NO'}
            </button>
          );
        })}
      </div>
      <AutoNote reason={auto} />
    </div>
  );
}

function ScoreField({ value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
        Professional score
        <span className={cn('font-mono text-sm', scoreColor(value))}>
          {value == null ? '—' : value}/10
        </span>
      </label>
      <div className="flex flex-wrap gap-1.5">
        {SCORE_OPTIONS.map((score) => {
          const isSelected = value === score;
          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(isSelected ? null : score)}
              className={cn(
                'h-9 w-9 rounded-lg border text-sm font-semibold transition-colors',
                isSelected
                  ? 'border-violet-400/50 bg-violet-500/20 text-violet-100'
                  : 'border-white/10 bg-white/[0.03] text-white/35 hover:border-white/20 hover:text-white/60',
              )}
            >
              {score}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewField({ label, labelColor, value, onChange, placeholder, rows = 3 }) {
  const colorClass = {
    emerald: 'text-emerald-200/70',
    rose: 'text-rose-200/70',
    amber: 'text-amber-200/70',
    cyan: 'text-cyan-200/70',
    white: 'text-white/45',
  }[labelColor] ?? 'text-white/45';

  return (
    <div className="space-y-1.5">
      <label className={cn('block text-[11px] font-semibold uppercase tracking-wider', colorClass)}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 placeholder-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-white/20 leading-relaxed"
      />
    </div>
  );
}

function HistoryCard({ review, onDelete, tradesById }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      {/* Expand and delete sit side by side: a button inside a button is not
          valid markup, and a nested one cannot be reached by keyboard. */}
      <div className="flex items-center gap-2 pr-3 hover:bg-white/[0.03] transition-colors">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-3 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-white/25 shrink-0" />
            <span className="text-sm font-medium text-white/65">{formatDateShort(review.date)}</span>
            {review.trade_snapshot?.symbol && (
              <span className="text-xs font-mono bg-violet-500/10 border border-violet-500/20 text-violet-300/70 px-1.5 py-0.5 rounded">
                {review.trade_snapshot.symbol}
              </span>
            )}
            {!expanded && (review.biggest_lesson || review.key_lesson) && (
              <span className="hidden md:block text-xs text-white/25 truncate">
                {review.biggest_lesson || review.key_lesson}
              </span>
            )}
          </span>
          <span className="flex items-center gap-2 shrink-0">
            {Number.isFinite(review.professional_score) && (
              <span className={cn('font-mono text-xs font-semibold', scoreColor(review.professional_score))}>
                {review.professional_score}/10
              </span>
            )}
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-white/25" />
              : <ChevronDown className="w-3.5 h-3.5 text-white/25" />}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(review.id)}
          aria-label={`Delete the report card for ${formatDateShort(review.date)}`}
          className="shrink-0 rounded p-1 text-white/15 transition-colors hover:bg-rose-500/20 hover:text-rose-400"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-white/[0.06] space-y-3">
          {YES_NO_FIELDS.filter(({ field }) => typeof review[field] === 'boolean').map(({ field, label, goodAnswer }) => (
            <div key={field} className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-wider text-white/30">{label}</p>
              <span className={cn(
                'text-xs font-semibold',
                review[field] === goodAnswer ? 'text-emerald-400' : 'text-rose-400',
              )}>
                {review[field] ? 'YES' : 'NO'}
              </span>
            </div>
          ))}
          {TRADE_REF_FIELDS.map(({ field, legacy, label, tone }) => {
            // A reference reads as the trade it names; cards written before
            // references existed still show what was typed then.
            const referenced = review[field] ? tradesById?.get(review[field]) : null;
            const text = referenced ? describeTrade(referenced) : review[legacy];
            if (!text) return null;
            return (
              <div key={field} className="flex items-center justify-between gap-3">
                <p className={cn('text-[10px] uppercase tracking-wider', tone)}>{label}</p>
                <span className="font-mono text-xs text-white/70">{text}</span>
              </div>
            );
          })}
          {TEXT_FIELDS.filter(({ field }) => review[field]).map(({ field, label, tone }) => (
            <div key={field}>
              <p className={cn('mb-1 text-[10px] uppercase tracking-wider', tone)}>{label}</p>
              <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{review[field]}</p>
            </div>
          ))}

          {/* Fields from report cards saved before the format changed */}
          {review.findings && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">What happened</p>
              <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{review.findings}</p>
            </div>
          )}
          {review.what_to_improve && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-rose-300/50 mb-1">What to improve</p>
              <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{review.what_to_improve}</p>
            </div>
          )}
          {review.key_lesson && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-300/50 mb-1">Key lesson</p>
              <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{review.key_lesson}</p>
            </div>
          )}
          {review.next_time && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-cyan-300/50 mb-1">Next time I'll…</p>
              <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{review.next_time}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DailyTradeReview() {
  const { data: reviews = [] } = useDailyReviews();
  const { data: allTrades = [] } = useTrades();
  const { settings } = useSettings();

  // The same keywords Add Trade offers, so a mistake is worded identically
  // wherever it is recorded.
  const mistakeOptions = useMemo(() => (
    Array.isArray(settings?.mistakes) && settings.mistakes.length > 0
      ? settings.mistakes
      : DEFAULT_MISTAKES
  ), [settings?.mistakes]);

  const improvementOptions = useMemo(() => (
    Array.isArray(settings?.improvements) && settings.improvements.length > 0
      ? settings.improvements
      : DEFAULT_IMPROVEMENTS
  ), [settings?.improvements]);

  const learningOptions = useMemo(() => (
    Array.isArray(settings?.learnings) && settings.learnings.length > 0
      ? settings.learnings
      : DEFAULT_LEARNINGS
  ), [settings?.learnings]);

  // Named from the Playbook, so the setup credited here is the same setup the
  // rest of the app measures.
  const { playbookEntries } = usePlaybook();
  const setupOptions = useMemo(() => (
    playbookEntries.filter((entry) => entry.is_active !== false).map((entry) => entry.name)
  ), [playbookEntries]);
  const createReview = useCreateDailyReview();
  const updateReview = useUpdateDailyReview();
  const deleteReview = useDeleteDailyReview();

  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [loadedToday, setLoadedToday] = useState(false);

  const todaysTrades = useMemo(() => getTradesForDay(allTrades, TODAY_STR), [allTrades]);
  const tradesById = useMemo(
    () => new Map(allTrades.map((trade) => [String(trade.id), trade])),
    [allTrades],
  );

  const { today: todayReviews, past: pastReviews } = useMemo(
    () => partitionReviews(reviews, TODAY_STR),
    [reviews],
  );

  // Auto-load today's first review into the form on initial data arrival
  useEffect(() => {
    if (loadedToday || todayReviews.length === 0) return;
    const r = todayReviews[0];
    setActiveReviewId(r.id);
    // Rebuilt from the empty draft so a field added later loads as unanswered
    // rather than undefined.
    setDraft({
      ...EMPTY_DRAFT,
      ...Object.fromEntries(YES_NO_FIELDS.map(({ field }) => (
        [field, typeof r[field] === 'boolean' ? r[field] : null]
      ))),
      ...Object.fromEntries(TEXT_FIELDS.map(({ field }) => [field, r[field] || ''])),
      ...Object.fromEntries(TRADE_REF_FIELDS.map(({ field }) => [field, r[field] || ''])),
      professional_score: Number.isFinite(r.professional_score) ? r.professional_score : null,
    });
    setLoadedToday(true);
  }, [todayReviews, loadedToday]);

  // ── Answers the day already knows ────────────────────────────────────────
  // From what Guardian saw on Trade Terminal, the trades logged today and the
  // Morning Brief. Only blank answers are filled, an answer filled this way
  // follows the day as it changes, and touching it makes it the trader's own.
  const { status: guardianStatus } = useGuardian();
  const { guardianDaysByDate } = useGuardianDays();
  const { todayBrief } = useMorningBrief();
  const guardianDay = useMemo(() => (
    (guardianStatus?.day?.date === TODAY_STR ? toGuardianDayRecord(guardianStatus) : null)
      || guardianDaysByDate.get(TODAY_STR)
      || null
  ), [guardianStatus, guardianDaysByDate]);
  const liveDailyPnl = guardianStatus?.day?.date === TODAY_STR ? guardianStatus?.reading?.dailyPnl ?? null : null;
  const suggestions = useMemo(() => suggestReportCard({
    guardianDay,
    dailyPnl: liveDailyPnl,
    brief: todayBrief,
    trades: todaysTrades,
    mistakeOptions,
    setupOptions,
  }), [guardianDay, liveDailyPnl, todayBrief, todaysTrades, mistakeOptions, setupOptions]);
  const suggestionsKey = JSON.stringify(suggestions);

  // field → reason, for answers currently filled by the card itself.
  const [autoFilled, setAutoFilled] = useState({});
  const autoFilledRef = useRef(autoFilled);
  autoFilledRef.current = autoFilled;

  useEffect(() => {
    const filled = autoFilledRef.current;
    const next = {};
    setDraft((prev) => {
      const updated = { ...prev };
      for (const [field, { value, reason }] of Object.entries(suggestions)) {
        if (!(field in EMPTY_DRAFT)) continue;
        if (isUnanswered(prev[field]) || filled[field]) {
          updated[field] = value;
          next[field] = reason;
        }
      }
      // A suggestion that no longer holds gives its field back.
      for (const field of Object.keys(filled)) {
        if (!(field in next) && !(field in suggestions)) updated[field] = EMPTY_DRAFT[field];
      }
      return updated;
    });
    setAutoFilled(next);
    // Rerun when the suggestions or the card being edited change.
  }, [suggestionsKey, activeReviewId, loadedToday]);

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setAutoFilled((prev) => {
      if (!(field in prev)) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const startNew = () => {
    setActiveReviewId(null);
    setAutoFilled({});
    setDraft(EMPTY_DRAFT);
  };

  const handleSave = async () => {
    // The report card grades the day as a whole, so reviews are no longer
    // linked to an individual trade — the keys stay for records saved before
    // that change.
    const payload = {
      date: TODAY_STR,
      trade_id: null,
      trade_snapshot: null,
      ...draft,
    };

    try {
      if (activeReviewId) {
        await updateReview.mutateAsync({ id: activeReviewId, ...payload });
        toast.success('Review updated');
      } else {
        const created = await createReview.mutateAsync(payload);
        setActiveReviewId(created.id);
        setLoadedToday(true);
        toast.success('Review saved');
      }
    } catch {
      toast.error('Failed to save review');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReview.mutateAsync(id);
      if (id === activeReviewId) startNew();
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const isSaving = createReview.isPending || updateReview.isPending;
  const isDraftEmpty = Object.values(draft).every((v) => v === null || String(v).trim() === '');

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-8 space-y-8">

        {/* No page title: the sidebar already names the page. The one line
            here says whether today's card exists, and offers a fresh one. */}
        {todayReviews.length > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2">
            <p className="flex items-center gap-2 text-xs text-emerald-300/70">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {todayReviews.length === 1 ? 'Review saved for today' : `${todayReviews.length} reviews today`}
            </p>
            {activeReviewId && (
              <button
                type="button"
                onClick={startNew}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/50 hover:border-white/20 hover:text-white/70 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Review
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 items-start">

          {/* Review form */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <YesNoField
                label="Did I follow my pre-market plan?"
                value={draft.followed_plan}
                onChange={(v) => updateDraft('followed_plan', v)}
                goodAnswer
              />
              <YesNoField
                label="Did I take any trade that wasn't in my plan?"
                value={draft.traded_off_plan}
                auto={autoFilled.traded_off_plan}
                onChange={(v) => updateDraft('traded_off_plan', v)}
                goodAnswer={false}
              />
              <YesNoField
                label="Did I follow my risk plan?"
                value={draft.followed_risk_plan}
                auto={autoFilled.followed_risk_plan}
                onChange={(v) => updateDraft('followed_risk_plan', v)}
                goodAnswer
              />
              <YesNoField
                label="Did I give back profits?"
                value={draft.gave_back_profits}
                auto={autoFilled.gave_back_profits}
                onChange={(v) => updateDraft('gave_back_profits', v)}
                goodAnswer={false}
              />
              <YesNoField
                label="Did I trade worse after a loss?"
                value={draft.worse_after_loss}
                auto={autoFilled.worse_after_loss}
                onChange={(v) => updateDraft('worse_after_loss', v)}
                goodAnswer={false}
              />
              <YesNoField
                label="Did I trade worse when tired or distracted?"
                value={draft.worse_when_tired}
                auto={autoFilled.worse_when_tired}
                onChange={(v) => updateDraft('worse_when_tired', v)}
                goodAnswer={false}
              />
            </div>

            <SectionLabel>The day&apos;s trades</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <TradeRefField
                label="Best trade"
                labelColor="emerald"
                value={draft.best_trade_id}
                auto={autoFilled.best_trade_id}
                onChange={(v) => updateDraft('best_trade_id', v)}
                trades={todaysTrades}
                emptyHint="No trades logged today"
              />
              <TradeRefField
                label="Worst trade"
                labelColor="rose"
                value={draft.worst_trade_id}
                auto={autoFilled.worst_trade_id}
                onChange={(v) => updateDraft('worst_trade_id', v)}
                trades={todaysTrades}
                emptyHint="No trades logged today"
              />
              <TradeRefField
                label="Forced trade"
                labelColor="rose"
                value={draft.forced_trade_id}
                auto={autoFilled.forced_trade_id}
                onChange={(v) => updateDraft('forced_trade_id', v)}
                trades={todaysTrades}
                emptyHint="No trades logged today"
              />
              <ReviewField
                label="Missed trade"
                labelColor="cyan"
                value={draft.missed_trade}
                onChange={(v) => updateDraft('missed_trade', v)}
                placeholder="A setup you saw and did not take…"
                rows={2}
              />
            </div>

            <SectionLabel>Patterns</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <OptionField
                label="Setup that worked"
                labelColor="emerald"
                value={draft.setup_that_worked}
                auto={autoFilled.setup_that_worked}
                onChange={(v) => updateDraft('setup_that_worked', v)}
                options={setupOptions}
                emptyHint="Create a Playbook setup first"
              />
              <OptionField
                label="Repeated mistake"
                labelColor="rose"
                value={draft.repeated_mistake}
                auto={autoFilled.repeated_mistake}
                onChange={(v) => updateDraft('repeated_mistake', v)}
                options={mistakeOptions}
                emptyHint="Add mistake keywords in Settings"
              />
            </div>

            <SectionLabel>Reflection</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ReviewField
                label="What went well"
                labelColor="emerald"
                value={draft.what_went_well}
                onChange={(v) => updateDraft('what_went_well', v)}
                placeholder="Worth repeating tomorrow…"
                rows={2}
              />
              <OptionField
                label="What needs improvement"
                labelColor="amber"
                value={draft.needs_improvement}
                onChange={(v) => updateDraft('needs_improvement', v)}
                options={improvementOptions}
                emptyHint="Add improvement areas in Settings"
              />
              <OptionField
                label="Biggest mistake"
                labelColor="rose"
                value={draft.biggest_mistake}
                auto={autoFilled.biggest_mistake}
                onChange={(v) => updateDraft('biggest_mistake', v)}
                options={mistakeOptions}
                emptyHint="Add mistake keywords in Settings"
              />
              <OptionField
                label="Biggest lesson"
                labelColor="amber"
                value={draft.biggest_lesson}
                onChange={(v) => updateDraft('biggest_lesson', v)}
                options={learningOptions}
                emptyHint="Add learning keywords in Settings"
              />
            </div>

            <SectionLabel>Score</SectionLabel>
            <ScoreField
              value={draft.professional_score}
              onChange={(v) => updateDraft('professional_score', v)}
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isDraftEmpty}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all',
                  isDraftEmpty
                    ? 'border border-white/10 bg-white/[0.04] text-white/20 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30'
                )}
              >
                {isSaving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {activeReviewId ? 'Update Review' : 'Save Review'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Past reviews ─────────────────────────────────────────────── */}
        {pastReviews.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Past Reviews</p>
            <div className="space-y-2">
              {pastReviews.map((review) => (
                <HistoryCard key={review.id} review={review} onDelete={handleDelete} tradesById={tradesById} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
