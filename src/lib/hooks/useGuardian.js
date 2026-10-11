/**
 * @file src/lib/hooks/useGuardian.js
 *
 * Trading Guardian from the window: its live status, the on/off switch, and
 * setup. Guardian itself runs in the desktop app's main process, so it keeps
 * watching whichever page is open.
 */

import { useCallback, useEffect, useState } from 'react';

function getBridge() {
  return typeof window !== 'undefined' ? window.electronAPI?.guardian || null : null;
}

/** True when the window's code is newer than the main process it talks to. */
export function isGuardianRestartError(error) {
  return /No handler registered for 'guardian:/.test(String(error?.message || ''));
}

export const GUARDIAN_RESTART_MESSAGE = 'Restart TradeDesk to finish installing Trading Guardian — it was added after this session started.';

export function useGuardian() {
  const bridge = getBridge();
  const [status, setStatus] = useState(null);
  const [needsRestart, setNeedsRestart] = useState(false);

  useEffect(() => {
    if (!bridge) return undefined;
    let cancelled = false;
    bridge.getStatus()
      .then((next) => { if (!cancelled) setStatus(next); })
      .catch((error) => { if (!cancelled && isGuardianRestartError(error)) setNeedsRestart(true); });
    const unsubscribe = bridge.onStatus?.((next) => setStatus(next));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [bridge]);

  const call = useCallback(async (method, ...args) => {
    if (!bridge?.[method]) throw new Error('Trading Guardian runs in the Windows desktop app');
    try {
      const result = await bridge[method](...args);
      if (result && typeof result === 'object' && 'phase' in result) setStatus(result);
      return result;
    } catch (error) {
      if (isGuardianRestartError(error)) {
        setNeedsRestart(true);
        throw new Error(GUARDIAN_RESTART_MESSAGE);
      }
      throw error;
    }
  }, [bridge]);

  return {
    isAvailable: Boolean(bridge) && !needsRestart,
    needsRestart,
    status,
    setEnabled: useCallback((enabled) => call('setEnabled', enabled), [call]),
    setProcessName: useCallback((name) => call('setProcessName', name), [call]),
    pickRegion: useCallback((key) => call('pickRegion', key), [call]),
    setStartBalance: useCallback((account, value) => call('setStartBalance', { account, value }), [call]),
    testRead: useCallback(() => call('testRead'), [call]),
    runTest: useCallback((name) => call('runTest', name), [call]),
    bridge,
    openLog: useCallback(() => call('openLog'), [call]),
    setRules: useCallback((rules) => call('setRules', rules), [call]),
  };
}

/** What the Guardian is doing, in a word or two, and how loudly to show it. */
export function describeGuardianPhase(status) {
  if (!status?.enabled) return { label: 'Off', tone: 'off' };
  const day = status.day || {};
  switch (status.phase) {
    case 'locked': return { label: 'Locked', tone: 'danger' };
    case 'warning':
      return day.finalTradeStarted
        ? { label: 'Final trade', tone: 'danger' }
        : { label: `Warning ${day.warningCount || 1}/3`, tone: 'warning' };
    case 'monitoring': return { label: 'Watching', tone: 'ok' };
    case 'waiting': return { label: 'Waiting for terminal', tone: 'idle' };
    case 'unreadable': return { label: "Can't read screen", tone: 'danger' };
    case 'starting': return { label: 'Reading balance…', tone: 'idle' };
    case 'unlocked': return { label: 'Unlocked for review', tone: 'idle' };
    case 'finished': return { label: 'Done for today', tone: 'idle' };
    case 'setup': return { label: 'Needs setup', tone: 'warning' };
    case 'error': return { label: 'Error', tone: 'danger' };
    default: return { label: 'Starting…', tone: 'idle' };
  }
}

export default useGuardian;
