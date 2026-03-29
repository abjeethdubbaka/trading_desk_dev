import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { buildDisciplineSnapshot } from '@/lib/calculations/discipline';

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatUsd(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function LimitNotificationsWatcher() {
  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const riskAlertsEnabled = settings?.notifications?.risk_alerts !== false;

  const filters = useMemo(
    () => ({ account_tier: currentTier }),
    [currentTier]
  );

  const { data: trades = [] } = useTrades({
    filters,
    enabled: Boolean(settings),
  });

  const snapshot = useMemo(
    () => buildDisciplineSnapshot(trades, settings || {}),
    [trades, settings]
  );

  const previousRef = useRef({
    dayKey: '',
    tradeLimitReached: false,
    lossLimitReached: false,
  });

  useEffect(() => {
    if (!riskAlertsEnabled || !snapshot?.metrics) return;

    const todayKey = getLocalDayKey();
    if (previousRef.current.dayKey !== todayKey) {
      previousRef.current = {
        dayKey: todayKey,
        tradeLimitReached: false,
        lossLimitReached: false,
      };
    }

    const {
      todayTrades = 0,
      maxDailyTrades = 0,
      todayPnL = 0,
      maxDailyLoss = 0,
    } = snapshot.metrics;

    const tradeLimitReached =
      Number(maxDailyTrades) > 0 && Number(todayTrades) >= Number(maxDailyTrades);

    if (tradeLimitReached && !previousRef.current.tradeLimitReached) {
      toast.warning(`Daily trade limit reached (${todayTrades}/${maxDailyTrades}).`);
    }
    previousRef.current.tradeLimitReached = tradeLimitReached;

    const normalizedMaxDailyLoss = Math.abs(Number(maxDailyLoss) || 0);
    const lossLimitReached =
      normalizedMaxDailyLoss > 0 && Number(todayPnL) <= -normalizedMaxDailyLoss;

    if (lossLimitReached && !previousRef.current.lossLimitReached) {
      toast.error(
        `Daily loss limit reached (${formatUsd(Math.abs(todayPnL))}/${formatUsd(normalizedMaxDailyLoss)}).`
      );
    }
    previousRef.current.lossLimitReached = lossLimitReached;
  }, [riskAlertsEnabled, snapshot]);

  return null;
}
