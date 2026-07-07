import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EntryExamplesField({ examples = [], onAdd, onUpdate, onRemove }) {
  return (
    <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Examples</Label>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onAdd}>
          Add Example
        </Button>
      </div>
      {examples.map((example, index) => (
        <div key={`editor-example-${index}`} className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 md:grid-cols-[1fr_1fr_1.2fr_auto]">
          <Input
            value={example.title}
            onChange={(event) => onUpdate(index, 'title', event.target.value)}
            placeholder="Title"
            className="bg-white/[0.03] border-white/12"
          />
          <Input
            value={example.url}
            onChange={(event) => onUpdate(index, 'url', event.target.value)}
            placeholder="https://..."
            className="bg-white/[0.03] border-white/12"
          />
          <Input
            value={example.note}
            onChange={(event) => onUpdate(index, 'note', event.target.value)}
            placeholder="What this example teaches"
            className="bg-white/[0.03] border-white/12"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
            onClick={() => onRemove(index)}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
