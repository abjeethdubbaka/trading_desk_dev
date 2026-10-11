import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OPTIONAL_COLUMNS } from '../../hooks/useColumnVisibility';

/**
 * Column widths, shared with the row so the two can never drift apart. The
 * date is not a column any more: rows sit under their day's heading.
 */
export const COLUMN_WIDTHS = {
  time: 'w-[72px]',
  symbol: 'w-[110px]',
  prices: 'w-[145px]',
  size: 'w-[58px]',
  pnl: 'w-[150px]',
  r: 'w-[52px]',
  setup: 'w-[110px]',
  grades: 'w-[124px]',
  emotions: 'w-[120px]',
  rating: 'w-[72px]',
  images: 'w-10',
  done: 'w-[60px]',
};

const LABEL = 'text-[10px] font-semibold uppercase tracking-widest';

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown className="ml-0.5 inline h-2.5 w-2.5 opacity-30" />;
  return dir === 'asc'
    ? <ChevronUp className="ml-0.5 inline h-2.5 w-2.5 text-cyan-400" />
    : <ChevronDown className="ml-0.5 inline h-2.5 w-2.5 text-cyan-400" />;
}

function SortableHeader({ label, sortKey: key, activeSortKey, activeSortDir, onSortChange, className }) {
  const active = activeSortKey === key;
  return (
    <button
      type="button"
      onClick={() => onSortChange(key)}
      className={cn(
        LABEL, 'cursor-pointer select-none whitespace-nowrap transition-colors hover:text-white/60',
        active ? 'text-cyan-400/80' : 'text-white/30',
        className,
      )}
    >
      {label}
      <SortIcon active={active} dir={activeSortDir} />
    </button>
  );
}

function ColLabel({ children }) {
  return <span className={cn(LABEL, 'text-white/30')}>{children}</span>;
}

export function CompactHeader({
  sortKey: activeSortKey,
  sortDir: activeSortDir,
  onSortChange,
  showCheckbox = false,
  isAllSelected = false,
  isIndeterminate = false,
  onToggleAll,
  columns,
  onToggleColumn,
}) {
  const sortProps = { activeSortKey, activeSortDir, onSortChange };
  const optional = (key) => (columns?.[key] ? 'hidden xl:block' : 'hidden');

  return (
    <div className="flex items-center gap-0 border-b border-white/[0.06] bg-white/[0.015] px-3 py-2">
      {showCheckbox && (
        <div className="mr-1 w-6 flex-shrink-0">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
            onChange={onToggleAll}
            className="h-3 w-3 cursor-pointer rounded accent-cyan-500"
            title="Select all on page"
          />
        </div>
      )}

      <div className="mr-2 w-5 flex-shrink-0" />

      <div className={cn(COLUMN_WIDTHS.time, 'flex-shrink-0')}>
        <SortableHeader label="Time" sortKey="date" {...sortProps} />
      </div>
      <div className={cn(COLUMN_WIDTHS.symbol, 'flex-shrink-0')}>
        <SortableHeader label="Symbol" sortKey="symbol" {...sortProps} />
      </div>
      <div className={cn(COLUMN_WIDTHS.prices, 'hidden flex-shrink-0 sm:block')}>
        <ColLabel>Entry → Exit</ColLabel>
      </div>
      <div className={cn(COLUMN_WIDTHS.size, 'hidden flex-shrink-0 md:block')}>
        <ColLabel>Size</ColLabel>
      </div>
      {/* Shown at every width when on: P&L is the one figure a row is read for. */}
      <div className={cn(COLUMN_WIDTHS.pnl, 'flex-shrink-0', columns?.pnl === false && 'hidden')}>
        <SortableHeader label="P&L" sortKey="pnl" {...sortProps} />
      </div>
      <div className={cn(COLUMN_WIDTHS.r, 'hidden flex-shrink-0 lg:block')}>
        <SortableHeader label="R" sortKey="r_multiple" {...sortProps} />
      </div>

      <div className={cn(COLUMN_WIDTHS.setup, 'flex-shrink-0', optional('setup'))}>
        <SortableHeader label="Setup" sortKey="setup" {...sortProps} />
      </div>

      {/* Entry · Stop · Exit · Size grades, as one row of letters */}
      <div className={cn(COLUMN_WIDTHS.grades, 'flex-shrink-0', optional('grades'))}>
        <SortableHeader label="Grades  E·S·X·Z" sortKey="entry_grade" {...sortProps} />
      </div>

      <div className={cn(COLUMN_WIDTHS.emotions, 'flex-shrink-0', optional('emotions'))}>
        <ColLabel>Emotions</ColLabel>
      </div>
      <div className={cn(COLUMN_WIDTHS.rating, 'flex-shrink-0', optional('overallRating'))}>
        <ColLabel>Rating</ColLabel>
      </div>
      <div className={cn(COLUMN_WIDTHS.images, 'flex-shrink-0')}>
        <ColLabel>Img</ColLabel>
      </div>
      <div className={cn(COLUMN_WIDTHS.done, 'hidden flex-shrink-0 lg:block')}>
        <ColLabel>Done</ColLabel>
      </div>

      {onToggleColumn && (
        <div className="ml-auto flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Toggle columns"
                className="rounded p-1 text-white/20 transition-colors hover:text-white/55"
              >
                <SlidersHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] border-white/10 bg-[#1a1a24]">
              <DropdownMenuLabel className="text-[10px] text-white/40">Toggle columns</DropdownMenuLabel>
              {OPTIONAL_COLUMNS.map(({ key, label }) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onToggleColumn(key)}
                  className="flex cursor-pointer items-center gap-2 text-white/70 hover:text-white"
                >
                  <div className={cn(
                    'flex h-3.5 w-3.5 items-center justify-center rounded border',
                    columns?.[key] ? 'border-cyan-400/60 bg-cyan-500/20' : 'border-white/20',
                  )}>
                    {columns?.[key] && <Check className="h-2.5 w-2.5 text-cyan-300" />}
                  </div>
                  <span className="text-xs">{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
