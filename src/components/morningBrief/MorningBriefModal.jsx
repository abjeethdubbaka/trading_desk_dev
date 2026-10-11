import React, { useState } from 'react';
import { ArrowLeft, Brain, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  MORNING_BRIEF_QUESTIONS,
  SCALE_MAX,
  SCALE_MIN,
  buildMorningBrief,
  computeMentalScore,
  getReadiness,
} from '@/lib/morningBrief/utils';

const READINESS_STYLE = {
  positive: { ring: 'border-emerald-400/30 bg-emerald-500/10', text: 'text-emerald-300' },
  warning: { ring: 'border-amber-400/30 bg-amber-500/10', text: 'text-amber-300' },
  danger: { ring: 'border-rose-400/30 bg-rose-500/10', text: 'text-rose-300' },
  neutral: { ring: 'border-white/10 bg-white/[0.04]', text: 'text-white/70' },
};

/** A 1–10 slider that has no answer until it is touched. */
function ScaleQuestion({ question, value, onChange }) {
  const answered = value != null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-300/60">{question.title}</p>
      <p className="mt-2 text-lg font-semibold text-white/90">{question.prompt}</p>

      <div className="mt-6 flex items-baseline justify-center gap-1">
        <span className={cn('font-mono text-5xl font-bold tabular-nums', answered ? 'text-white' : 'text-white/15')}>
          {answered ? value : '–'}
        </span>
        <span className="text-sm text-white/30">/ {SCALE_MAX}</span>
      </div>

      <input
        type="range"
        min={SCALE_MIN}
        max={SCALE_MAX}
        step={1}
        value={answered ? value : Math.round((SCALE_MIN + SCALE_MAX) / 2)}
        onChange={(event) => onChange(Number(event.target.value))}
        onClick={(event) => onChange(Number(event.currentTarget.value))}
        aria-label={question.prompt}
        className={cn('mt-4 w-full cursor-pointer accent-violet-500', !answered && 'opacity-50')}
      />
      <div className="mt-1.5 flex justify-between text-xs text-white/40">
        <span>{question.low}</span>
        <span>{question.high}</span>
      </div>
    </div>
  );
}

/**
 * The morning check-in shown when the app opens: one question per screen,
 * then an optional goal, then the mental score and what it means for today.
 */
export default function MorningBriefModal({ onSave, onSkip, onDone }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [goal, setGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const questionCount = MORNING_BRIEF_QUESTIONS.length;
  const goalStep = questionCount;
  const resultStep = questionCount + 1;
  const question = MORNING_BRIEF_QUESTIONS[step];
  const score = computeMentalScore(answers);
  const readiness = getReadiness(score, answers);
  const style = READINESS_STYLE[readiness.tone];

  const canContinue = step < questionCount ? answers[question.key] != null : true;

  const handleContinue = async () => {
    if (step < goalStep) {
      setStep(step + 1);
      return;
    }
    if (step === goalStep) {
      setIsSaving(true);
      try {
        await onSave(buildMorningBrief(answers, goal));
      } catch (error) {
        // The score still helps today even if it could not be stored.
        toast.error(`Could not save the morning brief: ${error?.message || 'Unknown error'}`);
      } finally {
        setIsSaving(false);
      }
      setStep(resultStep);
      return;
    }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-violet-500/25 bg-[#11131e] p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15">
              <Brain className="h-4 w-4 text-violet-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Morning Brief</p>
              <p className="text-[11px] text-white/40">Answer all questions for your mental score</p>
            </div>
          </div>
          {step < resultStep && (
            <button
              type="button"
              onClick={onSkip}
              className="text-[11px] text-white/35 underline-offset-2 transition-colors hover:text-white/70 hover:underline"
            >
              Skip morning brief
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-5 flex gap-1.5">
          {Array.from({ length: resultStep }).map((_, i) => (
            <span
              key={i}
              className={cn('h-1 flex-1 rounded-full', i < step ? 'bg-violet-400' : i === step ? 'bg-violet-400/60' : 'bg-white/10')}
            />
          ))}
        </div>

        <div className="mt-6 min-h-[210px]">
          {step < questionCount && (
            <ScaleQuestion
              question={question}
              value={answers[question.key] ?? null}
              onChange={(value) => setAnswers((prev) => ({ ...prev, [question.key]: value }))}
            />
          )}

          {step === goalStep && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-300/60">Additional goal</p>
              <p className="mt-2 text-lg font-semibold text-white/90">Anything you want to hold yourself to today?</p>
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Insert here"
                rows={4}
                autoFocus
                className="mt-4 w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/40"
              />
              <p className="mt-1.5 text-[11px] text-white/30">Optional.</p>
            </div>
          )}

          {step === resultStep && (
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Mental score</p>
              <p className={cn('mt-2 font-mono text-6xl font-bold tabular-nums', style.text)}>
                {score ?? '–'}<span className="text-xl text-white/30">/10</span>
              </p>
              <div className={cn('mx-auto mt-4 rounded-xl border px-4 py-3 text-left', style.ring)}>
                <p className={cn('text-sm font-semibold', style.text)}>{readiness.label}</p>
                {readiness.advice && <p className="mt-1 text-xs text-white/65">{readiness.advice}</p>}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-left">
                {MORNING_BRIEF_QUESTIONS.map((q) => (
                  <div key={q.key} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1.5">
                    <p className="truncate text-[9px] uppercase tracking-wide text-white/35">{q.title}</p>
                    <p className="font-mono text-sm font-semibold text-white/80">{answers[q.key]}</p>
                  </div>
                ))}
              </div>
              {goal.trim() && (
                <p className="mt-4 rounded-lg border border-violet-400/20 bg-violet-500/[0.06] px-3 py-2 text-left text-xs text-violet-100/80">
                  <span className="font-semibold text-violet-200">Goal:</span> {goal.trim()}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2">
          {step > 0 && step < resultStep && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-xl border border-white/10 p-3 text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue || isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === resultStep ? "Start the day →" : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
