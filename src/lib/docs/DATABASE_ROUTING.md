# Database Routing & Advanced Patterns

## 🔄 Composite Adapter Pattern

### Route Different Collections to Different Backends

For advanced use cases, you can route specific collections to different storage backends:

```javascript
// CompositeAdapter pattern (build when needed):
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter'
import { FirebaseAdapter } from './adapters/FirebaseAdapter'

const routing = {
  trades:       new FirebaseAdapter(),
  settings:     new FirebaseAdapter(),
  calc_history: new LocalStorageAdapter(),  // keep local
  media:        new LocalStorageAdapter(),  // binary files local
}

export const adapter = {
  read:      (col, id)       => routing[col].read(col, id),
  write:     (col, data)     => routing[col].write(col, data),
  patch:     (col, id, data) => routing[col].patch(col, id, data),
  replace:   (col, id, data) => routing[col].replace(col, id, data),
  remove:    (col, id)       => routing[col].remove(col, id),
  query:     (col, filters)  => routing[col].query(col, filters),
  writeMany: (col, items)    => routing[col].writeMany(col, items),
  clear:     (col)           => routing[col].clear(col),
}
```

### 🎯 Use Cases

#### **Hybrid Storage Strategy**
- **Trades** → Firebase (sync across devices)
- **Settings** → Firebase (shared preferences)
- **Calc History** → LocalStorage (fast, private)
- **Media Files** → LocalStorage (binary efficiency)

#### **Performance Optimization**
- **Read-heavy data** → LocalStorage (instant access)
- **Collaborative data** → Firebase (real-time sync)
- **Large files** → LocalStorage (no network overhead)

#### **Privacy & Security**
- **Sensitive calculations** → LocalStorage (private)
- **Shared trades** → Firebase (collaboration)
- **User preferences** → Firebase (portability)

## 🔍 Storage Monitoring

### Browser Console Tools

Monitor storage usage and inspect adapter behavior:

```javascript
// See all storage usage:
window.__dbReport()

// Inspect the adapter directly:
window.__dbAdapter.storageReport()
```

### Available Reports

#### **Storage Report**
```javascript
window.__dbReport()
// Output:
// {
//   localStorage: {
//     used: 2.3MB,
//     available: 47.7MB,
//     collections: {
//       calc_history: 45 items,
//       media: 12 items
//     }
//   },
//   firebase: {
//     connected: true,
//     collections: {
//       trades: 156 items,
//       settings: 3 items
//     }
//   }
// }
```

#### **Adapter Report**
```javascript
window.__dbAdapter.storageReport()
// Output:
// {
//   adapter: 'composite',
//   routing: {
//     trades: 'firebase',
//     settings: 'firebase',
//     calc_history: 'localStorage'
//   },
//   performance: {
//     reads: 1245,
//     writes: 89,
//   }
// }
```

## ⚠️ Validation Errors

### Handling Validation Errors

Services throw `ValidationError` with detailed error information:

```javascript
import { ValidationError } from '@/lib/services/TradeService'

try {
  await TradeService.create(data)
} catch (e) {
  if (e instanceof ValidationError) {
    console.log(e.errors) // ['Symbol is required', 'Entry price must be positive']
  }
}
```

### Validation Error Structure

```javascript
class ValidationError extends Error {
  constructor(errors, data) {
    super(`Validation failed: ${errors.join(', ')}`)
    this.name = 'ValidationError'
    this.errors = errors      // Array of error messages
    this.data = data          // Original data that failed
  }
}
```

### Common Validation Scenarios

#### **Trade Validation**
```javascript
try {
  await TradeService.create({
    symbol: '',           // ❌ Required
    entry_price: -10,     // ❌ Must be positive
    quantity: 0           // ❌ Must be > 0
  })
} catch (e) {
  if (e instanceof ValidationError) {
    e.errors // [
    //   'Symbol is required',
    //   'Entry price must be positive',
    //   'Quantity must be greater than 0'
    // ]
  }
}
```

#### **Settings Validation**
```javascript
try {
  await SettingsService.save({
    account_size: -1000,  // ❌ Must be positive
    risk_percent: 150      // ❌ Must be <= 100
  })
} catch (e) {
  if (e instanceof ValidationError) {
    e.errors // [
    //   'Account size must be positive',
    //   'Risk percent cannot exceed 100'
    // ]
  }
}
```

## 🛠️ Implementation Examples

### **Custom Composite Adapter**

```javascript
// src/lib/db/composite-adapter.js
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter'
import { FirebaseAdapter } from './adapters/FirebaseAdapter'

export class CompositeAdapter {
  constructor(routing = {}) {
    this.routing = {
      // Default routing
      trades: new FirebaseAdapter(),
      settings: new FirebaseAdapter(),
      calc_history: new LocalStorageAdapter(),
      media: new LocalStorageAdapter(),
      ...routing // Override with custom routing
    }
  }

  async read(collection, id) {
    return this.routing[collection]?.read(collection, id)
  }

  async write(collection, data) {
    return this.routing[collection]?.write(collection, data)
  }

  // ... other methods delegate to appropriate adapter
}
```

### **Usage in db/index.js**

```javascript
// src/lib/db/index.js
import { CompositeAdapter } from './composite-adapter'
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter'
import { FirebaseAdapter } from './adapters/FirebaseAdapter'

// Custom routing configuration
const routing = {
  trades: new FirebaseAdapter(),
  settings: new FirebaseAdapter(),
  calc_history: new LocalStorageAdapter(),
  media: new LocalStorageAdapter(),
}

export const db = new CompositeAdapter(routing)
export const DB_BACKEND = 'composite'
```

## 📊 Performance Considerations

### **Routing Overhead**
- Minimal overhead - simple object lookup
- Adapter instances created once at startup
- No runtime adapter switching

### **Storage Optimization**
- **LocalStorage**: Fast reads, local only
- **Firebase**: Network latency, real-time sync
- **Hybrid**: Best of both worlds

### **Cache Strategy**
```javascript
// Consider caching frequently accessed data
const cache = new Map()

async function readWithCache(collection, id) {
  const key = `${collection}:${id}`
  if (cache.has(key)) {
    return cache.get(key)
  }
  
  const data = await db.read(collection, id)
  cache.set(key, data)
  return data
}
```

## 🚀 Advanced Use Cases

### **Environment-Based Routing**
```javascript
const isDevelopment = process.env.NODE_ENV === 'development'

const routing = {
  trades: isDevelopment ? new LocalStorageAdapter() : new FirebaseAdapter(),
  settings: new FirebaseAdapter(),
  calc_history: new LocalStorageAdapter(),
}
```

### **User Preference Routing**
```javascript
async function getUserRouting(userId) {
  const settings = await SettingsService.get(userId)
  
  return {
    trades: settings.cloudSync ? new FirebaseAdapter() : new LocalStorageAdapter(),
    settings: new FirebaseAdapter(),
    calc_history: new LocalStorageAdapter(),
  }
}
```

### **Feature Flag Routing**
```javascript
const routing = {
  trades: featureFlags.firebaseTrades ? new FirebaseAdapter() : new LocalStorageAdapter(),
  settings: new FirebaseAdapter(),
  calc_history: new LocalStorageAdapter(),
}
```

---

**Advanced database routing and validation patterns provide flexible, powerful storage solutions!** 🎉

Use these patterns to optimize performance, enhance privacy, and create hybrid storage strategies.
