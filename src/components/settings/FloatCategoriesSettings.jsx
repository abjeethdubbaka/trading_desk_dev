import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

export default function FloatCategoriesSettings() {
  const { settings, loading, saving, updateFloatCategory } = useSettings();
  const inputValue = (value) => (value == null || value === Infinity ? '' : String(value));

  return (
    <div className="glass-card rounded-2xl p-5 gradient-border max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-emerald-400" />
        <h2 className="text-lg font-semibold">Float Categories</h2>
      </div>
      
      <div className="space-y-4">
        {Object.entries(settings.float_categories).map(([key, category]) => (
          <div key={key} className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${category.color.replace('text-', 'bg-')}`} />
                <Label className="font-semibold capitalize">{category.label}</Label>
              </div>
              <div className="text-xs text-white/60">{key}</div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Min Float</Label>
                <Input
                  type="number"
                  value={inputValue(category.min)}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? Infinity : parseFloat(e.target.value) || 0;
                    updateFloatCategory(key, { min: newValue });
                  }}
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-sm"
                  disabled={loading || saving}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Max Float</Label>
                <Input
                  type="number"
                  value={inputValue(category.max)}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? Infinity : parseFloat(e.target.value) || 0;
                    updateFloatCategory(key, { max: newValue });
                  }}
                  placeholder="Infinity"
                  className="bg-white/5 border-white/10 text-sm"
                  disabled={loading || saving}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Color</Label>
                <select
                  value={category.color || ''}
                  onChange={(e) => updateFloatCategory(key, { color: e.target.value })}
                  className="w-full bg-white/5 border-white/10 text-sm rounded px-2 py-1 text-white"
                  disabled={loading || saving}
                >
                  <option value="text-red-400" className="bg-gray-800">Red</option>
                  <option value="text-orange-400" className="bg-gray-800">Orange</option>
                  <option value="text-yellow-400" className="bg-gray-800">Yellow</option>
                  <option value="text-blue-400" className="bg-gray-800">Blue</option>
                  <option value="text-emerald-400" className="bg-gray-800">Green</option>
                  <option value="text-purple-400" className="bg-gray-800">Purple</option>
                  <option value="text-pink-400" className="bg-gray-800">Pink</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Position Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={inputValue(category.positionMultiplier)}
                  onChange={(e) => updateFloatCategory(key, { positionMultiplier: parseFloat(e.target.value) || 1 })}
                  placeholder="1.0"
                  className="bg-white/5 border-white/10 text-sm"
                  disabled={loading || saving}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Stop Loss %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={inputValue(category.stopLossPercent)}
                  onChange={(e) => updateFloatCategory(key, { stopLossPercent: parseFloat(e.target.value) || 2 })}
                  placeholder="3.0"
                  className="bg-white/5 border-white/10 text-sm"
                  disabled={loading || saving}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Max Float %</Label>
                <Input
                  type="number"
                  step="0.05"
                  value={inputValue(category.maxFloatPercent)}
                  onChange={(e) => updateFloatCategory(key, { maxFloatPercent: parseFloat(e.target.value) || 0.5 })}
                  placeholder="0.5"
                  className="bg-white/5 border-white/10 text-sm"
                  disabled={loading || saving}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


