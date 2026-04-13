import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { calcCoreStats } from '@/lib/calculations/trades';
import {
  requestMorningBrief,
  getDefaultMorningBriefModel,
} from '@/lib/ai/services/assistantChatService';

const CACHE_KEY = 'morningBrief';
const todayKey = () => new Date().toISOString().slice(0, 10);
const MORNING_BRIEF_MODEL =
  import.meta.env.VITE_OLLAMA_MORNING_BRIEF_MODEL ||
  getDefaultMorningBriefModel();

const STYLE = {
  positive: {
    border: 'border-emerald-500/25 bg-emerald-500/8',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300/90',
  },
  warning: {
    border: 'border-amber-500/25 bg-amber-500/8',
    dot: 'bg-amber-400',
    text: 'text-amber-300/90',
  },
  focus: {
    border: 'border-blue-500/25 bg-blue-500/8',
    dot: 'bg-blue-400',
    text: 'text-blue-300/90',
  },
};

function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getTopValues(values = [], limit = 4) {
  const counts = new Map();

  values
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

function collectEmotions(trades = []) {
  const values = [];

  trades.forEach((trade) => {
    if (Array.isArray(trade?.emotions)) {
      trade.emotions.forEach((item) => values.push(item));
      return;
    }

    if (trade?.emotions) {
      values.push(trade.emotions);
    }
  });

  return values;
}

function buildBriefContext(trades = []) {
  const recentTrades = trades.slice(0, 10);
  const stats = calcCoreStats(recentTrades);
  const planFollowedCount = recentTrades.filter((trade) => trade?.followed_plan === true).length;
  const planFollowedPct = recentTrades.length
    ? (planFollowedCount / recentTrades.length) * 100
    : 0;

  return {
    trade_count: recentTrades.length,
    win_rate: toFiniteNumber(stats?.winRate, 0),
    avg_r: toFiniteNumber(stats?.avgR, 0),
    total_pnl: toFiniteNumber(stats?.totalPnL, 0),
    avg_win: toFiniteNumber(stats?.avgWin, 0),
    avg_loss: toFiniteNumber(stats?.avgLoss, 0),
    plan_followed_pct: planFollowedPct,
    top_setups: getTopValues(recentTrades.map((trade) => trade?.setup_type), 4),
    top_emotions: getTopValues(collectEmotions(recentTrades), 4),
  };
}

function buildFallbackBrief(briefContext = {}) {
  const winRate = toFiniteNumber(briefContext.win_rate, 0);
  const tradeCount = Math.max(0, Math.round(toFiniteNumber(briefContext.trade_count, 0)));
  const totalPnl = toFiniteNumber(briefContext.total_pnl, 0);
  const avgR = toFiniteNumber(briefContext.avg_r, 0);

  return [
    {
      type: 'focus',
      text: `Win rate ${winRate.toFixed(0)}% across ${tradeCount} recent trades. Stay selective.`,
    },
    {
      type: totalPnl >= 0 ? 'positive' : 'warning',
      text: `Recent P&L ${totalPnl >= 0 ? '+' : '-'}$${Math.abs(totalPnl).toFixed(0)}. Keep risk consistent.`,
    },
    {
      type: 'focus',
      text: `Average R ${avgR.toFixed(2)}. Keep targeting setups above 1.5R.`,
    },
  ];
}

export default function MorningBrief({ trades = [] }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (force = false) => {
      if (!trades.length) {
        setBrief(null);
        setError(null);
        return;
      }

      const briefContext = buildBriefContext(trades);

      if (!force) {
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
          if (
            cached?.date === todayKey() &&
            cached?.model === MORNING_BRIEF_MODEL &&
            Array.isArray(cached?.items) &&
            cached.items.length
          ) {
            setBrief(cached.items);
            return;
          }
        } catch {}
      }

      setLoading(true);
      setError(null);

      try {
        const result = await requestMorningBrief({
          briefContext,
          model: MORNING_BRIEF_MODEL,
        });

        setBrief(result);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            date: todayKey(),
            model: MORNING_BRIEF_MODEL,
            items: result,
          })
        );
      } catch (requestError) {
        setBrief(buildFallbackBrief(briefContext));
        setError(requestError?.message || 'AI insights unavailable - showing basic analysis');
      } finally {
        setLoading(false);
      }
    },
    [trades]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold">Morning Brief</span>
          <span className="text-[10px] text-white/30">Ollama | updates daily</span>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40"
          title="Regenerate"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white/50 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-xs">AI is reading your trades...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {!loading && !error && !trades.length && (
        <p className="text-xs text-white/30 text-center py-4">
          Log your first trade to unlock the morning brief.
        </p>
      )}

      {!loading && brief && (
        <div className="flex flex-col gap-2">
          {brief.map((item, index) => {
            const style = STYLE[item.type] ?? STYLE.focus;
            return (
              <div key={index} className={`rounded-lg border px-3 py-2.5 flex items-start gap-2.5 ${style.border}`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                <p className={`text-xs leading-relaxed ${style.text}`}>{item.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
