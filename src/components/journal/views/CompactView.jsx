import React from 'react';
import { CompactHeader } from './compact/CompactHeader';
import { CompactTradeRow } from './compact/CompactTradeRow';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';
import { useTradeScreenshotUrls } from '../shared/media/useScreenshotUrls';

export default function CompactView({
  trades,
  onEdit,
  onDelete,
  onDuplicateTrade,
  onCopyNotes,
  onInlineUpdateTrade,
  onViewDetails,
  onTagClick,
  reviews,
  reviewLoading,
  onReviewTrade,
  onClearReview,
  reviewUsefulness,
  onRateReviewUsefulness,
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
      <div>
        {trades.map((trade, index) => (
          <CompactTradeRow
            key={trade.id}
            trade={trade}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicateTrade={onDuplicateTrade}
            onCopyNotes={onCopyNotes}
            onInlineUpdateTrade={onInlineUpdateTrade}
            onViewDetails={onViewDetails}
            onTagClick={onTagClick}
            columns={columns}
            review={reviews?.[trade.id]}
            reviewLoading={reviewLoading?.[trade.id]}
            onReviewTrade={onReviewTrade}
            onClearReview={onClearReview}
            reviewUsefulness={reviewUsefulness?.[trade.id] ?? null}
            onRateReviewUsefulness={onRateReviewUsefulness}
            screenshotUrls={screenshotUrls}
            screenshotStatuses={screenshotStatuses}
            onOpenImage={(url) => handleOpenImage(url, trade)}
            isSelected={selectedIds?.has(trade.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      <MultiImageLightbox
        isOpen={Boolean(lightbox)}
        images={lightbox?.urls ?? []}
        startIndex={lightbox?.startIndex ?? 0}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
