import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { validateTrade } from '@/lib/validation/trades';
import { TradeCreator } from '../../float-calculator/TradeCreator';

/**
 * Saves the calculator's current symbol/prices as an already-closed trade
 * (single "Exit Price" action) and watches for a daily-loss-limit breach.
 */
export function useTradeSubmission({
  symbol,
  entryPrice,
  exitPrice,
  setExitPrice,
  customStop,
  direction,
  comment,
  calculation,
  selectedSetup,
  createTrade,
  maxDollars,
  allTrades,
}) {
  const [isSavingTrade, setIsSavingTrade] = useState(false);
  const [lossLimitInfo, setLossLimitInfo] = useState(null); // { todayPnL, maxDailyLoss } or null

  const dismissLossLimitInfo = useCallback(() => setLossLimitInfo(null), []);

  const handleAddToJournal = useCallback(async () => {
    if (!entryPrice) {
      toast.error('Enter an entry price first');
      return;
    }

    const exitPriceNum = parseFloat(exitPrice);
    if (!Number.isFinite(exitPriceNum) || exitPriceNum <= 0) {
      toast.error('Enter an exit price first');
      return;
    }

    const normalizedSymbol = String(symbol || '').trim().toUpperCase();
    if (!normalizedSymbol) {
      toast.error('Enter a symbol first');
      return;
    }
    const isFuturesSymbol = /^\d/.test(normalizedSymbol) || normalizedSymbol.includes('6') || normalizedSymbol.length > 5;
    if (!isFuturesSymbol && !/^[A-Z0-9]{1,6}$/.test(normalizedSymbol)) {
      toast.error('Invalid symbol format');
      return;
    }

    setIsSavingTrade(true);
    try {
      const tradeData = await TradeCreator.createTrade({
        symbol: normalizedSymbol,
        entryPrice,
        exitPrice: exitPriceNum,
        direction,
        comment,
        calculation,
        stopLoss: customStop || calculation?.stopLossPrice,
        setupType: selectedSetup?.name || null,
      });

      const validation = validateTrade(tradeData);
      if (!validation.isValid) {
        toast.error(`Trade validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      await createTrade(tradeData);
      const pnl = Number(tradeData.pnl) || 0;
      toast.success(`${normalizedSymbol} saved: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);

      if (pnl < 0) {
        const maxDailyLoss = Math.abs(Number(maxDollars) || 0);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const todayPnLBefore = allTrades.reduce((sum, t) => {
          const d = new Date(t.entry_time || t.created_date || 0);
          return d >= start && d <= end ? sum + (Number(t.pnl) || 0) : sum;
        }, 0);

        const projectedTodayPnL = todayPnLBefore + pnl;

        if (maxDailyLoss > 0 && Math.abs(projectedTodayPnL) >= maxDailyLoss) {
          setLossLimitInfo({ todayPnL: projectedTodayPnL, maxDailyLoss });
        }
      }

      setExitPrice('');
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setIsSavingTrade(false);
    }
  }, [symbol, entryPrice, exitPrice, setExitPrice, customStop, direction, comment, calculation, selectedSetup, createTrade, maxDollars, allTrades]);

  return { isSavingTrade, handleAddToJournal, lossLimitInfo, dismissLossLimitInfo };
}
