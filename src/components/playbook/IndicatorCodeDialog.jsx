import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIndicatorFiles } from '@/lib/hooks/useIndicatorFiles';
import { formatIndicatorSize, toOriginalFileName } from '@/lib/playbook/indicators';

/** Read-only view of an indicator's source, with copy and save. */
export default function IndicatorCodeDialog({ indicator, onOpenChange }) {
  const { readCode, download } = useIndicatorFiles();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!indicator) return undefined;
    let cancelled = false;
    setCode('');
    setError('');
    setCopied(false);
    setIsLoading(true);
    readCode(indicator)
      .then((text) => { if (!cancelled) setCode(text); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Could not read the file'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [indicator, readCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy to the clipboard');
    }
  };

  const handleDownload = async () => {
    try {
      await download(indicator);
    } catch (err) {
      toast.error(err?.message || 'Could not save the file');
    }
  };

  const lineCount = code ? code.split('\n').length : 0;

  return (
    <Dialog open={Boolean(indicator)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-4xl flex-col gap-3 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-baseline gap-2 pr-6">
            <span className="font-mono">{toOriginalFileName(indicator)}</span>
            <span className="text-xs font-normal text-white/40">
              {[formatIndicatorSize(indicator?.size), lineCount ? `${lineCount} lines` : ''].filter(Boolean).join(' · ')}
            </span>
          </DialogTitle>
        </DialogHeader>

        {indicator?.note ? <p className="text-xs text-white/60">{indicator.note}</p> : null}

        <div className="min-h-[200px] flex-1 overflow-auto rounded-lg border border-white/10 bg-[#0a0d14]">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-white/40">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="p-4 text-sm text-rose-300">{error}</p>
          ) : (
            <pre className="p-4 font-mono text-[12px] leading-relaxed text-white/80">
              <code>{code}</code>
            </pre>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleCopy} disabled={!code}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-300" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy code'}
          </Button>
          <Button type="button" size="sm" onClick={handleDownload} disabled={!code}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Save .cs file
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
