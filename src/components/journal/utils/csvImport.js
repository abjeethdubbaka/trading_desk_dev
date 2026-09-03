import { validateTrade } from '@/lib/validation/trades';

const FIELD_ALIASES = Object.freeze({
  symbol: ['symbol', 'ticker', 'stock', 'stock_symbol', 'ticker_symbol'],
  direction: ['direction', 'side', 'position', 'trade_direction'],
  entry_price: ['entry_price', 'entry', 'entryprice', 'entry_px', 'buy_price', 'open_price', 'avg_entry'],
  exit_price: ['exit_price', 'exit', 'exitprice', 'exit_px', 'sell_price', 'close_price', 'avg_exit'],
  quantity: ['quantity', 'qty', 'shares', 'share_size', 'position_size', 'size'],
  entry_time: ['entry_time', 'entry_datetime', 'entry_date', 'opened_at', 'open_time', 'open_date', 'open_datetime'],
  exit_time: ['exit_time', 'exit_datetime', 'exit_date', 'closed_at', 'close_time', 'close_date', 'close_datetime'],
  trade_date: ['date', 'trade_date', 'day'],
  entry_clock: ['entry_clock', 'entry_hour', 'entry_tm', 'entry_hhmm'],
  exit_clock: ['exit_clock', 'exit_hour', 'exit_tm', 'exit_hhmm'],
  setup_type: ['setup_type', 'setup', 'strategy', 'pattern'],
  notes: ['notes', 'note', 'comments', 'comment', 'journal'],
  stop_loss: ['stop_loss', 'stop', 'sl', 'stop_price'],
  target_price: ['target_price', 'target', 'tp', 'take_profit'],
  commission: ['commission', 'fee', 'fees'],
  pnl: ['pnl', 'p_l', 'pl', 'profit_loss', 'profit', 'net_pnl'],
  r_multiple: ['r_multiple', 'rmultiple', 'r'],
  followed_plan: ['followed_plan', 'plan_followed', 'followedplan'],
  emotions: ['emotions', 'emotion', 'mood'],
  account_tier: ['account_tier', 'account', 'tier'],
});

const DIRECTION_MAP = Object.freeze({
  long: 'long',
  buy: 'long',
  bullish: 'long',
  short: 'short',
  sell: 'short',
  bearish: 'short',
});

const PASTED_TABLE_HEADERS = Object.freeze([
  'ID',
  'Open Date',
  'Close Date',
  'Symbol',
  'Side',
  'Entry',
  'Exit',
  'Qty',
  'Fee',
  'P&L',
  'Status',
]);

const normalizeKey = (value = '') =>
  String(value)
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const parseCsvRows = (csvText = '') => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];

    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') {
        i += 1;
      }

      row.push(field);
      field = '';

      if (row.some((cell) => String(cell || '').trim() !== '')) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => String(cell || '').trim() !== '')) {
    rows.push(row);
  }

  return rows;
};

const toRowObject = (headers, row) => {
  const result = {};

  headers.forEach((header, index) => {
    const key = normalizeKey(header) || `column_${index + 1}`;
    if (!(key in result)) {
      result[key] = String(row[index] ?? '').trim();
    }
  });

  return result;
};

const getFirstValue = (row, aliases) => {
  for (const alias of aliases) {
    const key = normalizeKey(alias);
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const parseNumber = (value) => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const withoutSymbols = raw.replace(/[$,%\s]/g, '').replace(/,/g, '');
  if (!withoutSymbols) return null;

  const isParenthesizedNegative = /^\(.+\)$/.test(withoutSymbols);
  const signed = isParenthesizedNegative
    ? `-${withoutSymbols.slice(1, -1)}`
    : withoutSymbols;

  const scaled = signed.match(/^(-?\d+(\.\d+)?)([kKmM])$/);
  if (scaled) {
    const base = Number(scaled[1]);
    const factor = scaled[3].toLowerCase() === 'm' ? 1000000 : 1000;
    const result = base * factor;
    return Number.isFinite(result) ? result : null;
  }

  const parsed = Number(signed);
  return Number.isFinite(parsed) ? parsed : null;
};

const toIntegerSet = (values = []) => {
  const result = new Set();
  if (!Array.isArray(values)) return result;

  values.forEach((value) => {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      result.add(parsed);
    }
  });

  return result;
};

const JANUARY_NAMES = new Set(['jan', 'january']);

// Rollover only makes sense for early-January dates: a base year of "this year's
// December" paired with a stray "Jan 1-3" row means that row is actually next year.
// Without the month check this incorrectly bumped the 1st-3rd of every month.
const resolveMissingYear = (monthText, dayOfMonth, options = {}) => {
  const parsedBaseYear = Number(options?.missingYearBase);
  if (!Number.isFinite(parsedBaseYear)) {
    return new Date().getFullYear();
  }

  const isJanuary = JANUARY_NAMES.has(String(monthText || '').trim().toLowerCase());
  const rolloverDays = toIntegerSet(options?.missingYearRolloverDays);
  if (isJanuary && rolloverDays.has(dayOfMonth)) {
    return parsedBaseYear + 1;
  }

  return parsedBaseYear;
};

const resolveNumericYear = (yearPart, baseYear) => {
  if (!yearPart) return baseYear;
  if (yearPart.length <= 2) {
    const yy = Number(yearPart);
    return yy <= 49 ? 2000 + yy : 1900 + yy;
  }
  return Number(yearPart);
};

const parseDateToIso = (value, options = {}) => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 59 && serial < 100000) {
      const excelEpoch = Date.UTC(1899, 11, 30);
      const millis = excelEpoch + serial * 24 * 60 * 60 * 1000;
      const excelDate = new Date(millis);
      if (!Number.isNaN(excelDate.getTime())) {
        return excelDate.toISOString();
      }
    }
  }

  let normalized = raw;

  const baseYear = (() => {
    const y = Number(options?.missingYearBase);
    return Number.isFinite(y) ? y : new Date().getFullYear();
  })();

  // Numeric M/D or M/D/YY (with optional time) — use missingYearBase when year absent or 2-digit.
  const numericDateMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?:\s+(.+))?$/
  );
  // Dot-separated D.M.YY (day-first, e.g. "01.09.26" = Sep 1) — different source
  // format from the slash M/D/Y style above, so day and month are swapped.
  const dotDateMatch = raw.match(
    /^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?(?:\s+(.+))?$/
  );
  if (numericDateMatch) {
    const [, month, day, yearPart, rest] = numericDateMatch;
    const year = resolveNumericYear(yearPart, baseYear);
    normalized = `${month}/${day}/${year}${rest ? ' ' + rest : ''}`;
  } else if (dotDateMatch) {
    const [, day, month, yearPart, rest] = dotDateMatch;
    const year = resolveNumericYear(yearPart, baseYear);
    normalized = `${month}/${day}/${year}${rest ? ' ' + rest : ''}`;
  }

  const monthDayWithTimeMatch = normalized.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2})(?:,)?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)$/
  );
  const monthDayOnlyMatch = normalized.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2})(?:,)?$/
  );

  if (monthDayWithTimeMatch) {
    const [, monthText, dayText, timeText] = monthDayWithTimeMatch;
    const parsedDay = Number(dayText);
    const resolvedYear = resolveMissingYear(monthText, parsedDay, options);
    normalized = `${monthText} ${parsedDay} ${resolvedYear} ${timeText}`;
  } else if (monthDayOnlyMatch) {
    const [, monthText, dayText] = monthDayOnlyMatch;
    const parsedDay = Number(dayText);
    const resolvedYear = resolveMissingYear(monthText, parsedDay, options);
    normalized = `${monthText} ${parsedDay} ${resolvedYear}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const parseList = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw
    .split(/[;,|/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (['1', 'true', 'yes', 'y'].includes(raw)) return true;
  if (['0', 'false', 'no', 'n'].includes(raw)) return false;
  return null;
};

const normalizeDirection = (value, entryPrice, exitPrice) => {
  const raw = normalizeKey(value);
  if (raw && DIRECTION_MAP[raw]) {
    return DIRECTION_MAP[raw];
  }

  if (entryPrice !== null && exitPrice !== null) {
    return exitPrice >= entryPrice ? 'long' : 'short';
  }

  return 'long';
};

const mapRowToTrade = (row, options = {}) => {
  const defaultAccountTier = options?.defaultAccountTier || 'custom';
  const dateParseOptions = {
    missingYearBase: options?.missingYearBase,
    missingYearRolloverDays: options?.missingYearRolloverDays,
  };

  const symbol = getFirstValue(row, FIELD_ALIASES.symbol).toUpperCase().trim();
  const entryPrice = parseNumber(getFirstValue(row, FIELD_ALIASES.entry_price));
  const exitPrice = parseNumber(getFirstValue(row, FIELD_ALIASES.exit_price));
  const rawQuantity = parseNumber(getFirstValue(row, FIELD_ALIASES.quantity));
  const quantity = rawQuantity === null ? null : Math.trunc(rawQuantity);

  let entryTime = parseDateToIso(getFirstValue(row, FIELD_ALIASES.entry_time), dateParseOptions);
  let exitTime = parseDateToIso(getFirstValue(row, FIELD_ALIASES.exit_time), dateParseOptions);

  const tradeDate = getFirstValue(row, FIELD_ALIASES.trade_date);
  const entryClock = getFirstValue(row, FIELD_ALIASES.entry_clock);
  const exitClock = getFirstValue(row, FIELD_ALIASES.exit_clock);

  if (!entryTime && tradeDate && entryClock) {
    entryTime = parseDateToIso(`${tradeDate} ${entryClock}`, dateParseOptions);
  }
  if (!entryTime && tradeDate) {
    entryTime = parseDateToIso(tradeDate, dateParseOptions);
  }
  if (!exitTime && tradeDate && exitClock) {
    exitTime = parseDateToIso(`${tradeDate} ${exitClock}`, dateParseOptions);
  }

  const missing = [];
  if (!symbol) missing.push('symbol');
  if (entryPrice === null || entryPrice <= 0) missing.push('entry_price');
  if (quantity === null || quantity <= 0) missing.push('quantity');
  if (!entryTime) missing.push('entry_time');

  if (missing.length > 0) {
    return { trade: null, error: `Missing or invalid ${missing.join(', ')}` };
  }

  const followedPlan = parseBoolean(getFirstValue(row, FIELD_ALIASES.followed_plan));
  const fee = parseNumber(getFirstValue(row, FIELD_ALIASES.commission));
  const pnl = parseNumber(getFirstValue(row, FIELD_ALIASES.pnl));
  const rMultiple = parseNumber(getFirstValue(row, FIELD_ALIASES.r_multiple));
  const stopLoss = parseNumber(getFirstValue(row, FIELD_ALIASES.stop_loss));
  const targetPrice = parseNumber(getFirstValue(row, FIELD_ALIASES.target_price));
  const notes = getFirstValue(row, FIELD_ALIASES.notes);
  const setupType = getFirstValue(row, FIELD_ALIASES.setup_type);
  const emotions = parseList(getFirstValue(row, FIELD_ALIASES.emotions));
  const accountTier = getFirstValue(row, FIELD_ALIASES.account_tier) || defaultAccountTier;

  const trade = {
    symbol,
    entry_price: entryPrice,
    quantity,
    position_size: quantity,
    entry_time: entryTime,
    direction: normalizeDirection(getFirstValue(row, FIELD_ALIASES.direction), entryPrice, exitPrice),
    account_tier: accountTier,
  };

  if (exitPrice !== null) trade.exit_price = exitPrice;
  if (exitTime) trade.exit_time = exitTime;
  if (stopLoss !== null) trade.stop_loss = stopLoss;
  if (targetPrice !== null) trade.target_price = targetPrice;
  if (fee !== null) {
    trade.commission = fee;
    trade.fee = fee;
  }
  if (pnl !== null) trade.pnl = pnl;
  if (rMultiple !== null) trade.r_multiple = rMultiple;
  if (followedPlan !== null) trade.followed_plan = followedPlan;
  if (setupType) trade.setup_type = setupType;
  if (notes) trade.notes = notes;
  if (emotions.length > 0) trade.emotions = emotions;

  const validation = validateTrade(trade);
  if (!validation.isValid) {
    return { trade: null, error: validation.errors.join(', ') };
  }

  return { trade, error: null };
};

const parseTradesFromRows = (headers = [], dataRows = [], options = {}) => {
  const {
    defaultAccountTier = 'custom',
    rowNumberOffset = 2,
    missingYearBase,
    missingYearRolloverDays,
  } = options;

  const normalizedHeaders = headers.map((header) => String(header || ''));

  const trades = [];
  const errors = [];
  let totalRows = 0;

  dataRows.forEach((rawRow, index) => {
    const rowNumber = index + rowNumberOffset;
    const row = toRowObject(normalizedHeaders, rawRow);
    const hasValues = Object.values(row).some((value) => String(value || '').trim() !== '');

    if (!hasValues) return;

    totalRows += 1;
    const { trade, error } = mapRowToTrade(row, {
      defaultAccountTier,
      missingYearBase,
      missingYearRolloverDays,
    });

    if (!trade) {
      errors.push({ row: rowNumber, error });
      return;
    }

    trades.push(trade);
  });

  return {
    trades,
    errors,
    totalRows,
  };
};

const parsePastedTableRows = (rawText = '') => {
  const tokens = String(rawText || '')
    .split(/[\t\r\n]+/)
    .map((token) => String(token || '').trim())
    .filter(Boolean);

  if (tokens.length < PASTED_TABLE_HEADERS.length * 2) {
    return null;
  }

  const headers = tokens.slice(0, PASTED_TABLE_HEADERS.length);
  // Order-independent: match by the set of recognized column names rather than
  // position, since exported tables don't always list columns in the same order
  // (e.g. Symbol/Side before Open Date/Close Date). Row values are already looked
  // up by header name below, so matching order doesn't matter beyond this check.
  const expectedKeys = new Set(PASTED_TABLE_HEADERS.map((header) => normalizeKey(header)));
  const headerKeys = headers.map((header) => normalizeKey(header));
  const headerMatches = headerKeys.length === expectedKeys.size
    && headerKeys.every((key) => expectedKeys.has(key));

  if (!headerMatches) {
    return null;
  }

  const rowWidth = headers.length;
  const dataTokens = tokens.slice(rowWidth);
  const rows = [];

  for (let index = 0; index < dataTokens.length; index += rowWidth) {
    const chunk = dataTokens.slice(index, index + rowWidth);
    if (chunk.length < rowWidth) break;
    rows.push(chunk);
  }

  return {
    headers,
    rows,
  };
};

export function parseTradesCsv(csvText, options = {}) {
  const rows = parseCsvRows(csvText);

  if (rows.length <= 1) {
    return {
      trades: [],
      errors: [],
      totalRows: 0,
    };
  }

  const [headerRow, ...dataRows] = rows;
  return parseTradesFromRows(headerRow, dataRows, {
    ...options,
    rowNumberOffset: 2,
  });
}

export function parseTradesPastedText(rawText, options = {}) {
  const pastedRows = parsePastedTableRows(rawText);
  if (!pastedRows) {
    return parseTradesCsv(rawText, options);
  }

  return parseTradesFromRows(pastedRows.headers, pastedRows.rows, {
    ...options,
    rowNumberOffset: 2,
  });
}
