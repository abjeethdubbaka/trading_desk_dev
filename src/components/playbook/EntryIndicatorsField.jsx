import React, { useRef, useState } from 'react';
import { Eye, FileCode2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useIndicatorFiles } from '@/lib/hooks/useIndicatorFiles';
import { INDICATOR_ACCEPT, formatIndicatorSize } from '@/lib/playbook/indicators';
import IndicatorCodeDialog from './IndicatorCodeDialog';

/**
 * The indicators a setup is traded with, as their NinjaScript source files.
 * Removing one here only drops it from the setup; the file is deleted when
 * the setup is saved and no other setup still uses it.
 */
export default function EntryIndicatorsField({ indicators = [], onChange }) {
  const { attach, isDesktop } = useIndicatorFiles();
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewing, setViewing] = useState(null);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    setIsUploading(true);
    const added = [];
    for (const file of files) {
      try {
        added.push(await attach(file));
      } catch (error) {
        toast.error(error?.message || `Could not attach ${file.name}`);
      }
    }
    setIsUploading(false);
    if (added.length > 0) onChange([...indicators, ...added]);
  };

  const updateNote = (id, note) => {
    onChange(indicators.map((indicator) => (indicator.id === id ? { ...indicator, note } : indicator)));
  };

  const remove = (id) => {
    onChange(indicators.filter((indicator) => indicator.id !== id));
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label>Indicators</Label>
          <p className="mt-0.5 text-[11px] text-white/40">
            NinjaScript .cs files this setup is traded with.
            {isDesktop ? ' Saved beside your backups.' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-3 text-xs text-white/80 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Add .cs file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={INDICATOR_ACCEPT}
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {indicators.length > 0 && (
        <ul className="space-y-1.5">
          {indicators.map((indicator) => (
            <li
              key={indicator.id}
              className="grid grid-cols-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileCode2 className="h-4 w-4 flex-shrink-0 text-violet-300" />
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-white/90">{indicator.original_name || indicator.name}</p>
                  <p className="text-[10px] text-white/35">{formatIndicatorSize(indicator.size)}</p>
                </div>
              </div>
              <Input
                value={indicator.note || ''}
                onChange={(event) => updateNote(indicator.id, event.target.value)}
                placeholder="What it shows, settings used"
                className="h-8 border-white/12 bg-white/[0.03] text-xs"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewing(indicator)}
                  title="View code"
                  className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white/85"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(indicator.id)}
                  title="Remove from this setup"
                  className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-rose-500/15 hover:text-rose-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <IndicatorCodeDialog indicator={viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} />
    </div>
  );
}
