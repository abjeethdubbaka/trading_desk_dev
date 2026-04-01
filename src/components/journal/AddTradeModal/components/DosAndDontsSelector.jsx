import React, { useEffect, useMemo, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import {
  addRuleFromTradeNote,
  getRuleSuggestionsFromTrade,
  loadDosAndDontsItems,
} from '@/components/dosanddonts/storage';

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

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
          <p className="text-[11px] text-white/45 px-1 py-1">No rules yet.</p>
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

export default function DosAndDontsSelector({ tradeDraft, selectedRuleIds = [], onSelectionChange }) {
  const [items, setItems] = useState(() => loadDosAndDontsItems());
  const [newRuleType, setNewRuleType] = useState('do');
  const [newRuleText, setNewRuleText] = useState('');

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

  const suggestionLists = useMemo(() => (
    getRuleSuggestionsFromTrade(tradeDraft || {})
  ), [tradeDraft]);

  const toggleRule = (ruleId) => {
    const ruleKey = String(ruleId || '').trim();
    if (!ruleKey) return;

    const exists = selectedRuleIds.includes(ruleKey);
    const next = exists
      ? selectedRuleIds.filter((id) => id !== ruleKey)
      : [...selectedRuleIds, ruleKey];

    onSelectionChange([...new Set(next)]);
  };

  const createRuleFromText = (text, type) => {
    const normalized = normalizeText(text);
    if (!normalized) {
      toast.error('Add text first to create a Do/Don\'t rule.');
      return false;
    }

    const result = addRuleFromTradeNote({
      trade: tradeDraft,
      type,
      note: normalized,
    });

    if (result.ok) {
      const created = result.item;
      const nextSelection = [...new Set([...selectedRuleIds, created.id])];
      onSelectionChange(nextSelection);
      setItems(loadDosAndDontsItems());
      toast.success(`Added ${type === 'dont' ? "Don't" : 'Do'} rule and selected it.`);
      return true;
    }

    if (result.reason === 'duplicate') {
      const duplicate = result.item || items.find((item) => (
        item?.type === type
        && normalizeText(item?.description).toLowerCase() === normalized.toLowerCase()
      ));

      if (duplicate?.id) {
        const nextSelection = [...new Set([...selectedRuleIds, duplicate.id])];
        onSelectionChange(nextSelection);
        toast.warning('Rule already exists. Selected the existing one.');
        return true;
      }

      toast.warning('This rule already exists.');
      return false;
    }

    if (result.reason === 'storage_error') {
      toast.error('Could not save rule to local storage.');
      return false;
    }

    toast.error('Could not create rule from this note.');
    return false;
  };

  const handleCreateCustomRule = () => {
    const created = createRuleFromText(newRuleText, newRuleType);
    if (created) {
      setNewRuleText('');
    }
  };

  const canAddCustomRule = normalizeText(newRuleText).length > 0;

  return (
    <div className="space-y-3 border border-white/20 rounded-lg p-4 bg-white/5">
      <div className="space-y-1">
        <Label className="text-sm font-semibold text-white">Dos & Don&apos;ts for This Trade</Label>
        <p className="text-[11px] text-white/55">
          Select existing rules or create new ones directly while logging this trade.
        </p>
      </div>

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

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-white/55">Create New Rule</p>
        <div className="grid md:grid-cols-[120px_1fr_auto] gap-2">
          <Select value={newRuleType} onValueChange={(value) => setNewRuleType(value === 'dont' ? 'dont' : 'do')}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              <SelectItem value="do">Do</SelectItem>
              <SelectItem value="dont">Don&apos;t</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={newRuleText}
            onChange={(event) => setNewRuleText(event.target.value)}
            placeholder="Add a focused rule from this trade..."
            className="bg-white/5 border-white/10"
          />
          <Button
            type="button"
            onClick={handleCreateCustomRule}
            disabled={!canAddCustomRule}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-2.5">
        <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-emerald-300/90">Suggestions: Repeat (Do)</p>
          {suggestionLists.dos.map((suggestion, index) => (
            <button
              key={`suggest-do-${index}`}
              type="button"
              onClick={() => createRuleFromText(suggestion, 'do')}
              className="w-full text-left text-[10px] text-emerald-100/85 border border-emerald-500/25 rounded px-2 py-1 hover:bg-emerald-500/15 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="rounded border border-rose-500/20 bg-rose-500/5 p-2 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-rose-300/90">Suggestions: What Went Wrong (Don&apos;t)</p>
          {suggestionLists.donts.map((suggestion, index) => (
            <button
              key={`suggest-dont-${index}`}
              type="button"
              onClick={() => createRuleFromText(suggestion, 'dont')}
              className="w-full text-left text-[10px] text-rose-100/85 border border-rose-500/25 rounded px-2 py-1 hover:bg-rose-500/15 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

