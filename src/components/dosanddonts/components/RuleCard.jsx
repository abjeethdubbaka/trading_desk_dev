import React from 'react';
import { FiEdit2, FiXCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { getPriorityColor } from '../utils';

export function RuleCard({ item, onEdit, onDelete }) {
  // Fallback icon if item.icon is undefined (can happen with localStorage data)
  const IconComponent = item.icon || (item.type === 'do' ? FiCheckCircle : FiAlertTriangle);
  
  return (
    <div
      className={`glass-card rounded-xl hover:shadow-lg transition-all border border-white/10 hover:border-emerald-500/30 ${
        item.type === 'do' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'
      }`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              item.type === 'do' ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              {React.createElement(IconComponent, {
                className: `w-5 h-5 ${
                  item.type === 'do' ? 'text-emerald-400' : 'text-red-400'
                }`
              })}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                {item.priority} priority
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(item)}
              className="p-1 text-gray-400 hover:text-emerald-400"
            >
              <FiEdit2 />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 text-gray-400 hover:text-red-400"
            >
              <FiXCircle />
            </button>
          </div>
        </div>

        <p className="text-gray-300 mb-4">{item.description}</p>

        {item.examples && item.examples.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2">Examples:</h4>
            <ul className="space-y-1">
              {item.examples.map((example, index) => (
                <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded border border-white/20"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


