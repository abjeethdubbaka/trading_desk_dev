import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw, BookOpen, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';
import { FUTURES_CONTRACTS, toPointValue, toTickValue } from '@/lib/calculations/trades';
import PointValueInput from './PointValueInput';
import { normalizeRiskPercent } from '@/lib/playbook/utils';
import { usePlaybookImages } from '@/lib/hooks/usePlaybookImages';
import { useResolvedImages } from '@/lib/hooks/useLocalImages';
import { useInformativeImages } from '@/lib/hooks/useInformativeImages';
import { useTrades } from '@/lib/hooks/useTrades';
import { summarizeSymbolStops, suggestStopPrice } from '@/lib/calculations/tradeRisk';
import {
  flattenInformativeImages,
  getSetupOwnedGalleryIds,
  selectInformativeImagesForSetup,
} from '@/lib/informativeImages/utils';

/** A setup's size as a share of base risk, coloured by how far from full it is. */
function riskMetaFor(setup) {
  if (!setup) return null;
  const percent = normalizeRiskPercent(setup.risk_percent, setup.risk_level);
  if (percent === 100) return null;
  return {
    label: `${percent}% Size`,
    color: percent < 100 ? 'text-amber-300' : percent >= 200 ? 'text-rose-300' : 'text-cyan-300',
    bg: percent < 100
      ? 'bg-amber-500/10 border-amber-500/25'
      : percent >= 200 ? 'bg-rose-500/10 border-rose-500/25' : 'bg-cyan-500/10 border-cyan-500/25',
  };
}

function FloatInputForm({
  symbol,
  setSymbol,
  entryPrice,
  setEntryPrice,
  customStopLossPrice,
  setCustomStopLossPrice,
  onReset,
  playbookEntries = [],
  selectedSetupId = '',
  onSetupChange,
  selectedSetup = null,
  riskMultiplier = 1,
  baseRiskAmount = null,
  disabled = false,
  // futures
  isFutures = false,
  futuresPreset = 'ES',
  onFuturesPresetChange,
  tickSize = '',
  onTickSizeChange,
  tickValue = '',
  onTickValueChange,
}) {
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [lbImages, setLbImages] = useState([]);
  // The setup's rules are reference material, not something to read on every
  // trade — so they stay folded until asked for.
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const activeSetups = playbookEntries.filter((e) => e.is_active !== false);
  const riskMeta = riskMetaFor(selectedSetup);
  const { resolveImages } = usePlaybookImages();
  const setupImageRefs = selectedSetup ? resolveImages(selectedSetup) : [];
  // A chart on disk shows once it has been read; until then its slot holds
  // nothing. Never the raw "local:" reference — the page's security policy
  // blocks loading it, which only fills the console with errors.
  const setupImages = useResolvedImages(setupImageRefs);

  // Everything else studied under this setup's name in Informative Images —
  // the same reference material, in front of you while the position is sized.
  const { items: informativeImages } = useInformativeImages();
  const studiedImageRefs = selectedSetup
    ? flattenInformativeImages(selectInformativeImagesForSetup(
        informativeImages,
        selectedSetup.name,
        getSetupOwnedGalleryIds(selectedSetup),
      ))
    : [];
  const studiedImages = useResolvedImages(studiedImageRefs);
  const setupConditionRows = [
    ['Structure', selectedSetup?.setup_conditions?.structure],
    ['EMA Context', selectedSetup?.setup_conditions?.ema_context],
    ['Volume', selectedSetup?.setup_conditions?.volume],
    ['Market Context', selectedSetup?.setup_conditions?.market_context],
    ['Time', selectedSetup?.setup_conditions?.time],
    ['Entry Type', selectedSetup?.setup_conditions?.entry_type],
  ].filter(([, value]) => value);

  // What this symbol's stop has looked like before. One trade is a data
  // point; several make a habit worth suggesting, which is why the count is
  // always shown next to the number.
  const { data: allTrades = [] } = useTrades();
  const symbolStops = useMemo(
    () => summarizeSymbolStops(allTrades, symbol),
    [allTrades, symbol],
  );

  // A stop already typed above the entry means a short, so the suggestion is
  // mirrored rather than handed a long's stop.
  const typedStop = Number(customStopLossPrice);
  const typedEntry = Number(entryPrice);
  const stopDirection = Number.isFinite(typedStop) && Number.isFinite(typedEntry) && typedStop > typedEntry
    ? 'short'
    : 'long';
  const suggestedStop = suggestStopPrice(entryPrice, symbolStops, stopDirection);

  const baseRisk = Number.isFinite(Number(baseRiskAmount)) && Number(baseRiskAmount) > 0 ? Number(baseRiskAmount) : null;
  const effectiveRisk = baseRisk != null ? baseRisk * riskMultiplier : null; // used in risk badge


  return (
    <div className="space-y-4">

      {/* Setup selector */}
      {activeSetups.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-white/50">
            <BookOpen className="inline-block w-3 h-3 mr-1 opacity-60" />
            Playbook Setup
          </Label>
          <div className="flex gap-2">
            <select
              value={selectedSetupId}
              onChange={(e) => onSetupChange?.(e.target.value)}
              className="min-w-0 flex-1 h-10 rounded-lg border border-white/15 bg-[#0d1520] px-3 text-sm text-white/90 outline-none focus:border-emerald-400/40 focus:ring-0 appearance-none cursor-pointer"
            >
              <option value="" style={{ backgroundColor: '#0d1520', color: 'rgba(255,255,255,0.45)' }}>— No setup selected —</option>
              {activeSetups.map((s) => (
                <option key={s.id} value={s.id} style={{ backgroundColor: '#0d1520', color: 'rgba(255,255,255,0.92)' }}>
                  {s.name}
                  {riskMetaFor(s) ? ` (${riskMetaFor(s).label})` : ''}
                </option>
              ))}
            </select>
            {selectedSetup && (
              <button
                type="button"
                onClick={() => setIsSetupOpen((open) => !open)}
                aria-pressed={isSetupOpen}
                title={isSetupOpen ? 'Hide the setup rules' : 'Show the setup rules and charts'}
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition-colors',
                  isSetupOpen
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                    : 'border-white/15 bg-white/[0.03] text-white/45 hover:text-white/80',
                )}
              >
                {isSetupOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            {typeof onReset === 'function' && (
              <button
                type="button"
                onClick={onReset}
                title="Clear the calculator"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-white/35 transition-colors hover:text-white/70"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* The setup's rules and charts, behind the eye */}
          {selectedSetup && isSetupOpen && (
            <div className="rounded-lg border border-white/12 bg-[#0d1520]">
            <div className="px-3 py-2.5 space-y-2.5">

              {/* Row 1: badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {riskMeta && (
                  <span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', riskMeta.color, riskMeta.bg)}>
                    {riskMeta.label}{riskMultiplier !== 1 ? ` · ${riskMultiplier}×` : ''}
                  </span>
                )}
                {effectiveRisk != null && (
                  <span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-semibold tabular-nums', riskMeta?.color ?? 'text-white/60', riskMeta?.bg ?? '')}>
                    Risk ${effectiveRisk.toFixed(0)}
                  </span>
                )}
                {selectedSetup.timeframe && (
                  <span className="text-[10px] text-white/50">{selectedSetup.timeframe}</span>
                )}
              </div>

              {/* Chart thumbnails */}
              {setupImages.length > 0 && (
                <div className="flex gap-1.5">
                  {setupImages.slice(0, 4).map((url, i) => (!url
                    ? <div key={i} className="h-10 w-16 flex-shrink-0 animate-pulse rounded border border-white/15 bg-white/[0.05]" />
                    : (
                    <img
                      key={i}
                      src={url}
                      alt={`Chart ${i + 1}`}
                      onClick={() => { setLbImages(setupImages); setLbIndex(i); setLbOpen(true); }}
                      className="h-10 w-16 object-cover rounded border border-white/15 cursor-pointer hover:opacity-80 hover:border-white/35 transition-all flex-shrink-0"
                    />
                  )))}
                  {setupImages.length > 4 && (
                    <button
                      type="button"
                      onClick={() => { setLbImages(setupImages); setLbIndex(4); setLbOpen(true); }}
                      className="h-10 w-10 rounded border border-white/15 bg-white/[0.04] flex items-center justify-center text-[9px] text-white/50 hover:bg-white/[0.08] transition-colors flex-shrink-0"
                    >
                      +{setupImages.length - 4}
                    </button>
                  )}
                </div>
              )}

              {/* Studied charts filed under this setup in Informative Images */}
              {studiedImages.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-cyan-300/60">Studied Charts</p>
                  <div className="flex gap-1.5">
                    {studiedImages.slice(0, 4).map((url, i) => (!url
                      ? <div key={i} className="h-10 w-16 flex-shrink-0 animate-pulse rounded border border-cyan-400/20 bg-white/[0.05]" />
                      : (
                      <img
                        key={i}
                        src={url}
                        alt={`Studied chart ${i + 1}`}
                        decoding="async"
                        onClick={() => { setLbImages(studiedImages); setLbIndex(i); setLbOpen(true); }}
                        className="h-10 w-16 object-cover rounded border border-cyan-400/20 cursor-pointer hover:opacity-80 hover:border-cyan-400/45 transition-all flex-shrink-0"
                      />
                    )))}
                    {studiedImages.length > 4 && (
                      <button
                        type="button"
                        onClick={() => { setLbImages(studiedImages); setLbIndex(4); setLbOpen(true); }}
                        className="h-10 w-10 rounded border border-cyan-400/20 bg-cyan-500/[0.06] flex items-center justify-center text-[9px] text-cyan-200/60 hover:bg-cyan-500/[0.12] transition-colors flex-shrink-0"
                      >
                        +{studiedImages.length - 4}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Row 2: setup conditions */}
              {setupConditionRows.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-violet-300/60 mb-1">Setup Conditions</p>
                  {setupConditionRows.map(([label, value], i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-violet-400/50 flex-shrink-0" />
                      <span className="text-[10px] text-white/65 leading-snug">
                        <span className="text-white/40">{label}:</span> {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <MultiImageLightbox
                isOpen={lbOpen}
                images={lbImages.length > 0 ? lbImages : setupImages}
                startIndex={lbIndex}
                onClose={() => setLbOpen(false)}
              />
            </div>
            </div>
          )}
        </div>
      )}

      {/* Futures contract preset */}
      {isFutures && (
        <div className="space-y-3">
          <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-white/50">Futures Contract</Label>
          <div className="flex gap-2">
            <select
              value={futuresPreset}
              onChange={(e) => {
                const key = e.target.value;
                onFuturesPresetChange?.(key);
                const spec = FUTURES_CONTRACTS[key];
                if (spec) {
                  onTickSizeChange?.(String(spec.tickSize));
                  onTickValueChange?.(String(spec.tickValue));
                }
              }}
              className="flex-1 h-10 rounded-lg border border-white/15 bg-[#0d1520] px-3 text-sm text-white/90 outline-none focus:border-emerald-400/40 appearance-none cursor-pointer"
              disabled={disabled}
            >
              {Object.entries(FUTURES_CONTRACTS).map(([key, spec]) => (
                <option key={key} value={key} style={{ backgroundColor: '#0d1520' }}>
                  {key} — {spec.name} · ${toPointValue(spec.tickSize, spec.tickValue)}/pt
                </option>
              ))}
            </select>
          </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-white/50">Point Value ($)</Label>
              <PointValueInput
                tickSize={tickSize}
                tickValue={tickValue}
                onTickValueChange={onTickValueChange}
                className="h-10 bg-white/5 border-white/10 font-mono text-sm tabular-nums"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-white/50">Tick Size</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={tickSize}
                onChange={(e) => {
                  // A new tick size keeps the point value: what a point is worth does not change.
                  const pointValue = toPointValue(tickSize, tickValue);
                  onTickSizeChange?.(e.target.value);
                  const rescaled = pointValue != null ? toTickValue(e.target.value, pointValue) : null;
                  if (rescaled != null) onTickValueChange?.(String(rescaled));
                }}
                placeholder="0.25"
                className="h-10 bg-white/5 border-white/10 font-mono text-sm tabular-nums"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}

      {/* Price inputs: symbol narrow, the two prices sharing the rest */}
      <div className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-white/50">Symbol</Label>
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder={isFutures ? 'ES' : 'TSLA'}
            className="h-10 bg-white/5 border-white/10 px-2.5 font-mono text-sm uppercase tracking-wide focus-visible:ring-blue-500/30"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-white/50">Stop Loss</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={customStopLossPrice}
            onChange={(e) => setCustomStopLossPrice(e.target.value)}
            placeholder={isFutures ? '5880.00' : '209.50'}
            className="h-10 bg-white/5 border-white/10 font-mono text-sm tabular-nums focus-visible:ring-rose-500/30"
            disabled={disabled}
          />
          {symbolStops.count > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-white/40">
              <span>
                {symbolStops.count === 1 ? 'Last stop on' : `Usual stop on`} {symbolStops.symbol}
                <span className="ml-1 font-mono text-white/70">
                  {symbolStops.count === 1 ? symbolStops.lastDistance : symbolStops.avgDistance}
                </span>
                <span className="ml-1">({symbolStops.avgPercent}%)</span>
              </span>
              {symbolStops.count > 1 && (
                <span className="text-white/25">avg of {symbolStops.count} trades</span>
              )}
              {symbolStops.avgRisk != null && (
                <span className="text-white/25">· ${symbolStops.avgRisk.toLocaleString()} risked</span>
              )}
              {suggestedStop != null && (
                <button
                  type="button"
                  onClick={() => setCustomStopLossPrice(String(suggestedStop))}
                  className="rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 text-white/55 hover:bg-white/10 hover:text-white/85 transition-colors"
                >
                  Use {suggestedStop}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-white/50">Entry Price</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder={isFutures ? '5890.00' : '215.00'}
            className="h-10 bg-white/5 border-white/10 font-mono text-sm tabular-nums focus-visible:ring-emerald-500/30"
            disabled={disabled}
          />
        </div>
      </div>

    </div>
  );
}

// Re-renders on every keystroke in the calculator otherwise: the parent holds
// the live entry/stop/size state.
export default React.memo(FloatInputForm);
