import React from 'react';
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from 'lucide-react';

export default function EmptyState({ hasFilters, onAddTrade }) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center gradient-border">
      <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold mb-2">No trades found</h3>
      <p className="text-gray-500 mb-6">
        {hasFilters 
          ? 'Try adjusting your filters or search terms' 
          : 'Start logging your trades to build your journal'}
      </p>
      {!hasFilters && (
        <Button 
          onClick={onAddTrade} 
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Your First Trade
        </Button>
      )}
    </div>
  );
}


