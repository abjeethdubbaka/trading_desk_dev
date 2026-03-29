/**
 * @file src/components/screenshot-analysis/components/AnalysisCard/CouldHaveDoneBetter.js
 *
 * Could have done better section component.
 */

import React from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';

export function CouldHaveDoneBetter({
  shot,
  row,
  isLoading,
  entryTimingOptions,
  exitTimingOptions,
  onFieldChange,
}) {
  return (
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
  );
}


