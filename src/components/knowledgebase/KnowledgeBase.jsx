import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { SearchAndFilters } from './components/SearchAndFilters';
import { LearningStats } from './components/LearningStats';
import { LearningPath } from './components/LearningPath';
import { KnowledgeEntries } from './components/KnowledgeEntries';
import { LearningEntries as LearningContent } from './components/LearningEntries';
import { EmptyState } from './components/EmptyState';
import { EntryModal } from './components/EntryModal';
import { ViewModal } from './components/ViewModal';
import { useKnowledgeBase } from './hooks/useKnowledgeBase';
import { useLearningProgress } from './hooks/useLearningProgress';

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState('knowledge');
  const [showLearningPath, setShowLearningPath] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const knowledgeBase = useKnowledgeBase();
  const learningProgress = useLearningProgress();

  const {
    entries,
    filteredEntries,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedTags,
    setSelectedTags,
    sortBy,
    setSortBy,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    allTags,
    clearFilters,
    resetToDefaults,
    exportEntries,
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handleViewEntry
  } = knowledgeBase;

  const {
    handleEnrollCourse,
    handleModuleComplete,
    getCourseProgress,
    getLearningStats
  } = learningProgress;

  const handleCreateEntryClick = () => {
    setIsCreating(true);
  };

  const handleSaveEntry = async (entryData) => {
    if (editingEntry) {
      await handleUpdateEntry(editingEntry.id, entryData);
    } else {
      await handleCreateEntry(entryData);
    }
    setIsCreating(false);
    setEditingEntry(null);
  };

  const handleViewEntryClick = (entry) => {
    const viewedEntry = handleViewEntry(entry);
    setViewingEntry(viewedEntry);
  };

  const handleEditEntry = () => {
    setEditingEntry(viewingEntry);
    setViewingEntry(null);
    setIsCreating(true);
  };

  const handleDeleteEntryClick = (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      handleDeleteEntry(id);
      setViewingEntry(null);
    }
  };

  const handleModuleCompleteClick = (courseId, moduleId) => {
    handleModuleComplete(courseId, moduleId, filteredEntries);
  };

  // Filter entries based on active tab
  const knowledgeEntries = filteredEntries.filter(entry => 
    !['course', 'tutorial', 'video', 'article'].includes(entry.type)
  );
  
  const learningEntries = filteredEntries.filter(entry => 
    ['course', 'tutorial', 'video', 'article'].includes(entry.type)
  );

  const currentEntries = activeTab === 'knowledge' ? knowledgeEntries : learningEntries;
  const learningStats = getLearningStats(filteredEntries);
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedDifficulty !== 'all' ||
    selectedTags.length > 0
  );
  const entryCounts = useMemo(() => ({
    total: filteredEntries.length,
    all: entries.length,
    knowledge: knowledgeEntries.length,
    learning: learningEntries.length,
  }), [filteredEntries.length, entries.length, knowledgeEntries.length, learningEntries.length]);

  const handleExportEntries = () => {
    const payload = exportEntries();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `knowledge-base-${new Date().toISOString().slice(0, 10)}.json`,
    });
    link.click();
  };

  const handleResetDefaults = () => {
    if (!confirm('Reset Knowledge Base to default entries? This will replace current entries.')) return;
    resetToDefaults();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 lg:p-8">
      <Header>
        <SearchAndFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          allTags={allTags}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          onExportEntries={handleExportEntries}
          onResetDefaults={handleResetDefaults}
          onCreateEntry={handleCreateEntryClick}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showLearningPath={showLearningPath}
          setShowLearningPath={setShowLearningPath}
        />
      </Header>

      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-white/50">
          Showing {entryCounts.total} of {entryCounts.all} entries
          <span className="mx-2 text-white/25">|</span>
          Knowledge {entryCounts.knowledge}
          <span className="mx-2 text-white/25">|</span>
          Learning {entryCounts.learning}
        </p>
      </div>

      {/* Learning Stats Dashboard */}
      {activeTab === 'learning' && (
        <LearningStats stats={learningStats} />
      )}

      {/* Learning Path View */}
      {showLearningPath && (
        <LearningPath />
      )}

      {/* Content Display */}
      {currentEntries.length > 0 ? (
        activeTab === 'knowledge' ? (
          <KnowledgeEntries 
            entries={knowledgeEntries}
            onViewEntry={handleViewEntryClick}
            viewMode={viewMode}
          />
        ) : (
          <LearningContent 
            entries={learningEntries}
            onViewEntry={handleViewEntryClick}
            onEnrollCourse={handleEnrollCourse}
            getCourseProgress={getCourseProgress}
            viewMode={viewMode}
          />
        )
      ) : (
        <EmptyState 
          searchQuery={searchQuery}
          selectedType={selectedType}
          selectedTags={selectedTags}
          selectedCategory={selectedCategory}
          selectedDifficulty={selectedDifficulty}
          activeTab={activeTab}
          onCreateEntry={handleCreateEntryClick}
        />
      )}

      {/* Modals */}
      {(isCreating || editingEntry) && (
        <EntryModal
          entry={editingEntry}
          onSave={handleSaveEntry}
          onCancel={() => {
            setIsCreating(false);
            setEditingEntry(null);
          }}
        />
      )}

      {viewingEntry && (
        <ViewModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={handleEditEntry}
          onDelete={() => handleDeleteEntryClick(viewingEntry.id)}
          onEnroll={handleEnrollCourse}
          onModuleComplete={handleModuleCompleteClick}
          progress={getCourseProgress(viewingEntry.id)}
        />
      )}
    </div>
  );
}


