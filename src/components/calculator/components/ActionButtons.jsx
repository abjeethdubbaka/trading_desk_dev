import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Copy,
  Download,
  Save,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function ActionButtons({ 
  calculation, 
  onRecalculate,
  onCopy,
  onExport,
  onSave 
}) {
  const copyTradeToClipboard = () => {
    if (!calculation) return;
    
    const text = `
Float Position Sizer - ${calculation.symbol}
===============================

Entry Price: $${calculation.entryPrice.toFixed(2)}
Shares to Buy: ${calculation.shares.toLocaleString()}
Position Value: $${calculation.positionValue.toLocaleString()}

Stop Loss: $${calculation.stopLossPrice.toFixed(2)} (${calculation.stopPercent.toFixed(1)}%)
Risk Amount: $${calculation.actualRisk.toFixed(2)} (${calculation.actualRiskPercent.toFixed(2)}% of account)

Float Category: ${calculation.categoryInfo.label}
Float Used: ${calculation.percentOfFloat.toFixed(4)}% of ${calculation.floatSize.toLocaleString()} shares

Account: $${calculation.accountSize.toLocaleString()}
Trading Style: ${calculation.tradingStyle}
Risk per Trade: ${calculation.riskPercent.toFixed(1)}%
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast.success('Trade details copied to clipboard');
    
    if (onCopy) onCopy(text);
  };
  
  const exportTrade = () => {
    if (!calculation) return;
    
    const data = {
      trade: {
        symbol: calculation.symbol,
        entryPrice: calculation.entryPrice,
        shares: calculation.shares,
        positionValue: calculation.positionValue,
        stopLoss: calculation.stopLossPrice,
        riskAmount: calculation.actualRisk,
        riskPercent: calculation.actualRiskPercent
      },
      float: {
        category: calculation.floatCategory,
        size: calculation.floatSize,
        usedPercent: calculation.percentOfFloat,
        volumeToFloat: calculation.volumeToFloat,
        liquidityScore: calculation.liquidityScore
      },
      account: {
        size: calculation.accountSize,
        usedPercent: calculation.percentOfAccount,
        tradingStyle: calculation.tradingStyle
      },
      calculatedAt: calculation.calculatedAt
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-${calculation.symbol}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Trade exported as JSON');
    
    if (onExport) onExport(data);
  };
  
  const saveTrade = () => {
    if (!calculation) return;
    
    toast.success('Trade saved to journal');
    
    if (onSave) onSave(calculation);
  };
  
  if (!calculation) return null;
  
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={copyTradeToClipboard}
        variant="outline"
        className="border-white/10"
      >
        <Copy className="w-4 h-4 mr-2" />
        Copy Trade
      </Button>
      <Button
        onClick={exportTrade}
        variant="outline"
        className="border-white/10"
      >
        <Download className="w-4 h-4 mr-2" />
        Export JSON
      </Button>
      <Button
        onClick={saveTrade}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        <Save className="w-4 h-4 mr-2" />
        Save to Journal
      </Button>
      <Button
        onClick={onRecalculate}
        variant="outline"
        className="border-white/10 ml-auto"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Recalculate
      </Button>
    </div>
  );
}
