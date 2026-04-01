import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Loader2, TrendingUp, TrendingDown, Sigma } from 'lucide-react';

export default function FloatInputForm({
  symbol,
  setSymbol,
  entryPrice,
  setEntryPrice,
  customStopLossPrice,
  setCustomStopLossPrice,
  direction,
  setDirection,
  loading,
  fetchShareFloat,
  onCalculate,
  disabled = false
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-white/60">Symbol</Label>
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="TSLA"
            className="h-11 bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
            disabled={disabled}
          />
          <p className="text-[11px] text-white/35">Ticker, 1-5 letters</p>
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
          <p className="text-[11px] text-white/35">Planned entry level</p>
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
          <p className="text-[11px] text-white/35">Optional custom stop</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-white/60">Direction</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="h-11 bg-white/5 border-white/10 focus:ring-blue-500/30">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="long">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Long
                </span>
              </SelectItem>
              <SelectItem value="short">
                <span className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Short
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-white/35">Auto-adjusts when stop crosses entry</p>
        </div>
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
