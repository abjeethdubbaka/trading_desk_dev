import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchAndFilters } from './components/SearchAndFilters';
import { RuleCard } from './components/RuleCard';
import { EmptyState } from './components/EmptyState';
import { RuleModal } from './components/RuleModal';
import { Stats } from './components/Stats';
import { CATEGORIES } from './constants';
import { getDefaultItems } from './utils';
import { loadDosAndDontsItems, saveDosAndDontsItems } from './storage';

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

export default function DosAndDonts() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [sortBy, setSortBy] = useState('priority-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [items, setItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load items from localStorage
  useEffect(() => {
    setItems(loadDosAndDontsItems());
    setIsHydrated(true);
  }, []);

  // Save items to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    saveDosAndDontsItems(items);
  }, [items, isHydrated]);

  // Sync rules saved from other screens (e.g., Journal note -> Dos/Don't).
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncFromStorage = () => {
      setItems(loadDosAndDontsItems());
    };

    window.addEventListener('dosanddonts-updated', syncFromStorage);
    window.addEventListener('storage', syncFromStorage);

    return () => {
      window.removeEventListener('dosanddonts-updated', syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const list = items.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
      const matchesSearch = normalizedQuery.length === 0
        || (item.title || '').toLowerCase().includes(normalizedQuery)
        || (item.description || '').toLowerCase().includes(normalizedQuery)
        || (item.tags || []).some((tag) => String(tag).toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesType && matchesPriority && matchesSearch;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === 'priority-desc') {
        return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      }
      if (sortBy === 'priority-asc') {
        return (PRIORITY_WEIGHT[a.priority] || 0) - (PRIORITY_WEIGHT[b.priority] || 0);
      }
      if (sortBy === 'title-asc') {
        return String(a.title || '').localeCompare(String(b.title || ''));
      }
      if (sortBy === 'title-desc') {
        return String(b.title || '').localeCompare(String(a.title || ''));
      }
      if (sortBy === 'oldest') {
        return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
      }
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });

    return sorted;
  }, [items, selectedCategory, selectedType, selectedPriority, searchQuery, sortBy]);

  const hasActiveFilters = selectedCategory !== 'all'
    || selectedType !== 'all'
    || selectedPriority !== 'all'
    || searchQuery.trim().length > 0
    || sortBy !== 'priority-desc';

  const handleClearFilters = useCallback(() => {
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedPriority('all');
    setSortBy('priority-desc');
    setSearchQuery('');
  }, []);

  const handleResetDefaults = useCallback(() => {
    if (!confirm('Reset all rules to defaults? Your custom rules will be replaced.')) return;
    setItems(getDefaultItems());
  }, []);

  const handleExportRules = useCallback(() => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      total: items.length,
      items,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `dos-and-donts-${new Date().toISOString().slice(0, 10)}.json`,
    });
    link.click();
  }, [items]);

  const handleAddItem = (newItem) => {
    const item = {
      ...newItem,
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      usage_count: Number(newItem?.usage_count) || 0,
      last_used_at: newItem?.last_used_at || null,
    };
    setItems((prev) => [...prev, item]);
    setShowAddForm(false);
  };

  const handleEditItem = (updatedItem) => {
    setItems((prev) => prev.map(item => {
      if (item.id === updatedItem.id) {
        // Preserve the original icon if it exists and the updated item doesn't have one
        const iconToUse = updatedItem.icon || item.icon;
        return { 
          ...updatedItem, 
          updatedAt: new Date().toISOString(),
          icon: iconToUse,
          usage_count: Number(updatedItem?.usage_count ?? item?.usage_count) || 0,
          last_used_at: updatedItem?.last_used_at || item?.last_used_at || null,
        };
      }
      return item;
    }));
    setIsEditing(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems((prev) => prev.filter(item => item.id !== id));
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setIsEditing(true);
  };

  const handleAddRule = () => {
    setShowAddForm(true);
  };

  const handleModalCancel = () => {
    setShowAddForm(false);
    setIsEditing(false);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 lg:p-8">
      <SearchAndFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        sortBy={sortBy}
        setSortBy={setSortBy}
        hasActiveFilters={hasActiveFilters}
        categories={CATEGORIES}
        onAddRule={handleAddRule}
        onClearFilters={handleClearFilters}
        onExportRules={handleExportRules}
        onResetDefaults={handleResetDefaults}
      />

      <Stats items={filteredItems} totalItems={items.length} allItems={items} />

      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-white/50">
          Showing {filteredItems.length} of {items.length} rules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredItems.map(item => (
          <RuleCard
            key={item.id}
            item={item}
            onEdit={handleEditClick}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <EmptyState 
          searchQuery={searchQuery} 
          selectedCategory={selectedCategory}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {(showAddForm || isEditing) && (
        <RuleModal
          item={editingItem}
          categories={CATEGORIES.filter(cat => cat.value !== 'all')}
          onSave={isEditing ? handleEditItem : handleAddItem}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
}


