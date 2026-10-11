import React, { useState } from 'react';
import { Plus, X, Pencil, Trash2, Check, Sunrise } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import InfoHint from '@/components/ui/InfoHint';
import { useRules } from '@/lib/hooks/useRules';
import { getColorSwatch, pickNextRuleColor } from '@/lib/rules/utils';

// Authority order for rule categories — a higher level always overrides
// every level beneath it when two rules conflict.
const RULE_HIERARCHY_INFO = [
  'LEVEL 1 — CAPITAL PRESERVATION (Highest Authority)',
  '   ↓ overrides everything below',
  'LEVEL 2 — HARD "NO" RULES (Non-negotiable blockers)',
  '   ↓ overrides everything below',
  'LEVEL 3 — RISK MANAGEMENT (Size, max loss, max trades)',
  '   ↓ overrides everything below',
  'LEVEL 4 — TIMING / SESSION RULES (When you can trade)',
  '   ↓ overrides everything below',
  'LEVEL 5 — TRADE SELECTION & ENTRY/EXIT (What & how you trade)',
  '   ↓ overrides everything below',
  'LEVEL 6 — PSYCHOLOGY & MINDSET (How you feel)',
  '   ↓ overrides everything below',
  'LEVEL 7 — POST-TRADE / REVIEW (What you do after)',
].join('\n');

function PointerRow({ pointer, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pointer.text);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== pointer.text) onUpdate(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(pointer.text); setEditing(false); }
          }}
          onBlur={commit}
          className="h-8 bg-white/[0.04] border-white/12 text-sm"
        />
        <button type="button" onClick={commit} className="flex-shrink-0 p-1 rounded text-emerald-400/70 hover:text-emerald-300">
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
      <span className="flex-1 text-sm leading-relaxed text-white/85">- {pointer.text}</span>
      <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={() => setEditing(true)} className="p-1 rounded text-white/30 hover:text-cyan-300 hover:bg-cyan-500/10">
          <Pencil className="h-3 w-3" />
        </button>
        <button type="button" onClick={onDelete} className="p-1 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/10">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function CategoryCard({ category, onUpdate, onDelete, onAddPointer, onUpdatePointer, onDeletePointer }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(category.name);
  const [descriptionDraft, setDescriptionDraft] = useState(category.description);
  const [newPointer, setNewPointer] = useState('');
  const swatch = getColorSwatch(category.color);

  const startEditing = () => {
    setNameDraft(category.name);
    setDescriptionDraft(category.description);
    setIsEditing(true);
  };

  const finishEditing = () => {
    const trimmedName = nameDraft.trim();
    const trimmedDescription = descriptionDraft.trim();
    const updates = {};
    if (trimmedName && trimmedName !== category.name) updates.name = trimmedName;
    if (trimmedDescription !== category.description) updates.description = trimmedDescription;
    if (Object.keys(updates).length > 0) onUpdate(updates);
    setIsEditing(false);
  };

  const submitPointer = () => {
    const trimmed = newPointer.trim();
    if (!trimmed) return;
    onAddPointer(trimmed);
    setNewPointer('');
  };

  return (
    <div
      className={`rounded-2xl border p-5 space-y-3.5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.6)] bg-gradient-to-b from-white/[0.045] to-white/[0.015] ${swatch.className.split(' ').find((c) => c.startsWith('border-'))}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') finishEditing(); }}
              className="h-9 bg-white/[0.04] border-white/12 text-base font-semibold"
            />
          ) : (
            <p className="flex items-center gap-1.5 text-base font-semibold text-white/95">
              <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${swatch.dot}`} />
              {category.name}
            </p>
          )}

          {isEditing ? (
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              rows={2}
              placeholder="Add a description…"
              className="mt-1.5 w-full resize-none rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/30 focus:border-white/25"
            />
          ) : category.description ? (
            <p className="mt-1 text-sm leading-relaxed text-white/60">{category.description}</p>
          ) : null}

          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-wide text-white/30">{category.pointers.length} rule{category.pointers.length === 1 ? '' : 's'}</p>
            {isEditing ? (
              <button
                type="button"
                onClick={() => onUpdate({ daily_read: !category.daily_read })}
                title="Include this category's rules in the read-through shown when the app opens"
                className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors ${
                  category.daily_read
                    ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                    : 'border-white/12 text-white/30 hover:text-white/50'
                }`}
              >
                <Sunrise className="h-2.5 w-2.5" />
                Daily Read: {category.daily_read ? 'Yes' : 'No'}
              </button>
            ) : (
              <span className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                category.daily_read ? 'border-amber-400/30 bg-amber-500/10 text-amber-200' : 'border-white/12 text-white/30'
              }`}>
                <Sunrise className="h-2.5 w-2.5" />
                Daily Read: {category.daily_read ? 'Yes' : 'No'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-0.5">
          {isEditing ? (
            <button
              type="button"
              onClick={finishEditing}
              className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="p-1.5 rounded-lg text-white/25 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1 rounded-xl border border-white/8 bg-black/15 p-2.5">
        {category.pointers.length === 0 ? (
          <p className="px-2 py-1 text-sm text-white/25">No rules yet{isEditing ? ' — add one below.' : '.'}</p>
        ) : (
          category.pointers.map((pointer) => (
            isEditing ? (
              <PointerRow
                key={pointer.id}
                pointer={pointer}
                onUpdate={(text) => onUpdatePointer(pointer.id, text)}
                onDelete={() => onDeletePointer(pointer.id)}
              />
            ) : (
              <p key={pointer.id} className="px-2 py-1.5 text-sm leading-relaxed text-white/85">- {pointer.text}</p>
            )
          ))
        )}
      </div>

      {isEditing && (
        <div className="flex gap-2">
          <Input
            value={newPointer}
            onChange={(e) => setNewPointer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitPointer(); } }}
            placeholder="Add a rule…"
            className="h-9 flex-1 bg-white/[0.03] border-white/10 text-sm"
          />
          <Button
            type="button"
            size="sm"
            onClick={submitPointer}
            className="h-9 border border-white/12 bg-white/5 px-2.5 text-white/60 hover:bg-white/10"
            variant="ghost"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function RulesPage() {
  const {
    ruleCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addPointer,
    updatePointer,
    deletePointer,
  } = useRules();
  const [confirm, confirmDialog] = useConfirm();
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Enter a category name first');
      return;
    }
    try {
      await createCategory({ name: trimmed, color: pickNextRuleColor(ruleCategories) });
      setNewCategoryName('');
      toast.success('Rule category added');
    } catch (error) {
      toast.error(`Unable to add category: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteCategory = async (category) => {
    const shouldDelete = await confirm({
      title: `Delete "${category.name}"?`,
      description: `This removes the category and all ${category.pointers.length} rule(s) in it. This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!shouldDelete) return;

    try {
      await deleteCategory(category.id);
      toast.success('Rule category deleted');
    } catch (error) {
      toast.error(`Unable to delete category: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 text-white lg:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-semibold text-white">Rules</h1>
            <InfoHint text={RULE_HIERARCHY_INFO} />
          </div>
          <p className="mt-0.5 text-xs text-white/40">
            Group your trading rules into color-coded categories.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCategory(); }}
            placeholder="New category name…"
            className="h-9 w-56 bg-white/[0.03] border-white/12 text-sm"
          />
          <Button onClick={handleCreateCategory} className="h-9 bg-emerald-600/80 px-3 text-sm font-semibold hover:bg-emerald-600">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {ruleCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-12 text-center">
          <p className="text-lg font-semibold text-white">No rule categories yet</p>
          <p className="mt-1 text-sm text-white/50">Add a category above to start building your rule set.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ruleCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onUpdate={(updates) => updateCategory(category.id, updates)}
              onDelete={() => handleDeleteCategory(category)}
              onAddPointer={(text) => addPointer(category.id, text)}
              onUpdatePointer={(pointerId, text) => updatePointer(category.id, pointerId, text)}
              onDeletePointer={(pointerId) => deletePointer(category.id, pointerId)}
            />
          ))}
        </div>
      )}

      {confirmDialog}
    </div>
  );
}
