import React from 'react';
import { FiClock, FiPlay } from 'react-icons/fi';
import { CONSTANTS } from '../constants';

export function LearningEntries({ entries, onViewEntry, onEnrollCourse, getCourseProgress, viewMode = 'grid' }) {
  return (
    <div className={viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
      {entries.map(entry => {
        const progress = getCourseProgress(entry.id);
        const isEnrolled = progress.enrolled;
        
        return (
          <div
            key={entry.id}
            className="glass-card rounded-xl hover:shadow-lg transition-all cursor-pointer border border-white/10 hover:border-emerald-500/30"
            onClick={() => onViewEntry(entry)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    entry.difficulty === CONSTANTS.DIFFICULTY_LEVELS.BEGINNER ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    entry.difficulty === CONSTANTS.DIFFICULTY_LEVELS.INTERMEDIATE ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    entry.difficulty === CONSTANTS.DIFFICULTY_LEVELS.ADVANCED ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {entry.difficulty}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    entry.type === CONSTANTS.ENTRY_TYPES.COURSE ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    entry.type === CONSTANTS.ENTRY_TYPES.TUTORIAL ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    entry.type === CONSTANTS.ENTRY_TYPES.VIDEO ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {entry.type}
                  </span>
                </div>
              </div>

              <p className={`text-gray-300 mb-4 ${viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                {entry.content}
              </p>

              {entry.duration && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <FiClock />
                  {entry.duration}
                </div>
              )}

              {entry.modules && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(progress.overallProgress || 0)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress.overallProgress || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {entry.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded border border-white/20">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {entry.category?.replace('-', ' ').toUpperCase()}
                </span>
                {!isEnrolled ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEnrollCourse(entry.id);
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                  >
                    Enroll
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewEntry(entry);
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                  >
                    {progress.overallProgress === 100 ? 'Review' : 'Continue'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


