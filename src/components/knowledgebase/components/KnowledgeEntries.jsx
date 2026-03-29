import React from 'react';
import { FiImage, FiCode } from 'react-icons/fi';
import { CONSTANTS } from '../constants';

export function KnowledgeEntries({ entries, onViewEntry }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {entries.map(entry => (
        <div
          key={entry.id}
          className="glass-card rounded-xl hover:shadow-lg transition-all cursor-pointer border border-white/10 hover:border-emerald-500/30"
          onClick={() => onViewEntry(entry)}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                entry.type === CONSTANTS.ENTRY_TYPES.NOTE ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                entry.type === CONSTANTS.ENTRY_TYPES.FORMULA ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                entry.type === CONSTANTS.ENTRY_TYPES.STRATEGY ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {entry.type}
              </span>
            </div>

            <p className="text-gray-300 mb-4 line-clamp-3">
              {entry.content}
            </p>

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {entry.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded border border-white/20">
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded border border-white/20">
                    +{entry.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>{new Date(entry.updatedAt).toLocaleDateString()}</span>
              <div className="flex gap-3">
                {entry.images && entry.images.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FiImage />
                    {entry.images.length}
                  </span>
                )}
                {entry.formulas && entry.formulas.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FiCode />
                    {entry.formulas.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


