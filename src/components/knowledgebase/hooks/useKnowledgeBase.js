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
      console.error('Failed to load knowledge base:', error);
      // On error, initialize with default content
      const defaultLearningContent = getDefaultLearningContent();
      setEntries(migrateDataStructure(defaultLearningContent));
      setIsInitialized(true);
    }
  }, []);

  // Save entries to localStorage (only after initialization)
  useEffect(() => {
    if (isInitialized && entries.length > 0) {
      try {
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE_KEY, JSON.stringify(entries));
      } catch (error) {
        console.error('Failed to save knowledge base:', error);
      }
    }
  }, [entries, isInitialized]);

  // Filter and sort entries
  useEffect(() => {
    let filtered = entries;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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
          return new Date(b.createdAt) - new Date(a.createdAt);
        case CONSTANTS.SORT_OPTIONS.CREATED_ASC:
          return new Date(a.createdAt) - new Date(b.createdAt);
        case CONSTANTS.SORT_OPTIONS.UPDATED_DESC:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case CONSTANTS.SORT_OPTIONS.UPDATED_ASC:
          return new Date(a.updatedAt) - new Date(b.updatedAt);
        case CONSTANTS.SORT_OPTIONS.TITLE_ASC:
          return a.title.localeCompare(b.title);
        case CONSTANTS.SORT_OPTIONS.TITLE_DESC:
          return b.title.localeCompare(a.title);
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
        id: Date.now().toString(),
        ...entryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0
      };

      setEntries(prev => {
        const updated = [newEntry, ...prev];
        if (process.env.NODE_ENV === 'development') {
          console.log('📚 Knowledge Base: Created entry', newEntry);
          console.log('📚 Knowledge Base: Total entries', updated.length);
        }
        return updated;
      });
      return newEntry;
    } catch (error) {
      console.error('Failed to create knowledge base entry:', error);
      throw error;
    }
  }, []);

  // Handle update entry
  const handleUpdateEntry = useCallback(async (id, updates) => {
    try {
      setEntries(prev => {
        const updated = prev.map(entry =>
          entry.id === id
            ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
            : entry
        );
        if (process.env.NODE_ENV === 'development') {
          console.log('📚 Knowledge Base: Updated entry', { id, updates });
        }
        return updated;
      });
    } catch (error) {
      console.error('Failed to update knowledge base entry:', error);
      throw error;
    }
  }, []);

  // Handle delete entry
  const handleDeleteEntry = useCallback((id) => {
    try {
      setEntries(prev => {
        const updated = prev.filter(entry => entry.id !== id);
        if (process.env.NODE_ENV === 'development') {
          console.log('📚 Knowledge Base: Deleted entry', id);
          console.log('📚 Knowledge Base: Total entries', updated.length);
        }
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete knowledge base entry:', error);
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
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handleViewEntry
  };
}
