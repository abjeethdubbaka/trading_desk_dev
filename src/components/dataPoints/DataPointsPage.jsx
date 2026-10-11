import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Crosshair, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/general';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import InfoHint from '@/components/ui/InfoHint';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';
import EntryImagesField, { MAX_ENTRY_IMAGES } from '@/components/playbook/EntryImagesField';
import { imageFileToDataUrl } from '@/components/journal/media/imageUtils';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import { useTrades } from '@/lib/hooks/useTrades';
import { useDataPoints } from '@/lib/hooks/useDataPoints';
import { useInformativeImages } from '@/lib/hooks/useInformativeImages';
import { useLocalImages, useResolvedImages } from '@/lib/hooks/useLocalImages';
import { IMAGE_BUCKETS } from '@/lib/images/localStore';
import {
  calcDataPointR,
  calcDataPointMfeR,
  getDataPointDirection,
  getConfiguredExitLevels,
  getExitLevel,
  getExitLevelR,
  getHighestLevelReached,
  getRiskVerdict,
  summarizeDataPoints,
  tradeToDataPoint,
} from '@/lib/dataPoints/utils';
import { toExpectedRLabel } from '@/components/playbook/playbookFormHelpers';
import { normalizeRiskPercent } from '@/lib/playbook/utils';

const EMPTY_FORM = {
  entry: '',
  stop_loss: '',
  exit: '',
  levels_reached: { min: null, target: null, stretch: null },
  mfe_r: '',
  note: '',
  images: [],
};

const VERDICT_TONES = {
  increase: 'border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-200',
  hold: 'border-amber-400/30 bg-amber-500/[0.08] text-amber-200',
  reduce: 'border-rose-400/30 bg-rose-500/[0.08] text-rose-200',
  insufficient: 'border-white/12 bg-white/[0.03] text-white/50',
};

function rTone(r) {
  if (r == null) return 'text-white/40';
  if (r >= 2) return 'text-emerald-300';
  if (r > 0) return 'text-emerald-400/70';
  return 'text-rose-400';
}

function SummaryStat({ label, value, tone = 'text-white/85', hint }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <p className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-white/40">
        {label}
        {hint ? <InfoHint text={hint} /> : null}
      </p>
      <p className={cn('mt-1 font-mono text-sm font-semibold', tone)}>{value}</p>
    </div>
  );
}

function DataPointCard({ point, expectedRProfile, onDelete, onViewImages, galleryImages = [] }) {
  const r = calcDataPointR(point, expectedRProfile);
  const direction = getDataPointDirection(point);
  const imageRefs = galleryImages.length > 0
    ? galleryImages
    : (Array.isArray(point.images) ? point.images : []);
  // A chart on disk shows once it has been read; until then its slot holds
  // nothing. Never the raw "local:" reference — the page's security policy
  // blocks loading it, which only fills the console with errors.
  const images = useResolvedImages(imageRefs);
  const exitLevel = getExitLevel(getHighestLevelReached(point));
  const mfeR = calcDataPointMfeR(point);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('font-mono text-lg font-bold', rTone(r))}>
            {r == null ? '—' : `${r > 0 ? '+' : ''}${r}R`}
          </span>
          {direction && (
            <span className={cn(
              'rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              direction === 'long'
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-400/30 bg-rose-500/10 text-rose-200',
            )}>
              {direction}
            </span>
          )}
          {exitLevel && (
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/50">
              {exitLevel.label}
            </span>
          )}
          {mfeR != null && (
            <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-200/80">
              MFE {mfeR}R
            </span>
          )}
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-200/80">
            Study
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1 text-white/25 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-white/50">
        {point.entry != null && <span>Entry <span className="text-white/80">{point.entry}</span></span>}
        {point.stop_loss != null && <span>Stop <span className="text-white/80">{point.stop_loss}</span></span>}
        {point.exit != null && <span>Exit <span className="text-white/80">{point.exit}</span></span>}
      </div>

      {point.note ? (
        <p className="mt-2 text-xs leading-relaxed text-white/55">{point.note}</p>
      ) : null}

      {images.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onViewImages(images, i)}
              className="h-14 w-14 overflow-hidden rounded-lg border border-white/10 transition-opacity hover:opacity-80"
            >
              {url
                ? <img src={url} alt={`Data point chart ${i + 1}`} className="h-full w-full object-cover" />
                : <div className="h-full w-full animate-pulse bg-white/[0.05]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DataPointsPage() {
  const { playbookEntries } = usePlaybook();
  const { data: trades = [] } = useTrades();
  const { dataPoints, isLoading, addDataPoint, isAdding, deleteDataPoint } = useDataPoints();
  const { items: informativeImages, addItem: addInformativeImage, isAdding: isSavingImages } = useInformativeImages();
  const { store: storeLocalImage, remove: removeLocalImage, isSupported: isLocalSupported } = useLocalImages();

  // A point's charts live in the gallery; look them up by reference so the
  // card can still show thumbnails.
  const imagesByGalleryId = useMemo(
    () => new Map(informativeImages.map((item) => [item.id, Array.isArray(item.images) ? item.images : []])),
    [informativeImages],
  );
  const [confirm, confirmDialog] = useConfirm();

  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [lightbox, setLightbox] = useState(null);

  const activeStrategy = selectedStrategy || playbookEntries[0]?.name || '';
  const selectedEntry = useMemo(
    () => playbookEntries.find((entry) => entry.name === activeStrategy) || null,
    [playbookEntries, activeStrategy],
  );

  const expectedRProfile = selectedEntry?.expected_r_profile || null;
  const exitLevelOptions = useMemo(
    () => getConfiguredExitLevels(expectedRProfile),
    [expectedRProfile],
  );

  // Study points you recorded plus the trades already logged for this setup —
  // both are evidence of how the strategy resolves, so they're judged together.
  const strategyPoints = useMemo(() => {
    const key = activeStrategy.trim().toLowerCase();
    if (!key) return [];

    const manual = dataPoints
      .filter((point) => String(point.strategy || '').trim().toLowerCase() === key)
      .map((point) => ({ ...point, source: point.source || 'manual' }));

    const fromTrades = trades
      .filter((trade) => String(trade.setup_type || '').trim().toLowerCase() === key)
      .map((trade) => tradeToDataPoint(trade));

    return [...manual, ...fromTrades].sort(
      (a, b) => Date.parse(b.created_date || 0) - Date.parse(a.created_date || 0),
    );
  }, [dataPoints, trades, activeStrategy]);

  // Logged trades still count towards the verdict, but they are not listed —
  // they already have a home in the Journal, and repeating them here buries
  // the study samples this page exists to collect.
  const studyPoints = useMemo(
    () => strategyPoints.filter((point) => point.source !== 'trade'),
    [strategyPoints],
  );

  const tradeCount = strategyPoints.length - studyPoints.length;

  const summary = useMemo(
    () => summarizeDataPoints(strategyPoints, expectedRProfile),
    [strategyPoints, expectedRProfile],
  );

  const verdict = useMemo(
    () => getRiskVerdict(summary, expectedRProfile),
    [summary, expectedRProfile],
  );

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const setLevelAnswer = (levelKey, answer) => setForm((prev) => ({
    ...prev,
    levels_reached: { ...prev.levels_reached, [levelKey]: answer },
  }));

  const handleUploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    try {
      const dataUrls = await Promise.all(files.map((file) => (
        isLocalSupported ? storeLocalImage(file, IMAGE_BUCKETS.informative) : imageFileToDataUrl(file)
      )));
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...dataUrls].slice(0, MAX_ENTRY_IMAGES),
      }));
    } catch {
      toast.error('Could not read that image');
    }
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleAdd = async () => {
    if (!activeStrategy) {
      toast.error('Create a Playbook setup first');
      return;
    }

    const answered = exitLevelOptions.filter(
      (level) => typeof form.levels_reached[level.key] === 'boolean',
    );
    if (answered.length === 0) {
      toast.error('Answer at least one exit level — yes or no');
      return;
    }

    const entry = Number(form.entry);
    const stopLoss = Number(form.stop_loss);
    const mfeR = Number(form.mfe_r);
    const hasEntry = Number.isFinite(entry);
    const hasStop = Number.isFinite(stopLoss);

    if (hasEntry && hasStop && entry === stopLoss) {
      toast.error('Stop loss must differ from entry');
      return;
    }

    try {
      // Charts belong in Informative Images — the gallery is where studied
      // charts are browsed, and keeping one copy avoids storing the same
      // base64 twice. The point keeps only a reference.
      let informativeImageId = '';
      if (form.images.length > 0) {
        const created = await addInformativeImage({
          images: form.images,
          category: activeStrategy,
          category_type: 'setup',
          note: form.note.trim() || `Data point · ${activeStrategy}`,
        });
        informativeImageId = created?.id || '';
      }

      await addDataPoint({
        strategy: activeStrategy,
        entry: hasEntry ? entry : null,
        stop_loss: hasStop ? stopLoss : null,
        exit: Number.isFinite(Number(form.exit)) && form.exit !== '' ? Number(form.exit) : null,
        levels_reached: form.levels_reached,
        mfe_r: Number.isFinite(mfeR) ? mfeR : null,
        note: form.note.trim(),
        images: [],
        informative_image_id: informativeImageId,
      });
      setForm(EMPTY_FORM);
      toast.success(form.images.length > 0
        ? 'Data point added · charts saved to Informative Images'
        : 'Data point added');
    } catch (error) {
      toast.error(`Could not add data point: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (point) => {
    const shouldDelete = await confirm({
      title: 'Delete this data point?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!shouldDelete) return;

    try {
      await deleteDataPoint(point.id);
      // Charts a point stored itself go with it. Ones in the gallery stay:
      // they are studied charts in their own right.
      for (const image of (Array.isArray(point.images) ? point.images : [])) {
        await removeLocalImage(image);
      }
      toast.success('Data point deleted');
    } catch (error) {
      toast.error(`Could not delete: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 text-white lg:p-8">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-cyan-400" />
          <h1 className="text-lg font-semibold text-white">Data Points</h1>
          <InfoHint text="Entry/exit/stop observations collected per strategy to calibrate its expected R. These are study samples only — they are never counted as trades and never affect Performance." />
        </div>
        <p className="mt-0.5 text-xs text-white/40">
          Record what a setup actually produced so its expected R comes from observation, not guesswork.
        </p>
      </div>

      {playbookEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-12 text-center">
          <p className="text-lg font-semibold text-white">No Playbook setups yet</p>
          <p className="mt-1 text-sm text-white/50">Create a setup in the Playbook first — data points are collected per strategy.</p>
        </div>
      ) : (
        <>
          {/* Strategy selector */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {playbookEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedStrategy(entry.name)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  entry.name === activeStrategy
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                    : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white/70',
                )}
              >
                {entry.name}
              </button>
            ))}
          </div>

          {/* The call this page exists to answer: size up, hold, or cut? */}
          <div className={cn('mb-4 rounded-2xl border px-4 py-3', VERDICT_TONES[verdict.key])}>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-sm font-semibold">{verdict.label}</p>
              {selectedEntry && (
                <span className="text-[11px] opacity-70">
                  current risk {normalizeRiskPercent(selectedEntry.risk_percent, selectedEntry.risk_level)}%
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs opacity-80">{verdict.detail}</p>
          </div>

          {/* Expected R vs what the evidence shows */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <SummaryStat
              label="Playbook Expected R"
              value={selectedEntry ? toExpectedRLabel(selectedEntry.expected_r_profile) : 'n/a'}
              tone="text-white/70"
              hint="The expected R profile configured for this setup in the Playbook."
            />
            <SummaryStat
              label="Expectancy"
              value={summary.expectancy == null ? '—' : `${summary.expectancy}R`}
              tone={rTone(summary.expectancy)}
              hint="Average R per observation — what one instance of this setup is worth. This drives the risk call above."
            />
            <SummaryStat
              label="Median R"
              value={summary.medianR == null ? '—' : `${summary.medianR}R`}
              tone={rTone(summary.medianR)}
              hint="Middle R across observations — resists outliers better than the average."
            />
            <SummaryStat
              label="Median MFE"
              value={summary.medianMfeR == null ? '—' : `${summary.medianMfeR}R`}
              tone={rTone(summary.medianMfeR)}
              hint={
                summary.mfeGap == null
                  ? 'Median furthest the move ran in your favour. Record MFE to see whether targets are unreachable or exits are early.'
                  : summary.mfeGap >= 0.5
                    ? `The move typically ran ${summary.mfeGap}R past where it was closed — exits are early.`
                    : summary.mfeGap <= 0
                      ? 'The move rarely runs past where it closes — the targets may be out of reach for this setup.'
                      : `Only ${summary.mfeGap}R was left on the table — exits are landing close to the high.`
              }
            />
            <SummaryStat
              label="Observations"
              value={summary.scored === 0 ? '0' : `${summary.scored}${summary.winRate == null ? '' : ` · ${summary.winRate}% +R`}`}
              tone="text-white/70"
              hint={`${summary.manualCount} study point(s) + ${summary.tradeCount} logged trade(s) for this setup.`}
            />
          </div>

          {/* Add form */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
              New data point · {activeStrategy}
            </p>

            {/* The trade as it was seen: where it was entered, where it was
                risked to, and where it was closed. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="dp-entry">Entry</Label>
                <Input
                  id="dp-entry"
                  type="number"
                  step="0.01"
                  value={form.entry}
                  onChange={(e) => updateForm('entry', e.target.value)}
                  placeholder="Optional — for context"
                  className="h-9 bg-white/[0.03] border-white/12 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dp-stop">Stop Loss</Label>
                <Input
                  id="dp-stop"
                  type="number"
                  step="0.01"
                  value={form.stop_loss}
                  onChange={(e) => updateForm('stop_loss', e.target.value)}
                  placeholder="Optional — for context"
                  className="h-9 bg-white/[0.03] border-white/12 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dp-exit">Exit</Label>
                <Input
                  id="dp-exit"
                  type="number"
                  step="0.01"
                  value={form.exit}
                  onChange={(e) => updateForm('exit', e.target.value)}
                  placeholder="Optional — where it closed"
                  className="h-9 bg-white/[0.03] border-white/12 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Exit Strategy — levels reached *
                <InfoHint text="The same question Add Trade asks: did the move reach each rung of this setup's exit ladder? R comes from the highest rung reached, per its configured value in the Playbook. Answering No to every rung means the stop took it (-1R)." />
              </Label>
              <div className="space-y-1.5">
                {exitLevelOptions.map((level) => {
                  const levelR = getExitLevelR(level.key, expectedRProfile);
                  const answer = form.levels_reached[level.key];
                  return (
                    <div key={level.key} className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                      <p className="text-xs text-white/70">
                        {level.label}
                        {levelR != null && <span className="ml-1.5 font-mono text-white/40">{levelR > 0 ? '+' : ''}{levelR}R</span>}
                      </p>
                      <div className="flex gap-1.5">
                        {[true, false].map((option) => {
                          const isSelected = answer === option;
                          return (
                            <button
                              key={String(option)}
                              type="button"
                              onClick={() => setLevelAnswer(level.key, isSelected ? null : option)}
                              className={cn(
                                'rounded-md border px-3 py-1 text-[11px] font-semibold transition-colors',
                                isSelected
                                  ? option
                                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                                    : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
                                  : 'border-white/10 bg-white/[0.03] text-white/35 hover:border-white/20 hover:text-white/60',
                              )}
                            >
                              {option ? 'YES' : 'NO'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              {exitLevelOptions.length === 0 && (
                <p className="text-[11px] text-amber-300/70">
                  Set Min/Target/Stretch R on this setup in the Playbook to record against its exit ladder.
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:max-w-[220px]">
              <Label htmlFor="dp-mfe" className="flex items-center gap-1.5">
                MFE (R)
                <InfoHint text="Maximum Favourable Excursion — how far the move ran in your favour at its best, in R, regardless of where it was actually exited. Comparing it to the R you captured shows whether targets are unreachable or exits are early." />
              </Label>
              <Input
                id="dp-mfe"
                type="number"
                step="0.1"
                value={form.mfe_r}
                onChange={(e) => updateForm('mfe_r', e.target.value)}
                placeholder="e.g. 2.5"
                className="h-9 bg-white/[0.03] border-white/12 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dp-note">Note</Label>
              <textarea
                id="dp-note"
                value={form.note}
                onChange={(e) => updateForm('note', e.target.value)}
                rows={2}
                placeholder="What made this a valid example of the setup…"
                className="w-full resize-none rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
              />
            </div>

            <EntryImagesField
              images={form.images}
              onUpload={handleUploadImages}
              onRemove={handleRemoveImage}
            />

            <div className="flex justify-end">
              <Button
                onClick={handleAdd}
                disabled={isAdding || isSavingImages}
                className="h-9 bg-cyan-600/80 px-4 text-sm font-semibold hover:bg-cyan-600"
              >
                {isAdding || isSavingImages ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Saving…</>
                ) : (
                  <><Plus className="mr-1.5 h-4 w-4" />Add Data Point</>
                )}
              </Button>
            </div>
          </div>

          {/* Collected points */}
          {tradeCount > 0 && (
            <p className="mb-3 text-[11px] text-violet-200/60">
              Plus {tradeCount} logged trade{tradeCount === 1 ? '' : 's'} from the Journal, counted in the numbers above.
            </p>
          )}

          {isLoading ? (
            <p className="text-sm text-white/35">Loading data points…</p>
          ) : studyPoints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
              <p className="text-sm font-semibold text-white/70">No data points for {activeStrategy} yet</p>
              <p className="mt-1 text-xs text-white/40">Add entry, exit, and stop above to start building a sample.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {studyPoints.map((point) => (
                <DataPointCard
                  key={point.id}
                  point={point}
                  expectedRProfile={expectedRProfile}
                  onDelete={() => handleDelete(point)}
                  onViewImages={(images, index) => setLightbox({ images, index })}
                  galleryImages={imagesByGalleryId.get(point.informative_image_id) || []}
                />
              ))}
            </div>
          )}
        </>
      )}

      <MultiImageLightbox
        isOpen={Boolean(lightbox)}
        images={lightbox?.images || []}
        startIndex={lightbox?.index || 0}
        title={activeStrategy}
        onClose={() => setLightbox(null)}
      />

      {confirmDialog}
    </div>
  );
}
