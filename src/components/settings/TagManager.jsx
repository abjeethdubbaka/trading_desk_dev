import React, { useState } from 'react';
import { Pencil, Trash2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { TagsService, normalizeTagName, tagNameKey } from '@/lib/services/TagsService';
import { cn } from '@/lib/utils/general';

/**
 * Single unified tag list: add new tags, toggle which ones are defaults,
 * rename, or delete — all from one place.
 */
export default function TagManager({ defaultTags = [], onChange }) {
  const [tags, setTags] = useState(() => TagsService.getAll());
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  const refresh = () => setTags(TagsService.getAll());
  const isDefault = (name) => defaultTags.some((n) => tagNameKey(n) === tagNameKey(name));

  const toggleDefault = (name) => {
    onChange(
      isDefault(name)
        ? defaultTags.filter((n) => tagNameKey(n) !== tagNameKey(name))
        : [...defaultTags, name]
    );
  };

  const addNewTag = () => {
    const normalized = normalizeTagName(newTagInput);
    if (!normalized) return;
    const tag = TagsService.findOrCreate(normalized);
    const finalName = tag?.name ?? normalized;
    if (!isDefault(finalName)) onChange([...defaultTags, finalName]);
    setNewTagInput('');
    refresh();
  };

  const startEdit = (tag) => {
    setEditingId(tag.id);
    setEditValue(tag.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const commitEdit = (tag) => {
    if (editValue.trim() === tag.name) {
      cancelEdit();
      return;
    }

    try {
      TagsService.rename(tag.id, editValue);
      const renamed = TagsService.getAll().find((t) => t.id === tag.id);
      if (renamed && renamed.name !== tag.name && isDefault(tag.name)) {
        onChange(defaultTags.map((n) => (tagNameKey(n) === tagNameKey(tag.name) ? renamed.name : n)));
      }
      refresh();
      cancelEdit();
    } catch (error) {
      toast.error(error?.message || 'Could not rename tag');
    }
  };

  const handleDelete = (tag) => {
    TagsService.delete(tag.id);
    if (isDefault(tag.name)) onChange(defaultTags.filter((n) => tagNameKey(n) !== tagNameKey(tag.name)));
    refresh();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <input
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addNewTag(); }
          }}
          placeholder="Add a tag…"
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/25 transition-colors"
        />
        <button
          type="button"
          onClick={addNewTag}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          title="Add tag"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {!tags.length ? (
        <p className="text-[11px] text-white/30 px-1 py-1">No tags yet — add one above.</p>
      ) : (
        <div className="space-y-0.5 max-h-48 overflow-y-auto rounded-md border border-white/10 bg-white/[0.02] p-1.5">
          {tags.map((tag) => {
            const checked = isDefault(tag.name);
            return (
              <div
                key={tag.id}
                className="flex items-center justify-between gap-2 px-1.5 py-1 rounded hover:bg-white/[0.04] group"
              >
                <button
                  type="button"
                  onClick={() => toggleDefault(tag.name)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  title={checked ? 'Remove from defaults' : 'Add to defaults'}
                >
                  <span className={cn(
                    'flex items-center justify-center w-3.5 h-3.5 rounded border flex-shrink-0 transition-colors',
                    checked ? 'bg-cyan-500 border-cyan-500' : 'border-white/20'
                  )}>
                    {checked && <Check className="w-2.5 h-2.5 text-black" />}
                  </span>

                  {editingId === tag.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => commitEdit(tag)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit(tag);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded px-1.5 py-0.5 text-[11px] text-white outline-none"
                    />
                  ) : (
                    <span className="text-[11px] font-medium truncate" style={{ color: tag.color }}>
                      {tag.name}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    className="p-1 rounded text-white/30 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                    title="Rename"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tag)}
                    className="p-1 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
