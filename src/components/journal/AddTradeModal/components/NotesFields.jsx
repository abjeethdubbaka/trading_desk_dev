import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import KeywordToggleGroup from './KeywordToggleGroup';
import { DEFAULT_MISTAKES } from '@/lib/constants/mistakes';
import { DEFAULT_LEARNINGS } from '@/lib/constants/learnings';

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
  { value: 'A++', label: 'A++ (Exceptional execution)' },
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

const IMPROVEMENT_OPTIONS = [
  { value: 'risk_management', label: 'Risk Management' },
  { value: 'entry_timing', label: 'Entry Timing' },
  { value: 'exit_timing', label: 'Exit Timing' },
  { value: 'patience_discipline', label: 'Patience / Discipline' },
  { value: 'position_sizing', label: 'Position Sizing' },
  { value: 'plan_adherence', label: 'Plan Adherence' },
  { value: 'emotional_control', label: 'Emotional Control' },
  { value: 'other', label: 'Other' },
];

const NotesFields = ({
  setupType,
  setupGrade,
  breakoutChecklist,
  reflectionAnswers,
  mistakeOptions = DEFAULT_MISTAKES,
  learningOptions = DEFAULT_LEARNINGS,
  onReflectionChange,
  onBreakoutChecklistChange,
  onBreakoutMetaChange
}) => {
  const isVWAPPullback = (setupType || '').toLowerCase().trim() === 'vwap pullback';
  const showLegacyVWAPChecklist = isVWAPPullback;

  return (
    <>
      {/* Always show reflection section */}
      <div className="space-y-3 border border-white/20 rounded-lg p-4 bg-white/5">
        <p className="text-sm font-semibold text-white">Reflection</p>

        <div className="space-y-2">
          <Label className="text-xs text-white/80">Mistakes</Label>
          <KeywordToggleGroup
            options={mistakeOptions}
            value={reflectionAnswers?.what_went_wrong}
            onChange={(next) => onReflectionChange('what_went_wrong', next)}
            emptyHint="No mistake keywords configured yet — add some in Settings."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-white/80">Learning</Label>
          <KeywordToggleGroup
            options={learningOptions}
            value={reflectionAnswers?.what_learned}
            onChange={(next) => onReflectionChange('what_learned', next)}
            emptyHint="No learning keywords configured yet — add some in Settings."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="improvements" className="text-xs text-white/80">Improvements</Label>
          <Select
            value={reflectionAnswers?.improvements || ''}
            onValueChange={(value) => onReflectionChange('improvements', value)}
          >
            <SelectTrigger id="improvements" className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select an area to improve" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              {IMPROVEMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showLegacyVWAPChecklist && (
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


