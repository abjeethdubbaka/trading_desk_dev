import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronRight, CircleDashed, RefreshCw } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils/general';
import { useDosAndDonts } from '@/lib/hooks/useDosAndDonts';
import InfoHint from '@/components/ui/InfoHint';

const STORAGE_KEY = 'dashboard.dailyImprovements.v1';

const todayKey = () => new Date().toISOString().slice(0, 10);

const normalizeRuleIds = (value, validIdSet = null) => {
  const ids = Array.isArray(value) ? value : [];
  const normalized = [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))];

  if (!validIdSet) return normalized;
  return normalized.filter((id) => validIdSet.has(id));
};

const sortByUsageThenTitle = (a, b) => {
  const usageDiff = (Number(b?.usage_count) || 0) - (Number(a?.usage_count) || 0);
  if (usageDiff !== 0) return usageDiff;
  return String(a?.title || '').localeCompare(String(b?.title || ''));
};

const formatUpdatedLabel = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const loadEntries = () => {
  if (typeof window === 'undefined' || !window.localStorage) return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const saveEntries = (entries) => {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
};

function RuleList({
  title,
  hint,
  items,
  selectedIds,
  onToggle,
  selectedClassName,
}) {
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold text-white/85">{title}</p>
        <InfoHint text={hint} />
      </div>

      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
        {items.map((item) => {
          const id = String(item?.id || '').trim();
          if (!id) return null;

          const selected = selectedIdSet.has(id);
          const usageCount = Number(item?.usage_count) || 0;
          const typeLabel = item?.type === 'dont' ? "Don't" : 'Do';

          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={cn(
                'w-full rounded-lg border px-2.5 py-2 text-left transition-colors',
                selected
                  ? selectedClassName
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-white/90">{item?.title || 'Untitled rule'}</p>
                  <p className="text-[10px] text-white/45">{typeLabel} rule</p>
                </div>
                <span className="text-[10px] text-white/40">{usageCount}x</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DailyImprovements() {
  const [collapsed, setCollapsed] = useState(true);
  const { items: rules } = useDosAndDonts();
  const [entriesByDate, setEntriesByDate] = useState(() => loadEntries());

  const dayKey = todayKey();

  useEffect(() => {
    saveEntries(entriesByDate);
  }, [entriesByDate]);

  const sortedRules = useMemo(
    () => [...(Array.isArray(rules) ? rules : [])].sort(sortByUsageThenTitle),
    [rules]
  );
  const doRules = useMemo(
    () => sortedRules.filter((item) => item?.type === 'do'),
    [sortedRules]
  );

  const validRuleIdSet = useMemo(
    () => new Set(sortedRules.map((item) => String(item?.id || '').trim()).filter(Boolean)),
    [sortedRules]
  );

  const todayEntry = useMemo(() => {
    const entry = entriesByDate?.[dayKey] || {};
    return {
      followed_rule_ids: normalizeRuleIds(entry?.followed_rule_ids, validRuleIdSet),
      needs_work_rule_ids: normalizeRuleIds(entry?.needs_work_rule_ids, validRuleIdSet),
      updated_at: entry?.updated_at || null,
    };
  }, [dayKey, entriesByDate, validRuleIdSet]);

  const updateTodayEntry = useCallback((updater) => {
    setEntriesByDate((previous) => {
      const currentEntry = previous?.[dayKey] || {};
      const normalizedCurrent = {
        followed_rule_ids: normalizeRuleIds(currentEntry?.followed_rule_ids, validRuleIdSet),
        needs_work_rule_ids: normalizeRuleIds(currentEntry?.needs_work_rule_ids, validRuleIdSet),
      };
      const nextValue = updater(normalizedCurrent);
      const normalizedNext = {
        followed_rule_ids: normalizeRuleIds(nextValue?.followed_rule_ids, validRuleIdSet),
        needs_work_rule_ids: normalizeRuleIds(nextValue?.needs_work_rule_ids, validRuleIdSet),
        updated_at: new Date().toISOString(),
      };

      return {
        ...previous,
        [dayKey]: normalizedNext,
      };
    });
  }, [dayKey, validRuleIdSet]);

  const toggleFollowedRule = useCallback((ruleId) => {
    const normalizedId = String(ruleId || '').trim();
    if (!normalizedId) return;

    updateTodayEntry((entry) => {
      const exists = entry.followed_rule_ids.includes(normalizedId);

      if (exists) {
        return {
          ...entry,
          followed_rule_ids: entry.followed_rule_ids.filter((id) => id !== normalizedId),
        };
      }

      return {
        ...entry,
        followed_rule_ids: [...entry.followed_rule_ids, normalizedId],
        needs_work_rule_ids: entry.needs_work_rule_ids.filter((id) => id !== normalizedId),
      };
    });
  }, [updateTodayEntry]);

  const toggleNeedsWorkRule = useCallback((ruleId) => {
    const normalizedId = String(ruleId || '').trim();
    if (!normalizedId) return;

    updateTodayEntry((entry) => {
      const exists = entry.needs_work_rule_ids.includes(normalizedId);

      if (exists) {
        return {
          ...entry,
          needs_work_rule_ids: entry.needs_work_rule_ids.filter((id) => id !== normalizedId),
        };
      }

      return {
        ...entry,
        needs_work_rule_ids: [...entry.needs_work_rule_ids, normalizedId],
        followed_rule_ids: entry.followed_rule_ids.filter((id) => id !== normalizedId),
      };
    });
  }, [updateTodayEntry]);

  const clearToday = useCallback(() => {
    setEntriesByDate((previous) => ({
      ...previous,
      [dayKey]: {
        followed_rule_ids: [],
        needs_work_rule_ids: [],
        updated_at: new Date().toISOString(),
      },
    }));
  }, [dayKey]);

  const updatedAtLabel = formatUpdatedLabel(todayEntry.updated_at);
  const hasRules = sortedRules.length > 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#13131e] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-white/40" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-white/40" />
          )}
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-300" />
          <p className="text-sm font-semibold text-white">Daily Improvements</p>
          <InfoHint text="Capture today's rule execution and what needs work." />
          {collapsed && (todayEntry.followed_rule_ids.length > 0 || todayEntry.needs_work_rule_ids.length > 0) && (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
              {todayEntry.followed_rule_ids.length}✓ / {todayEntry.needs_work_rule_ids.length}!
            </span>
          )}
        </button>

        {!collapsed && (
          <button
            type="button"
            onClick={clearToday}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/65 hover:bg-white/[0.06] hover:text-white/85"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-200/85">Followed</p>
              <p className="mt-1 text-lg font-bold text-emerald-300">{todayEntry.followed_rule_ids.length}</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/85">Needs Work</p>
              <p className="mt-1 text-lg font-bold text-amber-300">{todayEntry.needs_work_rule_ids.length}</p>
            </div>
          </div>

          {updatedAtLabel ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/50">
              <CalendarDays className="h-3 w-3" />
              Saved today at {updatedAtLabel}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/40">
              <CircleDashed className="h-3 w-3" />
              Not saved yet for today
            </div>
          )}

          {!hasRules ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3 text-xs text-white/60">
              Add rules in{' '}
              <Link to={createPageUrl('DosAndDonts')} className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2">
                Do&apos;s &amp; Don&apos;ts
              </Link>{' '}
              first, then track daily improvements here.
            </div>
          ) : (
            <div className="space-y-4">
              <RuleList
                title="Rules Followed Today"
                hint="Select Do rules you executed well."
                items={doRules}
                selectedIds={todayEntry.followed_rule_ids}
                onToggle={toggleFollowedRule}
                selectedClassName="border-emerald-500/35 bg-emerald-500/15"
              />

              <RuleList
                title="Needs Work"
                hint="Select rules that slipped or need focus tomorrow."
                items={sortedRules}
                selectedIds={todayEntry.needs_work_rule_ids}
                onToggle={toggleNeedsWorkRule}
                selectedClassName="border-amber-500/35 bg-amber-500/15"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
