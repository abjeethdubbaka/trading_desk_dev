import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createDefaultTemplate } from '@/lib/setupJournal/utils';

/**
 * The Setup Journal prompts this setup is debriefed with. Each setup owns its
 * own, which is why the editor lives inside the setup rather than in the
 * journal itself.
 *
 * Answers are typed as a comma separated list because that is how a trader
 * says them out loud — "lower, equal, higher" — and it keeps the whole
 * template readable on one screen.
 *
 * Shape: { fields: [{ label, optionsText }], questions: [string] } — the flat
 * editing form of a template, normalized on save.
 */
export default function JournalTemplateField({ value, onChange }) {
  const fields = Array.isArray(value?.fields) ? value.fields : [];
  const questions = Array.isArray(value?.questions) ? value.questions : [];

  const setFields = (next) => onChange({ fields: next, questions });
  const setQuestions = (next) => onChange({ fields, questions: next });

  const updateField = (index, patch) => {
    setFields(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  };

  const loadStarter = () => {
    const starter = createDefaultTemplate();
    onChange({
      fields: starter.fields.map((field) => ({
        label: field.label,
        optionsText: field.options.join(', '),
      })),
      questions: starter.questions.map((question) => question.prompt),
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <Label>Journal Template</Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-white/45"
            onClick={loadStarter}
          >
            Use starter
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-white/60"
            onClick={() => setFields([...fields, { label: '', optionsText: '' }])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />Add prompt
          </Button>
        </div>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/12 px-3 py-4 text-center text-xs text-white/35">
          No prompts yet. This setup uses the starter template until you add your own.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={index} className="flex items-start gap-2">
              <Input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Second high"
                className="h-9 w-40 shrink-0 border-white/12 bg-white/[0.03] text-xs"
              />
              <Input
                value={field.optionsText}
                onChange={(e) => updateField(index, { optionsText: e.target.value })}
                placeholder="Lower, Equal, Higher"
                className="h-9 flex-1 border-white/12 bg-white/[0.03] text-xs"
              />
              <button
                type="button"
                onClick={() => setFields(fields.filter((_, i) => i !== index))}
                className="mt-1.5 flex-shrink-0 text-white/25 hover:text-rose-400"
                aria-label={`Remove ${field.label || 'prompt'}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-white/35">
        Answers are typed as a comma separated list. They become the only choices when logging an entry, which is what lets the journal compare them later.
      </p>

      <div className="space-y-2 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-white/60">Questions to answer every time</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-white/60"
            onClick={() => setQuestions([...questions, ''])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />Add question
          </Button>
        </div>

        {questions.map((prompt, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={prompt}
              onChange={(e) => setQuestions(questions.map((q, i) => (i === index ? e.target.value : q)))}
              placeholder="What did the market prove before I entered?"
              className="h-9 flex-1 border-white/12 bg-white/[0.03] text-xs"
            />
            <button
              type="button"
              onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
              className="flex-shrink-0 text-white/25 hover:text-rose-400"
              aria-label="Remove question"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
