import React from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiEye } from 'react-icons/fi';

export function Stats({ items, totalItems = items.length, allItems = items }) {
  const mostUsed = [...allItems]
    .sort((a, b) => (Number(b?.usage_count) || 0) - (Number(a?.usage_count) || 0))[0];
  const mostUsedCount = Number(mostUsed?.usage_count) || 0;

  const stats = {
    dos: items.filter(item => item.type === 'do').length,
    donts: items.filter(item => item.type === 'dont').length,
    highPriority: items.filter(item => item.priority === 'high').length,
    total: items.length,
    overall: totalItems,
    totalUsage: allItems.reduce((sum, item) => sum + (Number(item?.usage_count) || 0), 0),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <FiCheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Do\'s</p>
            <p className="text-2xl font-bold text-white">{stats.dos}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <FiXCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Don\'ts</p>
            <p className="text-2xl font-bold text-white">{stats.donts}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <FiAlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">High Priority</p>
            <p className="text-2xl font-bold text-white">{stats.highPriority}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FiEye className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Rules</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            {stats.total !== stats.overall && (
              <p className="text-[11px] text-white/35">of {stats.overall}</p>
            )}
            <p className="text-[11px] text-white/45 mt-0.5">Uses: {stats.totalUsage}</p>
            <p className="text-[11px] text-white/35">
              {mostUsed && mostUsedCount > 0
                ? `Top used: ${mostUsed.title} (${mostUsedCount}x)`
                : 'Top used: none yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


