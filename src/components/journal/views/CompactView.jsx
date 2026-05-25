import React from 'react';
import { CompactHeader } from './compact/CompactHeader';
import { CompactTradeRow } from './compact/CompactTradeRow';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { useTradeScreenshotUrls } from '../shared/media/useScreenshotUrls';

export default function CompactView({
  trades,
  onEdit,
  onDelete,
  onDuplicateTrade,
  onCopyNotes,
  onInlineUpdateTrade,
  onViewDetails,
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
}) {
  const { urlsById: screenshotUrls, statusById: screenshotStatuses } = useTradeScreenshotUrls(trades);
  const [lightboxImage, setLightboxImage] = React.useState(null);
  const showCheckbox = Boolean(onToggleSelect);

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
            review={reviews?.[trade.id]}
            reviewLoading={reviewLoading?.[trade.id]}
            onReviewTrade={onReviewTrade}
            onClearReview={onClearReview}
            reviewUsefulness={reviewUsefulness?.[trade.id] ?? null}
            onRateReviewUsefulness={onRateReviewUsefulness}
            screenshotUrls={screenshotUrls}
            screenshotStatuses={screenshotStatuses}
            onOpenImage={(url) => setLightboxImage(url)}
            isSelected={selectedIds?.has(trade.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
      <ImageLightbox
        isOpen={Boolean(lightboxImage)}
        imageUrl={lightboxImage}
        alt="Trade screenshot"
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
