const STORAGE_KEY = 'journal.tags.v1';

const PALETTE = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

function hashColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function normalizeTagName(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(tags) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tags)); } catch {}
}

export const TagsService = {
  getAll() {
    return load();
  },

  findOrCreate(rawName) {
    const name = normalizeTagName(rawName);
    if (!name) return null;

    const tags = load();
    const existing = tags.find((t) => t.name === name);
    if (existing) return existing;

    const tag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      color: hashColor(name),
      createdAt: new Date().toISOString(),
    };
    persist([...tags, tag]);
    return tag;
  },

  delete(id) {
    const tags = load().filter((t) => t.id !== id);
    persist(tags);
  },

  rename(id, rawName) {
    const name = normalizeTagName(rawName);
    if (!name) throw new Error('Tag name cannot be empty');

    const tags = load();
    const conflict = tags.find((t) => t.name === name && t.id !== id);
    if (conflict) throw new Error(`Tag "${name}" already exists`);

    const next = tags.map((t) => (t.id === id ? { ...t, name } : t));
    persist(next);
    return next;
  },

  /** Resolve an array of tag names/IDs → canonical tag objects, creating missing ones. */
  resolveTagNames(names = []) {
    return names
      .map((n) => TagsService.findOrCreate(n))
      .filter(Boolean);
  },
};
