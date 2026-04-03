/**
 * @file src/components/screenshot-analysis/components/AnalysisCard/ReviewSection.js
 *
 * Review section component.
 */

import React from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Skeleton } from './index.js';

export function ReviewSection({
  shot,
  row,
  isLoading,
  setupOptions,
  statusOptions,
  onFieldChange,
}) {
  return (
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
    </div>
  );
}


