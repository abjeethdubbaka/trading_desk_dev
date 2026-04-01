import { useState, useEffect, useCallback, useMemo } from 'react';
import { CONSTANTS } from '../constants';
import { migrateDataStructure, getDefaultLearningContent } from '../utils';

export function useKnowledgeBase() {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState(CONSTANTS.SORT_OPTIONS.CREATED_DESC);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load entries from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY);
      let data = stored ? JSON.parse(stored) : [];
      
      // Initialize default content only if completely empty
      if (data.length === 0) {
        const defaultLearningContent = getDefaultLearningContent();
        data = defaultLearningContent;
        // Save default content immediately
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
      
      setEntries(migrateDataStructure(data));
      setIsInitialized(true);
    } catch (error) {
      
      // On error, initialize with default content
      const defaultLearningContent = getDefaultLearningContent();
      setEntries(migrateDataStructure(defaultLearningContent));
      setIsInitialized(true);
    }
  }, []);

  // Save entries to localStorage (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE_KEY, JSON.stringify(entries));
      } catch (error) {
        
      }
    }
  }, [entries, isInitialized]);

  // Filter and sort entries
  useEffect(() => {
    let filtered = [...entries];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    // Search filter
    if (normalizedQuery) {
      filtered = filtered.filter(entry =>
        (entry.title || '').toLowerCase().includes(normalizedQuery) ||
        (entry.content || '').toLowerCase().includes(normalizedQuery) ||
        (entry.tags || []).some(tag => tag.toLowerCase().includes(normalizedQuery))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(entry => entry.type === selectedType);
    }

    // Learning category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(entry => entry.difficulty === selectedDifficulty);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(entry =>
        selectedTags.some(tag => entry.tags.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case CONSTANTS.SORT_OPTIONS.CREATED_DESC:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case CONSTANTS.SORT_OPTIONS.CREATED_ASC:
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case CONSTANTS.SORT_OPTIONS.UPDATED_DESC:
          return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
        case CONSTANTS.SORT_OPTIONS.UPDATED_ASC:
          return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
        case CONSTANTS.SORT_OPTIONS.TITLE_ASC:
          return String(a.title || '').localeCompare(String(b.title || ''));
        case CONSTANTS.SORT_OPTIONS.TITLE_DESC:
          return String(b.title || '').localeCompare(String(a.title || ''));
        default:
          return 0;
      }
    });

    setFilteredEntries(filtered);
  }, [entries, searchQuery, selectedType, selectedTags, sortBy, selectedCategory, selectedDifficulty]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    entries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [entries]);

  // Handle create entry
  const handleCreateEntry = useCallback(async (entryData) => {
    try {
      const newEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...entryData,
        title: String(entryData.title || '').trim(),
        content: String(entryData.content || '').trim(),
        tags: Array.from(new Set((entryData.tags || []).map((tag) => String(tag).trim()).filter(Boolean))),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0
      };

      setEntries(prev => {
        const updated = [newEntry, ...prev];
        if (process.env.NODE_ENV === 'development') {
          
          
        }
        return updated;
      });
      return newEntry;
    } catch (error) {
      
      throw error;
    }
  }, []);

  // Handle update entry
  const handleUpdateEntry = useCallback(async (id, updates) => {
    try {
      setEntries(prev => {
        const updated = prev.map(entry =>
          entry.id === id
            ? {
              ...entry,
              ...updates,
              title: updates.title != null ? String(updates.title).trim() : entry.title,
              content: updates.content != null ? String(updates.content).trim() : entry.content,
              tags: updates.tags
                ? Array.from(new Set(updates.tags.map((tag) => String(tag).trim()).filter(Boolean)))
                : entry.tags,
              updatedAt: new Date().toISOString(),
            }
            : entry
        );
        if (process.env.NODE_ENV === 'development') {
          
        }
        return updated;
      });
    } catch (error) {
      
      throw error;
    }
  }, []);

  // Handle delete entry
  const handleDeleteEntry = useCallback((id) => {
    try {
      setEntries(prev => {
        const updated = prev.filter(entry => entry.id !== id);
        if (process.env.NODE_ENV === 'development') {
          
          
        }
        return updated;
      });
    } catch (error) {
      
      throw error;
    }
  }, []);

  // Handle view entry
  const handleViewEntry = useCallback((entry) => {
    setEntries(prev => prev.map(e =>
      e.id === entry.id
        ? { ...e, viewCount: (e.viewCount || 0) + 1 }
        : e
    ));
    return entry;
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedTags([]);
    setSortBy(CONSTANTS.SORT_OPTIONS.CREATED_DESC);
    setSelectedCategory('all');
    setSelectedDifficulty('all');
  }, []);

  const resetToDefaults = useCallback(() => {
    setEntries(migrateDataStructure(getDefaultLearningContent()));
    clearFilters();
  }, [clearFilters]);

  const exportEntries = useCallback(() => ({
    exportedAt: new Date().toISOString(),
    total: entries.length,
    entries,
  }), [entries]);

  return {
    entries,
    filteredEntries,
    allTags,
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
    clearFilters,
    resetToDefaults,
    exportEntries,
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handleViewEntry
  };
}


