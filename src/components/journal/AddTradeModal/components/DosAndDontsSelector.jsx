import React, { useEffect, useMemo, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { loadDosAndDontsItems } from '@/components/dosanddonts/storage';

const byUsageThenTitle = (a, b) => {
  const usageDiff = (Number(b?.usage_count) || 0) - (Number(a?.usage_count) || 0);
  if (usageDiff !== 0) return usageDiff;
  return String(a?.title || '').localeCompare(String(b?.title || ''));
};

function RuleGroup({ title, type, items, selectedRuleIds, onToggle }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
      <p className={cn(
        "text-[11px] uppercase tracking-wide mb-2",
        type === 'do' ? 'text-emerald-300/85' : 'text-rose-300/85'
      )}>
        {title}
      </p>
      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-[11px] text-white/45 px-1 py-1">
            No rules yet — add some in the Do&apos;s &amp; Don&apos;ts page.
          </p>
        ) : (
          items.map((item) => {
            const selected = selectedRuleIds.includes(item.id);
            const usageCount = Number(item?.usage_count) || 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className={cn(
                  "w-full text-left border rounded px-2 py-1.5 transition-colors",
                  selected
                    ? type === 'do'
                      ? 'border-emerald-500/45 bg-emerald-500/15'
                      : 'border-rose-500/45 bg-rose-500/15'
                    : 'border-white/10 bg-white/[0.01] hover:border-white/20'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] text-white/85 leading-snug">{item.title}</span>
                  <span className="text-[10px] text-white/45 whitespace-nowrap">
                    {usageCount}x
                  </span>
                </div>
                {selected ? (
                  <div className="mt-1 text-[10px] flex items-center gap-1 text-white/60">
                    <Check className="w-3 h-3" />
                    Selected
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function DosAndDontsSelector({ selectedRuleIds = [], onSelectionChange }) {
  const [collapsed, setCollapsed] = useState(true);
  const [items, setItems] = useState(() => loadDosAndDontsItems());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const sync = () => setItems(loadDosAndDontsItems());
    window.addEventListener('dosanddonts-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('dosanddonts-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const doRules = useMemo(
    () => items.filter((item) => item?.type === 'do').sort(byUsageThenTitle),
    [items]
  );
  const dontRules = useMemo(
    () => items.filter((item) => item?.type === 'dont').sort(byUsageThenTitle),
    [items]
  );

  const selectedRules = useMemo(() => {
    const selectedIdSet = new Set(selectedRuleIds);
    return items.filter((item) => selectedIdSet.has(item.id));
  }, [items, selectedRuleIds]);

  const toggleRule = (ruleId) => {
    const ruleKey = String(ruleId || '').trim();
    if (!ruleKey) return;

    const exists = selectedRuleIds.includes(ruleKey);
    const next = exists
      ? selectedRuleIds.filter((id) => id !== ruleKey)
      : [...selectedRuleIds, ruleKey];

    onSelectionChange([...new Set(next)]);
  };

  return (
    <div className="border border-white/15 rounded-lg bg-white/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-white pointer-events-none">Dos &amp; Don&apos;ts for This Trade</Label>
          {selectedRuleIds.length > 0 && (
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
              {selectedRuleIds.length}
            </span>
          )}
        </div>
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5 text-white/35 flex-shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-white/35 flex-shrink-0" />
        }
      </button>

      {!collapsed && <div className="space-y-3 px-4 pb-4">
        <p className="text-[11px] text-white/55">
          Select the rules from your Do&apos;s &amp; Don&apos;ts list that apply to this trade.
        </p>

      {selectedRules.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedRules.map((rule) => (
            <button
              key={rule.id}
              type="button"
              onClick={() => toggleRule(rule.id)}
              className={cn(
                "text-[11px] px-2 py-1 rounded border transition-colors",
                rule.type === 'do'
                  ? "border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/15"
                  : "border-rose-500/30 text-rose-200 hover:bg-rose-500/15"
              )}
            >
              {rule.type === 'do' ? 'Do' : "Don't"}: {rule.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-white/45">No Dos/Don&apos;ts selected yet.</p>
      )}

      <div className="grid md:grid-cols-2 gap-2.5">
        <RuleGroup
          title="Do Rules"
          type="do"
          items={doRules}
          selectedRuleIds={selectedRuleIds}
          onToggle={toggleRule}
        />
        <RuleGroup
          title="Don&apos;t Rules"
          type="dont"
          items={dontRules}
          selectedRuleIds={selectedRuleIds}
          onToggle={toggleRule}
        />
      </div>
      </div>}
    </div>
  );
}
