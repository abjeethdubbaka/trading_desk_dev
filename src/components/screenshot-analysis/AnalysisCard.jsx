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
import {
  ActionItems,
  ExecutionTimeline,
  MistakeCostCard,
  PatternAlert
} from './AdvancedAnalysisPanels';

export default function AnalysisCard({
  shot,
  row,
  setupOptions,
  statusOptions,
  entryTimingOptions,
  exitTimingOptions,
  onFieldChange
}) {
  const advanced = row.advanced_analysis;

  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardHeader>
        <CardTitle className="text-sm truncate">{shot.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <img src={shot.url} alt={shot.name} className="w-full h-56 object-cover rounded border border-white/10" />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Detected setup</Label>
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
          </div>

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
          <Label className="text-xs">Narrative</Label>
          <Textarea
            value={row.narrative || ''}
            onChange={(e) => onFieldChange(shot.id, 'narrative', e.target.value)}
            className="bg-white/5 border-white/10 min-h-[72px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
                placeholder="e.g., Wait for volume confirmation before entry"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">One thing to change next time</Label>
                <Input
                  value={row.one_thing_to_change || ''}
                  onChange={(e) => onFieldChange(shot.id, 'one_thing_to_change', e.target.value)}
                  className="bg-white/5 border-white/10 h-8 text-xs"
                  placeholder="e.g., Be more patient"
                />
              </div>
              <div>
                <Label className="text-xs">Rewind moment</Label>
                <Input
                  value={row.rewind_moment || ''}
                  onChange={(e) => onFieldChange(shot.id, 'rewind_moment', e.target.value)}
                  className="bg-white/5 border-white/10 h-8 text-xs"
                  placeholder="e.g., At 10:32 AM - wait"
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
      </CardContent>
    </Card>
  );
}
