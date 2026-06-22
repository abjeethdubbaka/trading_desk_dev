import { useState, useCallback } from 'react';
import { TagsService, tagNameKey } from '@/lib/services/TagsService';

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
    const key = tagNameKey(name);
    return tags.find((t) => tagNameKey(t.name) === key) ?? null;
  }, [tags]);

  return { tags, findOrCreate, deleteTag, getByName, refresh };
}
