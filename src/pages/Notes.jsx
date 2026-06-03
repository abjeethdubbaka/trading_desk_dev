/**
 * @file src/pages/Notes.jsx
 *
 * Aggregated feed of all per-trade notes, sorted by date.
 * Combines raw notes, what-went-wrong, and what-I-learned into one readable stream.
 */

import React, { useMemo, useState } from 'react';
import { FileText, Search, SortAsc, SortDesc } from 'lucide-react';
import { useJournal } from '@/lib/hooks/useTrades';
import { getTradePnL } from '@/lib/utils/tradeFields';
import { stripCalculatorAutoNote } from '@/components/journal/utils/notes';
import { PnlBadge, DirectionBadge } from '@/components/ui/TradeBadge';
import { TagChip } from '@/components/journal/components/TagChip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function getNoteContent(trade) {
  const rawNotes      = stripCalculatorAutoNote(trade?.notes) || '';
  const ref           = trade?.reflection_answers || {};
  const whatWentWrong = String(ref.what_went_wrong  || ref.whatWentWrong  || '').trim();
  const whatLearned   = String(ref.what_learned     || ref.whatLearned    || ref.what_did_you_learn || '').trim();

  return {
    notes: rawNotes,
    whatWentWrong,
    whatLearned,
    hasAny: Boolean(rawNotes || whatWentWrong || whatLearned),
    allText: [rawNotes, whatWentWrong, whatLearned].join(' ').toLowerCase(),
  };
}

function highlight(text, term) {
  if (!term || !text) return text;
  const safe  = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safe})`, 'gi');
  return text.split(regex).map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="rounded px-0.5 bg-amber-400/25 text-amber-200">{part}</mark>
      : part,
  );
}

// ── NoteCard ─────────────────────────────────────────────────────────────────

function NoteCard({ trade, searchTerm }) {
  const pnl  = getTradePnL(trade);
  const tags = Array.isArray(trade.tags) ? trade.tags.filter(Boolean) : [];
  const { notes, whatWentWrong, whatLearned } = getNoteContent(trade);

  const hl = (text) => highlight(text, searchTerm);

  return (
    <div className="rounded-xl border border-white/10 bg-[#13131e] p-4 space-y-3 transition-colors hover:border-white/[0.16]">

      {/* Trade header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold tracking-wide text-white">
            {highlight(trade.symbol || '--', searchTerm)}
          </span>
          <DirectionBadge direction={trade.direction} size="xs" />
          <PnlBadge value={pnl} size="sm" />
          {trade.setup_type && (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
              {highlight(trade.setup_type, searchTerm)}
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-white/30">
          {fmtDate(trade.entry_time || trade.created_date)}
        </span>
      </div>

      {/* Raw notes */}
      {notes && (
        <p className="text-sm leading-relaxed text-white/75 whitespace-pre-wrap">
          {hl(notes)}
        </p>
      )}

      {/* Reflection: what went wrong */}
      {whatWentWrong && (
        <div className="border-l-2 border-rose-500/40 pl-3">
          <p className="mb-1 text-[9px] uppercase tracking-widest text-rose-400/70">
            What went wrong
          </p>
          <p className="text-sm leading-relaxed text-white/65">{hl(whatWentWrong)}</p>
        </div>
      )}

      {/* Reflection: what I learned */}
      {whatLearned && (
        <div className="border-l-2 border-cyan-500/40 pl-3">
          <p className="mb-1 text-[9px] uppercase tracking-widest text-cyan-400/70">
            What I learned
          </p>
          <p className="text-sm leading-relaxed text-white/65">{hl(whatLearned)}</p>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {tags.map((tag) => <TagChip key={tag} name={tag} size="xs" />)}
        </div>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function NotesSkeleton() {
  return (
    <div className="space-y-3">
      {[90, 65, 80].map((pct, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-[#13131e] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className={`h-3 rounded-full`} style={{ width: `${pct}%` }} />
          <Skeleton className="h-3 w-3/4 rounded-full" />
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyNotes({ hasFilters }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <FileText className="h-16 w-16 text-white/15" />
      <p className="text-lg font-medium text-white/40">
        {hasFilters ? 'No notes match your filters' : 'No trade notes yet'}
      </p>
      <p className="text-sm text-white/25">
        {hasFilters
          ? 'Try adjusting the search or outcome filter'
          : "Add notes to your trades in the Journal — they'll all appear here"}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const OUTCOMES = [
  { key: 'all',    label: 'All' },
  { key: 'wins',   label: 'Wins' },
  { key: 'losses', label: 'Losses' },
];

export default function Notes() {
  const { trades = [], isLoading } = useJournal();
  const [searchTerm,    setSearchTerm]    = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [sortDir,       setSortDir]       = useState('desc');

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return trades
      .filter((t) => {
        const content = getNoteContent(t);
        if (!content.hasAny) return false;

        if (outcomeFilter === 'wins'   && getTradePnL(t) <= 0) return false;
        if (outcomeFilter === 'losses' && getTradePnL(t) >  0) return false;

        if (term) {
          return (
            (t.symbol || '').toLowerCase().includes(term)
            || (t.setup_type || '').toLowerCase().includes(term)
            || content.allText.includes(term)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const aMs = new Date(a.entry_time || a.created_date || 0).getTime();
        const bMs = new Date(b.entry_time || b.created_date || 0).getTime();
        return sortDir === 'desc' ? bMs - aMs : aMs - bMs;
      });
  }, [trades, searchTerm, outcomeFilter, sortDir]);

  const totalWithNotes = useMemo(
    () => trades.filter((t) => getNoteContent(t).hasAny).length,
    [trades],
  );

  const hasFilters = Boolean(searchTerm || outcomeFilter !== 'all');

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes, symbol, setup type…"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition-colors"
          />
        </div>

        {/* Outcome filter */}
        <div className="flex gap-1">
          {OUTCOMES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setOutcomeFilter(key)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                outcomeFilter === key
                  ? key === 'wins'
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                    : key === 'losses'
                      ? 'border-rose-400/40 bg-rose-500/15 text-rose-300'
                      : 'border-white/20 bg-white/10 text-white'
                  : 'border-white/10 bg-transparent text-white/45 hover:text-white/70',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/75 transition-colors"
        >
          {sortDir === 'desc'
            ? <SortDesc className="h-3.5 w-3.5" />
            : <SortAsc  className="h-3.5 w-3.5" />}
          {sortDir === 'desc' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* ── Summary line ── */}
      {!isLoading && (
        <p className="text-[11px] text-white/30">
          {filtered.length === totalWithNotes
            ? `${totalWithNotes} trade${totalWithNotes !== 1 ? 's' : ''} with notes`
            : `${filtered.length} of ${totalWithNotes} notes`}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      )}

      {/* ── Feed ── */}
      {isLoading ? (
        <NotesSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyNotes hasFilters={hasFilters} />
      ) : (
        <div className="space-y-3">
          {filtered.map((trade) => (
            <NoteCard
              key={trade.id}
              trade={trade}
              searchTerm={searchTerm.trim()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
