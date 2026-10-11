import { useCallback } from 'react';

export function useSettingsMaintenanceActions({ signOut, confirmFn }) {
  const confirm = useCallback(async (opts) => {
    if (confirmFn) return confirmFn(opts);
    return window.confirm(opts?.title ?? 'Are you sure?');
  }, [confirmFn]);

  const handleSignOut = useCallback(async () => {
    const ok = await confirm({ title: 'Sign out?', confirmLabel: 'Sign out', destructive: false });
    if (ok) signOut();
  }, [confirm, signOut]);

  return {
    handleSignOut,
  };
}
