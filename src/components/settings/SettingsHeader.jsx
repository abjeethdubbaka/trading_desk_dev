import React from 'react';
import SyncBadge from '@/components/settings/SyncBadge';

export default function SettingsHeader({
  handleSave,
  isSaving,
  hasChanges,
  user,
  handleSignOut,
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <SyncBadge />
        {user && (
          <button
            onClick={handleSignOut}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Sign out ({user.email})
          </button>
        )}
      </div>
    </div>
  );
}

