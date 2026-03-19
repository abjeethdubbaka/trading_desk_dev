import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Stock Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="TSLA"
                className="bg-white/5 border-white/10"
                disabled={disabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Entry Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="215.00"
                className="bg-white/5 border-white/10"
                disabled={disabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Stop Loss ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={customStopLossPrice}
                onChange={(e) => setCustomStopLossPrice(e.target.value)}
                placeholder="29.28"
                className="bg-white/5 border-white/10"
                disabled={disabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Position Type</Label>
              <Select value={direction} onValueChange={(value) => {
    console.log('Direction changed to:', value);
    setDirection(value);
  }}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Long Position
                  </SelectItem>
                  <SelectItem value="short">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Short Position
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-3">
          <Button
            onClick={fetchShareFloat}
            disabled={!symbol || loading || disabled}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching Share Float...
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
              variant="outline"
              className="border-white/10"
            >
              Calculate
            </Button>
          )}
        </div>
    </div>
  );
}
