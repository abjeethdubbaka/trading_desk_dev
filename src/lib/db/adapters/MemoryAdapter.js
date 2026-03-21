/**
 * In-memory adapter for testing
 */

class MemoryAdapter {
  constructor() {
    this.name = 'memory';
    this.data = new Map();
  }

  // Helper methods
  _getCollection(collection) {
    if (!this.data.has(collection)) {
      this.data.set(collection, []);
    }
    return this.data.get(collection);
  }

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  _broadcast(channel, detail) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(channel, { detail }));
    }
  }

  // Collection operations
  async list(collection, options = {}) {
    const items = [...this._getCollection(collection)];
    
    let result = items;
    
    // Apply filters
    if (options.trade_id) {
      result = result.filter(item => item.trade_id === options.trade_id);
    }
    
    if (options.file_type) {
      result = result.filter(item => item.file_type === options.file_type);
    }
    
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
  }

  async get(collection, id) {
    const items = this._getCollection(collection);
    return items.find(item => item.id === id) || null;
  }

  async create(collection, data) {
    const items = this._getCollection(collection);
    
    const newItem = {
      ...data,
      id: this._generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    items.push(newItem);
    this._broadcast(`${collection}-updated`, { action: 'create', item: newItem });
    
    return newItem;
  }

  async update(collection, id, changes) {
    const items = this._getCollection(collection);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item ${id} not found in ${collection}`);
    }
    
    items[index] = {
      ...items[index],
      ...changes,
      updated_date: new Date().toISOString()
    };
    
    this._broadcast(`${collection}-updated`, { action: 'update', item: items[index] });
    
    return items[index];
  }

  async delete(collection, id) {
    const items = this._getCollection(collection);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item ${id} not found in ${collection}`);
    }
    
    const deletedItem = items[index];
    items.splice(index, 1);
    
    this._broadcast(`${collection}-updated`, { action: 'delete', itemId: id });
    
    return deletedItem;
  }

  async bulkCreate(collection, dataArray) {
    const results = [];
    
    for (const data of dataArray) {
      const result = await this.create(collection, data);
      results.push(result);
    }
    
    return results;
  }

  // Storage management
  async clear(collection) {
    this.data.delete(collection);
    this._broadcast(`${collection}-updated`, { action: 'clear' });
  }

  async clearAll() {
    this.data.clear();
    this._broadcast('storage-cleared', {});
  }

  // Statistics
  async getStats(collection) {
    const items = this._getCollection(collection);
    
    return {
      count: items.length,
      size: JSON.stringify(items).length,
      lastUpdated: items.length > 0 ? 
        Math.max(...items.map(item => new Date(item.updated_date || item.created_date))) : 
        null
    };
  }

  // Testing utilities
  async seedData(collection, seedData) {
    this.data.set(collection, seedData.map(item => ({
      ...item,
      id: item.id || this._generateId(),
      created_date: item.created_date || new Date().toISOString(),
      updated_date: item.updated_date || new Date().toISOString()
    })));
  }

  async getAllData() {
    const result = {};
    for (const [collection, items] of this.data.entries()) {
      result[collection] = [...items];
    }
    return result;
  }

  async loadAllData(data) {
    this.data.clear();
    for (const [collection, items] of Object.entries(data)) {
      this.data.set(collection, [...items]);
    }
  }

  // Performance testing
  async benchmark(operation, iterations = 1000) {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      switch (operation) {
        case 'create':
          await this.create('test', { test: i });
          break;
        case 'read':
          await this.list('test');
          break;
        case 'update':
          await this.update('test', `item-${i}`, { test: i + 1 });
          break;
        case 'delete':
          await this.delete('test', `item-${i}`);
          break;
      }
    }
    
    const end = performance.now();
    return {
      operation,
      iterations,
      duration: end - start,
      avgTime: (end - start) / iterations
    };
  }
}

export const memoryAdapter = new MemoryAdapter();
