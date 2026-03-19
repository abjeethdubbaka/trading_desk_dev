import React, { useState, useEffect } from 'react';
import { SearchAndFilters } from './components/SearchAndFilters';
import { RuleCard } from './components/RuleCard';
import { EmptyState } from './components/EmptyState';
import { RuleModal } from './components/RuleModal';
import { CATEGORIES } from './constants';
import { getDefaultItems } from './utils';

export default function DosAndDonts() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [items, setItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dosAndDonts');
      const data = stored ? JSON.parse(stored) : getDefaultItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load dos and donts:', error);
      setItems(getDefaultItems());
    }
  }, []);

  // Save items to localStorage
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('dosAndDonts', JSON.stringify(items));
    }
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = (newItem) => {
    const item = {
      ...newItem,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setItems([...items, item]);
    setShowAddForm(false);
  };

  const handleEditItem = (updatedItem) => {
    setItems(items.map(item => {
      if (item.id === updatedItem.id) {
        // Preserve the original icon if it exists and the updated item doesn't have one
        const iconToUse = updatedItem.icon || item.icon;
        return { 
          ...updatedItem, 
          updatedAt: new Date().toISOString(),
          icon: iconToUse
        };
      }
      return item;
    }));
    setIsEditing(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(item => item.id !== id));
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
        categories={CATEGORIES}
        onAddRule={handleAddRule}
      />

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
