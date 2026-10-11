import React, { useState } from 'react';
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
import { AlertTriangle, Info, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import DirectionToggle from './DirectionToggle';
import PriceFields from './PriceFields';
import TimeFields from './TimeFields';
import TradeMetrics from './TradeMetrics';
import EmotionsSelect from './EmotionsSelect';
import NotesFields from './NotesFields';
import ScreenshotUpload from './ScreenshotUpload';
import { SETUP_TYPE_OPTIONS as DEFAULT_SETUP_TYPE_OPTIONS } from '../constants/tradeConstants';

const SIMPLE_GRADE_OPTIONS = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'].map((g) => ({ value: g, label: g }));

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
    sizeRiskInfo = { actualRisk: null, expectedRisk: null, isOversized: false, riskRatio: null, suggestedSizeGrade: null },
    ratingBreakdown = { total: 0, factors: [] },
    tradeNudges = [],
    winPrediction = null,
    mistakeOptions = [],
    learningOptions = [],
    improvementOptions = [],
    emotionOptions,
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
  const [showRatingBreakdown, setShowRatingBreakdown] = useState(false);

  const tradeOutcome = (() => {
    const entry = Number(formData.entry_price);
    const exit  = Number(formData.exit_price);
    if (!entry || !exit) return null;
    const rawPnl = formData.direction === 'short' ? entry - exit : exit - entry;
    return rawPnl > 0 ? 'win' : 'loss';
  })();

  // Clears whichever entry/SL/exit criteria (and their grades) were picked
  // for a now-inapplicable setup — shared by the Setup Type change handler
  // below and the Direction change handler, since either can invalidate them.
  const clearSetupSelections = () => {
    updateField('entry_criteria_used', '');
    updateField('stop_loss_used', '');
    updateField('stop_loss_move_used', '');
    updateField('exit_used', '');
    updateField('entry_grade', '');
    updateField('sl_grade', '');
    updateField('exit_grade', '');
    updateField('exit_min_r_taken', null);
    updateField('exit_target_r_taken', null);
    updateField('exit_stretch_r_taken', null);
  };

  // If the currently selected setup is direction-locked (Long/Short, not
  // Both) and no longer matches the trade's new direction, it — and
  // whichever entry/SL/exit criteria were picked for it — no longer apply.
  const handleDirectionChange = (value) => {
    updateField('direction', value);
    const lockedDirection = selectedPlaybookEntry?.direction;
    if (lockedDirection && lockedDirection !== 'both' && lockedDirection !== value) {
      updateField('setup_type', '');
      clearSetupSelections();
    }
  };

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
          onChange={handleDirectionChange}
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
          mfe_price: formData.mfe_price,
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
        // Entry/Exit/Stop Loss criteria come from the Playbook as
        // { text, grade } items — picking one auto-fills the matching grade
        // field below (trader can still override it manually afterward).
        // Stop Loss Move has no grading and stays a plain string list.
        const toGradedOption = (item) => (
          typeof item === 'string' ? { text: item, grade: '' } : { text: item?.text || '', grade: item?.grade || '' }
        );

        const playbookSLPlan = selectedPlaybookEntry?.has_sl_exit_plan === true;
        const slOptions = (selectedPlaybookEntry?.stop_loss_management || []).map(toGradedOption);
        const slMoveOptions = selectedPlaybookEntry?.stop_loss_move || [];

        // The setup's Exit Strategy — its Min/Target/Stretch R scale-out
        // levels from Playbook's "Expected R & Exit Allocation". Only levels
        // that are actually configured (a positive R value) are shown, so an
        // unconfigured Stretch level (say) doesn't get its own dropdown.
        const expectedRProfile = selectedPlaybookEntry?.expected_r_profile || null;
        const exitAllocationLevels = [
          { key: 'exit_min_r_taken', label: 'Ex1 — Min R', r: expectedRProfile?.min, percent: expectedRProfile?.min_percent },
          { key: 'exit_target_r_taken', label: 'Ex2 — Target R', r: expectedRProfile?.target, percent: expectedRProfile?.target_percent },
          { key: 'exit_stretch_r_taken', label: 'Ex3 — Stretch R', r: expectedRProfile?.stretch, percent: expectedRProfile?.stretch_percent },
        ].filter((level) => Number.isFinite(Number(level.r)) && Number(level.r) > 0);

        // "Exit Strategy" is a synthetic Exit option (not a Playbook exit
        // criterion) that only appears once the setup actually has scale-out
        // levels configured. Only picking it — not any other exit rule —
        // reveals the "Levels Taken" panel, since picking e.g. "Exit at
        // VWAP" doesn't mean the trader is running the Min/Target/Stretch plan.
        const EXIT_STRATEGY_OPTION = 'Exit Strategy';
        const playbookExitOptions = (selectedPlaybookEntry?.exit_criteria || []).map(toGradedOption);
        // A setup may already name an exit criterion "Exit Strategy", and an
        // option list is keyed by its text — so dedupe rather than appending a
        // second one. The setup's own wording (and grade) wins.
        const seenExitOptions = new Set();
        const exitOptions = [
          ...playbookExitOptions,
          ...(exitAllocationLevels.length > 0 ? [{ text: EXIT_STRATEGY_OPTION, grade: '' }] : []),
        ].filter((option) => {
          const key = option.text;
          if (!key || seenExitOptions.has(key)) return false;
          seenExitOptions.add(key);
          return true;
        });

        // Switching setups invalidates whichever entry/SL/exit criteria (and
        // their grades) were picked for the old one — they're option values
        // from that setup's Playbook and won't necessarily exist for the new
        // one. Clearing them here (only on an actual user change, not on
        // initial load/edit) prevents a stale exit_used from silently
        // keeping panels like "Exit Strategy — Levels Taken" visible for a
        // setup where Exit was never actually picked.
        const handleSetupTypeChange = (value) => {
          updateField('setup_type', value);
          clearSetupSelections();
        };

        const setupTypeSelect = (
          <div className="space-y-2">
            <Label>Setup Type</Label>
            <Select value={formData.setup_type} onValueChange={handleSetupTypeChange}>
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
          const entryOptions = (selectedPlaybookEntry.entry_criteria || []).map(toGradedOption);
          const selectGradedOption = (options, usedField, gradeField) => (value) => {
            updateField(usedField, value);
            const matched = options.find((opt) => opt.text === value);
            if (matched?.grade) updateField(gradeField, matched.grade);
          };
          return (
            <div className="space-y-3">
              <div>{setupTypeSelect}</div>

              {/* Step 1: Entry */}
              <div className="space-y-1.5">
                <Label className="text-emerald-200/80">Entry</Label>
                <Select
                  value={formData.entry_criteria_used || ''}
                  onValueChange={selectGradedOption(entryOptions, 'entry_criteria_used', 'entry_grade')}
                >
                  <SelectTrigger className="bg-emerald-500/[0.06] border-emerald-400/20">
                    <SelectValue placeholder="Which entry trigger did you follow?" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a24] border-white/10">
                    {entryOptions.map((opt) => (
                      <SelectItem key={opt.text} value={opt.text}>{opt.text}{opt.grade ? ` (${opt.grade})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.entry_criteria_used && (
                  <Select value={formData.entry_grade || ''} onValueChange={(value) => updateField('entry_grade', value)}>
                    <SelectTrigger className="bg-emerald-500/[0.06] border-emerald-400/20">
                      <SelectValue placeholder="Entry-Grade — how well was the entry executed?" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/10">
                      {SIMPLE_GRADE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Step 2: Stop Loss — revealed after entry */}
              {formData.entry_criteria_used && (
                <div className="space-y-1.5">
                  <Label className="text-indigo-200/80">Stop Loss</Label>
                  <Select
                    value={formData.stop_loss_used || ''}
                    onValueChange={selectGradedOption(slOptions, 'stop_loss_used', 'sl_grade')}
                  >
                    <SelectTrigger className="bg-indigo-500/[0.06] border-indigo-400/20">
                      <SelectValue placeholder="Which SL rule did you use?" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/10">
                      {slOptions.map((opt) => (
                        <SelectItem key={opt.text} value={opt.text}>{opt.text}{opt.grade ? ` (${opt.grade})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.stop_loss_used && (
                    <>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.stop_loss || ''}
                        onChange={(e) => updateField('stop_loss', e.target.value)}
                        placeholder="SL price"
                        className="bg-indigo-500/[0.06] border-indigo-400/20"
                      />
                      <Select value={formData.sl_grade || ''} onValueChange={(value) => updateField('sl_grade', value)}>
                        <SelectTrigger className="bg-indigo-500/[0.06] border-indigo-400/20">
                          <SelectValue placeholder="SL-Grade — how well was the stop managed?" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a24] border-white/10">
                          {SIMPLE_GRADE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {sizeRiskInfo.isOversized && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                          Oversized — ${Math.round(sizeRiskInfo.actualRisk).toLocaleString()} risked vs ${Math.round(sizeRiskInfo.expectedRisk).toLocaleString()} intended for this setup
                        </div>
                      )}
                      <Select value={formData.size_grade || ''} onValueChange={(value) => updateField('size_grade', value)}>
                        <SelectTrigger className="bg-indigo-500/[0.06] border-indigo-400/20">
                          <SelectValue placeholder="Size-Grade — how well sized was this position?" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a24] border-white/10">
                          {SIMPLE_GRADE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {sizeRiskInfo.suggestedSizeGrade && (
                        <p className="flex items-center gap-1 text-[11px] text-white/40">
                          <Info className="h-3 w-3 flex-shrink-0" />
                          Auto-graded {sizeRiskInfo.suggestedSizeGrade} — ${Math.round(sizeRiskInfo.actualRisk).toLocaleString()} risked vs ${Math.round(sizeRiskInfo.expectedRisk).toLocaleString()} intended ({sizeRiskInfo.riskRatio.toFixed(2)}×). Change it above if you disagree.
                        </p>
                      )}
                    </>
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
                    <Label className="text-teal-200/80">Exit</Label>
                    <Select
                      value={formData.exit_used || ''}
                      onValueChange={selectGradedOption(exitOptions, 'exit_used', 'exit_grade')}
                    >
                      <SelectTrigger className="bg-teal-500/[0.06] border-teal-400/20">
                        <SelectValue placeholder="Which exit rule did you follow?" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a24] border-white/10">
                        {exitOptions.map((opt) => (
                          <SelectItem key={opt.text} value={opt.text}>{opt.text}{opt.grade ? ` (${opt.grade})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.exit_used && (
                      <Select value={formData.exit_grade || ''} onValueChange={(value) => updateField('exit_grade', value)}>
                        <SelectTrigger className="bg-teal-500/[0.06] border-teal-400/20">
                          <SelectValue placeholder="Exit-Grade — how well was the exit executed?" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a24] border-white/10">
                          {SIMPLE_GRADE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}

              {/* Exit Strategy — was each configured scale-out level taken? */}
              {formData.exit_used === EXIT_STRATEGY_OPTION && exitAllocationLevels.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-teal-200/80">Exit Strategy — Levels Taken</Label>
                  <div className={cn(
                    'grid grid-cols-1 gap-2',
                    exitAllocationLevels.length === 2 ? 'md:grid-cols-2' : exitAllocationLevels.length >= 3 ? 'md:grid-cols-3' : '',
                  )}>
                    {exitAllocationLevels.map((level) => (
                      <div key={level.key} className="space-y-1">
                        <p className="text-[10px] text-white/40">
                          {level.label} ({Number(level.r).toFixed(1)}R{Number.isFinite(Number(level.percent)) && Number(level.percent) > 0 ? ` @ ${Number(level.percent)}%` : ''})
                        </p>
                        <Select
                          value={formData[level.key] === true ? 'yes' : formData[level.key] === false ? 'no' : ''}
                          onValueChange={(value) => updateField(level.key, value === 'yes')}
                        >
                          <SelectTrigger className="bg-teal-500/[0.06] border-teal-400/20">
                            <SelectValue placeholder="Taken?" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a24] border-white/10">
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
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
                <Label className="text-indigo-200/80">Stop Loss</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.stop_loss || ''}
                  onChange={(e) => updateField('stop_loss', e.target.value)}
                  placeholder="SL price"
                  className="bg-indigo-500/[0.06] border-indigo-400/20"
                />
                {sizeRiskInfo.isOversized && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    Oversized — ${Math.round(sizeRiskInfo.actualRisk).toLocaleString()} risked vs ${Math.round(sizeRiskInfo.expectedRisk).toLocaleString()} intended
                  </div>
                )}
                <Select value={formData.size_grade || ''} onValueChange={(value) => updateField('size_grade', value)}>
                  <SelectTrigger className="bg-indigo-500/[0.06] border-indigo-400/20">
                    <SelectValue placeholder="Size-Grade — how well sized was this position?" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a24] border-white/10">
                    {SIMPLE_GRADE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        options={emotionOptions}
      />

      <NotesFields
        setupType={formData.setup_type}
        setupGrade={formData.entry_grade}
        breakoutChecklist={formData.breakout_checklist}
        reflectionAnswers={formData.reflection_answers}
        mistakeOptions={mistakeOptions}
        learningOptions={learningOptions}
        improvementOptions={improvementOptions}
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
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-0.5">
              <span className={cn(
                'text-lg font-bold font-mono',
                formData.overall_rating >= 7 ? 'text-emerald-400' : formData.overall_rating >= 4 ? 'text-amber-400' : 'text-rose-400'
              )}>
                {formData.overall_rating != null ? formData.overall_rating : '—'}
              </span>
              <span className="text-xs text-white/30">/10</span>
            </div>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  formData.overall_rating >= 7 ? 'bg-emerald-400' : formData.overall_rating >= 4 ? 'bg-amber-400' : 'bg-rose-400'
                )}
                style={{ width: `${Math.min(100, Math.max(0, ((formData.overall_rating || 0) / 10) * 100))}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowRatingBreakdown((prev) => !prev)}
              className="flex-shrink-0 text-[10px] font-semibold text-cyan-300/80 hover:text-cyan-200 underline decoration-dotted underline-offset-2"
            >
              {showRatingBreakdown ? 'Hide' : 'Why?'}
            </button>
          </div>
          {showRatingBreakdown ? (
            <div className="space-y-1 border-t border-white/10 pt-2">
              {ratingBreakdown.factors.map((factor) => (
                <div key={factor.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-white/50">{factor.label} <span className="text-white/25">({factor.detail})</span></span>
                  <span className="font-mono text-white/75">{factor.score.toFixed(2)} / {factor.weight.toFixed(1)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-white/35 leading-tight">
              Scored from Entry/Exit/SL/Size-Grade and emotions.
            </p>
          )}
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
                  // Severity ladder uses colors not already claimed as section
                  // identity elsewhere on this form (emerald=Entry, indigo=Stop
                  // Loss, amber=SL Move, teal=Exit) so a nudge's color can't be
                  // mistaken for "which field group is this".
                  isWarning
                    ? 'border-amber-400/25 bg-amber-500/[0.07]'
                    : isCaution
                    ? 'border-orange-400/20 bg-orange-500/[0.06]'
                    : 'border-sky-400/20 bg-sky-500/[0.06]'
                )}
              >
                <Icon
                  className={cn(
                    'mt-0.5 h-3.5 w-3.5 flex-shrink-0',
                    isWarning ? 'text-amber-400' : isCaution ? 'text-orange-400' : 'text-sky-400'
                  )}
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-[11px] font-semibold leading-tight',
                      isWarning ? 'text-amber-200' : isCaution ? 'text-orange-200' : 'text-sky-200'
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
