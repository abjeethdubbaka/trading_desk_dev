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
  tags: ['tags', 'tag'],
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

const parseDateToIso = (value) => {
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
  const monthDayWithTime =
    /^[A-Za-z]{3,9}\s+\d{1,2}\s+\d{1,2}:\d{2}(\s*[AaPp][Mm])?$/;
  if (monthDayWithTime.test(raw)) {
    normalized = `${raw} ${new Date().getFullYear()}`;
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

const mapRowToTrade = (row, defaultAccountTier) => {
  const symbol = getFirstValue(row, FIELD_ALIASES.symbol).toUpperCase().trim();
  const entryPrice = parseNumber(getFirstValue(row, FIELD_ALIASES.entry_price));
  const exitPrice = parseNumber(getFirstValue(row, FIELD_ALIASES.exit_price));
  const rawQuantity = parseNumber(getFirstValue(row, FIELD_ALIASES.quantity));
  const quantity = rawQuantity === null ? null : Math.trunc(rawQuantity);

  let entryTime = parseDateToIso(getFirstValue(row, FIELD_ALIASES.entry_time));
  let exitTime = parseDateToIso(getFirstValue(row, FIELD_ALIASES.exit_time));

  const tradeDate = getFirstValue(row, FIELD_ALIASES.trade_date);
  const entryClock = getFirstValue(row, FIELD_ALIASES.entry_clock);
  const exitClock = getFirstValue(row, FIELD_ALIASES.exit_clock);

  if (!entryTime && tradeDate && entryClock) {
    entryTime = parseDateToIso(`${tradeDate} ${entryClock}`);
  }
  if (!entryTime && tradeDate) {
    entryTime = parseDateToIso(tradeDate);
  }
  if (!exitTime && tradeDate && exitClock) {
    exitTime = parseDateToIso(`${tradeDate} ${exitClock}`);
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
  const tags = parseList(getFirstValue(row, FIELD_ALIASES.tags));
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
  if (tags.length > 0) trade.tags = tags;

  const validation = validateTrade(trade);
  if (!validation.isValid) {
    return { trade: null, error: validation.errors.join(', ') };
  }

  return { trade, error: null };
};

export function parseTradesCsv(csvText, options = {}) {
  const { defaultAccountTier = 'custom' } = options;
  const rows = parseCsvRows(csvText);

  if (rows.length <= 1) {
    return {
      trades: [],
      errors: [],
      totalRows: 0,
    };
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => String(header || ''));

  const trades = [];
  const errors = [];
  let totalRows = 0;

  dataRows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const row = toRowObject(headers, rawRow);
    const hasValues = Object.values(row).some((value) => String(value || '').trim() !== '');

    if (!hasValues) return;

    totalRows += 1;
    const { trade, error } = mapRowToTrade(row, defaultAccountTier);

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
}
