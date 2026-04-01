import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

export function EmptyState({ searchQuery, selectedCategory, hasActiveFilters = false }) {
  return (
    <div className="text-center py-12">
      <FiAlertTriangle className="mx-auto text-4xl text-gray-500 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">No rules found</h3>
      <p className="text-gray-400">
        {searchQuery || selectedCategory !== 'all' || hasActiveFilters
          ? 'Try adjusting your filters, search query, or sorting'
          : 'Get started by adding your first trading rule'}
      </p>
    </div>
  );
}


