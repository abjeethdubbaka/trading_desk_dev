const DEFAULT_POSITION_MULTIPLIERS = {
  micro: 0.65,
  small: 0.8,
  medium: 1,
  large: 1.1,
  mega: 1.2,
  unknown: 1,
};

const DEFAULT_STOP_PCT_BY_RANGE = {
  micro: 4.5,
  small: 3.8,
  medium: 3.2,
  large: 2.8,
  mega: 2.4,
  unknown: 3.5,
};

const DEFAULT_TARGET_R_BY_RANGE = {
  micro: { minR: 3.5, maxR: 6 },
  small: { minR: 2.5, maxR: 4.5 },
  medium: { minR: 2, maxR: 3.5 },
  large: { minR: 1.5, maxR: 2.8 },
  mega: { minR: 1.2, maxR: 2.2 },
  unknown: { minR: 1.8, maxR: 3 },
};

const DEFAULT_MAX_MOVE_PCT_BY_RANGE = {
  micro: 20,
  small: 15,
  medium: 11,
  large: 8,
  mega: 6,
  unknown: 10,
};

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPositive(value, fallback = null) {
  const parsed = toNumber(value, null);
  return parsed != null && parsed > 0 ? parsed : fallback;
}

function round(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizePercentFromDecimalOrPercent(value, fallbackPercent = null) {
  const parsed = toPositive(value, null);
  if (parsed == null) return fallbackPercent;
  return parsed <= 1 ? parsed * 100 : parsed;
}

function normalizeMaxFloatPercent(value, fallbackPercent = null) {
  const parsed = toPositive(value, null);
  if (parsed == null) return fallbackPercent;
  return parsed;
}

function resolveFloatTargetFields(shareFloat) {
  const numeric = toPositive(shareFloat, null);
  if (numeric == null) {
    return { minField: null, maxField: null };
  }

  if (numeric < 10_000_000) {
    return { minField: 'float_10m_min_r', maxField: 'float_10m_max_r' };
  }
  if (numeric < 50_000_000) {
    return { minField: 'float_10_50m_min_r', maxField: 'float_10_50m_max_r' };
  }
  if (numeric < 200_000_000) {
    return { minField: 'float_50_200m_min_r', maxField: 'float_50_200m_max_r' };
  }
  return { minField: 'float_200m_min_r', maxField: 'float_200m_max_r' };
}

function getDirectionalStopPrice(entryPrice, direction, stopLossPercent) {
  if (!Number.isFinite(entryPrice) || entryPrice <= 0 || !Number.isFinite(stopLossPercent) || stopLossPercent <= 0) {
    return null;
  }

  const stopDistance = (entryPrice * stopLossPercent) / 100;
  if (direction === 'short') return entryPrice + stopDistance;
  return entryPrice - stopDistance;
}

function getDirectionalTargetPrice(entryPrice, direction, riskPerShare, rMultiple) {
  if (
    !Number.isFinite(entryPrice) ||
    entryPrice <= 0 ||
    !Number.isFinite(riskPerShare) ||
    riskPerShare <= 0 ||
    !Number.isFinite(rMultiple) ||
    rMultiple <= 0
  ) {
    return null;
  }

  if (direction === 'short') return entryPrice - (riskPerShare * rMultiple);
  return entryPrice + (riskPerShare * rMultiple);
}

function resolveBaseRiskContext(settings = {}) {
  const directRiskAmount = toPositive(settings?.risk_amount, null);
  if (directRiskAmount != null) {
    return {
      value: directRiskAmount,
      source: 'risk_amount',
    };
  }

  const accountSize = toPositive(settings?.account_size, null);
  const positionSizing = toPositive(settings?.position_sizing_percent, null);
  if (accountSize == null || positionSizing == null) {
    return {
      value: null,
      source: 'unavailable',
    };
  }

  const sizingDecimal = positionSizing <= 1 ? positionSizing : positionSizing / 100;
  if (sizingDecimal <= 0) {
    return {
      value: null,
      source: 'unavailable',
    };
  }

  return {
    value: accountSize * sizingDecimal,
    source: 'account_size x position_sizing_percent',
  };
}

function resolveMarketContextAdjustment(marketContext = {}) {
  const dataSources = Array.isArray(marketContext?.data_sources)
    ? marketContext.data_sources.map((source) => String(source || '').toLowerCase())
    : [];
  const marketCap = toPositive(marketContext?.market_cap, null);
  const noteText = String(marketContext?.note || '').toLowerCase();
  const hasError = Boolean(marketContext?.error);
  const isEstimated = dataSources.some(
    (source) => source.includes('estimated') || source.includes('simulation') || source.includes('fallback')
  ) || noteText.includes('estimate') || noteText.includes('simulation');

  let factor = 1;
  const notes = [];

  if (hasError) {
    factor *= 0.8;
    notes.push('Risk reduced due to data retrieval error.');
  } else if (isEstimated) {
    factor *= 0.9;
    notes.push('Risk slightly reduced because float data is estimated/simulated.');
  }

  if (marketCap != null) {
    if (marketCap < 2_000_000_000) {
      factor *= 0.9;
      notes.push('Small-cap context detected; risk scaled down.');
    } else if (marketCap > 200_000_000_000) {
      factor *= 1.05;
      notes.push('Large-cap liquidity context detected; risk scaled slightly up.');
    }
  }

  return {
    factor: clamp(round(factor, 3), 0.6, 1.1),
    notes,
  };
}

function resolveRealisticMovePercent(rangeKey, marketContext = {}) {
  const marketCap = toPositive(marketContext?.market_cap, null);
  const hasError = Boolean(marketContext?.error);
  const dataSources = Array.isArray(marketContext?.data_sources)
    ? marketContext.data_sources.map((source) => String(source || '').toLowerCase())
    : [];
  const noteText = String(marketContext?.note || '').toLowerCase();
  const isEstimated = dataSources.some(
    (source) => source.includes('estimated') || source.includes('simulation') || source.includes('fallback')
  ) || noteText.includes('estimate') || noteText.includes('simulation');

  let maxMovePct = DEFAULT_MAX_MOVE_PCT_BY_RANGE[rangeKey] || DEFAULT_MAX_MOVE_PCT_BY_RANGE.unknown;

  if (marketCap != null) {
    if (marketCap < 2_000_000_000) maxMovePct += 3;
    if (marketCap > 200_000_000_000) maxMovePct -= 1.5;
  }
  if (hasError) maxMovePct -= 2;
  if (isEstimated) maxMovePct -= 1;

  return clamp(round(maxMovePct, 2), 5, 25);
}

function sanitizeExitPercents(levels = []) {
  const total = levels.reduce((sum, level) => sum + (toPositive(level.percent, 0) || 0), 0);
  if (!Number.isFinite(total) || total <= 0) {
    const equalShare = levels.length > 0 ? round(100 / levels.length, 2) : 0;
    return levels.map((level, index) => ({
      ...level,
      percent: index === levels.length - 1
        ? round(100 - (equalShare * (levels.length - 1)), 2)
        : equalShare,
    }));
  }

  const scaled = levels.map((level) => {
    const rawPercent = toPositive(level.percent, 0) || 0;
    const nextPercent = round((rawPercent / total) * 100, 2);
    return {
      ...level,
      percent: nextPercent,
    };
  });

  const running = scaled.reduce((sum, level) => sum + level.percent, 0);
  const drift = round(100 - running, 2);
  if (scaled.length > 0 && drift !== 0) {
    const last = scaled[scaled.length - 1];
    last.percent = round(last.percent + drift, 2);
  }

  return scaled;
}

function buildExitLevels({
  minR,
  maxR,
  entryPrice,
  direction,
  riskPerShare,
  settingsExitLevels = [],
}) {
  const hasRange = Number.isFinite(minR) && minR > 0 && Number.isFinite(maxR) && maxR > 0;
  if (!hasRange || !Number.isFinite(riskPerShare) || riskPerShare <= 0) return [];

  const lowR = Math.min(minR, maxR);
  const highR = Math.max(minR, maxR);
  const levelsSource = Array.isArray(settingsExitLevels) && settingsExitLevels.length > 0
    ? settingsExitLevels
    : [
      { r: lowR, percent: 30, trailingStop: false },
      { r: round((lowR + highR) / 2, 2), percent: 40, trailingStop: false },
      { r: highR, percent: 30, trailingStop: true },
    ];

  const mapped = levelsSource.map((level, index) => {
    const ratio = levelsSource.length === 1 ? 1 : index / (levelsSource.length - 1);
    const preferredLevelR = toPositive(level?.r, null);
    const mappedR = clamp(
      round(preferredLevelR == null ? lowR + ((highR - lowR) * ratio) : preferredLevelR, 2),
      lowR,
      highR
    );
    const targetPrice = getDirectionalTargetPrice(entryPrice, direction, riskPerShare, mappedR);

    return {
      r: mappedR,
      percent: toPositive(level?.percent, null),
      trailingStop: level?.trailingStop === true,
      targetPrice: Number.isFinite(targetPrice) ? round(targetPrice, 2) : null,
    };
  });

  return sanitizeExitPercents(mapped);
}

function buildGuardrails({
  rangeKey,
  stopLossPercent,
  positionSize,
  positionValue,
  accountSize,
  sizeCappedByPositionValue,
  sizeCappedByFloat,
}) {
  const hints = [];
  const baselineStopPercent = DEFAULT_STOP_PCT_BY_RANGE[rangeKey] || DEFAULT_STOP_PCT_BY_RANGE.unknown;
  const minPracticalStopPercent = Math.max(0.5, round(baselineStopPercent * 0.6, 2));
  const maxPracticalStopPercent = Math.min(12, round(baselineStopPercent * 1.8, 2));

  if (Number.isFinite(stopLossPercent) && stopLossPercent > 0) {
    if (stopLossPercent < minPracticalStopPercent) {
      hints.push({
        level: 'warning',
        title: 'Stop too tight',
        message: `Current stop ${round(stopLossPercent, 2)}% is below practical range (${minPracticalStopPercent}%+).`,
      });
    } else if (stopLossPercent > maxPracticalStopPercent) {
      hints.push({
        level: 'warning',
        title: 'Stop too wide',
        message: `Current stop ${round(stopLossPercent, 2)}% is wider than practical range (~${maxPracticalStopPercent}% max).`,
      });
    }
  }

  if (!Number.isFinite(positionSize) || positionSize <= 0) {
    hints.push({
      level: 'critical',
      title: 'Impractical size',
      message: 'No valid share size could be derived from current entry, risk, and stop settings.',
    });
  } else {
    if (positionSize < 10) {
      hints.push({
        level: 'warning',
        title: 'Impractical size',
        message: `Order size is very small (${positionSize} shares). Consider adjusting stop or risk.`,
      });
    } else if (positionSize > 10_000) {
      hints.push({
        level: 'warning',
        title: 'Impractical size',
        message: `Order size is very large (${Math.round(positionSize).toLocaleString()} shares). Check liquidity and slippage.`,
      });
    }
  }

  if (
    Number.isFinite(positionValue) &&
    positionValue > 0 &&
    Number.isFinite(accountSize) &&
    accountSize > 0
  ) {
    const concentrationPercent = round((positionValue / accountSize) * 100, 1);
    if (concentrationPercent >= 60) {
      hints.push({
        level: 'warning',
        title: 'Size concentration',
        message: `Position value uses ${concentrationPercent}% of account size.`,
      });
    }
  }

  if (sizeCappedByPositionValue || sizeCappedByFloat) {
    const capReasons = [];
    if (sizeCappedByPositionValue) capReasons.push('max position value');
    if (sizeCappedByFloat) capReasons.push('float liquidity');
    hints.push({
      level: 'info',
      title: 'Size constrained',
      message: `Order size was constrained by ${capReasons.join(' + ')} limits.`,
    });
  }

  return hints;
}

export function buildFloatSmartPlan({
  entryPrice,
  direction = 'long',
  shareFloat,
  floatRangeKey = 'unknown',
  floatRangeLabel = 'Unknown Float',
  settings = {},
  marketContext = {},
}) {
  const normalizedDirection = String(direction || '').trim().toLowerCase() === 'short' ? 'short' : 'long';
  const normalizedShareFloat = toPositive(shareFloat, null);
  const rangeKey = String(floatRangeKey || 'unknown').trim().toLowerCase() || 'unknown';
  const floatCategories = settings?.float_categories || {};
  const rangeConfig = floatCategories?.[rangeKey] || null;

  const positionMultiplier = toPositive(
    rangeConfig?.positionMultiplier ?? rangeConfig?.position_multiplier,
    DEFAULT_POSITION_MULTIPLIERS[rangeKey] || DEFAULT_POSITION_MULTIPLIERS.unknown
  );

  const categoryStopPercent = normalizePercentFromDecimalOrPercent(
    rangeConfig?.stopLossPercent ?? rangeConfig?.stop_loss_percent,
    null
  );
  const defaultStopPct = normalizePercentFromDecimalOrPercent(
    settings?.default_stop_loss_percent,
    DEFAULT_STOP_PCT_BY_RANGE[rangeKey] || DEFAULT_STOP_PCT_BY_RANGE.unknown
  );
  const stopLossPercent = categoryStopPercent ?? defaultStopPct;
  const stopSource = categoryStopPercent != null
    ? `float category (${rangeKey})`
    : 'default_stop_loss_percent';

  const maxFloatPercent = normalizeMaxFloatPercent(
    rangeConfig?.maxFloatPercent ?? rangeConfig?.max_float_percent,
    null
  );
  const marketContextAdjustment = resolveMarketContextAdjustment(marketContext);

  const baseRiskContext = resolveBaseRiskContext(settings);
  const baseRiskAmount = baseRiskContext.value;
  const accountSize = toPositive(settings?.account_size, null);
  let riskAmount = baseRiskAmount != null
    ? round(baseRiskAmount * (positionMultiplier || 1) * (marketContextAdjustment.factor || 1), 2)
    : null;

  const capNotes = [];
  const dailyLossLimit = toPositive(settings?.max_dollars, null);
  let riskCappedByDailyLoss = false;
  if (Number.isFinite(riskAmount) && riskAmount > 0 && Number.isFinite(dailyLossLimit) && dailyLossLimit > 0 && riskAmount > dailyLossLimit) {
    riskAmount = round(dailyLossLimit, 2);
    riskCappedByDailyLoss = true;
    capNotes.push(`Risk capped by max daily loss setting (${Math.round(dailyLossLimit).toLocaleString()}).`);
  }

  const numericEntryPrice = toPositive(entryPrice, null);
  const stopPrice = getDirectionalStopPrice(numericEntryPrice, normalizedDirection, stopLossPercent);
  const riskPerShare = (
    Number.isFinite(numericEntryPrice) &&
    Number.isFinite(stopPrice)
  )
    ? Math.abs(numericEntryPrice - stopPrice)
    : null;

  let positionSize = (
    Number.isFinite(riskAmount) &&
    riskAmount > 0 &&
    Number.isFinite(riskPerShare) &&
    riskPerShare > 0
  )
    ? Math.floor(riskAmount / riskPerShare)
    : null;

  const maxPositionValue = toPositive(
    settings?.max_position_value ?? settings?.max_position_dollars,
    null
  );
  let sizeCappedByPositionValue = false;
  if (Number.isFinite(positionSize) && positionSize > 0 && Number.isFinite(maxPositionValue) && maxPositionValue > 0 && Number.isFinite(numericEntryPrice) && numericEntryPrice > 0) {
    const maxByPositionValue = Math.max(1, Math.floor(maxPositionValue / numericEntryPrice));
    if (positionSize > maxByPositionValue) {
      positionSize = maxByPositionValue;
      sizeCappedByPositionValue = true;
      capNotes.push(`Size capped by max position value (${Math.round(maxPositionValue).toLocaleString()}).`);
    }
  }

  let sizeCappedByFloat = false;
  if (
    Number.isFinite(positionSize) &&
    positionSize > 0 &&
    Number.isFinite(normalizedShareFloat) &&
    normalizedShareFloat > 0 &&
    Number.isFinite(maxFloatPercent) &&
    maxFloatPercent > 0
  ) {
    const maxByFloat = Math.max(1, Math.floor(normalizedShareFloat * (maxFloatPercent / 100)));
    if (positionSize > maxByFloat) {
      positionSize = maxByFloat;
      sizeCappedByFloat = true;
      capNotes.push(`Size capped by float liquidity limit (${maxFloatPercent}% of float).`);
    }
  }

  if (Number.isFinite(positionSize) && positionSize > 0) {
    positionSize = Math.max(1, Math.floor(positionSize));
  } else {
    positionSize = null;
  }

  const rangeTargets = DEFAULT_TARGET_R_BY_RANGE[rangeKey] || DEFAULT_TARGET_R_BY_RANGE.unknown;
  const targetFields = resolveFloatTargetFields(normalizedShareFloat);
  const minR = toPositive(settings?.[targetFields.minField], rangeTargets.minR);
  const maxR = toPositive(settings?.[targetFields.maxField], rangeTargets.maxR);
  const baseMinR = Math.min(minR, maxR);
  const baseMaxR = Math.max(minR, maxR);
  const realisticMaxMovePct = resolveRealisticMovePercent(rangeKey, marketContext);
  const maxRByMove = (
    Number.isFinite(stopLossPercent) &&
    stopLossPercent > 0
  )
    ? round(realisticMaxMovePct / stopLossPercent, 2)
    : null;
  const rCappedByMove = Number.isFinite(maxRByMove) && maxRByMove > 0 && maxRByMove < baseMaxR;
  const safeMaxR = Number.isFinite(maxRByMove) && maxRByMove > 0
    ? Math.min(baseMaxR, maxRByMove)
    : baseMaxR;
  const safeMinR = Math.min(baseMinR, safeMaxR);
  const preferredR = round((safeMinR + safeMaxR) / 2, 2);
  const targetPrice = getDirectionalTargetPrice(numericEntryPrice, normalizedDirection, riskPerShare, preferredR);
  const potentialProfit = (
    Number.isFinite(positionSize) &&
    positionSize > 0 &&
    Number.isFinite(riskPerShare) &&
    riskPerShare > 0 &&
    Number.isFinite(preferredR)
  )
    ? round(positionSize * riskPerShare * preferredR, 2)
    : null;
  const positionValue = (
    Number.isFinite(positionSize) &&
    positionSize > 0 &&
    Number.isFinite(numericEntryPrice) &&
    numericEntryPrice > 0
  )
    ? round(positionSize * numericEntryPrice, 2)
    : null;

  const exitLevels = buildExitLevels({
    minR: safeMinR,
    maxR: safeMaxR,
    entryPrice: numericEntryPrice,
    direction: normalizedDirection,
    riskPerShare,
    settingsExitLevels: settings?.exit_strategy?.levels,
  });

  const guidance = [
    `Float bucket: ${floatRangeLabel || rangeKey}.`,
    `Use ${safeMinR}R-${safeMaxR}R target zone for this float profile (realistic move cap ~${realisticMaxMovePct}%).`,
  ];
  if (rCappedByMove) {
    guidance.push(`Exit R capped to ${safeMaxR} to avoid unrealistic targets for current stop/move conditions.`);
  }
  if (capNotes.length > 0) guidance.push(...capNotes);
  if (marketContextAdjustment.notes.length > 0) guidance.push(...marketContextAdjustment.notes);
  const basis = {
    riskSource: baseRiskContext.source,
    riskCappedByDailyLoss,
    dailyLossLimit: Number.isFinite(dailyLossLimit) ? round(dailyLossLimit, 2) : null,
    stopSource,
    configuredMinR: round(baseMinR, 2),
    configuredMaxR: round(baseMaxR, 2),
    finalMinR: round(safeMinR, 2),
    finalMaxR: round(safeMaxR, 2),
    realisticMaxMovePercent: realisticMaxMovePct,
    maxRByMove: Number.isFinite(maxRByMove) && maxRByMove > 0 ? round(maxRByMove, 2) : null,
    rCappedByMove,
    sizeCappedByPositionValue,
    sizeCappedByFloat,
  };
  const guardrails = buildGuardrails({
    rangeKey,
    stopLossPercent,
    positionSize,
    positionValue,
    accountSize,
    sizeCappedByPositionValue,
    sizeCappedByFloat,
  });

  return {
    hasFloatData: Number.isFinite(normalizedShareFloat) && normalizedShareFloat > 0,
    canApply:
      Number.isFinite(numericEntryPrice) &&
      numericEntryPrice > 0 &&
      Number.isFinite(stopPrice) &&
      stopPrice > 0 &&
      Number.isFinite(positionSize) &&
      positionSize > 0,
    float: {
      shareFloat: normalizedShareFloat,
      rangeKey,
      rangeLabel: floatRangeLabel || rangeKey,
    },
    recommendations: {
      entryPrice: Number.isFinite(numericEntryPrice) ? round(numericEntryPrice, 4) : null,
      baseRiskAmount: baseRiskAmount == null ? null : round(baseRiskAmount, 2),
      riskAmount,
      positionMultiplier,
      stopLossPercent: stopLossPercent == null ? null : round(stopLossPercent, 2),
      stopPrice: Number.isFinite(stopPrice) ? round(stopPrice, 2) : null,
      riskPerShare: Number.isFinite(riskPerShare) ? round(riskPerShare, 4) : null,
      positionSize,
      minR: round(safeMinR, 2),
      maxR: round(safeMaxR, 2),
      preferredR,
      targetPrice: Number.isFinite(targetPrice) ? round(targetPrice, 2) : null,
      positionValue,
      potentialProfit,
      maxFloatPercent: Number.isFinite(maxFloatPercent) ? round(maxFloatPercent, 3) : null,
      marketContextFactor: marketContextAdjustment.factor,
      realisticMaxMovePercent: realisticMaxMovePct,
      moveCappedMaxR: Number.isFinite(maxRByMove) && maxRByMove > 0 ? round(maxRByMove, 2) : null,
    },
    basis,
    guardrails,
    exitLevels,
    guidance,
  };
}
