/**
 * @file public/guardian/alerts.cjs
 *
 * Trade Terminal's own alerts — "META VWAP REJ SHORT TRIGGERED @ 719.60 |
 * 09:55 ET" — turned into triggers that can be filed under a Playbook
 * strategy and judged later.
 *
 * The text arrives through OCR, so it is read forgivingly: the setup words
 * are often mangled ("W{AP REJ", "WÆP REJ", or just "REJ"), a "|" can come
 * back as "1", and the Date column rarely reads at all. Symbol, direction,
 * price and the ET time read reliably, so those make a trigger and identify
 * it; the setup text is kept as read, for matching.
 *
 * Pure CommonJS module: no Electron, no filesystem.
 */

const LINE_PATTERN = new RegExp(
  '^\\s*'
  + '([A-Z][A-Z0-9.]{0,9})\\s+' // symbol
  + '(.*?)\\s*' // setup words, as read
  + '\\b(LONG|SHORT)\\b\\s*' // direction
  + '(?:TRIGGERED|TRIGGER|TRIG\\w*)?\\s*' // the word itself
  + '(?:[@©®]|\\(a\\))?\\s*' // "@", however it came out
  + '\\$?(\\d[\\d,]*(?:\\.\\d+)?)\\s*' // price
  + '[|Il1!/\\\\]?\\s*' // the separator
  + '(\\d{1,2})[:.](\\d{2})\\s*E[TS]', // time, Eastern
  'i',
);

/** The setup words as a readable label: OCR clutter removed, spacing kept. */
function cleanSetupText(text) {
  return String(text || '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** One alert line → a trigger, or null when the line is not an alert. */
function parseAlertLine(line) {
  const match = String(line || '').match(LINE_PATTERN);
  if (!match) return null;
  const [, symbol, setup, direction, priceText, hour, minute] = match;
  const price = Number(priceText.replace(/,/g, ''));
  const hh = Number(hour);
  const mm = Number(minute);
  if (!Number.isFinite(price) || price <= 0 || hh > 23 || mm > 59) return null;
  return {
    symbol: symbol.toUpperCase(),
    setupText: cleanSetupText(setup),
    setupRaw: String(setup || '').trim(),
    direction: direction.toLowerCase(),
    price,
    timeEt: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    raw: String(line).trim(),
  };
}

/**
 * Every trigger in an alert window's text, deduplicated — the headline
 * repeats the newest history row. Rows timed after `nowMinutes` (Eastern)
 * belong to an earlier day still in the history, and are left out.
 */
function parseAlertWindow(text, { dateKey, nowMinutes = 24 * 60 } = {}) {
  const seen = new Set();
  const triggers = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const trigger = parseAlertLine(line);
    if (!trigger) continue;
    const [hh, mm] = trigger.timeEt.split(':').map(Number);
    if (hh * 60 + mm > nowMinutes + 2) continue;
    const id = triggerId(dateKey, trigger);
    if (seen.has(id)) continue;
    seen.add(id);
    triggers.push({ ...trigger, id, date: dateKey });
  }
  return triggers;
}

/**
 * A stable id: the same alert read twice, or by two windows, is one
 * trigger. The setup text is left out — it reads differently each time.
 */
function triggerId(dateKey, trigger) {
  const price = String(trigger.price).replace('.', '_');
  return `${dateKey}_${trigger.timeEt.replace(':', '')}_${trigger.symbol}_${trigger.direction}_${price}`;
}

module.exports = { parseAlertLine, parseAlertWindow, cleanSetupText, triggerId };
