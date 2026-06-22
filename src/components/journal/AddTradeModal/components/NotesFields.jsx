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

const normalizeStepGrade = (value) => String(value ?? '').trim().toUpperCase();

const buildStepGradeOptions = ({ stepLabel, stepGrade, relativeGrades, selectedStepGrade }) => {
  const options = [];
  const usedGrades = new Set();

  const addOption = (grade, label) => {
    const normalizedGrade = normalizeStepGrade(grade);
    if (!normalizedGrade) return;
    if (usedGrades.has(normalizedGrade)) return;
    usedGrades.add(normalizedGrade);
    options.push({
      value: normalizedGrade,
      label: String(label || normalizedGrade).trim(),
    });
  };

  if (stepGrade) {
    addOption(stepGrade, `${stepGrade}: ${stepLabel || 'Target execution'}`);
  }

  relativeGrades.forEach((mapping) => {
    const mappingGrade = normalizeStepGrade(mapping?.grade);
    const mappingLabel = String(mapping?.label ?? '').trim();
    if (!mappingGrade) return;
    addOption(mappingGrade, mappingLabel ? `${mappingGrade}: ${mappingLabel}` : mappingGrade);
  });

  SETUP_GRADES.forEach((grade) => {
    addOption(grade.value, grade.label);
  });

  if (selectedStepGrade && !usedGrades.has(selectedStepGrade)) {
    addOption(selectedStepGrade, selectedStepGrade);
  }

  return options;
};

const normalizeRelativeGradeMappings = (mappings) => (
  Array.isArray(mappings)
    ? mappings.map((mapping) => {
      if (mapping && typeof mapping === 'object' && !Array.isArray(mapping)) {
        const label = String(mapping.label ?? mapping.step ?? '').trim();
        const grade = String(mapping.grade ?? '').trim().toUpperCase();
        if (!label && !grade) return null;
        return {
          label,
          grade,
        };
      }

      const label = String(mapping ?? '').trim();
      if (!label) return null;
      return {
        label,
        grade: '',
      };
    }).filter(Boolean)
    : []
);

const normalizeStrategySteps = (steps) => (
  Array.isArray(steps)
    ? steps.map((step) => {
      if (step && typeof step === 'object' && !Array.isArray(step)) {
        const label = String(step.label ?? step.step ?? '').trim();
        if (!label) return null;
        return {
          label,
          grade: String(step.grade ?? '').trim().toUpperCase(),
          relativeGrades: normalizeRelativeGradeMappings(
            step.relativeGrades
            ?? step.relative_grades
            ?? step.relatedGrades
            ?? step.related_grades
            ?? []
          ),
        };
      }

      const label = String(step ?? '').trim();
      if (!label) return null;
      return {
        label,
        grade: '',
        relativeGrades: [],
      };
    }).filter(Boolean)
    : []
);

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

const EXECUTION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'average', label: 'Average' },
  { value: 'poor', label: 'Poor' },
];

const NotesFields = ({
  setupType,
  setupGrade,
  setupQualityScore,
  breakoutChecklist,
  reflectionAnswers,
  strategySteps,
  strategyStepResults,
  followedPlan,
  onFollowedPlanChange,
  onReflectionChange,
  onStrategyStepResultChange,
  onBreakoutChecklistChange,
  onBreakoutMetaChange
}) => {
  const isVWAPPullback = (setupType || '').toLowerCase().trim() === 'vwap pullback';
  const normalizedStrategySteps = normalizeStrategySteps(strategySteps);
  const numericQualityScore = Number(setupQualityScore);
  const hasQualityScore = Number.isFinite(numericQualityScore);
  const showGenericStrategyChecklist = normalizedStrategySteps.length > 0;
  const showLegacyVWAPChecklist = isVWAPPullback && normalizedStrategySteps.length === 0;

  return (
    <>
      {/* Always show reflection section */}
      <div className="space-y-3 border border-white/20 rounded-lg p-4 bg-white/5">
        <p className="text-sm font-semibold text-white">Reflection</p>

        <div className="space-y-2">
          <Label htmlFor="mistakes" className="text-xs text-white/80">Mistakes</Label>
          <Textarea
            id="mistakes"
            value={reflectionAnswers?.what_went_wrong || ''}
            onChange={(e) => onReflectionChange('what_went_wrong', e.target.value)}
            placeholder="Example: Entered too early before confirmation, ignored stop discipline..."
            className="bg-white/5 border-white/10 min-h-[72px] resize-y"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="learning" className="text-xs text-white/80">Learning</Label>
          <Textarea
            id="learning"
            value={reflectionAnswers?.what_learned || ''}
            onChange={(e) => onReflectionChange('what_learned', e.target.value)}
            placeholder="Example: Wait for full setup confirmation and keep risk fixed."
            className="bg-white/5 border-white/10 min-h-[72px] resize-y"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-white/80">Plan</Label>
            <label className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <Checkbox
                checked={Boolean(followedPlan)}
                onCheckedChange={(checked) => onFollowedPlanChange?.(checked)}
              />
              <span className="text-sm text-white/80">Followed plan</span>
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="execution" className="text-xs text-white/80">Execution</Label>
            <Select
              value={reflectionAnswers?.execution || ''}
              onValueChange={(value) => onReflectionChange('execution', value)}
            >
              <SelectTrigger id="execution" className="bg-white/5 border-white/10">
                <SelectValue placeholder="Rate your execution" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                {EXECUTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200/80">Setup Quality</p>
          <p className="mt-1 text-sm font-mono font-semibold text-cyan-200">
            {hasQualityScore ? `${Math.round(numericQualityScore)}/100` : '--'}
            {setupGrade ? <span className="ml-1.5 text-cyan-100/90">({setupGrade})</span> : null}
          </p>
          <p className="mt-1 text-[10px] text-cyan-100/70">
            Auto-score from step grades, plan adherence, and risk compliance.
          </p>
        </div>
      </div>

      {showGenericStrategyChecklist && (
        <div className="space-y-3 border border-cyan-500/20 rounded-lg p-4 bg-cyan-500/5">
          <p className="text-sm font-semibold text-cyan-300">STRATEGY CHECKLIST</p>
          <p className="text-xs text-white/60">
            Mark each step for <span className="text-white/80">{setupType || 'selected strategy'}</span>.
          </p>

          <div className="space-y-2.5">
            {normalizedStrategySteps.map((step, index) => {
              const currentValue = Array.isArray(strategyStepResults)
                ? strategyStepResults[index]
                : null;
              const stepLabel = String(step?.label ?? '').trim();
              const stepGrade = String(step?.grade ?? '').trim();
              const selectedStepGrade = String(currentValue?.grade ?? '').trim().toUpperCase();
              const relativeGrades = Array.isArray(step?.relativeGrades) ? step.relativeGrades : [];
              const stepGradeOptions = buildStepGradeOptions({
                stepLabel,
                stepGrade,
                relativeGrades,
                selectedStepGrade,
              });

              return (
                <div key={`strategy-step-${index}`} className="grid grid-cols-[1fr_220px] items-center gap-3 rounded-md border border-white/10 bg-white/5 px-2.5 py-2">
                  <p className="text-xs text-white/85">
                    <span className="text-white/55 mr-1.5">Step {index + 1}:</span>
                    {stepLabel}
                    {stepGrade ? (
                      <span className="ml-2 inline-flex items-center rounded border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200">
                        Target {stepGrade}
                      </span>
                    ) : null}
                    {relativeGrades.length > 0 ? (
                      <span className="mt-1 block text-[10px] text-cyan-100/70">
                        {relativeGrades.map((mapping, mappingIndex) => {
                          const mappingLabel = String(mapping?.label ?? '').trim();
                          const mappingGrade = String(mapping?.grade ?? '').trim();
                          if (!mappingLabel && !mappingGrade) return null;
                          const summaryText = mappingGrade
                            ? `${mappingGrade}: ${mappingLabel}`
                            : mappingLabel;
                          const suffix = mappingIndex < relativeGrades.length - 1 ? ' · ' : '';
                          return `${summaryText}${suffix}`;
                        }).filter(Boolean)}
                      </span>
                    ) : null}
                  </p>
                  <Select
                    value={selectedStepGrade || 'none'}
                    onValueChange={(value) => onStrategyStepResultChange(index, { grade: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger className="h-8 bg-white/5 border-white/10 text-[11px]">
                      <SelectValue placeholder="Actual grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/10">
                      <SelectItem value="none">No grade</SelectItem>
                      {stepGradeOptions.map((gradeOption) => (
                        <SelectItem
                          key={`strategy-step-result-grade-${index}-${gradeOption.value}`}
                          value={gradeOption.value}
                        >
                          {gradeOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}

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


