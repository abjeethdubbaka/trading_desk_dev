import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Calculator,
  DollarSign,
  Target,
  PieChart,
  RefreshCw,
  Loader2,
  Settings
} from 'lucide-react';
import { TRADING_STYLES, getTradingStyle } from '../utils/tradingStyles';

export default function InputSection({
  symbol,
  setSymbol,
  entryPrice,
  setEntryPrice,
  accountSize,
  setAccountSize,
  tradingStyle,
  setTradingStyle,
  useAdvanced,
  setUseAdvanced,
  customRiskPercent,
  setCustomRiskPercent,
  customStopPercent,
  setCustomStopPercent,
  loading,
  onFetchFloatData,
  compact = false
}) {
  const StyleIcon = getTradingStyle(tradingStyle).icon;

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Symbol</Label>
            <Input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="TSLA"
              className="bg-white/5 border-white/10 text-sm h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Price</Label>
            <Input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="215.00"
              className="bg-white/5 border-white/10 text-sm h-9"
            />
          </div>
        </div>
        <Button
          onClick={onFetchFloatData}
          disabled={!symbol || loading}
          className="w-full h-9"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Calculator className="w-4 h-4 mr-2" />
          )}
          Calculate
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Position Calculator
        </CardTitle>
        <CardDescription>
          Enter stock details to calculate optimal position size
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Symbol */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Symbol
            </Label>
            <div className="flex gap-2">
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="TSLA"
                className="bg-white/5 border-white/10"
              />
              <Button
                onClick={onFetchFloatData}
                disabled={!symbol || loading}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Entry */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Entry
            </Label>
            <Input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="215.00"
              className="bg-white/5 border-white/10"
            />
          </div>
          
          {/* Stop */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Stop
            </Label>
            <Input
              type="number"
              step="0.01"
              value={customStopPercent}
              onChange={(e) => setCustomStopPercent(e.target.value)}
              placeholder="29.28"
              className="bg-white/5 border-white/10"
            />
          </div>
          
          {/* Account Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <PieChart className="w-3 h-3" />
              Account Size ($)
            </Label>
            <Input
              type="number"
              value={accountSize}
              onChange={(e) => setAccountSize(parseFloat(e.target.value))}
              placeholder="200000"
              className="bg-white/5 border-white/10"
            />
          </div>
          
          {/* Trading Style */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <StyleIcon className="w-3 h-3" />
              Trading Style
            </Label>
            <Select value={tradingStyle} onValueChange={setTradingStyle}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <div className="flex items-center gap-2">
                  <StyleIcon className="w-3 h-3" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                {Object.entries(TRADING_STYLES).map(([key, style]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <style.icon className={`w-3 h-3 ${style.color}`} />
                      {style.label}
                      <span className="text-xs text-white/40 ml-auto">
                        {style.riskPercent}% risk
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Advanced Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={useAdvanced}
                onCheckedChange={setUseAdvanced}
              />
              <Label className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Advanced Settings
              </Label>
            </div>
          </div>
          
          {useAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="space-y-2">
                <Label>Custom Risk per Trade (%)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[customRiskPercent]}
                    min={0.1}
                    max={5}
                    step={0.1}
                    onValueChange={([value]) => setCustomRiskPercent(value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={customRiskPercent}
                    onChange={(e) => setCustomRiskPercent(parseFloat(e.target.value))}
                    className="w-20 bg-white/5 border-white/10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Custom Stop (%)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[customStopPercent]}
                    min={1}
                    max={10}
                    step={0.5}
                    onValueChange={([value]) => setCustomStopPercent(value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.5"
                    value={customStopPercent}
                    onChange={(e) => setCustomStopPercent(parseFloat(e.target.value))}
                    className="w-20 bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
