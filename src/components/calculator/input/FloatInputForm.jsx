import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Target, Loader2, Sigma } from 'lucide-react';

export default function FloatInputForm({
  symbol,
  setSymbol,
  entryPrice,
  setEntryPrice,
  customStopLossPrice,
  setCustomStopLossPrice,
  comment,
  setComment,
  loading,
  fetchShareFloat,
  onCalculate,
  disabled = false
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-white/60">Symbol</Label>
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="TSLA"
            className="h-11 bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-white/60">Entry Price</Label>
          <Input
            type="text"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="215.00"
            className="h-11 bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-white/60">Stop Loss</Label>
          <Input
            type="text"
            value={customStopLossPrice}
            onChange={(e) => setCustomStopLossPrice(e.target.value)}
            placeholder="209.50"
            className="h-11 bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-white/60">Comment</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a note for this calculator setup..."
          className="min-h-[84px] bg-white/5 border-white/10 focus-visible:ring-blue-500/30 resize-y"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={fetchShareFloat}
          disabled={!symbol || loading || disabled}
          className="h-11 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Fetching Float Data...
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Get Share Float Data
            </>
          )}
        </Button>

        {typeof onCalculate === 'function' && (
          <Button
            onClick={onCalculate}
            disabled={!entryPrice || disabled}
            variant="outline"
            className="h-11 border-white/15 bg-white/5 hover:bg-white/10"
          >
            <Sigma className="w-4 h-4 mr-2" />
            Calculate Position
          </Button>
        )}
      </div>
    </div>
  );
}
