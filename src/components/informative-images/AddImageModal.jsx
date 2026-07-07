import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { imageFileToDataUrl } from '@/components/journal/shared/media/imageUtils';
import { DEFAULT_INFORMATIVE_IMAGE_CATEGORIES } from '@/lib/constants/informativeImageCategories';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import { useSettings } from '@/lib/context/SettingsContext';

const CATEGORY_TYPES = [
  { value: 'setup', label: 'Setup' },
  { value: 'other', label: 'Other' },
];

export default function AddImageModal({ open, onClose, onSave, isSaving, editingItem = null }) {
  const { playbookEntries } = usePlaybook();
  const { settings } = useSettings();
  const otherCategoryOptions = Array.isArray(settings?.informative_image_categories) && settings.informative_image_categories.length > 0
    ? settings.informative_image_categories
    : DEFAULT_INFORMATIVE_IMAGE_CATEGORIES;
  const setupOptions = playbookEntries.filter((entry) => entry.is_active !== false).map((entry) => entry.name);
  const isEditing = Boolean(editingItem);

  const [images, setImages] = useState([]);
  const [categoryType, setCategoryType] = useState('setup');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [converting, setConverting] = useState(false);

  const categoryOptions = categoryType === 'setup' ? setupOptions : otherCategoryOptions;

  // Prefill from the entry being edited each time the modal opens.
  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      setImages(Array.isArray(editingItem.images) ? editingItem.images : []);
      setCategoryType(editingItem.category_type === 'other' ? 'other' : 'setup');
      setCategory(editingItem.category || '');
      setNote(editingItem.note || '');
    } else {
      setImages([]);
      setCategoryType('setup');
      setCategory('');
      setNote('');
    }
  }, [open, editingItem]);

  const handleCategoryTypeChange = (value) => {
    setCategoryType(value);
    setCategory('');
  };

  const handleClose = () => {
    onClose();
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setConverting(true);
    try {
      const dataUrls = await Promise.all(files.map((file) => imageFileToDataUrl(file)));
      setImages((prev) => [...prev, ...dataUrls]);
    } finally {
      setConverting(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (images.length === 0 || !category) return;

    await onSave({
      id: editingItem?.id ?? null,
      images,
      category,
      category_type: categoryType,
      note: note.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Informative Image' : 'Add Informative Image'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? 'Edit this image entry.' : 'Upload chart images you studied, with a category and note.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative group w-16 h-16">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-md border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className={cn(
                'w-16 h-16 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer transition-all flex-shrink-0',
                converting ? 'border-white/10 bg-white/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              )}>
                {converting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                ) : (
                  <Upload className="w-4 h-4 text-white/50" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={converting}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-1">
              {CATEGORY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleCategoryTypeChange(type.value)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    categoryType === type.value
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                      : 'text-white/45 hover:text-white/70'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{categoryType === 'setup' ? 'Setup' : 'Category'}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder={categoryType === 'setup' ? 'Select setup' : 'Select category'} />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                {categoryOptions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-white/40">
                    {categoryType === 'setup' ? 'No playbook setups yet.' : 'No categories configured.'}
                  </div>
                ) : (
                  categoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What does this show? What should you remember?"
              className="bg-white/5 border-white/10 min-h-[80px] resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={handleClose} className="hover:bg-white/10">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={images.length === 0 || isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 transition-all min-w-[100px]"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
