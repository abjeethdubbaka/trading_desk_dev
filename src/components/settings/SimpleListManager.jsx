import React, { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Generic manager for a flat list of strings (add, rename, delete).
 * Used for things like Exit Reasons where there's no color/dedup complexity
 * like the tag system has — just an ordered list of plain values.
 */
export default function SimpleListManager({ items = [], onChange, placeholder = 'Add an option…' }) {
  const [newItemInput, setNewItemInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  const addItem = () => {
    const trimmed = newItemInput.trim();
    if (!trimmed) return;
    if (items.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" already exists`);
      return;
    }
    onChange([...items, trimmed]);
    setNewItemInput('');
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const commitEdit = (index) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }

    const conflict = items.some((item, i) => i !== index && item.toLowerCase() === trimmed.toLowerCase());
    if (conflict) {
      toast.error(`"${trimmed}" already exists`);
      return;
    }

    onChange(items.map((item, i) => (i === index ? trimmed : item)));
    cancelEdit();
  };

  const deleteItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <input
          value={newItemInput}
          onChange={(e) => setNewItemInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addItem(); }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/25 transition-colors"
        />
        <button
          type="button"
          onClick={addItem}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          title="Add"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {!items.length ? (
        <p className="text-[11px] text-white/30 px-1 py-1">No options yet — add one above.</p>
      ) : (
        <div className="space-y-0.5 max-h-48 overflow-y-auto rounded-md border border-white/10 bg-white/[0.02] p-1.5">
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center justify-between gap-2 px-1.5 py-1 rounded hover:bg-white/[0.04] group"
            >
              {editingIndex === index ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(index);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded px-1.5 py-0.5 text-[11px] text-white outline-none"
                />
              ) : (
                <span className="text-[11px] font-medium text-white/80 truncate">{item}</span>
              )}

              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => startEdit(index)}
                  className="p-1 rounded text-white/30 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                  title="Rename"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem(index)}
                  className="p-1 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
