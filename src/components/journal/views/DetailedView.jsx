import React from 'react';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { useTradeScreenshotUrls } from '../shared/media/useScreenshotUrls';
import { DetailedTradeCard } from './detailed/DetailedTradeCard';

export default function DetailedView({
  trades,
  onEdit,
  onDuplicateTrade,
  onCopyNotes,
  onInlineUpdateTrade,
}) {
  const [lightboxImage, setLightboxImage] = React.useState(null);
  const { urlsById: screenshotUrls, statusById: screenshotStatuses } = useTradeScreenshotUrls(trades);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 p-3 max-h-[600px] overflow-y-auto">
        {trades.map((trade) => (
          <DetailedTradeCard
            key={trade.id}
            trade={trade}
            onEdit={onEdit}
            onDuplicateTrade={onDuplicateTrade}
            onCopyNotes={onCopyNotes}
            onInlineUpdateTrade={onInlineUpdateTrade}
            screenshotUrls={screenshotUrls}
            screenshotStatuses={screenshotStatuses}
            onOpenImage={setLightboxImage}
          />
        ))}
      </div>
      <ImageLightbox
        isOpen={Boolean(lightboxImage)}
        imageUrl={lightboxImage}
        alt="Trade screenshot"
        onClose={() => setLightboxImage(null)}
      />
    </>
  );
}
