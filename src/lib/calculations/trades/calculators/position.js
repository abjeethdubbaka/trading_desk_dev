import { round } from '../shared/helpers.js';

export function calcPosition({
  entryPrice,
  direction = 'long',
  accountSize = 50000,
  positionPct = 1,
  stopPct = 4,
  stopLossPrice,
  riskAmount,
  shareFloat,
  floatCategory,
  floatCategories = {},
  maxDollars = 0,
  targetProfitDollars = 500,
  riskRewardRatio = 3,
}) {
  const entry = Number(entryPrice);
  const account = Number(accountSize);
  if (!entry || !account) throw new Error('Entry price and account size are required');

  const isLong = direction === 'long';
  const maxSharesByBalance = Math.floor(account / entry);
  const accountPositionValue = (account * positionPct) / 100;

  let stop;
  let riskPerShare;
  let shares;
  let mode;

  if (stopLossPrice) {
    stop = Number(stopLossPrice);
    riskPerShare = isLong ? entry - stop : stop - entry;
    if (riskPerShare <= 0) {
      throw new Error('Stop loss must be below entry for long, above for short');
    }

    const risk = riskAmount ?? accountPositionValue;
    const riskShares = Math.max(1, Math.round(risk / riskPerShare));
    shares = Math.min(riskShares, maxSharesByBalance);
    mode = 'custom-stop';
  } else {
    const isFloatAware = shareFloat && floatCategory && floatCategories[floatCategory];
    const category = isFloatAware ? floatCategories[floatCategory] : null;
    const categoryStopLossPercent = category?.stop_loss_percent ?? category?.stopLossPercent;
    const categoryPositionMultiplier = category?.position_multiplier ?? category?.positionMultiplier;
    const categoryMaxFloatPercent = category?.max_float_percent ?? category?.maxFloatPercent;
    const stopPctValue = (isFloatAware ? categoryStopLossPercent ?? stopPct : stopPct) / 100;
    stop = isLong ? entry * (1 - stopPctValue) : entry * (1 + stopPctValue);
    riskPerShare = Math.abs(entry - stop);

    const riskShares = Math.floor((riskAmount || 1500) / riskPerShare);

    if (isFloatAware) {
      const baseShares = Math.floor(accountPositionValue / entry);
      const adjustedShares = Math.floor(baseShares * (categoryPositionMultiplier ?? 1));
      const maxByFloat = Math.floor(shareFloat * ((categoryMaxFloatPercent ?? 0.5) / 100));
      const maxByAccountDollars = maxDollars > 0 ? Math.floor(maxDollars / entry) : Infinity;

      shares = Math.max(
        1,
        Math.min(riskShares, adjustedShares, maxByFloat, maxByAccountDollars, maxSharesByBalance)
      );
      mode = 'float-aware';
    } else {
      const maxPositionValue =
        maxDollars > 0 ? Math.min(accountPositionValue, maxDollars) : accountPositionValue;
      const maxSharesByPosition = Math.floor(maxPositionValue / entry);
      shares = Math.max(1, Math.min(riskShares, maxSharesByPosition, maxSharesByBalance));
      mode = 'entry-only';
    }
  }

  const positionValue = shares * entry;
  const actualRisk = shares * riskPerShare;
  const target = isLong
    ? entry + riskPerShare * riskRewardRatio
    : entry - riskPerShare * riskRewardRatio;
  const targetProfit = shares * riskPerShare * riskRewardRatio;
  const actualRiskPct = account > 0 ? (actualRisk / account) * 100 : 0;
  const riskLevel = actualRiskPct >= 2 ? 'High' : actualRiskPct >= 1 ? 'Medium' : 'Low';

  return {
    entryPrice: round(entry, 2),
    stopLossPrice: round(stop, 2),
    targetPrice: round(target, 2),
    direction,
    shares,
    positionValue: round(positionValue, 2),
    actualRisk: round(actualRisk, 2),
    actualRiskPct: round(actualRiskPct, 2),
    riskLevel,
    targetProfit: round(targetProfit, 2),
    riskRewardRatio,
    floatCategory: floatCategory ?? null,
    mode,
    calculatedAt: new Date().toLocaleString(),
  };
}
