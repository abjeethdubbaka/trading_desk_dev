import React from 'react';
import { Button } from '@/components/ui/button';

export default function JournalPagination({
  totalItems,
  totalPages,
  currentPage,
  onPageChange,
  pageStartNumber,
  pageEndNumber,
}) {
  if (totalItems <= 0 || totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-white/10 rounded-md bg-[#12121a] px-3 py-2">
      <p className="text-xs text-white/60">
        Showing {pageStartNumber}-{pageEndNumber} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="border-white/10"
        >
          Prev
        </Button>
        <span className="text-xs text-white/70 min-w-[90px] text-center">
          Page {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="border-white/10"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
