import React from 'react';
import PasteTradesCard from '@/components/settings/PasteTradesCard';
import BackupRestoreCard from '@/components/settings/BackupRestoreCard';

export default function DataManagementTab({
  handleReEnrichTrades,
  handleClearAndReinit,
  handleClearLocalCache,
  isReEnriching = false,
  accountTier = 'custom',
  onImportPastedTrades,
  isImportingPastedTrades = false,
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-white/70">Data management</h2>

      <BackupRestoreCard />

      <PasteTradesCard
        accountTier={accountTier}
        onImportTrades={onImportPastedTrades}
        isImporting={isImportingPastedTrades}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleReEnrichTrades}
          disabled={isReEnriching}
          className="flex flex-col items-start gap-1 bg-cyan-500/8 hover:bg-cyan-500/12 disabled:opacity-60 disabled:cursor-not-allowed border border-cyan-500/20 rounded-xl p-4 transition-colors text-left"
        >
          <span className="text-sm font-semibold text-cyan-300">
            {isReEnriching ? 'Re-enriching trades...' : 'Re-enrich Trades'}
          </span>
          <span className="text-xs text-white/40">
            Backfill share-float + float range on existing journal trades
          </span>
        </button>

        <button
          onClick={handleClearAndReinit}
          className="flex flex-col items-start gap-1 bg-orange-500/8 hover:bg-orange-500/12 border border-orange-500/20 rounded-xl p-4 transition-colors text-left"
        >
          <span className="text-sm font-semibold text-orange-300">Reset Settings</span>
          <span className="text-xs text-white/40">Clear all settings and reinitialize with defaults</span>
        </button>

        <button
          onClick={handleClearLocalCache}
          className="flex flex-col items-start gap-1 bg-red-500/8 hover:bg-red-500/12 border border-red-500/20 rounded-xl p-4 transition-colors text-left"
        >
          <span className="text-sm font-semibold text-red-300">Clear local cache</span>
          <span className="text-xs text-white/40">Removes localStorage - Firebase data stays safe</span>
        </button>
      </div>
    </div>
  );
}
