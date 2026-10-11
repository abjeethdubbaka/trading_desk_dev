/**
 * @file src/lib/reviews/autofill.js
 *
 * The Daily Report Card's answers that the day already knows: from what
 * Trading Guardian saw on Trade Terminal, the trades logged in the journal,
 * and the morning's check-in. Each suggestion carries the reason for it, so
 * a pre-filled answer is something to confirm, not something to trust
 * blindly. Questions only the trader can answer — the plan, the reflections,
 * the score — are left alone.
 *
 * Pure module: no React, no database.
 */

const FORCED_WINDOW_MS = 2 * 60 * 1000;

const money = (n) => `${n < 0 ? '-' : '+'}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
const pnlOf = (trade) => {
  const value = Number(trade?.pnl ?? trade?.total_pnl);
  return Number.isFinite(value) ? value : 0;
};

function eventsOf(guardianDay) {
  return Array.isArray(guardianDay?.events) ? guardianDay.events : [];
}

const has = (events, test) => events.some((event) => test(String(event.key || '')));
const isCooldownBreak = (key) => key.startsWith('cooldown_');
const isLossLogged = (key) => key === 'cooldown' || key === 'loss';
const isPastMaxTrades = (key) => key === 'max_trades_position_open' || key === 'max_trades_reached';
const isGivebackAlert = (key) => key === 'giveback' || key === 'giveback_position_open';

/** The first option in a list whose wording contains any of the stems. */
function findOption(options, stems) {
  const list = Array.isArray(options) ? options : [];
  return list.find((option) => {
    const text = String(option || '').toLowerCase();
    return stems.some((stem) => text.includes(stem));
  }) || null;
}

/**
 * @param {object} input
 * @param {object|null} input.guardianDay  Guardian's record of today (events, peak, lock)
 * @param {number|null} input.dailyPnl     today's P&L as Guardian reads it now
 * @param {object|null} input.brief        today's Morning Brief (sleep, focus, …)
 * @param {object[]}    input.trades       today's logged trades
 * @param {string[]}    input.mistakeOptions
 * @param {string[]}    input.setupOptions
 * @returns {Record<string, { value: *, reason: string }>}
 */
export function suggestReportCard({
  guardianDay = null,
  dailyPnl = null,
  brief = null,
  trades = [],
  mistakeOptions = [],
  setupOptions = [],
} = {}) {
  const out = {};
  const events = eventsOf(guardianDay);
  const list = Array.isArray(trades) ? trades : [];

  // ── Risk and discipline, from Guardian ───────────────────────────────────
  if (guardianDay) {
    const broke = [
      has(events, (k) => k === 'max_trades_position_open') && 'traded past your max trades',
      has(events, (k) => k === 'hard_position_open') && 'traded past the hard loss limit',
      has(events, (k) => k === 'final_loss_warning') && 'let the final trade run past its loss limit',
      has(events, (k) => k === 'giveback_position_open') && 'kept a trade open after giving back the green day',
    ].filter(Boolean);
    out.followed_risk_plan = broke.length > 0
      ? { value: false, reason: `Guardian saw you ${broke.join(', ')}.` }
      : { value: true, reason: 'Guardian saw no risk limit broken today.' };

    if (has(events, isPastMaxTrades)) {
      out.traded_off_plan = { value: true, reason: 'Trades taken past your max trades for the day.' };
    }

    if (has(events, isCooldownBreak)) {
      const breaks = events.filter((e) => isCooldownBreak(String(e.key || ''))).length;
      out.worse_after_loss = { value: true, reason: `${breaks} trade${breaks === 1 ? '' : 's'} opened inside the cooldown after a loss.` };
    } else if (has(events, isLossLogged)) {
      out.worse_after_loss = { value: false, reason: 'Losses today, and every next trade waited out the cooldown.' };
    }

    const peak = Number(guardianDay.peak_daily_pnl);
    if (has(events, isGivebackAlert)) {
      out.gave_back_profits = { value: true, reason: 'Guardian warned you were giving back the green day.' };
    } else if (Number.isFinite(peak) && dailyPnl != null && Number.isFinite(dailyPnl)) {
      if (peak <= 0) {
        out.gave_back_profits = { value: false, reason: 'Never green today, so nothing to give back.' };
      } else if (dailyPnl <= peak / 2) {
        out.gave_back_profits = { value: true, reason: `Peaked at ${money(peak)}, now ${money(dailyPnl)}.` };
      } else {
        out.gave_back_profits = { value: false, reason: `Peaked at ${money(peak)} and kept ${money(dailyPnl)}.` };
      }
    }
  }

  // ── Tiredness, from the Morning Brief ────────────────────────────────────
  if (brief) {
    const sleep = Number(brief.sleep);
    const focus = Number(brief.focus);
    const tired = (Number.isFinite(sleep) && sleep <= 3) || (Number.isFinite(focus) && focus <= 3);
    const rested = Number.isFinite(sleep) && Number.isFinite(focus) && sleep >= 6 && focus >= 6;
    const roughDay = (dailyPnl != null && dailyPnl < 0)
      || out.followed_risk_plan?.value === false
      || out.worse_after_loss?.value === true;
    if (tired && roughDay) {
      out.worse_when_tired = { value: true, reason: `Morning Brief: sleep ${sleep}/10, focus ${focus}/10, and the day went badly.` };
    } else if (rested) {
      out.worse_when_tired = { value: false, reason: `Morning Brief: sleep ${sleep}/10, focus ${focus}/10.` };
    }
  }

  // ── The day's trades, from the journal ───────────────────────────────────
  if (list.length > 0) {
    const sorted = [...list].sort((a, b) => pnlOf(b) - pnlOf(a));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (pnlOf(best) > 0) out.best_trade_id = { value: String(best.id), reason: `Largest win today, ${money(pnlOf(best))}.` };
    if (pnlOf(worst) < 0) out.worst_trade_id = { value: String(worst.id), reason: `Largest loss today, ${money(pnlOf(worst))}.` };

    // A trade opened right as Guardian flagged a cooldown break or a trade
    // past the limit is the one that was forced.
    const flagged = events.filter((e) => isCooldownBreak(String(e.key || '')) || String(e.key) === 'max_trades_position_open');
    const forced = flagged
      .map((event) => {
        const at = Date.parse(event.at);
        return list.find((trade) => {
          const entry = Date.parse(trade.entry_time);
          return Number.isFinite(entry) && Number.isFinite(at) && Math.abs(entry - at) <= FORCED_WINDOW_MS;
        });
      })
      .find(Boolean);
    if (forced) {
      out.forced_trade_id = { value: String(forced.id), reason: 'Opened as Guardian flagged a cooldown break or a trade past the limit.' };
    }

    const bySetup = new Map();
    for (const trade of list) {
      const setup = String(trade.setup_type || '').trim();
      if (setup) bySetup.set(setup, (bySetup.get(setup) || 0) + pnlOf(trade));
    }
    const [topSetup, topPnl] = [...bySetup.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    if (topSetup && topPnl > 0 && setupOptions.includes(topSetup)) {
      out.setup_that_worked = { value: topSetup, reason: `Best setup today, ${money(topPnl)}.` };
    }

    const mistakes = new Map();
    for (const trade of list) {
      for (const mistake of Array.isArray(trade.mistakes) ? trade.mistakes : []) {
        const key = String(mistake || '').trim();
        if (key) mistakes.set(key, (mistakes.get(key) || 0) + 1);
      }
    }
    const [topMistake, count] = [...mistakes.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    if (topMistake && count >= 2 && mistakeOptions.includes(topMistake)) {
      out.repeated_mistake = { value: topMistake, reason: `Tagged on ${count} trades today.` };
    }
  }

  // ── The biggest mistake Guardian could name ──────────────────────────────
  const named = [
    has(events, isPastMaxTrades) && { stems: ['overtrad', 'too many trade'], reason: 'Traded past your max trades.' },
    has(events, isCooldownBreak) && { stems: ['revenge'], reason: 'Traded inside the cooldown after a loss.' },
    has(events, isGivebackAlert) && { stems: ['gave back', 'give back', 'giving back'], reason: 'Gave back the green day.' },
  ].filter(Boolean);
  for (const candidate of named) {
    const option = findOption(mistakeOptions, candidate.stems);
    if (option) {
      out.biggest_mistake = { value: option, reason: candidate.reason };
      break;
    }
  }

  return out;
}

/** True when a field holds no answer yet, so a suggestion may fill it. */
export function isUnanswered(value) {
  return value === null || value === undefined || value === '';
}
