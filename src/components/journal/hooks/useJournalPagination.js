import { useEffect, useMemo, useState } from 'react';

export function useJournalPagination(items, options = {}) {
  const { pageSize = 20, resetSignal } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / pageSize));
  }, [items.length, pageSize]);

  const pageStartIndex = (currentPage - 1) * pageSize;
  const paginatedItems = items.slice(pageStartIndex, pageStartIndex + pageSize);
  const pageStartNumber = items.length === 0 ? 0 : pageStartIndex + 1;
  const pageEndNumber = Math.min(items.length, pageStartIndex + paginatedItems.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [resetSignal]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    pageStartNumber,
    pageEndNumber,
  };
}
