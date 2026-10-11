import React, { useState } from 'react';
import { CalendarClock, FolderOpen, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useWeeklyBackup } from '@/lib/hooks/useWeeklyBackup';
import { useSettings } from '@/lib/context/SettingsContext';
import { getBackupFileName, getNextBackupDay } from '@/lib/backup/schedule';

function formatWhen(iso) {
  if (!iso) return 'never';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? 'never' : date.toLocaleString();
}

export default function AutoBackupCard() {
  const { settings } = useSettings();
  const accountType = settings?.account_type || 'demo';
  const {
    isSupported,
    folder,
    lastRunAt,
    isBackingUp,
    isDue,
    runBackup,
    restoreBackup,
    chooseFolder,
    revealFolder,
  } = useWeeklyBackup();

  const [confirm, confirmDialog] = useConfirm();
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isSupported) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/45">
        Automatic backups write to a folder on this machine, which only the desktop app can do. Open TradeDesk as the installed app to use them. Manual export and import above work anywhere.
      </p>
    );
  }

  const handleBackupNow = async () => {
    try {
      const result = await runBackup();
      toast.success(`Backed up to ${result?.filePath || 'the backup folder'}`);
    } catch (error) {
      toast.error(`Backup failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleRevealFolder = async () => {
    try {
      await revealFolder();
    } catch (error) {
      // The handler lives in the Electron main process, which only reloads on
      // a full app restart — an old session will not have it yet.
      toast.error(`Could not open the folder: ${error?.message || 'Unknown error'}. Restart the app if it was running before this update.`);
    }
  };

  const handleChooseFolder = async () => {
    try {
      const result = await chooseFolder();
      if (result && !result.canceled) toast.success(`Backups will be written to ${result.folder}`);
    } catch (error) {
      toast.error(`Could not change folder: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleRestore = async () => {
    const shouldRestore = await confirm({
      title: `Restore the ${accountType} tier from its backup?`,
      description: `Every trade currently in the ${accountType} tier will be deleted and replaced by the ones in the backup file. This cannot be undone.`,
      confirmLabel: 'Replace trades',
      destructive: true,
    });
    if (!shouldRestore) return;

    setIsRestoring(true);
    try {
      const result = await restoreBackup();
      toast.success(`Restored ${result.restored} trade(s), replacing ${result.removed}`);
    } catch (error) {
      toast.error(`Restore failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Backup folder</p>
        <p className="mt-1 break-all font-mono text-xs text-white/75">{folder || 'Resolving…'}</p>
        <p className="mt-1.5 text-[11px] text-white/35">
          One file per account tier, rewritten each week. This tier writes{' '}
          <span className="font-mono text-white/55">{getBackupFileName(accountType)}</span>.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" className="h-8 text-xs text-white/60" onClick={handleChooseFolder}>
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />Change folder
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs text-white/60" onClick={handleRevealFolder}>
            Open folder
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-white/70">
            <CalendarClock className="h-3.5 w-3.5 text-white/35" />
            Last backup of the {accountType} tier: <span className="font-semibold text-white/85">{formatWhen(lastRunAt)}</span>
          </p>
          <p className="mt-1 text-[11px] text-white/35">
            {isDue
              ? 'Due now — it runs by itself when the app opens, or press Back up now.'
              : `Next backup ${getNextBackupDay().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRestore}
          disabled={isRestoring}
          className="h-8 border border-rose-400/25 text-xs text-rose-200/80 hover:bg-rose-500/10"
        >
          {isRestoring
            ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Restoring…</>
            : <><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Restore</>}
        </Button>
        <Button
          size="sm"
          onClick={handleBackupNow}
          disabled={isBackingUp}
          className="h-8 bg-cyan-600/80 text-xs font-semibold text-white hover:bg-cyan-600"
        >
          {isBackingUp
            ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Backing up…</>
            : <><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Back up now</>}
        </Button>
        </div>
      </div>

      <p className="text-[11px] text-white/35">
        Each file holds this tier&apos;s trades, settings and presets, Playbook setups with their rule history and charts,
        Rules, Dos &amp; Don&apos;ts, Data Points, Setup Journal, Informative Images, Daily Report Cards, the weekly review,
        watchlist and expenses. Trade screenshots and calculator history are not included.
      </p>

      <p className="text-[11px] text-white/35">
        Restoring replaces this tier's trades with the ones in its backup file. It is a rollback, not a merge.
      </p>
      {confirmDialog}
    </div>
  );
}
