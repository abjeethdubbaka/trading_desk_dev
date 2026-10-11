import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpenCheck, ListChecks, NotebookPen, ClipboardPaste, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import PasteTradesCard from '@/components/settings/PasteTradesCard';
// Full backup & restore — retired in favour of the weekly auto-backup above,
// which writes per account tier and restores the same way.
// import BackupRestoreCard from '@/components/settings/BackupRestoreCard';
import AutoBackupCard from '@/components/settings/AutoBackupCard';
import StrategiesBackupCard from '@/components/settings/StrategiesBackupCard';
import JournalBackupCard from '@/components/settings/JournalBackupCard';
import RulesBackupCard from '@/components/settings/RulesBackupCard';

// Each data tool collapses to a single row by default — the full export/
// import UI is tall, and stacking five of them made this tab a long scroll.
function DataSection({ icon: Icon, title, subtitle, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn(
      'rounded-xl border transition-colors',
      isOpen ? 'border-white/12 bg-white/[0.02]' : 'border-white/8 hover:border-white/15'
    )}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <Icon className="h-4 w-4 flex-shrink-0 text-white/45" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white/80">{title}</p>
          <p className="truncate text-xs text-white/35">{subtitle}</p>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-white/35" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/35" />
        )}
      </button>

      {isOpen && <div className="border-t border-white/8 p-4">{children}</div>}
    </div>
  );
}

export default function DataManagementTab({
  accountTier = 'custom',
  onImportPastedTrades,
  isImportingPastedTrades = false,
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-white/70">Data management</h2>

      <div className="space-y-2">
        <DataSection
          icon={CalendarClock}
          title="Weekly auto-backup"
          subtitle="Writes this account tier to a folder every Friday, or the next time you open the app"
        >
          <AutoBackupCard />
        </DataSection>

        <DataSection
          icon={BookOpenCheck}
          title="Strategies"
          subtitle="Export or import Playbook setups"
        >
          <StrategiesBackupCard />
        </DataSection>

        <DataSection
          icon={ListChecks}
          title="Rules"
          subtitle="Export or import rule categories and their rules"
        >
          <RulesBackupCard />
        </DataSection>

        <DataSection
          icon={NotebookPen}
          title="Journal"
          subtitle="Export trades as JSON or CSV, or import a journal file"
        >
          <JournalBackupCard />
        </DataSection>

        <DataSection
          icon={ClipboardPaste}
          title="Paste trades"
          subtitle="Bulk-add trades by pasting a table straight from your broker"
        >
          <PasteTradesCard
            accountTier={accountTier}
            onImportTrades={onImportPastedTrades}
            isImporting={isImportingPastedTrades}
          />
        </DataSection>
      </div>
    </div>
  );
}
