/**
 * Screenshot/file management service
 */

import { validateSchema } from '../schema/validation.js';
import { MediaSchema } from '../schema/index.js';

export class MediaService {
  constructor(dbAdapter, indexedDBAdapter) {
    this.db = dbAdapter;
    this.idb = indexedDBAdapter;
  }

  // Upload file
  async uploadFile(file, metadata = {}) {
    try {
      // Validate file metadata
      const fileData = {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        ...metadata
      };
      
      const validation = validateSchema(MediaSchema, fileData);
      
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Store file in IndexedDB
      const fileRecord = await this.idb.storeFile(file, metadata);
      
      // Create metadata record in main database
      const mediaRecord = await this.db.media.create({
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_id: fileRecord.id, // Reference to IndexedDB
        created_at: new Date().toISOString(),
        ...metadata
      });
      
      // Broadcast change
      this._broadcast('media-updated', { action: 'create', media: mediaRecord });
      
      return {
        ...mediaRecord,
        fileRecord
      };
    } catch (error) {
      
      throw error;
    }
  }

  // Upload screenshot specifically
  async uploadScreenshot(imageData, metadata = {}) {
    try {
      const screenshotData = {
        file_name: metadata.file_name || `screenshot-${Date.now()}.png`,
        file_type: 'image/png',
        file_size: typeof imageData === 'string' ? 
          Math.round(imageData.length * 0.75) : // Base64 approximation
          imageData.size,
        ...metadata
      };
      
      const validation = validateSchema(MediaSchema, screenshotData);
      
      if (!validation.isValid) {
        throw new Error(`Screenshot validation failed: ${validation.errors.join(', ')}`);
      }

      // Store screenshot in IndexedDB
      const screenshotRecord = await this.idb.storeScreenshot(imageData, metadata);
      
      // Create metadata record
      const mediaRecord = await this.db.media.create({
        file_name: screenshotData.file_name,
        file_type: screenshotData.file_type,
        file_size: screenshotData.file_size,
        file_id: screenshotRecord.id,
        media_type: 'screenshot',
        created_at: new Date().toISOString(),
        ...metadata
      });
      
      // Broadcast change
      this._broadcast('media-updated', { action: 'create', media: mediaRecord });
      
      return {
        ...mediaRecord,
        screenshotRecord
      };
    } catch (error) {
      
      throw error;
    }
  }

  // Get media by ID
  async get(id) {
    try {
      const mediaRecord = await this.db.media.get(id);
      
      if (!mediaRecord) {
        return null;
      }
      
      // Get actual file from IndexedDB
      const fileRecord = await this.idb.getFile(mediaRecord.file_id);
      
      return {
        ...mediaRecord,
        file: fileRecord
      };
    } catch (error) {
      
      throw error;
    }
  }

  // List media with filtering
  async list(options = {}) {
    try {
      let media = await this.db.media.list(options);
      
      // Apply additional filtering
      if (options.media_type) {
        media = media.filter(item => item.media_type === options.media_type);
      }
      
      if (options.trade_id) {
        media = media.filter(item => item.trade_id === options.trade_id);
      }
      
      if (options.file_type) {
        media = media.filter(item => item.file_type.startsWith(options.file_type));
      }
      
      return media;
    } catch (error) {
      
      throw error;
    }
  }

  // Get media by trade
  async getByTrade(tradeId) {
    return await this.list({ trade_id });
  }

  // Get screenshots by trade
  async getScreenshotsByTrade(tradeId) {
    return await this.list({ 
      trade_id, 
      media_type: 'screenshot' 
    });
  }

  // Get all screenshots
  async getScreenshots() {
    return await this.list({ media_type: 'screenshot' });
  }

  // Update media metadata
  async update(id, changes) {
    try {
      // Validate changes
      const validation = validateSchema(MediaSchema, changes);
      
      if (!validation.isValid) {
        throw new Error(`Media validation failed: ${validation.errors.join(', ')}`);
      }

      const result = await this.db.media.update(id, changes);
      
      // Broadcast change
      this._broadcast('media-updated', { action: 'update', media: result });
      
      return result;
    } catch (error) {
      
      throw error;
    }
  }

  // Delete media
  async delete(id) {
    try {
      // Get media record first
      const mediaRecord = await this.db.media.get(id);
      
      if (!mediaRecord) {
        throw new Error(`Media ${id} not found`);
      }
      
      // Delete from IndexedDB
      if (mediaRecord.file_id) {
        await this.idb.delete('files', mediaRecord.file_id);
      }
      
      // Delete metadata record
      const result = await this.db.media.delete(id);
      
      // Broadcast change
      this._broadcast('media-updated', { action: 'delete', mediaId: id });
      
      return result;
    } catch (error) {
      
      throw error;
    }
  }

  // Search media
  async search(query) {
    try {
      const media = await this.list();
      const lowerQuery = query.toLowerCase();
      
      return media.filter(item => 
        item.file_name?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      
      throw error;
    }
  }

  // Get media statistics
  async getStats() {
    try {
      const media = await this.list();
      
      const stats = {
        total: media.length,
        byType: {},
        byTrade: {},
        totalSize: 0,
        recentCount: 0,
        oldestMedia: null,
        newestMedia: null
      };
      
      if (media.length === 0) {
        return stats;
      }
      
      // Group by type
      media.forEach(item => {
        const type = item.media_type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });
      
      // Group by trade
      media.forEach(item => {
        if (item.trade_id) {
          stats.byTrade[item.trade_id] = (stats.byTrade[item.trade_id] || 0) + 1;
        }
      });
      
      // Calculate total size
      stats.totalSize = media.reduce((sum, item) => sum + (item.file_size || 0), 0);
      
      // Recent media (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      stats.recentCount = media.filter(item => 
        new Date(item.created_at) >= sevenDaysAgo
      ).length;
      
      // Oldest and newest
      const sortedByDate = media.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      
      stats.oldestMedia = sortedByDate[0];
      stats.newestMedia = sortedByDate[sortedByDate.length - 1];
      
      return stats;
    } catch (error) {
      
      throw error;
    }
  }

  // Get storage usage
  async getStorageUsage() {
    try {
      const idbUsage = await this.idb.getUsage();
      const stats = await this.getStats();
      
      return {
        indexedDB: idbUsage,
        mediaStats: stats,
        totalFiles: stats.total,
        totalSize: stats.totalSize,
        averageFileSize: stats.total > 0 ? stats.totalSize / stats.total : 0
      };
    } catch (error) {
      
      throw error;
    }
  }

  // Cleanup old media
  async cleanupOlderThan(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldMedia = await this.list({
        date_to: cutoffDate.toISOString()
      });
      
      const deletedCount = oldMedia.length;
      
      for (const media of oldMedia) {
        await this.delete(media.id);
      }
      
      return deletedCount;
    } catch (error) {
      
      throw error;
    }
  }

  // Optimize storage (compress images, etc.)
  async optimizeStorage() {
    try {
      const media = await this.list({ media_type: 'screenshot' });
      let optimizedCount = 0;
      
      for (const item of media) {
        try {
          // Get the actual image
          const fullMedia = await this.get(item.id);
          
          if (fullMedia.file && fullMedia.file.type.startsWith('image/')) {
            // Compress image (simplified - in real implementation would use canvas)
            const compressed = await this._compressImage(fullMedia.file);
            
            if (compressed.size < fullMedia.file.size) {
              // Update with compressed version
              await this.idb.update('files', item.file_id, { 
                data: compressed.data,
                size: compressed.size 
              });
              
              // Update metadata
              await this.update(item.id, { file_size: compressed.size });
              optimizedCount++;
            }
          }
        } catch (error) {
          
        }
      }
      
      return optimizedCount;
    } catch (error) {
      
      throw error;
    }
  }

  // Private helper methods
  async _compressImage(file) {
    return new Promise((resolve) => {
      // Simplified compression - in real implementation would use canvas
      // For now, just return the original file
      resolve({
        data: file,
        size: file.size
      });
    });
  }

  _broadcast(channel, detail) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(channel, { detail }));
    }
  }
}

// Factory function
export function createMediaService(dbAdapter, indexedDBAdapter) {
  return new MediaService(dbAdapter, indexedDBAdapter);
}


