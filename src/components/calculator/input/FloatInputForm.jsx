import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sigma, Plus, RotateCcw, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';

const RISK_LEVEL_META = {
  half:   { label: '½ Size', color: 'text-amber-300',   bg: 'bg-amber-500/10 border-amber-500/25' },
  normal: { label: 'Normal', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/25' },
  double: { label: '2× Size', color: 'text-rose-300',   bg: 'bg-rose-500/10 border-rose-500/25' },
};

export default function FloatInputForm({
  symbol,
  setSymbol,
  entryPrice,
  setEntryPrice,
  customStopLossPrice,
  setCustomStopLossPrice,
  exitPrice,
  setExitPrice,
  onCalculate,
  onAddToJournal,
  canAddToJournal = false,
  isSavingTrade = false,
  onReset,
  playbookEntries = [],
  selectedSetupId = '',
  onSetupChange,
  selectedSetup = null,
  riskMultiplier = 1,
  baseRiskAmount = null,
  todayTradeCount = 0,
  maxDailyTrades = null,
  disabled = false,
}) {
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  const activeSetups = playbookEntries.filter((e) => e.is_active !== false);
  const riskMeta = RISK_LEVEL_META[selectedSetup?.risk_level] ?? null;
  const setupImages = Array.isArray(selectedSetup?.images) ? selectedSetup.images : [];

  const baseRisk = Number.isFinite(Number(baseRiskAmount)) && Number(baseRiskAmount) > 0 ? Number(baseRiskAmount) : null;
  const effectiveRisk = baseRisk != null ? baseRisk * riskMultiplier : null; // used in risk badge


  const hasLimit = maxDailyTrades != null && Number.isFinite(Number(maxDailyTrades)) && Number(maxDailyTrades) > 0;
  const limitNum = hasLimit ? Number(maxDailyTrades) : null;
  const tradeCountColor = !hasLimit
    ? 'text-white/40 border-white/10 bg-white/[0.03]'
    : todayTradeCount >= limitNum
      ? 'text-rose-300 border-rose-500/35 bg-rose-500/12'
      : todayTradeCount >= limitNum - 1
        ? 'text-amber-300 border-amber-500/35 bg-amber-500/12'
        : 'text-emerald-300 border-emerald-500/25 bg-emerald-500/8';

  return (
    <div className="space-y-4">

      {/* Setup selector */}
      {activeSetups.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs uppercase tracking-wide text-white/60">
              <BookOpen className="inline-block w-3 h-3 mr-1 opacity-60" />
              Playbook Setup
            </Label>
            <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none', tradeCountColor)}>
              {todayTradeCount}{hasLimit ? `/${limitNum}` : ''} trades today
              {hasLimit && todayTradeCount >= limitNum ? ' · LIMIT' : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedSetupId}
              onChange={(e) => onSetupChange?.(e.target.value)}
              className="flex-1 h-10 rounded-lg border border-white/15 bg-[#0d1520] px-3 text-sm text-white/90 outline-none focus:border-emerald-400/40 focus:ring-0 appearance-none cursor-pointer"
            >
              <option value="" style={{ backgroundColor: '#0d1520', color: 'rgba(255,255,255,0.45)' }}>— No setup selected —</option>
              {activeSetups.map((s) => (
                <option key={s.id} value={s.id} style={{ backgroundColor: '#0d1520', color: 'rgba(255,255,255,0.92)' }}>
                  {s.name}
                  {s.risk_level && s.risk_level !== 'normal' ? ` (${RISK_LEVEL_META[s.risk_level]?.label})` : ''}
                </option>
              ))}
            </select>
            {selectedSetupId && (
              <button
                type="button"
                onClick={() => onSetupChange?.('')}
                className="px-2 text-white/30 hover:text-white/60 transition-colors"
                title="Clear setup"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selected setup info */}
          {selectedSetup && (
            <div className="rounded-lg border border-white/12 bg-[#0d1520] px-3 py-2.5 space-y-2.5">

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
                  {setupImages.slice(0, 4).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Chart ${i + 1}`}
                      onClick={() => { setLbIndex(i); setLbOpen(true); }}
                      className="h-10 w-16 object-cover rounded border border-white/15 cursor-pointer hover:opacity-80 hover:border-white/35 transition-all flex-shrink-0"
                    />
                  ))}
                  {setupImages.length > 4 && (
                    <button
                      type="button"
                      onClick={() => { setLbIndex(4); setLbOpen(true); }}
                      className="h-10 w-10 rounded border border-white/15 bg-white/[0.04] flex items-center justify-center text-[9px] text-white/50 hover:bg-white/[0.08] transition-colors flex-shrink-0"
                    >
                      +{setupImages.length - 4}
                    </button>
                  )}
                </div>
              )}

              {/* Row 2: stop loss rules */}
              {selectedSetup.stop_loss_management?.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase tracking-widest text-violet-300/60 mb-1">Stop Loss Rules</p>
                  {selectedSetup.stop_loss_management.slice(0, 4).map((rule, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-violet-400/50 flex-shrink-0" />
                      <span className="text-[10px] text-white/65 leading-snug">{rule}</span>
                    </div>
                  ))}
                  {selectedSetup.stop_loss_management.length > 4 && (
                    <p className="text-[9px] text-white/35 pl-2.5">+{selectedSetup.stop_loss_management.length - 4} more</p>
                  )}
                </div>
              )}

              {/* Row 3: entry criteria */}
              {selectedSetup.entry_criteria?.length > 0 && (
                <div className="space-y-0.5">
                  {selectedSetup.entry_criteria.slice(0, 5).map((criterion, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-emerald-400/70" />
                      <span className="text-[10px] text-white/70 leading-snug">{criterion}</span>
                    </div>
                  ))}
                  {selectedSetup.entry_criteria.length > 5 && (
                    <p className="text-[9px] text-white/45 pl-4.5">+{selectedSetup.entry_criteria.length - 5} more</p>
                  )}
                </div>
              )}
              <MultiImageLightbox
                isOpen={lbOpen}
                images={setupImages}
                startIndex={lbIndex}
                onClose={() => setLbOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Price inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-white/60">Symbol</Label>
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="TSLA"
            className="h-11 bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-white/60">Entry Price</Label>
          <Input
            type="text"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="215.00"
            className="h-11 bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-white/60">Stop Loss</Label>
          <Input
            type="text"
            value={customStopLossPrice}
            onChange={(e) => setCustomStopLossPrice(e.target.value)}
            placeholder="209.50"
            className="h-11 bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {typeof onCalculate === 'function' && (
          <Button
            onClick={onCalculate}
            disabled={!entryPrice || disabled}
            variant="outline"
            className="h-11 border-white/15 bg-white/5 hover:bg-white/10"
          >
            <Sigma className="w-4 h-4 mr-2" />
            Calculate
          </Button>
        )}

        <div className="flex gap-2">
          <Input
            type="text"
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onAddToJournal?.(); }}
            placeholder="Exit Price"
            className="h-11 flex-1 bg-white/5 border-white/10 focus-visible:ring-emerald-500/30"
            disabled={disabled || isSavingTrade}
          />
          {typeof onAddToJournal === 'function' && (
            <Button
              onClick={onAddToJournal}
              disabled={!canAddToJournal || isSavingTrade}
              className="h-11 px-4 flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Save trade with this exit price"
            >
              {isSavingTrade ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          )}
          {typeof onReset === 'function' && (
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              className="h-11 px-3 flex-shrink-0 text-white/40 hover:text-white/70"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
