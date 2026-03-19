import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  ActionItems,
  ExecutionTimeline,
  MistakeCostCard,
  PatternAlert,
} from './AdvancedAnalysisPanels';

function Skeleton({ className = '' }) {
  return <div className={`rounded bg-white/5 animate-pulse ${className}`} />;
}

function AIStateBadge({ state, error }) {
  if (state === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
        <Loader2 className="w-3 h-3 animate-spin" />
        Analyzing…
      </span>
    );
  }
  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        AI complete
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span title={error || ''} className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" />
        Analysis failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
      <Sparkles className="w-3 h-3" />
      Awaiting analysis
    </span>
  );
}

function ScoreBadge({ score }) {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  const color = n >= 8
    ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    : n >= 6
      ? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
      : 'text-red-400 bg-red-500/15 border-red-500/30';

  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{n}/10</span>;
}

function ConfidenceBar({ value }) {
  const pct = Math.round((Number(value) || 0) * 100);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/50">AI confidence</span>
        <span className="text-white/80">{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SignalPills({ signals, variant = 'risk' }) {
  const raw = typeof signals === 'string' ? signals : Array.isArray(signals) ? signals.join(', ') : '';
  const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) return <span className="text-xs text-white/30">—</span>;

  const color = variant === 'risk'
    ? 'bg-red-500/15 text-red-300 border-red-500/20'
    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, idx) => (
        <span key={`${item}-${idx}`} className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>{item}</span>
      ))}
    </div>
  );
}

export default function AnalysisCard({
  shot,
  row,
  aiState,
  aiError,
  setupOptions,
  statusOptions,
  entryTimingOptions,
  exitTimingOptions,
  onFieldChange,
}) {
  const isLoading = aiState === 'loading';
  const advanced = row.advanced_analysis;

  return (
    <Card className="bg-[#13131c] border-white/10 overflow-hidden">
      <CardHeader className="pb-2 border-b border-white/5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm truncate text-white/70 font-normal">{shot.name}</CardTitle>
          <AIStateBadge state={aiState} error={aiError} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="relative rounded-lg overflow-hidden border border-white/10">
          <img src={shot.url} alt={shot.name} className="w-full h-52 object-cover" />
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-xs text-blue-300">Claude Vision analyzing…</p>
            </div>
          )}

          {!isLoading && row.detected_setup && (
            <div className="absolute top-2 left-2">
              <span className="text-xs font-medium px-2 py-1 rounded bg-black/70 text-white border border-white/20">
                {row.detected_setup}
              </span>
            </div>
          )}

          {!isLoading && row.entry_quality_score !== undefined && row.entry_quality_score !== null && row.entry_quality_score !== '' && (
            <div className="absolute top-2 right-2">
              <ScoreBadge score={row.entry_quality_score} />
            </div>
          )}
        </div>

        {aiState === 'error' && (
          <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
            AI analysis failed for this image. You can still fill everything manually.
            {aiError ? ` ${aiError}` : ''}
          </div>
        )}

        {isLoading ? <Skeleton className="h-6" /> : <ConfidenceBar value={row.confidence} />}

        <div className="space-y-1">
          <Label className="text-xs text-white/50">AI narrative</Label>
          {isLoading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <Textarea
              value={row.narrative || ''}
              onChange={(e) => onFieldChange(shot.id, 'narrative', e.target.value)}
              className="bg-white/5 border-white/10 min-h-[68px] text-sm resize-none"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-white/50">Risk signals</Label>
            {isLoading ? <Skeleton className="h-7" /> : <SignalPills signals={row.risk_signals} variant="risk" />}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/50">Strength signals</Label>
            {isLoading ? <Skeleton className="h-7" /> : <SignalPills signals={row.strength_signals} variant="strength" />}
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 space-y-3">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Review & confirm</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Setup type</Label>
              {isLoading ? (
                <Skeleton className="h-9" />
              ) : (
                <Select
                  value={row.detected_setup || 'unknown'}
                  onValueChange={(value) => onFieldChange(shot.id, 'detected_setup', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a24] border-white/10">
                    {setupOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={row.status || 'suggested'}
                onValueChange={(value) => onFieldChange(shot.id, 'status', value)}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Quality score (0-10)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={row.entry_quality_score ?? ''}
                onChange={(e) => onFieldChange(shot.id, 'entry_quality_score', Number(e.target.value || 0))}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Confidence (0-1)</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={row.confidence ?? ''}
                onChange={(e) => onFieldChange(shot.id, 'confidence', Number(e.target.value || 0))}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Risk signals (comma-separated)</Label>
            <Input
              value={row.risk_signals || ''}
              onChange={(e) => onFieldChange(shot.id, 'risk_signals', e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Strength signals (comma-separated)</Label>
            <Input
              value={row.strength_signals || ''}
              onChange={(e) => onFieldChange(shot.id, 'strength_signals', e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Reviewer notes</Label>
            <Textarea
              value={row.user_notes || ''}
              onChange={(e) => onFieldChange(shot.id, 'user_notes', e.target.value)}
              className="bg-white/5 border-white/10 min-h-[60px]"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span className="text-yellow-400">O</span> Could Have Done Better
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/70">ENTRY</p>
                <div className="space-y-1">
                  <Label className="text-xs">Timing</Label>
                  <Select
                    value={row.entry_timing || ''}
                    onValueChange={(value) => onFieldChange(shot.id, 'entry_timing', value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs">
                      <SelectValue placeholder="Select timing" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/10">
                      {entryTimingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <Label className="text-xs">Actual Price</Label>
                    <Input
                      value={row.entry_price_actual || ''}
                      onChange={(e) => onFieldChange(shot.id, 'entry_price_actual', e.target.value)}
                      className="bg-white/5 border-white/10 h-8 text-xs"
                      placeholder="$"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Ideal Price</Label>
                    <Input
                      value={row.entry_price_ideal || ''}
                      onChange={(e) => onFieldChange(shot.id, 'entry_price_ideal', e.target.value)}
                      className="bg-white/5 border-white/10 h-8 text-xs"
                      placeholder="$"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Could have saved</Label>
                  <Input
                    value={row.entry_savings_potential || ''}
                    onChange={(e) => onFieldChange(shot.id, 'entry_savings_potential', e.target.value)}
                    className="bg-white/5 border-white/10 h-8 text-xs"
                    placeholder="$"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-white/70">EXIT</p>
                <div className="space-y-1">
                  <Label className="text-xs">Timing</Label>
                  <Select
                    value={row.exit_timing || ''}
                    onValueChange={(value) => onFieldChange(shot.id, 'exit_timing', value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs">
                      <SelectValue placeholder="Select timing" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/10">
                      {exitTimingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <Label className="text-xs">Actual Price</Label>
                    <Input
                      value={row.exit_price_actual || ''}
                      onChange={(e) => onFieldChange(shot.id, 'exit_price_actual', e.target.value)}
                      className="bg-white/5 border-white/10 h-8 text-xs"
                      placeholder="$"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Ideal Price</Label>
                    <Input
                      value={row.exit_price_ideal || ''}
                      onChange={(e) => onFieldChange(shot.id, 'exit_price_ideal', e.target.value)}
                      className="bg-white/5 border-white/10 h-8 text-xs"
                      placeholder="$"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Left on table</Label>
                  <Input
                    value={row.exit_left_on_table || ''}
                    onChange={(e) => onFieldChange(shot.id, 'exit_left_on_table', e.target.value)}
                    className="bg-white/5 border-white/10 h-8 text-xs"
                    placeholder="$"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div>
                <Label className="text-xs">What was the BETTER play?</Label>
                <Textarea
                  value={row.better_play || ''}
                  onChange={(e) => onFieldChange(shot.id, 'better_play', e.target.value)}
                  className="bg-white/5 border-white/10 min-h-[40px] text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">One thing to change next time</Label>
                  <Input
                    value={row.one_thing_to_change || ''}
                    onChange={(e) => onFieldChange(shot.id, 'one_thing_to_change', e.target.value)}
                    className="bg-white/5 border-white/10 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Rewind moment</Label>
                  <Input
                    value={row.rewind_moment || ''}
                    onChange={(e) => onFieldChange(shot.id, 'rewind_moment', e.target.value)}
                    className="bg-white/5 border-white/10 h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {advanced && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <h3 className="text-sm font-medium">Advanced Analysis</h3>
              <ExecutionTimeline entry={advanced.execution?.entry} exit={advanced.execution?.exit} />
              <MistakeCostCard analysis={advanced} />
              <PatternAlert pattern={advanced.pattern_matching} />
              <ActionItems items={advanced.improvement_analysis?.action_items || []} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
