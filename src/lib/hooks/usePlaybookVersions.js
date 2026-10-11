/**
 * @file src/lib/hooks/usePlaybookVersions.js
 *
 * Strategy versions — read access to each setup's history, and the live
 * version a trade should be stamped with. Versions are written by usePlaybook
 * as setups are saved, not from here.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { getCurrentVersions, getVersionHistory } from '@/lib/playbook/versions';

export const PLAYBOOK_VERSIONS_QUERY_KEY = ['playbookVersions'];

export function usePlaybookVersions() {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: PLAYBOOK_VERSIONS_QUERY_KEY,
    queryFn: () => db.playbookVersions.list(),
    staleTime: 1000 * 60 * 5,
  });

  const currentVersions = useMemo(() => getCurrentVersions(versions), [versions]);

  return {
    versions,
    isLoading,
    currentVersions,
    getCurrentVersion: (setupId) => currentVersions.get(String(setupId || '')) || null,
    getHistory: (setupId) => getVersionHistory(versions, setupId),
  };
}

export default usePlaybookVersions;
