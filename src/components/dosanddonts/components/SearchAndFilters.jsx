import React from 'react';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiPlus, FiRefreshCw, FiDownload } from 'react-icons/fi';

export function SearchAndFilters({ 
  searchQuery, 
  setSearchQuery, 
  showFilters, 
  setShowFilters,
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  selectedPriority,
  setSelectedPriority,
  sortBy,
  setSortBy,
  hasActiveFilters,
  categories,
  onAddRule,
  onClearFilters,
  onExportRules,
  onResetDefaults
}) {
  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white"
          >
            <FiFilter />
            Filters
            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          
          <button
            onClick={onAddRule}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiPlus />
            Add Rule
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value} className="bg-[#0a0a0f]">
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="all" className="bg-[#0a0a0f]">All</option>
                <option value="do" className="bg-[#0a0a0f]">Do</option>
                <option value="dont" className="bg-[#0a0a0f]">Don't</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="all" className="bg-[#0a0a0f]">All</option>
                <option value="high" className="bg-[#0a0a0f]">High</option>
                <option value="medium" className="bg-[#0a0a0f]">Medium</option>
                <option value="low" className="bg-[#0a0a0f]">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="priority-desc" className="bg-[#0a0a0f]">Priority (High to Low)</option>
                <option value="priority-asc" className="bg-[#0a0a0f]">Priority (Low to High)</option>
                <option value="newest" className="bg-[#0a0a0f]">Newest</option>
                <option value="oldest" className="bg-[#0a0a0f]">Oldest</option>
                <option value="title-asc" className="bg-[#0a0a0f]">Title A-Z</option>
                <option value="title-desc" className="bg-[#0a0a0f]">Title Z-A</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
            >
              <FiRefreshCw />
              Clear Filters
            </button>
            <button
              onClick={onExportRules}
              className="flex items-center gap-2 px-3 py-1.5 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/10 text-sm"
            >
              <FiDownload />
              Export JSON
            </button>
            <button
              onClick={onResetDefaults}
              className="px-3 py-1.5 border border-orange-500/30 text-orange-300 rounded-lg hover:bg-orange-500/10 text-sm"
            >
              Reset Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


