/**
 * Structured localStorage wrapper adapter
 */

class LocalStorageAdapter {
  constructor() {
    this.name = 'localStorage';
    this.prefix = 'tradedesk_';
  }

  // Helper methods
  _key(collection) {
    return `${this.prefix}${collection}`;
  }

  _serialize(data) {
    try {
      return JSON.stringify(data);
    } catch (error) {
      
      return null;
    }
  }

  _deserialize(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      
      return null;
    }
  }

  // Collection operations
  async list(collection, options = {}) {
    try {
      const key = this._key(collection);
      const data = localStorage.getItem(key);
      const items = this._deserialize(data) || [];
      
      let result = items;
      
      // Apply ordering
      if (options.orderBy) {
        const [field, direction] = options.orderBy.split(':');
        result.sort((a, b) => {
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
        result = result.slice(0, options.limit);
      }
      
      return result;
    } catch (error) {
      
      return [];
    }
  }

  async get(collection, id) {
    try {
      const items = await this.list(collection);
      return items.find(item => item.id === id) || null;
    } catch (error) {
      
      return null;
    }
  }

  async create(collection, data) {
    try {
      const key = this._key(collection);
      const items = await this.list(collection);
      
      const newItem = {
        ...data,
        id: this._generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };
      
      items.push(newItem);
      const serialized = this._serialize(items);
      
      if (serialized) {
        localStorage.setItem(key, serialized);
        this._broadcast(`${collection}-updated`, { action: 'create', item: newItem });
        return newItem;
      }
      
      throw new Error('Failed to serialize data');
    } catch (error) {
      
      throw error;
    }
  }

  async update(collection, id, changes) {
    try {
      const key = this._key(collection);
      const items = await this.list(collection);
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error(`Item ${id} not found in ${collection}`);
      }
      
      items[index] = {
        ...items[index],
        ...changes,
        updated_date: new Date().toISOString()
      };
      
      const serialized = this._serialize(items);
      
      if (serialized) {
        localStorage.setItem(key, serialized);
        this._broadcast(`${collection}-updated`, { action: 'update', item: items[index] });
        return items[index];
      }
      
      throw new Error('Failed to serialize data');
    } catch (error) {
      
      throw error;
    }
  }

  async delete(collection, id) {
    try {
      const key = this._key(collection);
      const items = await this.list(collection);
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error(`Item ${id} not found in ${collection}`);
      }
      
      const deletedItem = items[index];
      items.splice(index, 1);
      
      const serialized = this._serialize(items);
      
      if (serialized) {
        localStorage.setItem(key, serialized);
        this._broadcast(`${collection}-updated`, { action: 'delete', itemId: id });
        return deletedItem;
      }
      
      throw new Error('Failed to serialize data');
    } catch (error) {
      
      throw error;
    }
  }

  async bulkCreate(collection, dataArray) {
    try {
      const results = [];
      
      for (const data of dataArray) {
        const result = await this.create(collection, data);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      
      throw error;
    }
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
  async clear(collection) {
    try {
      const key = this._key(collection);
      localStorage.removeItem(key);
      this._broadcast(`${collection}-updated`, { action: 'clear' });
    } catch (error) {
      
      throw error;
    }
  }

  async clearAll() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      for (const key of keys) {
        localStorage.removeItem(key);
      }
      this._broadcast('storage-cleared', {});
    } catch (error) {
      
      throw error;
    }
  }

  // Statistics
  async getStats(collection) {
    try {
      const items = await this.list(collection);
      return {
        count: items.length,
        size: JSON.stringify(items).length,
        lastUpdated: items.length > 0 ? 
          Math.max(...items.map(item => new Date(item.updated_date || item.created_date))) : 
          null
      };
    } catch (error) {
      
      return { count: 0, size: 0, lastUpdated: null };
    }
  }
}

export const localStorageAdapter = new LocalStorageAdapter();


