import { createMediaService } from '@/lib/services/MediaService.js';
import { db } from '@/lib/db/index.js';
import { indexedDBAdapter } from '@/lib/db/adapters/IndexedDBAdapter.js';

export const journalMediaService = createMediaService(db, indexedDBAdapter);
