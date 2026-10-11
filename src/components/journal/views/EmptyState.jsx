import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, X } from 'lucide-react';

/**
 * Two different empties: a journal with nothing in it, and a filter that
 * matched nothing. The first asks for a trade; the second offers the way back.
 */
export default function EmptyState({ hasFilters, onAddTrade, onClearFilters }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-12 text-center">
      <BookOpen className="mx-auto mb-4 h-10 w-10 text-white/20" />
      <h3 className="mb-1.5 text-base font-semibold text-white/85">
        {hasFilters ? 'No trades match' : 'No trades yet'}
      </h3>
      <p className="mb-6 text-sm text-white/45">
        {hasFilters
          ? 'Nothing in the journal fits these chips and this period.'
          : 'Log a trade to start building the record.'}
      </p>
      {hasFilters ? (
        onClearFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="text-white/60 hover:text-white">
            <X className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        )
      ) : (
        <Button onClick={onAddTrade} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Log your first trade
        </Button>
      )}
    </div>
  );
}
