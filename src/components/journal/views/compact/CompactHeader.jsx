import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/general';

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown className="w-2.5 h-2.5 opacity-30 inline ml-0.5" />;
  return dir === 'asc'
    ? <ChevronUp   className="w-2.5 h-2.5 text-cyan-400 inline ml-0.5" />
    : <ChevronDown className="w-2.5 h-2.5 text-cyan-400 inline ml-0.5" />;
}

function SortableHeader({ label, sortKey: key, activeSortKey, activeSortDir, onSortChange, className }) {
  const active = activeSortKey === key;
  return (
    <button
      type="button"
      onClick={() => onSortChange(key)}
      className={cn(
        'text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap',
        'hover:text-white/60 transition-colors cursor-pointer select-none',
        active ? 'text-cyan-400/80' : 'text-white/25',
        className,
      )}
    >
      {label}
      <SortIcon active={active} dir={activeSortDir} />
    </button>
  );
}

export function CompactHeader({
  sortKey: activeSortKey,
  sortDir: activeSortDir,
  onSortChange,
  showCheckbox = false,
  isAllSelected = false,
  isIndeterminate = false,
  onToggleAll,
}) {
  const sortProps = { activeSortKey, activeSortDir, onSortChange };

  return (
    <div className="flex items-center gap-0 px-3 py-2 border-b border-white/[0.06] bg-white/[0.015]">
      {/* Checkbox column */}
      {showCheckbox && (
        <div className="w-6 flex-shrink-0 mr-1">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
            onChange={onToggleAll}
            className="w-3 h-3 rounded accent-cyan-500 cursor-pointer"
            title="Select all on page"
          />
        </div>
      )}

      {/* Expand chevron spacer */}
      <div className="w-5 mr-2 flex-shrink-0" />

      <div className="w-[82px] flex-shrink-0">
        <SortableHeader label="Date/Time" sortKey="date" {...sortProps} />
      </div>
      <div className="w-[110px] flex-shrink-0">
        <SortableHeader label="Symbol" sortKey="symbol" {...sortProps} />
      </div>
      <div className="w-[100px] flex-shrink-0 hidden sm:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Entry → Exit</span>
      </div>
      <div className="w-[58px] flex-shrink-0 hidden md:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Size</span>
      </div>
      <div className="w-[150px] flex-shrink-0">
        <SortableHeader label="P&L" sortKey="pnl" {...sortProps} />
      </div>
      <div className="w-[52px] flex-shrink-0 hidden lg:block">
        <SortableHeader label="R" sortKey="r_multiple" {...sortProps} />
      </div>
      <div className="w-[110px] flex-shrink-0 hidden xl:block">
        <SortableHeader label="Setup" sortKey="setup" {...sortProps} />
      </div>
      <div className="w-[120px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Emotions</span>
      </div>
      <div className="w-[90px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Quality</span>
      </div>
      <div className="w-[120px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Plan</span>
      </div>
      <div className="w-20 flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Img</span>
      </div>
    </div>
  );
}
