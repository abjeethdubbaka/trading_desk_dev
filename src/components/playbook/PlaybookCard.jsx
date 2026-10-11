import React, { useState } from 'react';
import { BookPlus, CheckCircle2, Download, ExternalLink, FileCode2, Image, Shield, ShieldAlert, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/general';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';
import { getRiskVerdict } from '@/lib/dataPoints/utils';
import { useResolvedImages } from '@/lib/hooks/useLocalImages';
import { useIndicatorFiles } from '@/lib/hooks/useIndicatorFiles';
import { formatIndicatorSize } from '@/lib/playbook/indicators';
import IndicatorCodeDialog from './IndicatorCodeDialog';
import { StrategyTriggers } from './TriggerPanels';
import { ConditionsPanel, CriteriaSection, GradeCriteriaPanel, PlaybookCardActions, TriggerSpecPanel } from './PlaybookCardParts';

export default function PlaybookCard({
  entry,
  images: resolvedImages = null,
  dataPointSummary = null,
  triggerSummary = null,
  executionScore = null,
  currentVersion = null,
  onEdit,
  onHistory,
  onDuplicate,
  onToggleActive,
  onMarkReviewed,
  onDelete,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [viewingIndicator, setViewingIndicator] = useState(null);
  const { download: downloadIndicator } = useIndicatorFiles();
  const indicators = Array.isArray(entry.indicators) ? entry.indicators : [];

  const handleDownloadIndicator = async (indicator) => {
    try {
      await downloadIndicator(indicator);
    } catch (error) {
      toast.error(error?.message || 'Could not save the file');
    }
  };
  const imageRefs = Array.isArray(resolvedImages)
    ? resolvedImages
    : (Array.isArray(entry.images) ? entry.images : []);
  // Charts are files on disk now, so the thumbnails read them on demand.
  // A chart on disk shows once it has been read; until then its slot holds
  // nothing. Never the raw "local:" reference — the page's security policy
  // blocks loading it, which only fills the console with errors.
  const images = useResolvedImages(imageRefs);
  const dataPointRiskVerdict = dataPointSummary
    ? getRiskVerdict(dataPointSummary, entry.expected_r_profile)
    : null;

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
        {/* Name, how the setup is classified, and how it is actually
            resolving all read on one line — the card's headline. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <h3 className="text-base font-semibold text-white/95">{entry.name}</h3>

          {entry.direction && entry.direction !== 'both' && (
            <span className={cn(
              'rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              entry.direction === 'long'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-400/40 bg-rose-500/15 text-rose-200',
            )}>
              {entry.direction}
            </span>
          )}

          {(Array.isArray(entry.timeframe) ? entry.timeframe : []).map((tf) => (
            <span key={tf} className="rounded-full border border-slate-400/25 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-200/80">
              {tf}
            </span>
          ))}

          {/* Which revision of the rules is live. Trades are stamped with it,
              so each version is judged on the trades it allowed. */}
          {currentVersion?.version ? (
            <span
              className="rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/55"
              title={`Live rules: v${currentVersion.version}${currentVersion.summary ? ` — ${currentVersion.summary}` : ''}`}
            >
              v{currentVersion.version}
            </span>
          ) : null}

          {/* How well this setup is executed, from the rating Add Trade gives
              each trade — a different question from whether it pays. */}
          {executionScore ? (
            <span
              className={cn(
                'rounded border px-1.5 py-0.5 text-[10px] text-white/70',
                executionScore.score >= 8 ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  : executionScore.score >= 6.5 ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                  : 'border-rose-400/30 bg-rose-500/10 text-rose-200',
              )}
              title={`Average execution rating across ${executionScore.count} graded trade(s)`}
            >
              Execution <span className="font-semibold">{executionScore.score}/10</span>
              <span className="ml-1 opacity-70">{executionScore.grade}</span>
            </span>
          ) : null}

          {/* Per Data Points — study samples plus logged trades, scored
              against this setup's own exit ladder. */}
          {dataPointSummary && dataPointSummary.scored > 0 ? (
            <>
              {/* Only an actionable call is worth a badge — while the
                  sample is still too small there is nothing to say here. */}
              {dataPointRiskVerdict && dataPointRiskVerdict.key !== 'insufficient' ? (
                <span className={cn(
                  'rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                  dataPointRiskVerdict.key === 'increase' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                    : dataPointRiskVerdict.key === 'reduce' ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                    : 'border-amber-400/30 bg-amber-500/10 text-amber-200',
                )}>
                  {dataPointRiskVerdict.label}
                </span>
              ) : null}
              <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/70">
                Expectancy <span className="font-semibold text-white/90">{dataPointSummary.expectancy}R</span>
              </span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/70">
                Median <span className="font-semibold text-white/90">{dataPointSummary.medianR}R</span>
              </span>
              <span className="rounded border border-cyan-500/25 bg-cyan-500/[0.08] px-1.5 py-0.5 text-[10px] text-cyan-200/80">
                {dataPointSummary.scored} obs
              </span>
            </>
          ) : null}
        </div>

        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
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

      {entry.has_sl_exit_plan !== false && (
        <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
          <ConditionsPanel conditions={entry.setup_conditions} />
          <GradeCriteriaPanel gradeCriteria={entry.grade_criteria} />
          <TriggerSpecPanel triggerSpec={entry.trigger_spec} />
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
            toneClassName="text-teal-200/90"
          />
          <CriteriaSection
            label="Stop Loss"
            items={entry.stop_loss_management}
            icon={Shield}
            toneClassName="text-indigo-200/90"
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

      {indicators.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
            <FileCode2 className="mr-1 inline h-3 w-3 opacity-60" />
            Indicators
          </p>
          <ul className="mt-1.5 space-y-1">
            {indicators.map((indicator) => (
              <li key={indicator.id} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewingIndicator(indicator)}
                  className="min-w-0 text-left"
                  title="View code"
                >
                  <span className="block truncate font-mono text-xs text-violet-200 hover:text-violet-100">
                    {indicator.name}
                  </span>
                  {indicator.note ? <span className="block truncate text-[11px] text-white/50">{indicator.note}</span> : null}
                </button>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <span className="text-[10px] text-white/30">{formatIndicatorSize(indicator.size)}</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadIndicator(indicator)}
                    title="Save .cs file"
                    className="rounded p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white/85"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <IndicatorCodeDialog
            indicator={viewingIndicator}
            onOpenChange={(open) => { if (!open) setViewingIndicator(null); }}
          />
        </div>
      )}

      <StrategyTriggers summary={triggerSummary} />

      {images.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 mb-1.5">
            <Image className="inline w-3 h-3 mr-1 opacity-60" />
            Charts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {images.map((url, i) => (url ? (
              <img
                key={i}
                src={url}
                alt={`Chart ${i + 1}`}
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                decoding="async"
                // Charts are wide; a small square crop hid most of the chart
                // and read as blurry, so the preview keeps a chart's shape.
                className="h-20 w-36 object-cover object-left-top rounded-lg cursor-pointer border border-white/10 hover:opacity-85 transition-opacity"
              />
            ) : (
              <div key={i} className="h-20 w-36 animate-pulse rounded-lg border border-white/10 bg-white/[0.05]" />
            )))}
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
        onHistory={onHistory}
        onDuplicate={onDuplicate}
        onToggleActive={onToggleActive}
        onMarkReviewed={onMarkReviewed}
        onDelete={onDelete}
      />
    </div>
  );
}
