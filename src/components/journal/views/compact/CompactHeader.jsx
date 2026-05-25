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
import { OPTIONAL_COLUMNS } from '../../shared/hooks/useColumnVisibility';

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown className="inline ml-0.5 h-2.5 w-2.5 opacity-30" />;
  return dir === 'asc'
    ? <ChevronUp   className="inline ml-0.5 h-2.5 w-2.5 text-cyan-400" />
    : <ChevronDown className="inline ml-0.5 h-2.5 w-2.5 text-cyan-400" />;
}

function SortableHeader({ label, sortKey: key, activeSortKey, activeSortDir, onSortChange, className }) {
  const active = activeSortKey === key;
  return (
    <button
      type="button"
      onClick={() => onSortChange(key)}
      className={cn(
        'cursor-pointer select-none whitespace-nowrap text-[9px] font-semibold uppercase tracking-widest',
        'transition-colors hover:text-white/60',
        active ? 'text-cyan-400/80' : 'text-white/25',
        className,
      )}
    >
      {label}
      <SortIcon active={active} dir={activeSortDir} />
    </button>
  );
}

function ColLabel({ children }) {
  return <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">{children}</span>;
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

      <div className="w-[82px] flex-shrink-0">
        <SortableHeader label="Date/Time" sortKey="date" {...sortProps} />
      </div>
      <div className="w-[110px] flex-shrink-0">
        <SortableHeader label="Symbol" sortKey="symbol" {...sortProps} />
      </div>
      <div className="hidden w-[100px] flex-shrink-0 sm:block">
        <ColLabel>Entry → Exit</ColLabel>
      </div>
      <div className="hidden w-[58px] flex-shrink-0 md:block">
        <ColLabel>Size</ColLabel>
      </div>
      <div className="w-[150px] flex-shrink-0">
        <SortableHeader label="P&L" sortKey="pnl" {...sortProps} />
      </div>
      <div className="hidden w-[52px] flex-shrink-0 lg:block">
        <SortableHeader label="R" sortKey="r_multiple" {...sortProps} />
      </div>

      <div className={cn('w-[110px] flex-shrink-0', columns?.setup ? 'hidden xl:block' : 'hidden')}>
        <SortableHeader label="Setup" sortKey="setup" {...sortProps} />
      </div>
      <div className={cn('w-[120px] flex-shrink-0', columns?.emotions ? 'hidden xl:block' : 'hidden')}>
        <ColLabel>Emotions</ColLabel>
      </div>
      <div className={cn('w-[90px] flex-shrink-0', columns?.quality ? 'hidden xl:block' : 'hidden')}>
        <ColLabel>Quality</ColLabel>
      </div>
      <div className={cn('w-[120px] flex-shrink-0', columns?.plan ? 'hidden xl:block' : 'hidden')}>
        <ColLabel>Plan</ColLabel>
      </div>

      <div className="w-20 flex-shrink-0">
        <ColLabel>Img</ColLabel>
      </div>
      <div className="hidden lg:block w-[60px] flex-shrink-0">
        <ColLabel>Done</ColLabel>
      </div>

      {/* Column visibility toggle */}
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
