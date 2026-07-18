import React, { useState } from 'react';
import { BookPlus, CheckCircle2, ExternalLink, Image, Shield, ShieldAlert, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';
import { formatDate, toExpectedRLabel } from './playbookFormHelpers';
import { CriteriaSection, MetricsPill, PlaybookCardActions } from './PlaybookCardParts';

export default function PlaybookCard({
  entry,
  onEdit,
  onDuplicate,
  onToggleActive,
  onMarkReviewed,
  onDelete,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const images = Array.isArray(entry.images) ? entry.images : [];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5',
        entry.is_active
          ? 'border-emerald-300/25 bg-emerald-500/[0.06] hover:border-emerald-300/35'
          : 'border-white/12 bg-white/[0.03] hover:border-white/25'
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-20 opacity-70',
          entry.is_active
            ? 'bg-gradient-to-b from-emerald-400/12 to-transparent'
            : 'bg-gradient-to-b from-cyan-300/8 to-transparent'
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white/95">{entry.name}</h3>
          {Array.isArray(entry.timeframe) && entry.timeframe.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {entry.timeframe.map((tf) => (
                <span key={tf} className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cyan-200/80">
                  {tf}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <span
          className={cn(
            'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
            entry.is_active
              ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100'
              : 'border-white/20 bg-white/10 text-white/70'
          )}
        >
          {entry.is_active ? 'Active' : 'Archived'}
        </span>
      </div>

      {entry.description ? (
        <p className="mt-2.5 text-sm text-white/80">{entry.description}</p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricsPill label="Expected R" value={toExpectedRLabel(entry.expected_r_profile)} />
        <div className={cn(
          'rounded-xl border px-3 py-2.5',
          entry.risk_level === 'half'         ? 'border-amber-500/25 bg-amber-500/8' :
          entry.risk_level === 'double'       ? 'border-rose-500/25 bg-rose-500/8' :
          entry.risk_level === 'oneandahalf' ? 'border-cyan-500/25 bg-cyan-500/8' :
                                               'border-emerald-500/20 bg-emerald-500/6',
        )}>
          <p className="text-[9px] uppercase tracking-widest text-white/40">Risk Level</p>
          <p className={cn(
            'mt-1 text-sm font-semibold',
            entry.risk_level === 'half'         ? 'text-amber-300' :
            entry.risk_level === 'double'       ? 'text-rose-300' :
            entry.risk_level === 'oneandahalf' ? 'text-cyan-300' :
                                                 'text-emerald-300',
          )}>
            {entry.risk_level === 'half' ? '½×' : entry.risk_level === 'double' ? '2×' : entry.risk_level === 'oneandahalf' ? '1.5×' : '1×'}
          </p>
        </div>
        <MetricsPill
          label="Last Reviewed"
          value={entry.last_reviewed_at ? formatDate(entry.last_reviewed_at) : 'Not reviewed'}
        />
      </div>

      {entry.has_sl_exit_plan !== false && (
        <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
          <CriteriaSection
            label="Entry Criteria"
            items={entry.entry_criteria}
            icon={BookPlus}
            toneClassName="text-emerald-200/90"
          />
          <CriteriaSection
            label="Exit Criteria"
            items={entry.exit_criteria}
            icon={CheckCircle2}
            toneClassName="text-cyan-200/90"
          />
          <CriteriaSection
            label="Stop Loss"
            items={entry.stop_loss_management}
            icon={Shield}
            toneClassName="text-violet-200/90"
          />
          <CriteriaSection
            label="Stop Loss Move"
            items={entry.stop_loss_move}
            icon={TrendingUp}
            toneClassName="text-amber-200/90"
          />
          <CriteriaSection
            label="Invalidations"
            items={entry.invalidations}
            icon={ShieldAlert}
            toneClassName="text-rose-200/90"
          />
        </div>
      )}

      {Array.isArray(entry.examples) && entry.examples.length > 0 ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Examples</p>
          <div className="mt-1.5 space-y-1.5">
            {entry.examples.map((example, index) => (
              <div key={`${entry.id}-example-${index}`} className="text-xs text-white/80">
                <p className="font-semibold text-white/90">{example.title || `Example ${index + 1}`}</p>
                {example.note ? <p className="text-white/70">{example.note}</p> : null}
                {example.url ? (
                  <a
                    href={example.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                  >
                    Open link
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {images.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 mb-1.5">
            <Image className="inline w-3 h-3 mr-1 opacity-60" />
            Charts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Chart ${i + 1}`}
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                className="w-16 h-16 object-cover rounded-lg cursor-pointer border border-white/10 hover:opacity-85 hover:scale-105 transition-all"
              />
            ))}
          </div>
          <MultiImageLightbox
            isOpen={lightboxOpen}
            images={images}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        </div>
      )}

      <PlaybookCardActions
        entry={entry}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onToggleActive={onToggleActive}
        onMarkReviewed={onMarkReviewed}
        onDelete={onDelete}
      />
    </div>
  );
}
