import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  isDisciplineCoachEnabled,
  requestDisciplineCoach,
} from '../services/disciplineCoachService.js';

const CACHE_KEY = 'disciplineCoachOverlayCache';
const CACHE_TTL = 1000 * 60 * 10;

function snapshotKey(snapshot) {
  const m = snapshot?.metrics || {};
  return JSON.stringify({
    score: snapshot?.score || 0,
    status: snapshot?.status || 'watch',
    p: Number(m.planAdherencePct || 0),
    t: Number(m.todayTrades || 0),
    mt: Number(m.maxDailyTrades || 0),
    lp: Number(m.lossUsedPct || 0),
    ls: Number(m.currentLossStreak || 0),
  });
}

function readCache(key) {
  try {
    const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const entry = store[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    store[key] = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // no-op
  }
}

export function useDisciplineCoachAI(snapshot) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enabled = isDisciplineCoachEnabled();
  const key = useMemo(() => snapshotKey(snapshot), [snapshot]);

  const fetchCoach = useCallback(async (force = false) => {
    if (!enabled || !snapshot) return;

    if (!force) {
      const cached = readCache(key);
      if (cached) {
        setCoach(cached);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const data = await requestDisciplineCoach(snapshot);
      setCoach(data);
      writeCache(key, data);
    } catch (err) {
      setError(err?.message || 'AI coach unavailable');
      setCoach(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, key, snapshot]);

  useEffect(() => {
    if (!enabled || !snapshot) {
      setCoach(null);
      setError(null);
      setLoading(false);
      return;
    }

    fetchCoach(false);
  }, [enabled, snapshot, fetchCoach]);

  return {
    aiEnabled: enabled,
    aiLoading: loading,
    aiError: error,
    aiInsights: coach?.insights || [],
    aiActions: coach?.actions || [],
    aiSummary: coach?.summary || '',
    refreshAI: () => fetchCoach(true),
  };
}
