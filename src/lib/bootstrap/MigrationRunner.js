/**
 * @file src/lib/bootstrap/MigrationRunner.js
 *
 * Migration system for database schema changes.
 */

import { db } from '../db/index.js';
import { createSettingsService } from '../services/SettingsService.js';
import { MIGRATIONS } from './migrations.js';

// Migration storage key
const MIGRATION_KEY = 'tradedesk_migrations';

export class MigrationRunner {
  constructor() {
    this.db = db;
    this.completedMigrations = this._getCompletedMigrations();
  }

  // Get completed migrations from storage
  _getCompletedMigrations() {
    try {
      const stored = localStorage.getItem(MIGRATION_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      
      return [];
    }
  }

  // Save completed migrations to storage
  _saveCompletedMigrations(migrations) {
    try {
      localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));
    } catch (error) {
      
    }
  }

  // Get pending migrations
  _getPendingMigrations() {
    const allVersions = Object.keys(MIGRATIONS).sort();
    return allVersions.filter(version => !this.completedMigrations.includes(version));
  }

  // Run a single migration
  async _runMigration(version) {
    const migration = MIGRATIONS[version];
    
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    try {
      await migration.up();
      
      // Mark as completed
      this.completedMigrations.push(version);
      this._saveCompletedMigrations(this.completedMigrations);
      
    } catch (error) {
      
      throw error;
    }
  }

  // Run all pending migrations
  async run() {
    const pending = this._getPendingMigrations();
    
    if (pending.length === 0) {
      return { completed: [], skipped: true };
    }

    const completed = [];
    
    for (const version of pending) {
      await this._runMigration(version);
      completed.push(version);
    }

    return { completed, skipped: false };
  }

  // Get migration status
  getStatus() {
    const allVersions = Object.keys(MIGRATIONS).sort();
    const pending = this._getPendingMigrations();
    
    return {
      current: this.completedMigrations.length > 0 ? 
        this.completedMigrations[this.completedMigrations.length - 1] : 
        '0.0.0',
      completed: this.completedMigrations,
      pending,
      total: allVersions.length,
      upToDate: pending.length === 0
    };
  }

  // Reset migration history (for development)
  reset() {
    this.completedMigrations = [];
    this._saveCompletedMigrations([]);
  }
}


