import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTrades } from '@/lib/hooks/useTrades';
import {
  useDailyReviews,
  useCreateDailyReview,
  useUpdateDailyReview,
  useDeleteDailyReview,
} from '@/lib/hooks/useDailyReviews';
import { getTradePnL } from '@/lib/utils/tradeFields';
import { toast } from 'sonner';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
} from 'lucide-react';

const TODAY_STR = new Date().toISOString().slice(0, 10);

const EMPTY_DRAFT = {
  findings: '',
  what_went_well: '',
  what_to_improve: '',
  key_lesson: '',
  next_time: '',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatPnl(pnl) {
  const n = Number(pnl) || 0;
  return `${n >= 0 ? '+' : ''}$${Math.abs(n).toFixed(2)}`;
}

function TradePickerCard({ trade, selected, onClick }) {
  const pnl = getTradePnL(trade);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border px-3 py-2.5 transition-all',
        selected
          ? 'border-violet-400/40 bg-violet-500/10'
          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono text-sm font-semibold text-white/90">{trade.symbol}</span>
          {trade.setup_type && (
            <span className="ml-2 text-[10px] text-white/35">{trade.setup_type}</span>
          )}
        </div>
        <span className={cn('text-xs font-semibold tabular-nums shrink-0', pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
          {formatPnl(pnl)}
        </span>
      </div>
      {trade.direction && (
        <p className="mt-0.5 text-[10px] text-white/30 capitalize">{trade.direction}</p>
      )}
    </button>
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

function HistoryCard({ review, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-white/25 shrink-0" />
          <span className="text-sm font-medium text-white/65">{formatDateShort(review.date)}</span>
          {review.trade_snapshot?.symbol && (
            <span className="text-xs font-mono bg-violet-500/10 border border-violet-500/20 text-violet-300/70 px-1.5 py-0.5 rounded">
              {review.trade_snapshot.symbol}
            </span>
          )}
          {review.key_lesson && !expanded && (
            <span className="hidden md:block text-xs text-white/25 truncate">{review.key_lesson}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(review.id); }}
            className="p-1 rounded hover:bg-rose-500/20 text-white/15 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-white/25" />
            : <ChevronDown className="w-3.5 h-3.5 text-white/25" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-white/[0.06] space-y-3">
          {review.findings && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">What happened</p>
              <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{review.findings}</p>
            </div>
          )}
          {review.what_went_well && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-300/50 mb-1">What went well</p>
              <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{review.what_went_well}</p>
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
  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';

  const { data: trades = [] } = useTrades({ filters: { account_tier: currentTier } });
  const { data: reviews = [] } = useDailyReviews();
  const createReview = useCreateDailyReview();
  const updateReview = useUpdateDailyReview();
  const deleteReview = useDeleteDailyReview();

  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [loadedToday, setLoadedToday] = useState(false);

  const todayTrades = useMemo(() =>
    trades
      .filter((t) => t.entry_time && new Date(t.entry_time).toISOString().slice(0, 10) === TODAY_STR)
      .sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time)),
    [trades]
  );

  const todayReviews = useMemo(() => reviews.filter((r) => r.date === TODAY_STR), [reviews]);
  const pastReviews  = useMemo(() => reviews.filter((r) => r.date !== TODAY_STR), [reviews]);

  // Auto-load today's first review into the form on initial data arrival
  useEffect(() => {
    if (loadedToday || todayReviews.length === 0) return;
    const r = todayReviews[0];
    setActiveReviewId(r.id);
    setSelectedTradeId(r.trade_id || null);
    setDraft({
      findings:        r.findings        || '',
      what_went_well:  r.what_went_well  || '',
      what_to_improve: r.what_to_improve || '',
      key_lesson:      r.key_lesson      || '',
      next_time:       r.next_time       || '',
    });
    setLoadedToday(true);
  }, [todayReviews, loadedToday]);

  const selectedTrade = useMemo(
    () => (selectedTradeId ? trades.find((t) => t.id === selectedTradeId) ?? null : null),
    [selectedTradeId, trades]
  );

  const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const startNew = () => {
    setActiveReviewId(null);
    setSelectedTradeId(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleSave = async () => {
    const payload = {
      date: TODAY_STR,
      trade_id: selectedTradeId || null,
      trade_snapshot: selectedTrade
        ? {
            symbol:     selectedTrade.symbol,
            pnl:        getTradePnL(selectedTrade),
            setup_type: selectedTrade.setup_type || '',
            direction:  selectedTrade.direction  || '',
          }
        : null,
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
  const isDraftEmpty = Object.values(draft).every((v) => !String(v).trim());

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-5 h-5 text-violet-400" />
              <h1 className="text-xl font-semibold text-white/90">Daily Trade Review</h1>
            </div>
            <p className="mt-0.5 text-sm text-white/35">{formatDate(TODAY_STR)}</p>
          </div>

          {activeReviewId && (
            <button
              type="button"
              onClick={startNew}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/50 hover:border-white/20 hover:text-white/70 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Review
            </button>
          )}
        </div>

        {/* ── Main split ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* Left: trade picker */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                {todayTrades.length > 0 ? "Today's Trades" : "No trades today"}
              </p>

              {todayTrades.length > 0 ? (
                <div className="space-y-2">
                  {todayTrades.map((trade) => (
                    <TradePickerCard
                      key={trade.id}
                      trade={trade}
                      selected={selectedTradeId === trade.id}
                      onClick={() => setSelectedTradeId(selectedTradeId === trade.id ? null : trade.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/25 leading-relaxed">
                  Log a trade first, or write a general review below without linking a trade.
                </p>
              )}

              {selectedTradeId && (
                <button
                  type="button"
                  onClick={() => setSelectedTradeId(null)}
                  className="text-[11px] text-white/25 hover:text-white/45 transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>

            {todayReviews.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300/70">
                  {todayReviews.length === 1 ? 'Review saved for today' : `${todayReviews.length} reviews today`}
                </p>
              </div>
            )}
          </div>

          {/* Right: review form */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">

            {/* Linked trade banner */}
            {selectedTrade && (
              <div className="flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-500/[0.06] px-3 py-2.5">
                <span className="font-mono text-sm font-semibold text-violet-200">{selectedTrade.symbol}</span>
                {selectedTrade.setup_type && (
                  <span className="text-xs text-white/35">{selectedTrade.setup_type}</span>
                )}
                <span className={cn(
                  'ml-auto text-xs font-semibold tabular-nums',
                  getTradePnL(selectedTrade) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}>
                  {formatPnl(getTradePnL(selectedTrade))}
                </span>
              </div>
            )}

            <ReviewField
              label="What happened?"
              labelColor="white"
              value={draft.findings}
              onChange={(v) => updateDraft('findings', v)}
              placeholder="Describe the setup, your decision-making, and how the trade played out…"
              rows={3}
            />
            <ReviewField
              label="What went well?"
              labelColor="emerald"
              value={draft.what_went_well}
              onChange={(v) => updateDraft('what_went_well', v)}
              placeholder="Execution, patience, or discipline points you nailed…"
              rows={2}
            />
            <ReviewField
              label="What to improve?"
              labelColor="rose"
              value={draft.what_to_improve}
              onChange={(v) => updateDraft('what_to_improve', v)}
              placeholder="Where did you deviate, hesitate, or add unnecessary risk…"
              rows={2}
            />
            <ReviewField
              label="Key lesson"
              labelColor="amber"
              value={draft.key_lesson}
              onChange={(v) => updateDraft('key_lesson', v)}
              placeholder="The one thing you're taking away from this trade…"
              rows={2}
            />
            <ReviewField
              label="Next time I'll…"
              labelColor="cyan"
              value={draft.next_time}
              onChange={(v) => updateDraft('next_time', v)}
              placeholder="Concrete commitment for your next similar setup…"
              rows={2}
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
                <HistoryCard key={review.id} review={review} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
