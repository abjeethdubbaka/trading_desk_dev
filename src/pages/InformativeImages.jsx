/**
 * @file src/pages/InformativeImages.jsx
 *
 * A gallery of chart setups/behaviors the user studied — images with a
 * category and a short note, browsable and filterable for quick recall.
 */

import React, { useMemo, useState } from 'react';
import { Images, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';
import AddImageModal from '@/components/informative-images/AddImageModal';
import ImageCard from '@/components/informative-images/ImageCard';
import { useInformativeImages } from '@/lib/hooks/useInformativeImages';
import { cn } from '@/lib/utils';

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'setup', label: 'Setup' },
  { value: 'other', label: 'Other' },
];

export default function InformativeImagesPage() {
  const { items, isLoading, addItem, isAdding, updateItem, isUpdating, deleteItem } = useInformativeImages();
  const [confirm, confirmDialog] = useConfirm();
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lightboxItem, setLightboxItem] = useState(null);

  const typeFilteredItems = useMemo(() => {
    if (selectedType === 'all') return items;
    return items.filter((item) => item.category_type === selectedType);
  }, [items, selectedType]);

  const categoryOptions = useMemo(() => {
    const unique = new Set(typeFilteredItems.map((item) => item.category).filter(Boolean));
    return [...unique].sort();
  }, [typeFilteredItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return typeFilteredItems;
    return typeFilteredItems.filter((item) => item.category === selectedCategory);
  }, [typeFilteredItems, selectedCategory]);

  const handleSelectType = (value) => {
    setSelectedType(value);
    setSelectedCategory('all');
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleSave = async ({ id, ...entry }) => {
    try {
      if (id) {
        await updateItem(id, entry);
        toast.success('Image updated');
      } else {
        await addItem(entry);
        toast.success('Image saved');
      }
      handleCloseModal();
    } catch (error) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    const shouldDelete = await confirm({
      title: 'Delete this image?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!shouldDelete) return;

    try {
      await deleteItem(id);
      toast.success('Image deleted');
    } catch (error) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-semibold text-white">Informative Images</h1>
        </div>

        <button
          type="button"
          onClick={() => { setEditingItem(null); setShowAddModal(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Image
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => handleSelectType(type.value)}
            className={cn(
              'rounded-lg border px-3 py-1 text-xs font-medium transition-colors',
              selectedType === type.value
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white/65'
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      {categoryOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'rounded-lg border px-3 py-1 text-xs font-medium transition-colors',
              selectedCategory === 'all'
                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white/65'
            )}
          >
            All categories
          </button>
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'rounded-lg border px-3 py-1 text-xs font-medium transition-colors',
                selectedCategory === category
                  ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white/65'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <Images className="h-8 w-8 text-white/15" />
          <p className="text-sm text-white/50">
            {items.length === 0 ? 'No images yet.' : 'No images in this category.'}
          </p>
          <p className="text-xs text-white/30">
            Save chart setups and behaviors you study so you can find them again later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => (
            <ImageCard
              key={item.id}
              item={item}
              onView={() => setLightboxItem(item)}
              onEdit={(target) => { setEditingItem(target); setShowAddModal(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddImageModal
        open={showAddModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        isSaving={isAdding || isUpdating}
        editingItem={editingItem}
      />

      <MultiImageLightbox
        isOpen={Boolean(lightboxItem)}
        images={Array.isArray(lightboxItem?.images) ? lightboxItem.images : []}
        onClose={() => setLightboxItem(null)}
      />

      {confirmDialog}
    </div>
  );
}
