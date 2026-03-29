import React from 'react';
import { FiBook } from 'react-icons/fi';

export function EmptyState({ searchQuery, selectedType, selectedTags, activeTab, onCreateEntry }) {
  const hasFilters = searchQuery || selectedType !== 'all' || selectedTags.length > 0;
  
  return (
    <div className="text-center py-12">
      <FiBook className="mx-auto text-4xl text-gray-500 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">No entries found</h3>
      <p className="text-gray-400 mb-4">
        {hasFilters
          ? 'Try adjusting your filters or search query'
          : activeTab === 'learning' 
            ? 'Get started by exploring our learning courses'
            : 'Get started by creating your first knowledge base entry'}
      </p>
      {!hasFilters && activeTab !== 'learning' && (
        <button
          onClick={onCreateEntry}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          Create First Entry
        </button>
      )}
    </div>
  );
}


