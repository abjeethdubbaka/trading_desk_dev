import { db } from '@/lib/db';
import { createDosAndDontsService } from '@/lib/services/DosAndDontsService';

const dosAndDontsService = createDosAndDontsService(db);

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const normalizeUsageCount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.floor(numeric);
};
const appendUnique = (list, text) => {
  const normalized = normalizeText(text);
  if (!normalized) return;
  const exists = list.some((item) => normalizeText(item).toLowerCase() === normalized.toLowerCase());
  if (!exists) {
    list.push(normalized);
  }
};

const buildRuleTitle = (note, type) => {
  const cleaned = normalizeText(note);
  if (!cleaned) {
    return type === 'dont' ? "Don't Rule from Journal" : 'Do Rule from Journal';
  }

  const firstClause = cleaned.split(/[.!?]/)[0] || cleaned;
  const words = firstClause.split(' ').filter(Boolean);
  const short = words.slice(0, 8).join(' ');
  const base = short.length > 0 ? short : cleaned.slice(0, 48);
  const label = base.length > 48 ? `${base.slice(0, 45)}...` : base;

  return label;
};

export function loadDosAndDontsItems() {
  return dosAndDontsService.getItems();
}

export function saveDosAndDontsItems(items) {
  return dosAndDontsService.saveItems(items);
}

export async function addRuleFromTradeNote({ trade, type = 'do', note } = {}) {
  try {
    const normalizedType = type === 'dont' ? 'dont' : 'do';
    const noteText = normalizeText(note ?? trade?.notes);

    if (!noteText) {
      return { ok: false, reason: 'empty_note' };
    }

    const items = await loadDosAndDontsItems();
    const descriptionKey = noteText.toLowerCase();
    const duplicateItem = items.find((item) => (
      item?.type === normalizedType
      && normalizeText(item?.description).toLowerCase() === descriptionKey
    ));

    if (duplicateItem) {
      return { ok: false, reason: 'duplicate', item: duplicateItem };
    }

    const symbol = String(trade?.symbol || '').trim().toUpperCase();
    const tradeDateSource = trade?.entry_time || trade?.created_date || trade?.created_at;
    const tradeDate = tradeDateSource ? new Date(tradeDateSource) : null;
    const tradeDateLabel = tradeDate && !Number.isNaN(tradeDate.getTime())
      ? tradeDate.toLocaleDateString()
      : null;
    const exampleContext = [
      'Captured from journal note',
      symbol ? `(${symbol})` : '',
      tradeDateLabel ? `on ${tradeDateLabel}` : ''
    ].filter(Boolean).join(' ');

    const createdAt = new Date().toISOString();
    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: normalizedType,
      category: 'execution',
      title: buildRuleTitle(noteText, normalizedType),
      description: noteText,
      priority: 'medium',
      examples: [exampleContext],
      tags: ['journal-note', ...(symbol ? [symbol.toLowerCase()] : [])],
      source_trade_id: trade?.id || null,
      usage_count: 0,
      last_used_at: null,
      createdAt
    };

    const nextItems = [...items, newItem];
    await saveDosAndDontsItems(nextItems);

    return { ok: true, item: newItem };
  } catch {
    return { ok: false, reason: 'storage_error' };
  }
}

export async function syncRuleUsageCounts({ previousRuleIds = [], nextRuleIds = [] } = {}) {
  const previousUnique = [...new Set(
    (Array.isArray(previousRuleIds) ? previousRuleIds : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean)
  )];
  const nextUnique = [...new Set(
    (Array.isArray(nextRuleIds) ? nextRuleIds : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean)
  )];

  const addedIds = nextUnique.filter((id) => !previousUnique.includes(id));
  const removedIds = previousUnique.filter((id) => !nextUnique.includes(id));
  if (addedIds.length === 0 && removedIds.length === 0) {
    return { ok: true, changed: false, addedIds: [], removedIds: [] };
  }

  try {
    const items = await loadDosAndDontsItems();
    const nowISO = new Date().toISOString();
    let touched = 0;

    const nextItems = items.map((item) => {
      const ruleId = String(item?.id || '');
      if (!ruleId) return item;

      if (addedIds.includes(ruleId)) {
        touched += 1;
        return {
          ...item,
          usage_count: normalizeUsageCount(item?.usage_count) + 1,
          last_used_at: nowISO,
        };
      }

      if (removedIds.includes(ruleId)) {
        touched += 1;
        return {
          ...item,
          usage_count: Math.max(0, normalizeUsageCount(item?.usage_count) - 1),
        };
      }

      return item;
    });

    if (touched === 0) {
      return { ok: true, changed: false, addedIds: [], removedIds: [] };
    }

    await saveDosAndDontsItems(nextItems);

    return {
      ok: true,
      changed: true,
      addedIds,
      removedIds,
    };
  } catch {
    return { ok: false, reason: 'storage_error', addedIds, removedIds };
  }
}

export function getRuleSuggestionsFromTrade(trade = {}) {
  const dos = [];
  const donts = [];

  const symbol = String(trade?.symbol || '').trim().toUpperCase();
  const setupType = normalizeText(trade?.setup_type);
  const noteText = normalizeText(trade?.notes);
  const pnlValue = Number(trade?.pnl);
  const hasPnl = Number.isFinite(pnlValue);
  const hasStopLoss = Number(trade?.stop_loss) > 0;
  const followedPlan = trade?.followed_plan;
  const emotions = Array.isArray(trade?.emotions)
    ? trade.emotions.map((emotion) => normalizeText(emotion)).filter(Boolean)
    : (trade?.emotions ? [normalizeText(trade.emotions)] : []);
  const emotionsLower = emotions.map((emotion) => emotion.toLowerCase());

  if (setupType) {
    appendUnique(dos, `Repeat high-quality ${setupType} setups with the same entry criteria.`);
  }

  if (followedPlan === true) {
    appendUnique(dos, 'Follow your plan checklist before every entry.');
  }
  if (followedPlan === false) {
    appendUnique(donts, "Don't deviate from your written trade plan mid-trade.");
  }

  if (hasStopLoss) {
    appendUnique(dos, 'Define stop loss before entry and keep risk pre-planned.');
  } else {
    appendUnique(donts, "Don't enter trades without a defined stop loss.");
  }

  if (hasPnl && pnlValue > 0) {
    appendUnique(dos, `Repeat the process used on this ${symbol || 'winning'} trade.`);
  }
  if (hasPnl && pnlValue < 0) {
    appendUnique(donts, "Don't force entries when confirmation is weak.");
    appendUnique(donts, "Don't hold losers hoping they will recover.");
  }

  if (emotionsLower.some((emotion) => ['calm', 'disciplined', 'patient', 'focused', 'confident'].includes(emotion))) {
    appendUnique(dos, 'Repeat the emotional routine that kept you calm and disciplined.');
  }
  if (emotionsLower.some((emotion) => ['fomo', 'fear', 'greed', 'revenge', 'anxious', 'frustrated'].includes(emotion))) {
    appendUnique(donts, "Don't trade from FOMO, fear, or revenge impulses.");
  }

  if (noteText) {
    const noteClauses = noteText
      .split(/[.!?]/)
      .map((clause) => normalizeText(clause))
      .filter(Boolean);

    if (noteClauses[0]) {
      appendUnique(dos, noteClauses[0]);
    }
    if (noteClauses[1]) {
      appendUnique(donts, `Avoid this mistake: ${noteClauses[1]}`);
    }
  }

  if (dos.length === 0) {
    appendUnique(dos, 'Repeat patient entries only when setup and risk align.');
  }
  if (donts.length === 0) {
    appendUnique(donts, "Don't break risk limits for any single trade.");
  }

  return {
    dos: dos.slice(0, 5),
    donts: donts.slice(0, 5),
  };
}
