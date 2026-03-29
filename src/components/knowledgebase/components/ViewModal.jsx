import React from 'react';
import { FiX, FiEdit2, FiTrash2, FiPlay, FiCheck, FiClock } from 'react-icons/fi';
import katex from 'katex';
import { CONSTANTS } from '../constants';

export function ViewModal({ entry, onClose, onEdit, onDelete, onEnroll, onModuleComplete, progress }) {
  const isLearningContent = ['course', 'tutorial', 'video', 'article'].includes(entry.type);
  const isEnrolled = progress?.enrolled;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{entry.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  entry.type === CONSTANTS.ENTRY_TYPES.NOTE ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                  entry.type === CONSTANTS.ENTRY_TYPES.FORMULA ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  entry.type === CONSTANTS.ENTRY_TYPES.STRATEGY ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  entry.type === CONSTANTS.ENTRY_TYPES.COURSE ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  entry.type === CONSTANTS.ENTRY_TYPES.TUTORIAL ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  entry.type === CONSTANTS.ENTRY_TYPES.VIDEO ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {entry.type}
                </span>
                {entry.difficulty && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    entry.difficulty === CONSTANTS.DIFFICULTY_LEVELS.BEGINNER ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    entry.difficulty === CONSTANTS.DIFFICULTY_LEVELS.INTERMEDIATE ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    entry.difficulty === CONSTANTS.DIFFICULTY_LEVELS.ADVANCED ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {entry.difficulty}
                  </span>
                )}
                {entry.duration && (
                  <span className="flex items-center gap-1">
                    <FiClock />
                    {entry.duration}
                  </span>
                )}
                {entry.category && (
                  <span>{entry.category.replace('-', ' ').toUpperCase()}</span>
                )}
                <span>Created: {new Date(entry.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(entry.updatedAt).toLocaleDateString()}</span>
                <span>Views: {entry.viewCount || 0}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <FiX />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-300 whitespace-pre-wrap">{entry.content}</p>
          </div>

          {/* Course Modules */}
          {entry.modules && entry.modules.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Course Modules</h3>
              <div className="space-y-3">
                {entry.modules.map((module, index) => {
                  const isCompleted = progress?.completedModules?.includes(module.id);
                  return (
                    <div key={module.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500'
                        }`}>
                          {isCompleted && <FiCheck className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-white">{module.title}</p>
                          <p className="text-sm text-gray-400">{module.duration}</p>
                        </div>
                      </div>
                      {isEnrolled && (
                        <button
                          onClick={() => onModuleComplete(entry.id, module.id)}
                          className={`px-3 py-1 text-sm rounded ${
                            isCompleted 
                              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' 
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Mark Complete'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {isEnrolled && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round(progress?.overallProgress || 0)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress?.overallProgress || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm border border-emerald-500/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {entry.images && entry.images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Images</h3>
              <div className="grid grid-cols-2 gap-4">
                {entry.images.map(image => (
                  <img
                    key={image.id}
                    src={image.dataURL}
                    alt={image.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {entry.formulas && entry.formulas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Formulas</h3>
              <div className="space-y-4">
                {entry.formulas.map(formula => (
                  <div key={formula.id} className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                    <div className="text-white" dangerouslySetInnerHTML={{ __html: katex.renderToString(formula.latex, { throwOnError: false }) }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <FiEdit2 />
                Edit
              </button>
              <button
                onClick={() => onDelete(entry.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <FiTrash2 />
                Delete
              </button>
            </div>
            
            {isLearningContent && !isEnrolled && (
              <button
                onClick={() => onEnroll(entry.id)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <FiPlay />
                Enroll in Course
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


