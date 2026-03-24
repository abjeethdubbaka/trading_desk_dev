/**
 * Settings service with merge/defaults
 */

import { validateSchema } from '../schema/validation.js';
import { SettingsSchema } from '../schema/index.js';

export class SettingsService {
  constructor(dbAdapter) {
    this.db = dbAdapter;
    this.cache = null;
    this.cacheTimestamp = null;
    this.cacheTimeout = 30000; // 30 seconds
  }

  // Get current settings
  async get() {
    try {
      // Check cache first
      const cached = this._getFromCache();
      if (cached) {
        return cached;
      }
      
      this._clearCache();
      
      // Try database
      const settings = await this.db.settings.get();
      
      // If no settings exist, create defaults only for first time setup
      if (!settings) {
        return await this._createDefaults();
      }

      // Return saved settings as-is, don't merge with defaults
      this._updateCache(settings);
      return settings;
    } catch (error) {
      console.error('SettingsService - Get error:', error);
      // Return defaults only on error, not as regular behavior
      const defaults = this._getDefaults();
      return defaults;
    }
  }

  // Save settings with merge and validation
  async save(updates) {
    try {
      // Validate the updates
      const validation = validateSchema(SettingsSchema, updates);
      
      if (!validation.isValid) {
        throw new Error(`Settings validation failed: ${validation.errors.join(', ')}`);
      }

      // Get current settings
      const current = await this.get();
      
      // Merge with current settings - don't apply any defaults
      const merged = this._mergeSettings(current, updates);
      
      // Save to database directly without merging defaults
      const result = await this.db.settings.save(merged);
      
      // Update cache
      this._updateCache(result);
      
      // Broadcast change
      this._broadcast('settings-updated', { settings: result });
      
      return result;
    } catch (error) {
      console.error('SettingsService - Save error:', error);
      throw error;
    }
  }

  // Update specific setting fields
  async updateField(field, value) {
    return await this.save({ [field]: value });
  }

  // Reset to defaults
  async reset() {
    try {
      // Clear cache first
      this._clearCache();
      
      // Get fresh defaults
      const defaults = this._getDefaults();
      const result = await this.db.settings.save(defaults);
      
      // Update cache
      this._updateCache(result);
      
      // Broadcast change
      this._broadcast('settings-updated', { settings: result });
      
      return result;
    } catch (error) {
      console.error('SettingsService - Reset error:', error);
      throw error;
    }
  }

  // Clear all settings and reinitialize with defaults
  async clearAndReinit() {
    try {
      // Clear cache
      this._clearCache();
      
      // Clear database
      await this.db.settings.clear();
      
      // Create fresh defaults
      const defaults = this._getDefaults();
      const result = await this.db.settings.save(defaults);
      
      // Update cache
      this._updateCache(result);
      
      // Broadcast change
      this._broadcast('settings-updated', { settings: result });
      
      return result;
    } catch (error) {
      console.error('SettingsService - Clear and reinit error:', error);
      throw error;
    }
  }

  // Export settings
  async export() {
    const settings = await this.get();
    
    // Remove sensitive fields if any
    const exportable = { ...settings };
    
    return JSON.stringify(exportable, null, 2);
  }

  // Import settings
  async import(settingsJson) {
    try {
      const imported = JSON.parse(settingsJson);
      
      // Validate imported settings
      const validation = validateSchema(SettingsSchema, imported);
      
      if (!validation.isValid) {
        throw new Error(`Import validation failed: ${validation.errors.join(', ')}`);
      }

      // Save imported settings
      return await this.save(imported);
    } catch (error) {
      console.error('SettingsService - Import error:', error);
      throw error;
    }
  }

  // Get specific setting value
  async getField(field, defaultValue = null) {
    const settings = await this.get();
    return settings[field] !== undefined ? settings[field] : defaultValue;
  }

  // Batch update multiple fields
  async updateFields(updates) {
    return await this.save(updates);
  }

  // Settings validation
  validate(settings) {
    return validateSchema(SettingsSchema, settings);
  }

  // Check if feature is enabled
  async isFeatureEnabled(feature) {
    const settings = await this.get();
    return settings.features?.[feature] ?? false;
  }

  // Enable/disable feature
  async setFeatureEnabled(feature, enabled) {
    const current = await this.get();
    const features = { ...current.features, [feature]: enabled };
    
    return await this.save({ features });
  }

  // Trading hours utilities
  async getTradingHours() {
    const settings = await this.get();
    return settings.trading_hours || this._getDefaults().trading_hours;
  }

  async setTradingHours(hours) {
    return await this.save({ trading_hours: hours });
  }

  async isMarketOpen() {
    const hours = await this.getTradingHours();
    const now = new Date();
    
    // Simple check - could be enhanced for holidays, weekends, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= hours.market_open && currentTime <= hours.market_close;
  }

  // Risk management utilities
  async getRiskSettings() {
    const settings = await this.get();
    
    return {
      riskAmount: settings.risk_amount,
      positionSizingPercent: settings.position_sizing_percent,
      defaultStopLossPercent: settings.default_stop_loss_percent,
      maxDollars: settings.max_dollars
    };
  }

  async setRiskSettings(riskSettings) {
    return await this.save(riskSettings);
  }

  // Float categories utilities
  async getFloatCategories() {
    const settings = await this.get();
    return settings.float_categories || {};
  }

  async setFloatCategories(categories) {
    return await this.save({ float_categories: categories });
  }

  async addFloatCategory(name, config) {
    const current = await this.getFloatCategories();
    const updated = { ...current, [name]: config };
    
    return await this.setFloatCategories(updated);
  }

  async removeFloatCategory(name) {
    const current = await this.getFloatCategories();
    const { [name]: removed, ...rest } = current;
    
    return await this.setFloatCategories(rest);
  }

  // Notification settings
  async getNotificationSettings() {
    const settings = await this.get();
    return settings.notifications || this._getDefaults().notifications;
  }

  async setNotificationSettings(notifications) {
    return await this.save({ notifications });
  }

  // UI preferences
  async getUIPreferences() {
    const settings = await this.get();
    return settings.ui_preferences || this._getDefaults().ui_preferences;
  }

  async setUIPreferences(preferences) {
    return await this.save({ ui_preferences: preferences });
  }

  // Private helper methods
  _getDefaults() {
    const defaults = { ...SettingsSchema.defaults };
    return defaults;
  }

  // Cache methods
  _getFromCache() {
    if (this.cache && this.cacheTimestamp && (Date.now() - this.cacheTimestamp < this.cacheTimeout)) {
      return this.cache;
    }
    return null;
  }

  _updateCache(settings) {
    this.cache = settings;
    this.cacheTimestamp = Date.now();
  }

  _clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  async _createDefaults() {
    const defaults = this._getDefaults();
    const result = await this.db.settings.save(defaults);
    return result;
  }

  _mergeWithDefaults(settings) {
    const defaults = this._getDefaults();
    
    // Deep merge settings with defaults
    const merged = this._deepMerge(defaults, settings);
    
    return merged;
  }

  _mergeMissingDefaults(settings) {
    const defaults = this._getDefaults();
    
    // Only add defaults for fields that are completely missing
    const merged = { ...defaults };
    
    // Don't override any existing fields
    for (const key in settings) {
      if (settings[key] !== undefined && settings[key] !== null) {
        merged[key] = settings[key];
      }
    }
    
    return merged;
  }

  _mergeSettings(current, updates) {
    return this._deepMerge(current, updates);
  }

  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  _isCacheValid() {
    return this.cache && 
           this.cacheTimestamp && 
           (Date.now() - this.cacheTimestamp) < this.cacheTimeout;
  }

  _broadcast(channel, detail) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(channel, { detail }));
    }
  }

  _updateCache(settings) {
    this.cache = settings;
    this.cacheTimestamp = Date.now();
  }

  _clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  // Cache management
  invalidateCache() {
    this._clearCache();
  }

  // Settings migration utilities
  async migrateFromOldFormat(oldSettings) {
    try {
      // Handle migration from old settings format
      const migrated = this._migrateSettingsFormat(oldSettings);
      
      // Validate migrated settings
      const validation = this.validate(migrated);
      
      if (!validation.isValid) {
        console.warn('Settings migration validation warnings:', validation.warnings);
      }
      
      // Save migrated settings
      return await this.save(migrated);
    } catch (error) {
      console.error('Settings migration error:', error);
      throw error;
    }
  }

  _migrateSettingsFormat(oldSettings) {
    // Example migration logic
    const migrated = { ...oldSettings };
    
    // Rename old fields to new ones
    if (oldSettings.risk_per_trade !== undefined) {
      migrated.risk_amount = oldSettings.risk_per_trade;
      delete migrated.risk_per_trade;
    }
    
    if (oldSettings.position_size_percent !== undefined) {
      migrated.position_sizing_percent = oldSettings.position_size_percent;
      delete migrated.position_size_percent;
    }
    
    // Ensure all required fields exist
    return this._mergeWithDefaults(migrated);
  }
}

// Factory function
export function createSettingsService(dbAdapter) {
  return new SettingsService(dbAdapter);
}
