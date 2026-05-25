import { useState, useCallback } from 'react';
import { TagsService } from '@/lib/services/TagsService';

export function useTags() {
  const [tags, setTags] = useState(() => TagsService.getAll());

  const refresh = useCallback(() => setTags(TagsService.getAll()), []);

  const findOrCreate = useCallback((name) => {
    const tag = TagsService.findOrCreate(name);
    refresh();
    return tag;
  }, [refresh]);

  const deleteTag = useCallback((id) => {
    TagsService.delete(id);
    refresh();
  }, [refresh]);

  const getByName = useCallback((name) => {
    const normalized = name?.toLowerCase().trim();
    return tags.find((t) => t.name === normalized) ?? null;
  }, [tags]);

  return { tags, findOrCreate, deleteTag, getByName, refresh };
}
