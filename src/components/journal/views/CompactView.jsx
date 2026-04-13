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
  reviews,
  reviewLoading,
  onReviewTrade,
  onClearReview,
  reviewUsefulness,
  onRateReviewUsefulness,
}) {
  const { urlsById: screenshotUrls, statusById: screenshotStatuses } = useTradeScreenshotUrls(trades);
  const [lightboxImage, setLightboxImage] = React.useState(null);

  return (
    <div className="overflow-x-auto">
      <CompactHeader />
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
            review={reviews?.[trade.id]}
            reviewLoading={reviewLoading?.[trade.id]}
            onReviewTrade={onReviewTrade}
            onClearReview={onClearReview}
            reviewUsefulness={reviewUsefulness?.[trade.id] ?? null}
            onRateReviewUsefulness={onRateReviewUsefulness}
            screenshotUrls={screenshotUrls}
            screenshotStatuses={screenshotStatuses}
            onOpenImage={(url) => setLightboxImage(url)}
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
