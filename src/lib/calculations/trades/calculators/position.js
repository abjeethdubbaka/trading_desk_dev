import { round } from '../shared/helpers.js';

// ── Futures contract specs ─────────────────────────────────────────────────────
export const FUTURES_CONTRACTS = {
  ES:  { name: 'E-mini S&P 500',          tickSize: 0.25,    tickValue: 12.50 },
  MES: { name: 'Micro E-mini S&P 500',    tickSize: 0.25,    tickValue: 1.25  },
  NQ:  { name: 'E-mini Nasdaq-100',       tickSize: 0.25,    tickValue: 5.00  },
  MNQ: { name: 'Micro E-mini Nasdaq-100', tickSize: 0.25,    tickValue: 0.50  },
  RTY: { name: 'E-mini Russell 2000',     tickSize: 0.10,    tickValue: 5.00  },
  M2K: { name: 'Micro Russell 2000',      tickSize: 0.10,    tickValue: 0.50  },
  YM:  { name: 'E-mini DJIA',             tickSize: 1.00,    tickValue: 5.00  },
  MYM: { name: 'Micro E-mini DJIA',       tickSize: 1.00,    tickValue: 0.50  },
  CL:  { name: 'Crude Oil',               tickSize: 0.01,    tickValue: 10.00 },
  GC:  { name: 'Gold',                    tickSize: 0.10,    tickValue: 10.00 },
  SI:  { name: 'Silver',                  tickSize: 0.005,   tickValue: 25.00 },
  '6E':{ name: 'Euro FX',                tickSize: 0.00005, tickValue: 6.25  },
};

export function calcFuturesPosition({
  entryPrice,
  direction = 'long',
  accountSize = 50000,
  riskAmount,
  stopLossPrice,
  tickSize,
  tickValue,
  riskRewardRatio = 3,
  maxContracts = null,
}) {
  const entry   = Number(entryPrice);
  const account = Number(accountSize);
  const tSize   = Number(tickSize);
  const tValue  = Number(tickValue);

  if (!entry || !account)   throw new Error('Entry price and account size are required');
  if (!tSize || !tValue)    throw new Error('Tick size and tick value are required');
  if (!stopLossPrice)       throw new Error('Stop loss price is required for futures sizing');

  const stop = Number(stopLossPrice);
  const stopDistance = Math.abs(entry - stop);
  if (stopDistance < tSize) throw new Error('Stop distance must be at least 1 tick');

  const isLong = direction === 'long';
  const stopTicks = Math.round(stopDistance / tSize);
  const riskPerContract = stopTicks * tValue;

  const resolvedRiskAmount = Number.isFinite(Number(riskAmount)) && Number(riskAmount) > 0
    ? Number(riskAmount)
    : account * 0.01;

  let contracts = Math.max(1, Math.floor(resolvedRiskAmount / riskPerContract));
  if (maxContracts != null && Number.isFinite(Number(maxContracts)) && Number(maxContracts) > 0) {
    contracts = Math.min(contracts, Math.floor(Number(maxContracts)));
  }

  const actualRisk        = contracts * riskPerContract;
  const riskUtilizationPct = resolvedRiskAmount > 0 ? (actualRisk / resolvedRiskAmount) * 100 : 100;
  const targetPrice       = isLong
    ? entry + stopTicks * riskRewardRatio * tSize
    : entry - stopTicks * riskRewardRatio * tSize;
  const targetProfit      = contracts * stopTicks * riskRewardRatio * tValue;
  const actualRiskPct     = account > 0 ? (actualRisk / account) * 100 : 0;

  return {
    entryPrice:          round(entry, 5),
    stopLossPrice:       round(stop, 5),
    targetPrice:         round(targetPrice, 5),
    direction,
    contracts,
    shares:              contracts,        // alias so ResultsDisplay renders correctly
    stopTicks,
    riskPerContract:     round(riskPerContract, 2),
    positionValue:       round(contracts * entry, 2),
    actualRisk:          round(actualRisk, 2),
    actualRiskPct:       round(actualRiskPct, 2),
    requestedRisk:       round(resolvedRiskAmount, 2),
    riskUtilizationPct:  round(riskUtilizationPct, 2),
    riskLevel:           actualRiskPct >= 2 ? 'High' : actualRiskPct >= 1 ? 'Medium' : 'Low',
    targetProfit:        round(targetProfit, 2),
    riskRewardRatio,
    isFutures:           true,
    tickSize:            tSize,
    tickValue:           tValue,
    mode:                'futures',
    capReason:           null,
    cappedByBalance:     false,
    cappedByPositionValue: false,
    cappedByFloat:       false,
    cappedByFloatAdjustment: false,
    calculatedAt:        new Date().toLocaleString(),
  };
}

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
  maxPositionValue = 0,
  maxDollars = 0,
  riskRewardRatio = 3,
  allowFloatDynamic = false,
}) {
  const entry = Number(entryPrice);
  const account = Number(accountSize);
  if (!entry || !account) throw new Error('Entry price and account size are required');

  const isLong = direction === 'long';
  const normalizedPositionPct = (() => {
    const value = Number(positionPct);
    if (!Number.isFinite(value) || value <= 0) return 0.01;
    return value > 1 ? value / 100 : value;
  })();
  const normalizedRiskAmount = (() => {
    const value = Number(riskAmount);
    return Number.isFinite(value) && value > 0 ? value : null;
  })();
  const maxSharesByBalance = Math.floor(account / entry);
  const accountPositionValue = account * normalizedPositionPct;
  const resolvedRiskAmount = normalizedRiskAmount ?? accountPositionValue;
  const hasFloatCategory = Boolean(shareFloat && floatCategory && floatCategories[floatCategory]);
  const isFloatAware = Boolean(allowFloatDynamic && hasFloatCategory);
  const category = isFloatAware ? floatCategories[floatCategory] : null;
  const configuredMaxPositionValue = Number(maxPositionValue);
  const legacyMaxPositionValue = Number(maxDollars);
  const resolvedMaxPositionValue = Number.isFinite(configuredMaxPositionValue) && configuredMaxPositionValue > 0
    ? configuredMaxPositionValue
    : Number.isFinite(legacyMaxPositionValue) && legacyMaxPositionValue > 0
      ? legacyMaxPositionValue
      : null;

  let stop;
  let riskPerShare;
  let shares;
  let mode;
  let cappedByBalance = false;
  let cappedByPositionValue = false;
  let cappedByFloat = false;
  let cappedByFloatAdjustment = false;

  if (stopLossPrice) {
    stop = Number(stopLossPrice);
    riskPerShare = isLong ? entry - stop : stop - entry;
    if (riskPerShare <= 0) {
      throw new Error('Stop loss must be below entry for long, above for short');
    }

    const riskShares = Math.max(1, Math.round(resolvedRiskAmount / riskPerShare));
    let resolvedShares = Math.min(riskShares, maxSharesByBalance);
    if (resolvedShares < riskShares && resolvedShares === maxSharesByBalance) {
      cappedByBalance = true;
    }

    if (isFloatAware) {
      const categoryMaxFloatPercent = category?.max_float_percent ?? category?.maxFloatPercent;
      if (Number.isFinite(Number(categoryMaxFloatPercent)) && Number(categoryMaxFloatPercent) > 0) {
        const maxByFloat = Math.max(1, Math.floor(shareFloat * (Number(categoryMaxFloatPercent) / 100)));
        if (resolvedShares > maxByFloat) {
          cappedByFloat = true;
        }
        resolvedShares = Math.min(resolvedShares, maxByFloat);
      }
      if (resolvedMaxPositionValue != null) {
        const maxByPositionValue = Math.max(1, Math.floor(resolvedMaxPositionValue / entry));
        if (resolvedShares > maxByPositionValue) {
          cappedByPositionValue = true;
        }
        resolvedShares = Math.min(resolvedShares, maxByPositionValue);
      }
    }

    shares = Math.max(1, resolvedShares);
    mode = 'custom-stop';
  } else {
    const categoryStopLossPercent = category?.stop_loss_percent ?? category?.stopLossPercent;
    const categoryPositionMultiplier = category?.position_multiplier ?? category?.positionMultiplier;
    const categoryMaxFloatPercent = category?.max_float_percent ?? category?.maxFloatPercent;
    const stopPctValue = (isFloatAware ? categoryStopLossPercent ?? stopPct : stopPct) / 100;
    stop = isLong ? entry * (1 - stopPctValue) : entry * (1 + stopPctValue);
    riskPerShare = Math.abs(entry - stop);

    const riskShares = Math.max(1, Math.floor(resolvedRiskAmount / riskPerShare));

    if (isFloatAware) {
      const baseShares = Math.floor(accountPositionValue / entry);
      const adjustedShares = Math.floor(baseShares * (categoryPositionMultiplier ?? 1));
      const maxByFloat = Math.floor(shareFloat * ((categoryMaxFloatPercent ?? 0.5) / 100));
      const maxByPositionValue = resolvedMaxPositionValue != null
        ? Math.floor(resolvedMaxPositionValue / entry)
        : Infinity;

      shares = Math.max(
        1,
        Math.min(riskShares, adjustedShares, maxByFloat, maxByPositionValue, maxSharesByBalance)
      );
      if (shares < riskShares && shares === maxSharesByBalance) cappedByBalance = true;
      if (shares < riskShares && Number.isFinite(maxByPositionValue) && shares === maxByPositionValue) {
        cappedByPositionValue = true;
      }
      if (shares < riskShares && shares === maxByFloat) cappedByFloat = true;
      if (shares < riskShares && shares === adjustedShares) cappedByFloatAdjustment = true;
      mode = 'float-aware';
    } else {
      shares = Math.max(1, Math.min(riskShares, maxSharesByBalance));
      if (shares < riskShares && shares === maxSharesByBalance) {
        cappedByBalance = true;
      }
      mode = 'entry-only';
    }
  }

  const positionValue = shares * entry;
  const actualRisk = shares * riskPerShare;
  const requestedRisk = resolvedRiskAmount;
  const riskUtilizationPct = requestedRisk > 0 ? (actualRisk / requestedRisk) * 100 : 100;
  const capReasons = [];
  if (cappedByBalance) capReasons.push('account buying power');
  if (cappedByPositionValue) capReasons.push('max position value');
  if (cappedByFloat) capReasons.push('float liquidity cap');
  if (cappedByFloatAdjustment) capReasons.push('float multiplier');
  const capReason = capReasons.length > 0 ? capReasons.join(', ') : null;
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
    requestedRisk: round(requestedRisk, 2),
    riskUtilizationPct: round(riskUtilizationPct, 2),
    cappedByBalance,
    cappedByPositionValue,
    cappedByFloat,
    cappedByFloatAdjustment,
    capReason,
    riskLevel,
    targetProfit: round(targetProfit, 2),
    riskRewardRatio,
    floatCategory: floatCategory ?? null,
    mode,
    calculatedAt: new Date().toLocaleString(),
  };
}
