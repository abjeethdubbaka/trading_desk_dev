import { getTradeNotesText } from './notes';

const parseNumber = (value) => {
  if (value === '' || value == null) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[$,%\s]/g, '').replace(/,/g, '');
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toPositiveNumber = (value, fallback = 0) => {
  const parsed = parseNumber(value);
  return parsed != null && parsed > 0 ? parsed : fallback;
};

const toOptionalNumber = (value) => parseNumber(value);

const toIsoStringOrNow = (value) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const normalizeString = (value) => String(value ?? '').trim();

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item ?? '').trim()).filter(Boolean))];
  }

  if (value === '' || value == null) return [];

  const single = String(value).trim();
  return single ? [single] : [];
};

const toSerializableObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  try {
    const parsed = JSON.parse(JSON.stringify(value));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export function normalizeDuplicateTrade(trade) {
  const symbol = normalizeString(trade?.symbol ?? trade?.ticker).toUpperCase();
  const entryPrice = toPositiveNumber(trade?.entry_price ?? trade?.entryPrice ?? trade?.entry, 0);
  const quantity = toPositiveNumber(trade?.quantity ?? trade?.position_size ?? trade?.shares, 0);
  const positionSize = toPositiveNumber(
    trade?.position_size ?? trade?.quantity ?? trade?.shares,
    quantity || 0
  );
  const direction = normalizeString(trade?.direction).toLowerCase() === 'short' ? 'short' : 'long';
  const entryTime = toIsoStringOrNow(trade?.entry_time ?? trade?.created_date);
  const commission = toOptionalNumber(trade?.commission ?? trade?.fee);

  return {
    symbol,
    entry_price: entryPrice,
    quantity,
    position_size: positionSize || quantity,
    direction,
    entry_time: entryTime,
    exit_time: null,
    exit_price: null,
    hold_duration_minutes: null,
    pnl: 0,
    pnl_percent: 0,
    r_multiple: null,
    total_pnl: 0,
    gross_pnl: 0,
    screenshots: [],
    screenshot_url: null,
    setup_type: normalizeString(trade?.setup_type),
    custom_setup_type: normalizeString(trade?.custom_setup_type),
    stop_loss: toOptionalNumber(trade?.stop_loss),
    target_price: toOptionalNumber(trade?.target_price),
    commission: commission ?? 0,
    fee: toOptionalNumber(trade?.fee),
    risk_amount: toOptionalNumber(trade?.risk_amount),
    position_size_percent: toOptionalNumber(trade?.position_size_percent),
    risk_reward_ratio: toOptionalNumber(trade?.risk_reward_ratio),
    market_condition: normalizeString(trade?.market_condition),
    float_category: normalizeString(trade?.float_category),
    share_float: toOptionalNumber(trade?.share_float),
    share_float_range: normalizeString(trade?.share_float_range),
    sector: normalizeString(trade?.sector),
    news_impact: normalizeString(trade?.news_impact),
    notes: getTradeNotesText(trade),
    lessons: normalizeString(trade?.lessons),
    setup_grade: normalizeString(trade?.setup_grade),
    tags: normalizeStringArray(trade?.tags),
    mistakes: normalizeStringArray(trade?.mistakes),
    trade_mistakes: normalizeStringArray(trade?.trade_mistakes),
    trade_successes: normalizeStringArray(trade?.trade_successes),
    emotions: normalizeStringArray(trade?.emotions),
    followed_plan: Boolean(trade?.followed_plan ?? true),
    plan_rating: toOptionalNumber(trade?.plan_rating),
    entry_quality: toOptionalNumber(trade?.entry_quality),
    exit_quality: toOptionalNumber(trade?.exit_quality),
    reflection_answers: toSerializableObject(trade?.reflection_answers),
    breakout_checklist: toSerializableObject(trade?.breakout_checklist),
    trade_plan_id: trade?.trade_plan_id ?? null,
    strategy_preset_id: trade?.strategy_preset_id ?? null,
    dos_donts_rule_ids: normalizeStringArray(trade?.dos_donts_rule_ids),
  };
}

export function buildMinimalDuplicateTrade(trade) {
  const symbol = normalizeString(trade?.symbol ?? trade?.ticker).toUpperCase();
  const entryPrice = toPositiveNumber(trade?.entry_price ?? trade?.entryPrice ?? trade?.entry, 0);
  const quantity = toPositiveNumber(trade?.quantity ?? trade?.position_size ?? trade?.shares, 0);

  return {
    symbol,
    entry_price: entryPrice,
    quantity,
    position_size: quantity,
    direction: normalizeString(trade?.direction).toLowerCase() === 'short' ? 'short' : 'long',
    entry_time: toIsoStringOrNow(trade?.entry_time ?? trade?.created_date),
    notes: getTradeNotesText(trade),
    emotions: normalizeStringArray(trade?.emotions),
    followed_plan: Boolean(trade?.followed_plan ?? true),
    screenshots: [],
    screenshot_url: null,
  };
}

export function buildInlineUpdatePayload(trade, changes) {
  const nextSymbol = String(changes?.symbol ?? trade?.symbol ?? '').trim().toUpperCase();
  const nextEntryPrice = toPositiveNumber(changes?.entry_price ?? trade?.entry_price, 0);
  const nextQuantity = toPositiveNumber(
    changes?.quantity ?? changes?.position_size ?? trade?.quantity ?? trade?.position_size,
    0
  );

  const payload = {
    symbol: nextSymbol,
    entry_price: nextEntryPrice,
    quantity: nextQuantity,
    entry_time: toIsoStringOrNow(changes?.entry_time ?? trade?.entry_time ?? trade?.created_date),
    ...changes,
  };

  if (Object.prototype.hasOwnProperty.call(changes, 'position_size')) {
    payload.position_size = toPositiveNumber(changes.position_size, nextQuantity);
    payload.quantity = toPositiveNumber(changes.position_size, nextQuantity);
  } else if (trade?.position_size != null) {
    payload.position_size = toPositiveNumber(trade.position_size, nextQuantity);
  }

  if (Object.prototype.hasOwnProperty.call(changes, 'entry_price')) {
    payload.entry_price = toPositiveNumber(changes.entry_price, nextEntryPrice);
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'exit_price')) {
    payload.exit_price = toOptionalNumber(changes.exit_price);
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'notes')) {
    payload.notes = String(changes.notes ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'setup_type')) {
    payload.setup_type = String(changes.setup_type ?? '').trim();
  }

  return payload;
}
