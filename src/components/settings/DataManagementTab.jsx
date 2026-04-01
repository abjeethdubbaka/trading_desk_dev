import React from 'react';

export default function DataManagementTab({
  exportCSV,
  handleMigrateTrades,
  handleClearAndReinit,
  handleClearLocalCache,
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-white/70">Data management</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={exportCSV}
          className="flex flex-col items-start gap-1 border border-white/10 bg-white/5 hover:bg-white/8 rounded-xl p-4 transition-colors text-left"
        >
          <span className="text-sm font-semibold text-white">Export trades CSV</span>
          <span className="text-xs text-white/40">All journal trades as spreadsheet</span>
        </button>

        <button
          onClick={handleMigrateTrades}
          className="flex flex-col items-start gap-1 bg-blue-500/8 hover:bg-blue-500/12 border border-blue-500/20 rounded-xl p-4 transition-colors text-left"
        >
          <span className="text-sm font-semibold text-blue-300">Migrate Trades to 25K</span>
          <span className="text-xs text-white/40">Assign existing trades to 25K account tier</span>
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

