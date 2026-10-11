import React from 'react';
import { cn } from '@/lib/utils/general';
import { CompactHeader } from './compact/CompactHeader';
import { CompactTradeRow } from './compact/CompactTradeRow';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';
import { useTradeScreenshotUrls } from '../media/useScreenshotUrls';
import { groupTradesByDay } from '@/lib/journal/dayGroups';
import { assessDay } from '@/lib/journal/dayAssessment';
import { formatGuardianTimeline } from '@/lib/guardian/days';
import { Shield } from 'lucide-react';

const money = (value) => `${value >= 0 ? '+' : '-'}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

/**
 * One trading day's heading: the date, and how the day went. A trader
 * reviews in days, so the day carries the result and the rows carry only
 * their time.
 */
const FEEDBACK_TONE = {
  danger: 'border-rose-500/30 bg-rose-500/12 text-rose-200',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  positive: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  neutral: 'border-white/10 bg-white/[0.04] text-white/55',
};

/** That weekday's loss limit, Mon–Fri; a weekend day has none to break. */
function lossLimitFor(date, dailyLossLimits) {
  if (!date || !Array.isArray(dailyLossLimits)) return 0;
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return 0;
  return Number(dailyLossLimits[dow - 1]) || 0;
}

function DayHeader({ group, maxDailyTrades = 0, dailyLossLimits, guardianDay = null }) {
  const label = group.date
    ? group.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Undated';
  const isToday = group.date && group.date.toDateString() === new Date().toDateString();
  // More trades than the daily limit allows is a broken rule, whatever the P&L.
  const overLimit = maxDailyTrades > 0 && group.count > maxDailyTrades;
  const { quality, feedback, issues } = React.useMemo(
    () => assessDay(group.trades, { maxDailyTrades, maxDailyLoss: lossLimitFor(group.date, dailyLossLimits), guardianDay }),
    [group.trades, group.date, maxDailyTrades, dailyLossLimits, guardianDay],
  );
  const qualityTone = quality == null
    ? ''
    : quality >= 7 ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300'
      : quality >= 4 ? 'border-amber-500/25 bg-amber-500/8 text-amber-300'
        : 'border-rose-500/25 bg-rose-500/8 text-rose-300';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/[0.06] bg-white/[0.025] px-3 py-1.5">
      <span className="text-xs font-semibold text-white/80">
        {label}
        {isToday && <span className="ml-1.5 text-[10px] font-medium text-cyan-300/80">today</span>}
      </span>
      <span
        className={cn(
          'text-[11px]',
          overLimit ? 'rounded border border-rose-500/30 bg-rose-500/15 px-1.5 font-semibold text-rose-300' : 'text-white/35',
        )}
        title={overLimit ? `Over the limit of ${maxDailyTrades} trades a day` : undefined}
      >
        {group.count} trade{group.count === 1 ? '' : 's'}
        {overLimit && <span className="font-normal text-rose-300/70"> / {maxDailyTrades} max</span>}
      </span>
      <span className={cn('font-mono text-xs font-semibold', group.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
        {money(group.pnl)}
      </span>
      {group.avgR != null && (
        <span className="font-mono text-[11px] text-white/45">{group.avgR > 0 ? '+' : ''}{group.avgR}R avg</span>
      )}
      <span className="text-[11px] text-white/35">{group.wins}/{group.count} won</span>
      {quality != null && (
        <span
          className={cn('rounded border px-1.5 py-px text-[10px] font-bold tabular-nums', qualityTone)}
          title="Day quality: the average rating of the day's trades"
        >
          {quality}/10
        </span>
      )}

      {/* Beside the quality: the one thing most worth knowing about the day, the rest on hover. */}
      <span
        className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px]', FEEDBACK_TONE[feedback.tone])}
        title={(issues.length > 0 ? issues : [feedback]).map((item) => `${item.title}: ${item.detail}`).join('\n')}
      >
        <span className="font-semibold">{feedback.title}</span>
        <span className="hidden opacity-75 md:inline">· {feedback.detail}</span>
        {issues.length > 1 && <span className="font-semibold opacity-80">+{issues.length - 1} more</span>}
      </span>

      {/* Guardian watched this day: its timeline on hover. */}
      {guardianDay?.events?.length > 0 && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px]',
            guardianDay.locked ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-white/10 bg-white/[0.04] text-white/50',
          )}
          title={['Trading Guardian', ...formatGuardianTimeline(guardianDay)].join('\n')}
        >
          <Shield className="h-3 w-3" />
          {guardianDay.locked ? 'Locked' : `${guardianDay.events.length} event${guardianDay.events.length === 1 ? '' : 's'}`}
        </span>
      )}
    </div>
  );
}

export default function CompactView({
  trades,
  onEdit,
  onDelete,
  onInlineUpdateTrade,
  onViewDetails,
  // Sort
  sortKey,
  sortDir,
  onSortChange,
  // Bulk selection
  selectedIds,
  onToggleSelect,
  onToggleAll,
  isAllSelected,
  isIndeterminate,
  // Column visibility
  columns,
  onToggleColumn,
  riskLimit = 0,
  // The most trades a day the rules allow; 0 means no limit.
  maxDailyTrades = 0,
  // Max daily loss for Monday to Friday.
  dailyLossLimits,
  // Trading Guardian's record of each day, by YYYY-MM-DD.
  guardianDaysByDate,
  // Trade ids that have a Setup Journal debrief
  journaledTradeIds,
}) {
  const { urlsById: screenshotUrls, statusById: screenshotStatuses } = useTradeScreenshotUrls(trades);

  // { urls: string[], startIndex: number } | null
  const [lightbox, setLightbox] = React.useState(null);
  const showCheckbox = Boolean(onToggleSelect);

  const handleOpenImage = React.useCallback((url, trade) => {
    const ids = Array.isArray(trade?.screenshots) ? trade.screenshots : [];
    const urls = ids.map((id) => screenshotUrls[id]).filter(Boolean);
    const startIndex = Math.max(0, urls.indexOf(url));
    setLightbox({ urls: urls.length > 0 ? urls : [url], startIndex });
  }, [screenshotUrls]);

  const groups = React.useMemo(() => groupTradesByDay(trades), [trades]);
  const isDebriefed = (trade) => Boolean(journaledTradeIds?.has(String(trade.id)));

  return (
    <div className="overflow-x-auto">
      <CompactHeader
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={onSortChange}
        showCheckbox={showCheckbox}
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        onToggleAll={onToggleAll}
        columns={columns}
        onToggleColumn={onToggleColumn}
      />

      {groups.map((group) => (
        <div key={group.key}>
          <DayHeader
            group={group}
            maxDailyTrades={maxDailyTrades}
            dailyLossLimits={dailyLossLimits}
            guardianDay={guardianDaysByDate?.get(group.key) || null}
          />
          {group.trades.map((trade) => (
            <CompactTradeRow
              key={trade.id}
              trade={trade}
              riskLimit={riskLimit}
              onEdit={onEdit}
              onDelete={onDelete}
              onInlineUpdateTrade={onInlineUpdateTrade}
              onViewDetails={onViewDetails}
              columns={columns}
              screenshotUrls={screenshotUrls}
              screenshotStatuses={screenshotStatuses}
              onOpenImage={(url) => handleOpenImage(url, trade)}
              isSelected={selectedIds?.has(trade.id)}
              onToggleSelect={onToggleSelect}
              isDebriefed={journaledTradeIds ? isDebriefed(trade) : null}
            />
          ))}
        </div>
      ))}

      <MultiImageLightbox
        isOpen={Boolean(lightbox)}
        images={lightbox?.urls ?? []}
        startIndex={lightbox?.startIndex ?? 0}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
