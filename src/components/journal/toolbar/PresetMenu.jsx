import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Star, Trash2, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { toast } from 'sonner';

export function PresetMenu({ presets, onApply, onSave, onDelete, onSetDefault }) {
  const [saveMode, setSaveMode] = useState(false);
  const [saveName, setSaveName] = useState('');

  const builtIn = presets.filter((p) => p.builtIn);
  const custom  = presets.filter((p) => !p.builtIn);

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    try {
      onSave(name);
      toast.success(`Preset "${name}" saved`);
      setSaveName('');
      setSaveMode(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setSaveMode(false); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-white/10 bg-white/[0.02] hover:bg-white/10 gap-1.5 text-xs h-9">
          <Bookmark className="w-3.5 h-3.5" />
          Presets
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56 border-white/10 bg-[#121824] text-white">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-white/40">
          Built-in
        </DropdownMenuLabel>
        {builtIn.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onSelect={() => onApply(p.id)}
            className="text-sm cursor-pointer"
          >
            {p.name}
          </DropdownMenuItem>
        ))}

        {custom.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-white/40">
              My Presets
            </DropdownMenuLabel>
            {custom.map((p) => (
              <div key={p.id} className="flex items-center gap-1 px-1">
                <DropdownMenuItem
                  onSelect={() => onApply(p.id)}
                  className="flex-1 text-sm cursor-pointer"
                >
                  {p.name}
                  {p.isDefault && <Star className="w-3 h-3 text-amber-400 ml-1 inline" />}
                </DropdownMenuItem>
                <button
                  onClick={(e) => { e.stopPropagation(); onSetDefault(p.id); }}
                  className={cn(
                    'p-1 rounded hover:bg-white/10 transition-colors',
                    p.isDefault ? 'text-amber-400' : 'text-white/30 hover:text-amber-300'
                  )}
                  title={p.isDefault ? 'Default preset' : 'Set as default'}
                >
                  <Star className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                  className="p-1 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete preset"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </>
        )}

        <DropdownMenuSeparator className="bg-white/10" />

        {saveMode ? (
          <div className="px-2 pb-2 pt-1 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Input
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setSaveMode(false);
              }}
              placeholder="Preset name…"
              className="h-7 text-xs flex-1"
            />
            <Button size="sm" onClick={handleSave} className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700">
              Save
            </Button>
          </div>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setSaveMode(true); }}
            className="text-sm text-cyan-300/80 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Save current as preset…
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
