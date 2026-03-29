import React from 'react';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiPlus, FiBook, FiAward, FiTarget, FiGrid, FiList, FiX } from 'react-icons/fi';
import { CONSTANTS } from '../constants';

export function SearchAndFilters({ 
  searchQuery, 
  setSearchQuery, 
  showFilters, 
  setShowFilters,
  viewMode,
  setViewMode,
  selectedType,
  setSelectedType,
  selectedCategory,
  setSelectedCategory,
  selectedDifficulty,
  setSelectedDifficulty,
  sortBy,
  setSortBy,
  selectedTags,
  setSelectedTags,
  allTags,
  onCreateEntry,
  activeTab,
  setActiveTab,
  showLearningPath,
  setShowLearningPath
}) {
  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'knowledge'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FiBook className="inline mr-2" />
          Knowledge Base
        </button>
        <button
          onClick={() => setActiveTab('learning')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'learning'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FiAward className="inline mr-2" />
          Learning Hub
        </button>
        <button
          onClick={() => setShowLearningPath(!showLearningPath)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showLearningPath
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FiTarget className="inline mr-2" />
          Learning Path
        </button>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search entries..."
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
            onClick={onCreateEntry}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiPlus />
            Add Entry
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400'}`}
            >
              <FiGrid />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400'}`}
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="all" className="bg-[#0a0a0f]">All Types</option>
                <option value={CONSTANTS.ENTRY_TYPES.NOTE} className="bg-[#0a0a0f]">Note</option>
                <option value={CONSTANTS.ENTRY_TYPES.FORMULA} className="bg-[#0a0a0f]">Formula</option>
                <option value={CONSTANTS.ENTRY_TYPES.STRATEGY} className="bg-[#0a0a0f]">Strategy</option>
                <option value={CONSTANTS.ENTRY_TYPES.OBSERVATION} className="bg-[#0a0a0f]">Observation</option>
                <option value={CONSTANTS.ENTRY_TYPES.COURSE} className="bg-[#0a0a0f]">Course</option>
                <option value={CONSTANTS.ENTRY_TYPES.TUTORIAL} className="bg-[#0a0a0f]">Tutorial</option>
                <option value={CONSTANTS.ENTRY_TYPES.ARTICLE} className="bg-[#0a0a0f]">Article</option>
                <option value={CONSTANTS.ENTRY_TYPES.VIDEO} className="bg-[#0a0a0f]">Video</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="all" className="bg-[#0a0a0f]">All Categories</option>
                <option value={CONSTANTS.LEARNING_CATEGORIES.TECHNICAL_ANALYSIS} className="bg-[#0a0a0f]">Technical Analysis</option>
                <option value={CONSTANTS.LEARNING_CATEGORIES.FUNDAMENTAL_ANALYSIS} className="bg-[#0a0a0f]">Fundamental Analysis</option>
                <option value={CONSTANTS.LEARNING_CATEGORIES.RISK_MANAGEMENT} className="bg-[#0a0a0f]">Risk Management</option>
                <option value={CONSTANTS.LEARNING_CATEGORIES.TRADING_PSYCHOLOGY} className="bg-[#0a0a0f]">Trading Psychology</option>
                <option value={CONSTANTS.LEARNING_CATEGORIES.MARKET_STRUCTURE} className="bg-[#0a0a0f]">Market Structure</option>
                <option value={CONSTANTS.LEARNING_CATEGORIES.STRATEGY_DEVELOPMENT} className="bg-[#0a0a0f]">Strategy Development</option>
                <option value={CONSTANTS.LEARNING_CATEGORIES.PORTFOLIO_MANAGEMENT} className="bg-[#0a0a0f]">Portfolio Management</option>
                <option value={CONSTANTS.LEARNING_CATEGORIES.ALGORITHMIC_TRADING} className="bg-[#0a0a0f]">Algorithmic Trading</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="all" className="bg-[#0a0a0f]">All Levels</option>
                <option value={CONSTANTS.DIFFICULTY_LEVELS.BEGINNER} className="bg-[#0a0a0f]">Beginner</option>
                <option value={CONSTANTS.DIFFICULTY_LEVELS.INTERMEDIATE} className="bg-[#0a0a0f]">Intermediate</option>
                <option value={CONSTANTS.DIFFICULTY_LEVELS.ADVANCED} className="bg-[#0a0a0f]">Advanced</option>
                <option value={CONSTANTS.DIFFICULTY_LEVELS.EXPERT} className="bg-[#0a0a0f]">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value={CONSTANTS.SORT_OPTIONS.CREATED_DESC} className="bg-[#0a0a0f]">Newest First</option>
                <option value={CONSTANTS.SORT_OPTIONS.CREATED_ASC} className="bg-[#0a0a0f]">Oldest First</option>
                <option value={CONSTANTS.SORT_OPTIONS.UPDATED_DESC} className="bg-[#0a0a0f]">Recently Updated</option>
                <option value={CONSTANTS.SORT_OPTIONS.TITLE_ASC} className="bg-[#0a0a0f]">Title A-Z</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
            <select
              value=""
              onChange={(e) => {
                const tag = e.target.value;
                if (tag && !selectedTags.includes(tag)) {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="" className="bg-[#0a0a0f]">Add tag...</option>
              {allTags.map(tag => (
                <option key={tag} value={tag} className="bg-[#0a0a0f]">{tag}</option>
              ))}
            </select>
          </div>

          {selectedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm border border-emerald-500/30"
                >
                  {tag}
                  <button
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    className="hover:text-emerald-300"
                  >
                    <FiX />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


