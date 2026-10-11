import { useCallback, useMemo } from 'react';
import { useSettings } from '@/lib/context/SettingsContext';
import {
  RULES_FIELD,
  normalizeRuleCategories,
  normalizeRuleCategory,
} from '@/lib/rules/utils';

export function useRules() {
  const { settings, saveImmediately, isSaving, saveError } = useSettings();

  const ruleCategories = useMemo(
    () => normalizeRuleCategories(settings?.[RULES_FIELD]),
    [settings]
  );

  const persistCategories = useCallback(async (categories) => {
    const normalized = normalizeRuleCategories(categories);
    return saveImmediately({ [RULES_FIELD]: normalized });
  }, [saveImmediately]);

  const createCategory = useCallback(async (category) => {
    const normalized = normalizeRuleCategory(category);
    await persistCategories([...ruleCategories, normalized]);
    return normalized;
  }, [persistCategories, ruleCategories]);

  const updateCategory = useCallback(async (id, updates) => {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return null;

    const next = ruleCategories.map((category) => {
      if (category.id !== normalizedId) return category;
      return normalizeRuleCategory({
        ...category,
        ...updates,
        id: category.id,
        created_at: category.created_at,
        updated_at: new Date().toISOString(),
      });
    });

    await persistCategories(next);
    return next.find((category) => category.id === normalizedId) || null;
  }, [persistCategories, ruleCategories]);

  const deleteCategory = useCallback(async (id) => {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return;
    await persistCategories(ruleCategories.filter((category) => category.id !== normalizedId));
  }, [persistCategories, ruleCategories]);

  // Pointer CRUD — implemented as targeted category updates so callers don't
  // need to reconstruct the full pointers array themselves.
  const addPointer = useCallback(async (categoryId, text) => {
    const category = ruleCategories.find((c) => c.id === categoryId);
    if (!category) return null;
    return updateCategory(categoryId, { pointers: [...category.pointers, { text }] });
  }, [ruleCategories, updateCategory]);

  const updatePointer = useCallback(async (categoryId, pointerId, text) => {
    const category = ruleCategories.find((c) => c.id === categoryId);
    if (!category) return null;
    const pointers = category.pointers.map((p) => (p.id === pointerId ? { ...p, text } : p));
    return updateCategory(categoryId, { pointers });
  }, [ruleCategories, updateCategory]);

  const deletePointer = useCallback(async (categoryId, pointerId) => {
    const category = ruleCategories.find((c) => c.id === categoryId);
    if (!category) return null;
    const pointers = category.pointers.filter((p) => p.id !== pointerId);
    return updateCategory(categoryId, { pointers });
  }, [ruleCategories, updateCategory]);

  // Import merges by category name: a category whose name already exists is
  // replaced with the imported version (keeping its id/created_at so nothing
  // else pointing at it breaks), anything else is added as new.
  const importCategories = useCallback(async (rawCategories) => {
    const incoming = Array.isArray(rawCategories) ? rawCategories : [];
    if (incoming.length === 0) return { created: 0, updated: 0 };

    const now = new Date().toISOString();
    const next = [...ruleCategories];
    let created = 0;
    let updated = 0;

    incoming.forEach((raw) => {
      const name = String(raw?.name || '').trim();
      if (!name) return;

      const nameKey = name.toLowerCase();
      const existingIndex = next.findIndex((category) => category.name.toLowerCase() === nameKey);

      if (existingIndex >= 0) {
        const existing = next[existingIndex];
        next[existingIndex] = normalizeRuleCategory({
          ...raw,
          id: existing.id,
          created_at: existing.created_at,
          updated_at: now,
        });
        updated += 1;
      } else {
        next.push(normalizeRuleCategory({ ...raw, created_at: now, updated_at: now }));
        created += 1;
      }
    });

    await persistCategories(next);
    return { created, updated };
  }, [persistCategories, ruleCategories]);

  return {
    ruleCategories,
    isSaving,
    saveError,
    createCategory,
    updateCategory,
    deleteCategory,
    addPointer,
    updatePointer,
    deletePointer,
    importCategories,
  };
}
