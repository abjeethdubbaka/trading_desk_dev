/**
 * IndexedDB adapter for binary/image storage
 */

class IndexedDBAdapter {
  constructor() {
    this.name = 'indexedDB';
    this.dbName = 'TradeDeskDB';
    this.version = 1;
    this.db = null;
    this.stores = {
      media: 'media',
      screenshots: 'screenshots',
      files: 'files'
    };
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains(this.stores.media)) {
          const mediaStore = db.createObjectStore(this.stores.media, { keyPath: 'id' });
          mediaStore.createIndex('trade_id', 'trade_id', { unique: false });
          mediaStore.createIndex('file_type', 'file_type', { unique: false });
          mediaStore.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.screenshots)) {
          const screenshotStore = db.createObjectStore(this.stores.screenshots, { keyPath: 'id' });
          screenshotStore.createIndex('trade_id', 'trade_id', { unique: false });
          screenshotStore.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.files)) {
          const fileStore = db.createObjectStore(this.stores.files, { keyPath: 'id' });
          fileStore.createIndex('trade_id', 'trade_id', { unique: false });
          fileStore.createIndex('file_type', 'file_type', { unique: false });
          fileStore.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });
  }

  async getStore(storeName, mode = 'readonly') {
    await this.init();
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  async create(storeName, data) {
    try {
      const store = await this.getStore(storeName, 'readwrite');
      
      const item = {
        ...data,
        id: this._generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return new Promise((resolve, reject) => {
        const request = store.add(item);
        
        request.onsuccess = () => {
          this._broadcast(`${storeName}-updated`, { action: 'create', item });
          resolve(item);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`IndexedDBAdapter - Create error in ${storeName}:`, error);
      throw error;
    }
  }

  async get(storeName, id) {
    try {
      const store = await this.getStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`IndexedDBAdapter - Get error in ${storeName}/${id}:`, error);
      throw error;
    }
  }

  async list(storeName, options = {}) {
    try {
      const store = await this.getStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          let results = request.result || [];
          
          // Apply filters
          if (options.trade_id) {
            results = results.filter(item => item.trade_id === options.trade_id);
          }
          
          if (options.file_type) {
            results = results.filter(item => item.file_type === options.file_type);
          }
          
          // Apply ordering
          if (options.orderBy) {
            const [field, direction] = options.orderBy.split(':');
            results.sort((a, b) => {
              const aVal = a[field];
              const bVal = b[field];
              if (direction === 'desc') {
                return bVal > aVal ? 1 : -1;
              }
              return aVal > bVal ? 1 : -1;
            });
          }
          
          // Apply limit
          if (options.limit) {
            results = results.slice(0, options.limit);
          }
          
          resolve(results);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`IndexedDBAdapter - List error in ${storeName}:`, error);
      throw error;
    }
  }

  async update(storeName, id, changes) {
    try {
      const store = await this.getStore(storeName, 'readwrite');
      
      // First get the existing item
      const existing = await this.get(storeName, id);
      if (!existing) {
        throw new Error(`Item ${id} not found in ${storeName}`);
      }
      
      const updated = {
        ...existing,
        ...changes,
        updated_at: new Date().toISOString()
      };

      return new Promise((resolve, reject) => {
        const request = store.put(updated);
        
        request.onsuccess = () => {
          this._broadcast(`${storeName}-updated`, { action: 'update', item: updated });
          resolve(updated);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`IndexedDBAdapter - Update error in ${storeName}/${id}:`, error);
      throw error;
    }
  }

  async delete(storeName, id) {
    try {
      const store = await this.getStore(storeName, 'readwrite');
      
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        
        request.onsuccess = () => {
          this._broadcast(`${storeName}-updated`, { action: 'delete', itemId: id });
          resolve(true);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`IndexedDBAdapter - Delete error in ${storeName}/${id}:`, error);
      throw error;
    }
  }

  // File-specific methods
  async storeFile(file, metadata = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result, // Base64 or ArrayBuffer
            ...metadata
          };
          
          const result = await this.create(this.stores.files, fileData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file); // For images, use readAsDataURL
    });
  }

  async getFile(id) {
    try {
      const fileRecord = await this.get(this.stores.files, id);
      if (!fileRecord) return null;

      // Convert base64 back to Blob if needed
      if (fileRecord.data && fileRecord.data.startsWith('data:')) {
        const response = await fetch(fileRecord.data);
        const blob = await response.blob();
        
        return new File([blob], fileRecord.name, { type: fileRecord.type });
      }
      
      return fileRecord;
    } catch (error) {
      console.error(`IndexedDBAdapter - Get file error for ${id}:`, error);
      throw error;
    }
  }

  async storeScreenshot(imageData, metadata = {}) {
    const screenshotData = {
      file_type: 'image',
      data: imageData, // Base64 or Blob
      ...metadata
    };
    
    return await this.create(this.stores.screenshots, screenshotData);
  }

  async getScreenshot(id) {
    return await this.get(this.stores.screenshots, id);
  }

  async getScreenshotsByTrade(tradeId) {
    return await this.list(this.stores.screenshots, { trade_id: tradeId });
  }

  // Utility methods
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  _broadcast(channel, detail) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(channel, { detail }));
    }
  }

  // Storage management
  async clear(storeName) {
    try {
      const store = await this.getStore(storeName, 'readwrite');
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        
        request.onsuccess = () => {
          this._broadcast(`${storeName}-updated`, { action: 'clear' });
          resolve(true);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`IndexedDBAdapter - Clear error in ${storeName}:`, error);
      throw error;
    }
  }

  async getUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          usageDetails: estimate.usageDetails
        };
      } catch (error) {
        console.error('IndexedDBAdapter - Storage estimate error:', error);
      }
    }
    
    return { quota: null, usage: null, usageDetails: null };
  }
}

export const indexedDBAdapter = new IndexedDBAdapter();
