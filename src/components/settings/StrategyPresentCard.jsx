import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Layers, 
  Pencil, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StrategyPresetCard({ preset, onEdit, onDelete, onActivate, userId = 'user-123' }) {
  const queryClient = useQueryClient();
  
  // Update preset activation mutation
  const activateMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.StrategyPreset.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['strategy-presets', userId]);
      onActivate?.(preset.id, !preset.active);
    }
  });
  
  // Delete preset mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StrategyPreset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['strategy-presets', userId]);
      onDelete?.(preset.id);
    }
  });
  
  const handleActivate = (active) => {
    activateMutation.mutate({ id: preset.id, active });
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this strategy preset?')) {
      deleteMutation.mutate(preset.id);
    }
  };
  return (
    <div className={cn(
      "glass-card rounded-xl p-4 gradient-border transition-all",
      preset.active && "ring-1 ring-emerald-500/50 bg-emerald-500/5"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            preset.active ? "bg-emerald-500/20" : "bg-white/10"
          )}>
            <Layers className={cn(
              "w-5 h-5",
              preset.active ? "text-emerald-400" : "text-white/60"
            )} />
          </div>
          <div>
            <h3 className="font-semibold">{preset.name}</h3>
            {preset.active && (
              <Badge className="text-xs bg-emerald-500/20 text-emerald-400 mt-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </div>
        <Switch
          checked={preset.active}
          onCheckedChange={() => handleActivate(!preset.active)}
          className="data-[state=checked]:bg-emerald-600"
        />
      </div>

      {preset.description && (
        <p className="text-sm text-white/50 mb-3">{preset.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 text-xs">Risk/Trade</p>
          <p className="font-semibold">{preset.risk_per_trade || 1}%</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 text-xs">Max Daily Loss</p>
          <p className="font-semibold">${preset.max_daily_loss || 0}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 text-xs">Max Positions</p>
          <p className="font-semibold">{preset.max_positions || '-'}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-white/40 text-xs">Target R:R</p>
          <p className="font-semibold">{preset.target_rr || '-'}:1</p>
        </div>
      </div>

      {preset.setup_types?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-white/40 mb-1">Setup Types</p>
          <div className="flex flex-wrap gap-1">
            {Array.isArray(preset.setup_types) ? preset.setup_types.slice(0, 3).map((setup, i) => (
              <Badge key={i} className="text-xs bg-white/10 text-white/60">
                {setup}
              </Badge>
            )) : JSON.parse(preset.setup_types || '[]').slice(0, 3).map((setup, i) => (
              <Badge key={i} className="text-xs bg-white/10 text-white/60">
                {setup}
              </Badge>
            ))}
            {(Array.isArray(preset.setup_types) ? preset.setup_types : JSON.parse(preset.setup_types || '[]')).length > 3 && (
              <Badge className="text-xs bg-white/5 text-white/40">
                +{((Array.isArray(preset.setup_types) ? preset.setup_types : JSON.parse(preset.setup_types || '[]')).length - 3)} more
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(preset)}
          className="text-white/50 hover:text-white"
        >
          <Pencil className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-white/50 hover:text-red-400"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}