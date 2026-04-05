import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/general';

export default function ExitStrategySettings({
  exitDraft,
  onAddLevel,
  onRemoveLevel,
  onFieldChange,
  onFieldBlur,
  onTrailingToggle,
  isLoading,
  exitPercentTotal,
}) {
  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white/80">Exit strategy</h3>
          <p className="text-[11px] text-white/45 mt-0.5">
            Configure R-multiple targets and share allocation for calculator exits (global across all account tiers).
          </p>
        </div>
        <button
          type="button"
          onClick={onAddLevel}
          className="px-2.5 py-1.5 rounded-md text-xs bg-blue-500/15 border border-blue-500/25 text-blue-300 hover:bg-blue-500/25 transition-colors"
        >
          Add level
        </button>
      </div>

      <div className="space-y-2">
        {exitDraft.map((level, index) => (
          <div key={`exit-level-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-3 space-y-1">
                <Label className="text-[11px] text-white/55">Target (R)</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={level.r}
                  onChange={(e) => onFieldChange(index, 'r', e.target.value)}
                  onBlur={onFieldBlur}
                  className="bg-white/5 border-white/10 h-9"
                  disabled={isLoading}
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <Label className="text-[11px] text-white/55">Allocation (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={level.percent}
                  onChange={(e) => onFieldChange(index, 'percent', e.target.value)}
                  onBlur={onFieldBlur}
                  className="bg-white/5 border-white/10 h-9"
                  disabled={isLoading}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="h-9 px-2 rounded-md border border-white/10 bg-white/5 flex items-center gap-2 text-xs text-white/65">
                  <input
                    type="checkbox"
                    checked={Boolean(level.trailingStop)}
                    onChange={(e) => onTrailingToggle(index, e.target.checked)}
                    className="accent-purple-400"
                    disabled={isLoading}
                  />
                  Trailing stop
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemoveLevel(index)}
                  disabled={exitDraft.length <= 1 || isLoading}
                  className="h-9 px-2.5 rounded-md text-xs bg-red-500/10 border border-red-500/25 text-red-300 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p
        className={cn(
          'text-[11px]',
          Math.abs(exitPercentTotal - 100) < 0.01 ? 'text-emerald-300/90' : 'text-amber-300/90'
        )}
      >
        Allocation total: {exitPercentTotal.toFixed(1)}% (distribution auto-normalizes in calculator).
      </p>
    </div>
  );
}
