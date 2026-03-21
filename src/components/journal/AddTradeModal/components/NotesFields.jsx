import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const STEP_1_ITEMS = [
  { key: 'smoothVWAPPullback', label: 'Price pulls into VWAP smoothly' },
  { key: 'controlledRedCandles', label: 'Red candles are controlled' },
  { key: 'holdsAboveVWAP', label: "Sellers can't push below VWAP" },
  { key: 'lowerWicksDipBuyers', label: 'Long lower wicks show dip buyers' }
];

const STEP_2_ITEMS = [
  { key: 'tightRange3to6Candles', label: 'Tight 3-6 candle range' },
  { key: 'volumeDriesUp', label: 'Volume dries up' },
  { key: 'higherLowsForming', label: 'Higher lows forming' },
  { key: 'vwapSlopesUpward', label: 'VWAP slopes upward' }
];

const STEP_3_ITEMS = [
  { key: 'breakAboveBaseHigh', label: 'Break above base high' },
  { key: 'volumeIncreases', label: 'Volume increases' },
  { key: 'vwapRising', label: 'VWAP rising' }
];

const SETUP_GRADES = [
  { value: 'A+', label: 'A+ (Perfect - all boxes checked)' },
  { value: 'A', label: 'A (Clean - minor deviation)' },
  { value: 'B', label: 'B (Decent - one step weak)' },
  { value: 'C', label: 'C (Sloppy - multiple issues)' },
  { value: 'D', label: 'D (Forced trade - skipped steps)' },
  { value: 'F', label: 'F (Revenge/tilt trade)' }
];

const ChecklistStep = ({
  title,
  items,
  stepKey,
  stepState,
  onChecklistChange,
  timeLabel,
  timeValue,
  onTimeChange,
  passLabel
}) => {
  const allYes = items.every(({ key }) => !!stepState?.[key]);

  return (
    <div className="space-y-3 rounded-lg border border-white/10 p-3 bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-white/60">{timeLabel}</Label>
          <Input
            value={timeValue || ''}
            onChange={(e) => onTimeChange(e.target.value)}
            className="h-8 w-36 bg-white/5 border-white/10 text-xs"
            placeholder=""
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.map(({ key, label }) => {
          const isYes = !!stepState?.[key];
          return (
            <div key={key} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
              <p className="text-xs text-white/80">{label}</p>
              <label className="flex items-center gap-1 text-[11px] text-emerald-300">
                <Checkbox
                  checked={isYes}
                  onCheckedChange={() => onChecklistChange(stepKey, key, true)}
                />
                YES
              </label>
              <label className="flex items-center gap-1 text-[11px] text-red-300">
                <Checkbox
                  checked={!isYes}
                  onCheckedChange={() => onChecklistChange(stepKey, key, false)}
                />
                NO
              </label>
            </div>
          );
        })}
      </div>

      <Textarea
        value={stepState?.notes || ''}
        onChange={(e) => onChecklistChange(stepKey, 'notes', e.target.value)}
        placeholder="Notes"
        className="bg-white/5 border-white/10 min-h-[58px] text-xs"
      />

      <p className="text-xs text-white/70">
        {passLabel} → {allYes ? 'YES' : 'NO'}
      </p>
    </div>
  );
};

const NotesFields = ({
  pnlValue,
  setupType,
  setupGrade,
  breakoutChecklist,
  reflectionAnswers,
  onReflectionChange,
  onBreakoutChecklistChange,
  onBreakoutMetaChange
}) => {
  const isVWAPPullback = (setupType || '').toLowerCase().trim() === 'vwap pullback';
  const outcome = Number(pnlValue) < 0 ? 'loss' : Number(pnlValue) > 0 ? 'profit' : 'neutral';

  return (
    <>
      {/* Always show reflection section */}
      <div className="space-y-3 border border-white/20 rounded-lg p-4 bg-white/5">
        <p className="text-sm font-semibold text-white">Reflection</p>
        
        <div className="space-y-2">
          <Label htmlFor="what-went-right" className="text-xs text-white/80">What went right?</Label>
          <Textarea
            id="what-went-right"
            value={reflectionAnswers?.what_went_right || ''}
            onChange={(e) => onReflectionChange('what_went_right', e.target.value)}
            placeholder="Example: Followed plan, entered on confirmation, respected targets."
            className="bg-white/5 border-white/10 min-h-[72px] resize-y"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="what-went-wrong" className="text-xs text-white/80">What went wrong?</Label>
          <Textarea
            id="what-went-wrong"
            value={reflectionAnswers?.what_went_wrong || ''}
            onChange={(e) => onReflectionChange('what_went_wrong', e.target.value)}
            placeholder="Example: Entered too early before confirmation, ignored stop discipline..."
            className="bg-white/5 border-white/10 min-h-[72px] resize-y"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="what-learned" className="text-xs text-white/80">What did you learn?</Label>
          <Textarea
            id="what-learned"
            value={reflectionAnswers?.what_learned || ''}
            onChange={(e) => onReflectionChange('what_learned', e.target.value)}
            placeholder="Example: Wait for full setup confirmation and keep risk fixed."
            className="bg-white/5 border-white/10 min-h-[72px] resize-y"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="what-to-repeat" className="text-xs text-white/80">What should you repeat?</Label>
          <Textarea
            id="what-to-repeat"
            value={reflectionAnswers?.what_to_repeat || ''}
            onChange={(e) => onReflectionChange('what_to_repeat', e.target.value)}
            placeholder="Example: Keep this entry timing and risk management process consistent."
            className="bg-white/5 border-white/10 min-h-[72px] resize-y"
          />
        </div>
      </div>

      {isVWAPPullback && (
        <>
          <div className="space-y-3 border border-blue-500/20 rounded-lg p-4 bg-blue-500/5">
            <p className="text-sm font-semibold text-blue-300">YOUR 3-STEP BREAKOUT STRATEGY</p>

            <ChecklistStep
              title="STEP 1: VWAP TOUCH"
              items={STEP_1_ITEMS}
              stepKey="step1"
              stepState={breakoutChecklist?.step1}
              onChecklistChange={onBreakoutChecklistChange}
              timeLabel="Time of touch"
              timeValue={breakoutChecklist?.step1Time}
              onTimeChange={(value) => onBreakoutMetaChange('step1Time', value)}
              passLabel="VWAP Touch"
            />

            <ChecklistStep
              title="STEP 2: BASE FORMATION"
              items={STEP_2_ITEMS}
              stepKey="step2"
              stepState={breakoutChecklist?.step2}
              onChecklistChange={onBreakoutChecklistChange}
              timeLabel="Base duration (mins)"
              timeValue={breakoutChecklist?.step2DurationMins}
              onTimeChange={(value) => onBreakoutMetaChange('step2DurationMins', value)}
              passLabel="Base Build"
            />

            <ChecklistStep
              title="STEP 3: BREAKOUT TRIGGER"
              items={STEP_3_ITEMS}
              stepKey="step3"
              stepState={breakoutChecklist?.step3}
              onChecklistChange={onBreakoutChecklistChange}
              timeLabel="Entry time"
              timeValue={breakoutChecklist?.step3Time}
              onTimeChange={(value) => onBreakoutMetaChange('step3Time', value)}
              passLabel="Breakout Trigger"
            />
          </div>

          <div className="space-y-2 border border-emerald-500/20 rounded-lg p-4 bg-emerald-500/5">
            <Label className="text-emerald-300 font-semibold">TRADE GRADE</Label>
            <p className="text-xs text-white/60">Auto-calculated from selected checklist items</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SETUP_GRADES.map((grade) => (
                <label key={grade.value} className="flex items-center gap-2 text-sm text-white/80">
                  <Checkbox
                    checked={setupGrade === grade.value}
                    disabled
                  />
                  {grade.label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default React.memo(NotesFields);