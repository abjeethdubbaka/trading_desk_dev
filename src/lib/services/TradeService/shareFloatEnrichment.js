/**
 * @file src/lib/services/TradeService/shareFloatEnrichment.js
 *
 * Auto-enrich share float using Polygon data when trades do not include it.
 */

import { PolygonClient } from '../../../api/polygonClient.js';

const polygonClient = new PolygonClient();

const SHARE_FLOAT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_FALLBACK_SHARE_FLOAT = 100_000_000;
const SHARE_FLOAT_DEBUG_KEY = 'debug.shareFloatEnrichment';
const shareFloatCache = new Map();

function isShareFloatDebugEnabled() {
  if (typeof window === 'undefined') return false;

  try {
    const explicitFlag = window.localStorage?.getItem(SHARE_FLOAT_DEBUG_KEY);
    if (explicitFlag === '1') return true;
    if (explicitFlag === '0') return false;
  } catch {
    // Ignore localStorage access errors.
  }

  return Boolean(import.meta?.env?.DEV);
}

function logShareFloat(stage, payload = {}) {
  if (!isShareFloatDebugEnabled()) return;
  console.info(`[ShareFloat][${stage}]`, payload);
}

function parseNumber(value) {
  if (value == null) return null;
  const normalized = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function estimateFloatFromMarketCap(marketCap) {
  if (!Number.isFinite(marketCap) || marketCap <= 0) return null;
  if (marketCap > 1_000_000_000_000) return 15_000_000_000;
  if (marketCap > 500_000_000_000) return 5_000_000_000;
  if (marketCap > 100_000_000_000) return 1_500_000_000;
  if (marketCap > 20_000_000_000) return 500_000_000;
  return 30_000_000;
}

function normalizeSymbol(symbol) {
  return String(symbol || '').trim().toUpperCase();
}

function getCachedShareFloat(symbol) {
  const entry = shareFloatCache.get(symbol);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > SHARE_FLOAT_CACHE_TTL_MS) {
    shareFloatCache.delete(symbol);
    return null;
  }

  return entry.shareFloat;
}

function setCachedShareFloat(symbol, shareFloat) {
  shareFloatCache.set(symbol, {
    shareFloat,
    timestamp: Date.now(),
  });
}

function hasShareFloatValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

export async function fetchShareFloatFromPolygon(symbol) {
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!normalizedSymbol) return null;

  const cachedShareFloat = getCachedShareFloat(normalizedSymbol);
  if (cachedShareFloat != null) {
    logShareFloat('cache_hit', { symbol: normalizedSymbol, shareFloat: cachedShareFloat });
    return cachedShareFloat;
  }

  logShareFloat('fetch_start', { symbol: normalizedSymbol });
  const polygonData = await polygonClient.getStockData(normalizedSymbol);
  logShareFloat('fetch_result', {
    symbol: normalizedSymbol,
    hasError: Boolean(polygonData?.error),
    error: polygonData?.error || null,
    hasSharesOutstanding: Boolean(
      parseNumber(polygonData?.share_class_shares_outstanding ?? polygonData?.outstanding_shares)
    ),
    hasMarketCap: Boolean(parseNumber(polygonData?.market_cap ?? polygonData?.market_capitalization)),
  });

  const sharesOutstanding = parseNumber(
    polygonData?.share_class_shares_outstanding ?? polygonData?.outstanding_shares
  );

  if (Number.isFinite(sharesOutstanding) && sharesOutstanding > 0) {
    const actualShareFloat = Math.round(sharesOutstanding * 0.75);
    setCachedShareFloat(normalizedSymbol, actualShareFloat);
    logShareFloat('resolved_from_ticker_overview', {
      symbol: normalizedSymbol,
      sharesOutstanding,
      shareFloat: actualShareFloat,
    });
    return actualShareFloat;
  }

  const sharesOutstandingFromFinancials = parseNumber(
    await polygonClient.getSharesOutstanding(normalizedSymbol)
  );
  if (Number.isFinite(sharesOutstandingFromFinancials) && sharesOutstandingFromFinancials > 0) {
    const actualShareFloat = Math.round(sharesOutstandingFromFinancials * 0.75);
    setCachedShareFloat(normalizedSymbol, actualShareFloat);
    logShareFloat('resolved_from_financials', {
      symbol: normalizedSymbol,
      sharesOutstanding: sharesOutstandingFromFinancials,
      shareFloat: actualShareFloat,
    });
    return actualShareFloat;
  }

  const marketCap = parseNumber(polygonData?.market_cap ?? polygonData?.market_capitalization);
  const estimatedShareFloat = estimateFloatFromMarketCap(marketCap);
  if (estimatedShareFloat != null) {
    setCachedShareFloat(normalizedSymbol, estimatedShareFloat);
    logShareFloat('resolved_from_market_cap_estimate', {
      symbol: normalizedSymbol,
      marketCap,
      shareFloat: estimatedShareFloat,
    });
    return estimatedShareFloat;
  }

  // Match calculator behavior: if API doesn't provide enough signal, use
  // a conservative default so journal-created trades still get float context.
  setCachedShareFloat(normalizedSymbol, DEFAULT_FALLBACK_SHARE_FLOAT);
  logShareFloat('resolved_from_default_fallback', {
    symbol: normalizedSymbol,
    shareFloat: DEFAULT_FALLBACK_SHARE_FLOAT,
    reason: polygonData?.error || 'insufficient_polygon_fields',
  });
  return DEFAULT_FALLBACK_SHARE_FLOAT;
}

export async function hydrateTradeShareFloat(trade) {
  if (!trade) return trade;
  if (hasShareFloatValue(trade.share_float)) {
    logShareFloat('hydrate_skip_existing', {
      symbol: normalizeSymbol(trade.symbol),
      shareFloat: Number(trade.share_float),
    });
    return trade;
  }

  const normalizedSymbol = normalizeSymbol(trade.symbol);
  if (!normalizedSymbol) {
    logShareFloat('hydrate_skip_missing_symbol', { symbol: trade?.symbol ?? null });
    return trade;
  }

  const fetchedShareFloat = await fetchShareFloatFromPolygon(normalizedSymbol);
  if (!hasShareFloatValue(fetchedShareFloat)) {
    logShareFloat('hydrate_skip_unresolved', { symbol: normalizedSymbol, fetchedShareFloat });
    return trade;
  }

  const normalizedShareFloat = Math.round(Number(fetchedShareFloat));
  logShareFloat('hydrate_success', {
    symbol: normalizedSymbol,
    shareFloat: normalizedShareFloat,
  });

  return {
    ...trade,
    symbol: normalizedSymbol,
    share_float: normalizedShareFloat,
  };
}

export function shouldResetShareFloatForSymbolChange(existingTrade, changes, mergedTrade) {
  const existingSymbol = normalizeSymbol(existingTrade?.symbol);
  const mergedSymbol = normalizeSymbol(mergedTrade?.symbol);
  const symbolChanged = existingSymbol && mergedSymbol && existingSymbol !== mergedSymbol;

  if (!symbolChanged) return false;

  const hasExplicitShareFloatFields =
    Object.prototype.hasOwnProperty.call(changes, 'share_float') ||
    Object.prototype.hasOwnProperty.call(changes, 'float_category') ||
    Object.prototype.hasOwnProperty.call(changes, 'share_float_range');

  return !hasExplicitShareFloatFields;
}
