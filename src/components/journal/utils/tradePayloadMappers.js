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
