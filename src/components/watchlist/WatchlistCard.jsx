import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MoreHorizontal,
  Eye,
  Target,
  Trash2,
  Bell
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { base44 } from '@/api/base44Client';

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

const statusColors = {
  watching: 'bg-white/10 text-white/60',
  ready: 'bg-emerald-500/20 text-emerald-400',
  triggered: 'bg-amber-500/20 text-amber-400',
  passed: 'bg-white/5 text-white/30'
};

const floatLabels = {
  micro: 'Micro Float',
  small: 'Small Float',
  mid: 'Mid Float',
  large: 'Large Float'
};

export default function WatchlistCard({ item, onEdit, onDelete, onStatusChange, onCreatePlan, onSetAlert, userId = 'user-123' }) {
  const queryClient = useQueryClient();
  
  // Update watchlist item status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.WatchlistItem.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist-items', userId]);
      onStatusChange?.(item.id, status);
    }
  });
  
  // Delete watchlist item mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchlistItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist-items', userId]);
      onDelete?.(item.id);
    }
  });
  
  const handleStatusChange = (status) => {
    updateStatusMutation.mutate({ id: item.id, status });
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to remove this item from your watchlist?')) {
      deleteMutation.mutate(item.id);
    }
  };
  return (
    <div className={cn(
      "glass-card rounded-xl p-4 gradient-border transition-all hover:bg-white/5",
      item.status === 'passed' && 'opacity-50'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <span className="text-lg font-bold">{item.symbol?.slice(0, 2)}</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">{item.symbol}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={cn("text-xs", priorityColors[item.priority])}>
                {item.priority}
              </Badge>
              <Badge className={cn("text-xs border-0", statusColors[item.status])}>
                {item.status}
              </Badge>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1a24] border-white/10">
            <DropdownMenuItem onClick={() => handleStatusChange('watching')} className="text-white/70 hover:text-white">
              <Eye className="w-4 h-4 mr-2" /> Watching
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('ready')} className="text-emerald-400">
              <Star className="w-4 h-4 mr-2" /> Ready
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreatePlan(item)} className="text-amber-400">
              <Target className="w-4 h-4 mr-2" /> Create Plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetAlert(item)} className="text-blue-400">
              <Bell className="w-4 h-4 mr-2" /> Set Alert
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('passed')} className="text-white/40">
              <TrendingDown className="w-4 h-4 mr-2" /> Passed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-400">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {item.catalyst && (
        <p className="text-sm text-white/60 mb-3 line-clamp-2">{item.catalyst}</p>
      )}

      <div className="grid grid-cols-3 gap-3 text-sm">
        {item.premarket_high && (
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-white/40 text-xs">PM High</p>
            <p className="font-semibold text-emerald-400">${item.premarket_high}</p>
          </div>
        )}
        {item.premarket_low && (
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-white/40 text-xs">PM Low</p>
            <p className="font-semibold text-red-400">${item.premarket_low}</p>
          </div>
        )}
        {item.float_size && (
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-white/40 text-xs">Float</p>
            <p className="font-semibold">{floatLabels[item.float_size]}</p>
          </div>
        )}
      </div>

      {item.notes && (
        <p className="text-xs text-white/40 mt-3 italic">{item.notes}</p>
      )}
    </div>
  );
}