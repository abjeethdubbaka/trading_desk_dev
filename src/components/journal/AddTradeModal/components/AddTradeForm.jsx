import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Info, Lightbulb, Loader2, Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import DirectionToggle from './DirectionToggle';
import PriceFields from './PriceFields';
import TimeFields from './TimeFields';
import TradeMetrics from './TradeMetrics';
import EmotionsSelect from './EmotionsSelect';
import NotesFields from './NotesFields';
import ScreenshotUpload from './ScreenshotUpload';
import { SETUP_TYPE_OPTIONS as DEFAULT_SETUP_TYPE_OPTIONS } from '../constants/tradeConstants';

const CAP_OPTIONS = [
  { value: 'micro', label: 'Micro (<10M)' },
  { value: 'small', label: 'Small (10M-50M)' },
  { value: 'medium', label: 'Medium (50M-200M)' },
  { value: 'large', label: 'Large (200M-1B)' },
  { value: 'mega', label: 'Mega (1B+)' },
];

export default function AddTradeForm({
  initialData,
  controller,
  onClose,
}) {
  const {
    formData,
    symbolError,
    presets,
    screenshotIds,
    uploading,
    setupTypeOptions = DEFAULT_SETUP_TYPE_OPTIONS,
    selectedPlaybookEntry = null,
    tradeNudges = [],
    winPrediction = null,
    mistakeOptions = [],
    learningOptions = [],
    whatWorkedOptions = [],
    autoScreenshotSymbol = null,
    loading,
    handleSubmit,
    updateField,
    handleUploadFiles,
    handleRemoveById,
    handleReflectionChange,
    handleBreakoutChecklistChange,
    handleBreakoutMetaChange,
  } = controller;
  const selectedCapValue = formData.float_category || formData.share_float_range || 'none';

  const tradeOutcome = (() => {
    const entry = Number(formData.entry_price);
    const exit  = Number(formData.exit_price);
    if (!entry || !exit) return null;
    const rawPnl = formData.direction === 'short' ? entry - exit : exit - entry;
    return rawPnl > 0 ? 'win' : 'loss';
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol *</Label>
          <Input
            id="symbol"
            value={formData.symbol}
            onChange={(event) => updateField('symbol', event.target.value.toUpperCase())}
            placeholder="AAPL"
            className={cn(
              "bg-white/5 border-white/10 uppercase font-mono",
              symbolError && "border-red-500/60 focus-visible:ring-red-500/50"
            )}
            required
            maxLength={10}
          />
          {symbolError && (
            <p className="text-[11px] text-red-300">{symbolError}</p>
          )}
        </div>

        <DirectionToggle
          value={formData.direction}
          onChange={(value) => updateField('direction', value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Entry Type</Label>
        <div className="flex gap-2">
          {['Market', 'Limit', 'Stop'].map((type) => {
            const active = formData.entry_order_type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => updateField('entry_order_type', active ? '' : type)}
                className={cn(
                  'flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors',
                  type === 'Market' && active && 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200',
                  type === 'Limit'  && active && 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
                  type === 'Stop'   && active && 'border-amber-400/40 bg-amber-500/15 text-amber-200',
                  !active && 'border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/65',
                )}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <PriceFields
        values={{
          entry_price: formData.entry_price,
          exit_price: formData.exit_price,
          stop_loss: formData.stop_loss,
          position_size: formData.position_size,
          fee: formData.fee,
          tick_size: formData.tick_size,
          tick_value: formData.tick_value,
          futures_preset: formData.futures_preset,
        }}
        onChange={updateField}
        instrumentType={formData.instrument_type || 'stocks'}
      />

      <TradeMetrics
        entry_price={formData.entry_price}
        exit_price={formData.exit_price}
        stop_loss={formData.stop_loss}
        position_size={formData.position_size}
        direction={formData.direction}
        fee={formData.fee}
      />

      <TimeFields
        entryTime={formData.entry_time}
        exitTime={formData.exit_time}
        onEntryChange={(value) => updateField('entry_time', value)}
        onExitChange={(value) => updateField('exit_time', value)}
      />

      {(() => {
        const playbookSLPlan = selectedPlaybookEntry?.has_sl_exit_plan === true;
        const slOptions = selectedPlaybookEntry?.stop_loss_management || [];
        const slMoveOptions = selectedPlaybookEntry?.stop_loss_move || [];
        const exitOptions = selectedPlaybookEntry?.exit_criteria || [];
        const gradeCriteria = selectedPlaybookEntry?.grade_criteria;
        const gradeOptions = [
          ['A+', gradeCriteria?.a_plus],
          ['A', gradeCriteria?.a],
          ['B', gradeCriteria?.b],
          ['C', gradeCriteria?.c],
        ]
          .filter(([, description]) => description)
          .map(([value, description]) => ({ value, label: `${value} — ${description}` }));

        const setupTypeSelect = (
          <div className="space-y-2">
            <Label>Setup Type</Label>
            <Select value={formData.setup_type} onValueChange={(value) => updateField('setup_type', value)}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select setup" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                {setupTypeOptions.map((setup) => (
                  <SelectItem key={setup} value={setup}>{setup}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

        if (playbookSLPlan) {
          const entryOptions = selectedPlaybookEntry.entry_criteria || [];
          return (
            <div className="space-y-3">
              <div>{setupTypeSelect}</div>

              {/* Step 1: Entry */}
              <div className="space-y-1.5">
                <Label className="text-emerald-200/80">Entry</Label>
                <Select value={formData.entry_criteria_used || ''} onValueChange={(value) => updateField('entry_criteria_used', value)}>
                  <SelectTrigger className="bg-emerald-500/[0.06] border-emerald-400/20">
                    <SelectValue placeholder="Which entry trigger did you follow?" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a24] border-white/10">
                    {entryOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Stop Loss — revealed after entry */}
              {formData.entry_criteria_used && (
                <div className="space-y-1.5">
                  <Label className="text-violet-200/80">Stop Loss</Label>
                  <Select value={formData.stop_loss_used || ''} onValueChange={(value) => updateField('stop_loss_used', value)}>
                    <SelectTrigger className="bg-violet-500/[0.06] border-violet-400/20">
                      <SelectValue placeholder="Which SL rule did you use?" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/10">
                      {slOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.stop_loss_used && (
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.stop_loss || ''}
                      onChange={(e) => updateField('stop_loss', e.target.value)}
                      placeholder="SL price"
                      className="bg-violet-500/[0.06] border-violet-400/20"
                    />
                  )}
                </div>
              )}

              {/* Step 3: SL Move + Exit — revealed after stop loss */}
              {formData.stop_loss_used && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-amber-200/80">SL Move</Label>
                    <Select value={formData.stop_loss_move_used || ''} onValueChange={(value) => updateField('stop_loss_move_used', value)}>
                      <SelectTrigger className="bg-amber-500/[0.06] border-amber-400/20">
                        <SelectValue placeholder="How did you move SL?" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a24] border-white/10">
                        {slMoveOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-cyan-200/80">Exit</Label>
                    <Select value={formData.exit_used || ''} onValueChange={(value) => updateField('exit_used', value)}>
                      <SelectTrigger className="bg-cyan-500/[0.06] border-cyan-400/20">
                        <SelectValue placeholder="Which exit rule did you follow?" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a24] border-white/10">
                        {exitOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 4: Grade — revealed after exit, using the setup's Grade Criteria */}
              {formData.exit_used && gradeOptions.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-fuchsia-200/80">Grade</Label>
                  <Select value={formData.setup_grade || ''} onValueChange={(value) => updateField('setup_grade', value)}>
                    <SelectTrigger className="bg-fuchsia-500/[0.06] border-fuchsia-400/20">
                      <SelectValue placeholder="How would you grade this execution?" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/10">
                      {gradeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          );
        }

        const hasSetupSelected = Boolean(formData.setup_type);
        return (
          <div className="space-y-3">
            <div>{setupTypeSelect}</div>
            {hasSetupSelected && (
              <div className="space-y-1.5">
                <Label className="text-violet-200/80">Stop Loss</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.stop_loss || ''}
                  onChange={(e) => updateField('stop_loss', e.target.value)}
                  placeholder="SL price"
                  className="bg-violet-500/[0.06] border-violet-400/20"
                />
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Cap</Label>
          <Select
            value={selectedCapValue}
            onValueChange={(value) => {
              const nextValue = value === 'none' ? null : value;
              updateField('float_category', nextValue);
              updateField('share_float_range', nextValue);
            }}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select cap" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              <SelectItem value="none">Unknown</SelectItem>
              {CAP_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScreenshotUpload
          screenshotIds={screenshotIds}
          uploading={uploading}
          onUpload={handleUploadFiles}
          onRemove={handleRemoveById}
          autoFilledFrom={autoScreenshotSymbol}
        />
      </div>


      {presets.length > 0 && (
        <div className="space-y-2">
          <Label>Strategy Preset</Label>
          <Select
            value={formData.strategy_preset_id || ''}
            onValueChange={(value) => updateField('strategy_preset_id', value || null)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              <SelectItem value="">None</SelectItem>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <EmotionsSelect
        value={formData.emotions}
        onChange={(value) => updateField('emotions', value)}
      />

      <NotesFields
        setupType={formData.setup_type}
        setupGrade={formData.setup_grade}
        breakoutChecklist={formData.breakout_checklist}
        reflectionAnswers={formData.reflection_answers}
        mistakeOptions={mistakeOptions}
        learningOptions={learningOptions}
        whatWorkedOptions={whatWorkedOptions}
        outcome={tradeOutcome}
        onReflectionChange={handleReflectionChange}
        onBreakoutChecklistChange={handleBreakoutChecklistChange}
        onBreakoutMetaChange={handleBreakoutMetaChange}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Rating</Label>
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300">
            Auto
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = Number(formData.overall_rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateField('overall_rating', formData.overall_rating === star ? null : star)}
                  className="p-0.5"
                  title={`${star} star${star === 1 ? '' : 's'}`}
                >
                  <Star
                    className={cn(
                      'w-4 h-4 transition-colors',
                      filled ? 'fill-amber-400 text-amber-400' : 'text-white/20'
                    )}
                  />
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-white/35 leading-tight">
            {formData.overall_rating === 5 && 'All criteria met · clean execution'}
            {formData.overall_rating === 4 && 'All criteria met · area to improve'}
            {formData.overall_rating === 3 && 'Partial criteria met'}
            {formData.overall_rating === 2 && 'Setup only · missing criteria'}
            {formData.overall_rating === 1 && 'No entry / SL / exit criteria'}
            {!formData.overall_rating && 'Fill in setup + criteria to auto-rate'}
          </p>
        </div>
      </div>

      {winPrediction && winPrediction.confidence !== 'low' && (
        <div className={cn(
          'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5',
          winPrediction.probability >= 55
            ? 'border-emerald-400/25 bg-emerald-500/[0.07]'
            : winPrediction.probability >= 45
            ? 'border-amber-400/20 bg-amber-500/[0.06]'
            : 'border-rose-400/20 bg-rose-500/[0.06]'
        )}>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Your Edge · This Context</p>
            <p className={cn(
              'mt-0.5 text-sm font-bold',
              winPrediction.probability >= 55 ? 'text-emerald-300' : winPrediction.probability >= 45 ? 'text-amber-300' : 'text-rose-300'
            )}>
              {winPrediction.probability}% historical win rate
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/35">
            {winPrediction.confidence} conf
          </span>
        </div>
      )}

      {tradeNudges.length > 0 && (
        <div className="space-y-2">
          {tradeNudges.map((nudge) => {
            const isWarning = nudge.level === 'warning';
            const isCaution = nudge.level === 'caution';
            const Icon = isWarning ? AlertTriangle : isCaution ? Info : Lightbulb;
            return (
              <div
                key={nudge.id}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border px-3 py-2.5',
                  isWarning
                    ? 'border-amber-400/25 bg-amber-500/[0.07]'
                    : isCaution
                    ? 'border-cyan-400/20 bg-cyan-500/[0.06]'
                    : 'border-violet-400/20 bg-violet-500/[0.06]'
                )}
              >
                <Icon
                  className={cn(
                    'mt-0.5 h-3.5 w-3.5 flex-shrink-0',
                    isWarning ? 'text-amber-400' : isCaution ? 'text-cyan-400' : 'text-violet-400'
                  )}
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-[11px] font-semibold leading-tight',
                      isWarning ? 'text-amber-200' : isCaution ? 'text-cyan-200' : 'text-violet-200'
                    )}
                  >
                    {nudge.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/50">
                    {nudge.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="hover:bg-white/10"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 transition-all min-w-[100px]"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? 'Update' : 'Log'} Trade
        </Button>
      </div>
    </form>
  );
}
