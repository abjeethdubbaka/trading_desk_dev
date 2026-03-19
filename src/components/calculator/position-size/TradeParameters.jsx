import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TradeParameters({ 
  values, 
  watchlist, 
  handleInputChange, 
  handleSymbolSelect, 
  handleStopLossPercentChange, 
  effectiveStopLoss 
}) {
  return (
    <>
      {/* Symbol and Entry Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Symbol</Label>
          <Select value={values.symbol} onValueChange={handleSymbolSelect}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select or type..." />
            </SelectTrigger>
            <SelectContent>
              {watchlist.map((item) => (
                <SelectItem key={item.id} value={item.symbol}>
                  {item.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Entry Price ($)</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={values.entryPrice}
            onChange={(e) => {
              console.log('Entry price changing to:', e.target.value);
              handleInputChange('entryPrice', e.target.value);
            }}
            placeholder="100.00"
            className="bg-white/5 border-white/10"
          />
        </div>
      </div>

      {/* Stop Loss Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Stop Loss % (Auto-calc)</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={values.stopLossPercent}
            onChange={(e) => handleStopLossPercentChange(e.target.value)}
            placeholder="2"
            className="bg-red-500/10 border-red-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label>Stop Loss Price (Override)</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={values.stopLoss}
            onChange={(e) => handleInputChange('stopLoss', e.target.value)}
            placeholder={effectiveStopLoss > 0 ? effectiveStopLoss.toFixed(2) : "Auto"}
            className="bg-red-500/10 border-red-500/20"
          />
        </div>
      </div>

      {/* Account Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Account Balance ($)</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={values.accountBalance}
            onChange={(e) => handleInputChange('accountBalance', e.target.value)}
            placeholder="50000"
            className="bg-white/5 border-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label>Risk per Trade (%)</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={values.riskPercent}
            onChange={(e) => handleInputChange('riskPercent', e.target.value)}
            placeholder="1"
            className="bg-white/5 border-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label>Risk:Reward Ratio</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={values.riskRewardRatio}
            onChange={(e) => handleInputChange('riskRewardRatio', e.target.value)}
            placeholder="2"
            className="bg-emerald-500/10 border-emerald-500/20"
          />
        </div>
      </div>
    </>
  );
}
