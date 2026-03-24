import React, { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3,
  ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

const emotionColors = {
  confident: 'bg-emerald-500/20 text-emerald-400',
  disciplined: 'bg-blue-500/20 text-blue-400',
  neutral: 'bg-white/10 text-white/60',
  nervous: 'bg-amber-500/20 text-amber-400',
  fomo: 'bg-orange-500/20 text-orange-400',
  revenge: 'bg-red-500/20 text-red-400'
};

export default function TradeCard({ trade, onEdit, onDelete, onFocusInCalculator }) {
  const { settings } = useSettings();
  
  // Get current account tier settings
  const journalPrefs = settings.journal_preferences || {};
  const performanceGoals = settings.performance_goals || {};
  const tradingRules = settings.trading_rules || {};
  
  const pnl = trade.pnl || 0;
  const isProfit = pnl >= 0;
  const breakoutChecklist = trade.breakout_checklist || null;
  const isVWAPPullback = (trade.setup_type || '').toLowerCase().trim() === 'vwap pullback';

  const step1Passed = !!(
    breakoutChecklist?.step1?.smoothVWAPPullback &&
    breakoutChecklist?.step1?.controlledRedCandles &&
    breakoutChecklist?.step1?.holdsAboveVWAP &&
    breakoutChecklist?.step1?.lowerWicksDipBuyers
  );
  const step2Passed = !!(
    breakoutChecklist?.step2?.tightRange3to6Candles &&
    breakoutChecklist?.step2?.volumeDriesUp &&
    breakoutChecklist?.step2?.higherLowsForming &&
    breakoutChecklist?.step2?.vwapSlopesUpward
  );
  const step3Passed = !!(
    breakoutChecklist?.step3?.breakAboveBaseHigh &&
    breakoutChecklist?.step3?.volumeIncreases &&
    breakoutChecklist?.step3?.vwapRising
  );

  return (
    <div className={cn(
      "glass-card rounded-xl p-4 gradient-border transition-all hover:bg-white/5",
      isProfit ? "hover:shadow-emerald-500/5" : "hover:shadow-red-500/5"
    )}>
      <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            trade.direction === 'long' ? "bg-emerald-500/20" : "bg-red-500/20"
          )}>
            {trade.direction === 'long' ? (
              <ArrowUpRight className="w-6 h-6 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg">{trade.symbol}</h3>
            <p className="text-xs text-white/40">
              {trade.entry_time 
                ? format(new Date(trade.entry_time), 'MMM d, yyyy • h:mm a')
                : trade.created_date
                  ? format(new Date(trade.created_date), 'MMM d, yyyy')
                  : 'No date'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-xl font-bold",
            isProfit ? "text-emerald-400" : "text-red-400"
          )}>
            {isProfit ? '+' : ''}${pnl.toFixed(2)}
          </p>
          {trade.exit_time && (
            <p className="text-xs text-white/40 mt-1">
              {format(new Date(trade.exit_time), 'h:mm a')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 text-sm mb-3">
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 text-xs">Entry</p>
          <p className="font-semibold">${trade.entry_price}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 text-xs">Exit</p>
          <p className="font-semibold">${trade.exit_price || '-'}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 text-xs">Stop</p>
          <p className="font-semibold">${trade.stop_loss || '-'}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 text-xs">Size</p>
          <p className="font-semibold">{trade.position_size}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 text-xs">Date</p>
          <p className="font-semibold text-xs">{format(new Date(trade.entry_time), 'MMM dd')}</p>
        </div>
      </div>

      <div className="flex gap-2 text-sm mb-3">
        <div className="bg-white/5 rounded-lg p-2 flex-1">
          <p className="text-white/40 text-xs">P&L</p>
          <p className={cn(
            "font-semibold",
            isProfit ? "text-emerald-400" : "text-red-400"
          )}>
            {isProfit ? '+' : ''}{pnl.toFixed(2)}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 flex-1">
          <p className="text-white/40 text-xs">R:R</p>
          <p className="font-semibold">{trade.r_multiple ? `${trade.r_multiple}:1` : '-'}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 flex-1">
          <p className="text-white/40 text-xs">Setup</p>
          <p className="font-semibold truncate">{trade.setup_type || '-'}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 flex-1">
          <p className="text-white/40 text-xs">P&L %</p>
          <p className={cn(
            "font-semibold",
            isProfit ? "text-emerald-400" : "text-red-400"
          )}>
            {trade.pnl_percent ? `${(isProfit ? '+' : '')}${trade.pnl_percent.toFixed(2)}%` : '-'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {trade.emotions && (
          <Badge className={cn("text-xs", emotionColors[trade.emotions])}>
            {trade.emotions}
          </Badge>
        )}
        {trade.followed_plan !== undefined && (
          <Badge className={cn(
            "text-xs flex items-center gap-1",
            trade.followed_plan 
              ? "bg-emerald-500/20 text-emerald-400" 
              : "bg-red-500/20 text-red-400"
          )}>
            {trade.followed_plan ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {trade.followed_plan ? 'Followed Plan' : 'Deviated'}
          </Badge>
        )}
        {trade.screenshots?.length > 0 && (
          <Badge className="text-xs bg-white/10 text-white/60">
            <ImageIcon className="w-3 h-3 mr-1" />
            {trade.screenshots.length} screenshot{trade.screenshots.length > 1 ? 's' : ''}
          </Badge>
        )}
        <Badge className={cn(
          "text-xs",
          trade.setup_grade ? "bg-blue-500/20 text-blue-300" : "bg-white/10 text-white/60"
        )}>
          Setup Quality: {trade.setup_grade || 'No Grade'}
        </Badge>
      </div>

      {isVWAPPullback && breakoutChecklist && (
        <div className="bg-blue-500/10 rounded-lg p-2 mb-3 border border-blue-500/20">
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <p className={cn("font-medium", step1Passed ? "text-emerald-300" : "text-red-300")}>
              VWAP Touch: {step1Passed ? 'YES' : 'NO'}
            </p>
            <p className={cn("font-medium", step2Passed ? "text-emerald-300" : "text-red-300")}>
              Base: {step2Passed ? 'YES' : 'NO'}
            </p>
            <p className={cn("font-medium", step3Passed ? "text-emerald-300" : "text-red-300")}>
              Trigger: {step3Passed ? 'YES' : 'NO'}
            </p>
          </div>
        </div>
      )}

      {trade.notes && (
        <p className="text-sm text-white/50 mb-3 line-clamp-2">{trade.notes}</p>
      )}

      {trade.mistakes && trade.mistakes.length > 0 && (
        <div className="bg-red-500/10 rounded-lg p-2 mb-3 border border-red-500/20">
          <p className="text-xs text-red-400/80">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Mistakes: {Array.isArray(trade.mistakes) ? trade.mistakes.join(', ') : trade.mistakes}
          </p>
        </div>
      )}

      {trade.lessons && (
        <div className="bg-amber-500/10 rounded-lg p-2 mb-3 border border-amber-500/20">
          <p className="text-xs text-amber-400/80">💡 {trade.lessons}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
        {onFocusInCalculator && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFocusInCalculator(trade)}
            className="text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
          >
            Use in Calculator
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(trade)}
          className="text-white/50 hover:text-white"
        >
          <Pencil className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(trade.id)}
          className="text-white/50 hover:text-red-400"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}
