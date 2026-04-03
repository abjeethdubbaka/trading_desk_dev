import React, { useCallback, useMemo, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

export default function FloatCategoriesSettings() {
  const { settings, loading, saving, updateFloatCategory } = useSettings();
  const [draftValues, setDraftValues] = useState({});
  const categories = settings?.float_categories || {};
  const compactInputClass = 'h-9 rounded-lg px-2.5 bg-white/5 border-white/10 text-sm';
  const compactSelectClass = 'w-full h-9 rounded-lg px-2.5 bg-white/5 border border-white/10 text-sm text-white';

  const inputValue = useCallback((value) => (value == null || value === Infinity ? '' : String(value)), []);
  const keyFor = useCallback((categoryKey, field) => `${categoryKey}:${field}`, []);

  const getFieldValue = useCallback((categoryKey, field, sourceValue) => {
    const lookupKey = keyFor(categoryKey, field);
    return draftValues[lookupKey] ?? inputValue(sourceValue);
  }, [draftValues, inputValue, keyFor]);

  const updateDraftValue = useCallback((categoryKey, field, value) => {
    const lookupKey = keyFor(categoryKey, field);
    setDraftValues((prev) => ({
      ...prev,
      [lookupKey]: value,
    }));
  }, [keyFor]);

  const commitNumericField = useCallback((categoryKey, field, rawValue, fallbackValue, allowInfinity = false) => {
    let parsedValue;
    if (rawValue === '' && allowInfinity) {
      parsedValue = Infinity;
    } else {
      const numericValue = parseFloat(rawValue);
      parsedValue = Number.isFinite(numericValue) ? numericValue : fallbackValue;
    }

    updateFloatCategory(categoryKey, { [field]: parsedValue });
    const lookupKey = keyFor(categoryKey, field);
    setDraftValues((prev) => {
      const next = { ...prev };
      delete next[lookupKey];
      return next;
    });
  }, [keyFor, updateFloatCategory]);

  const categoryEntries = useMemo(() => Object.entries(categories), [categories]);

  return (
    <div className="glass-card rounded-2xl p-4 gradient-border max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-emerald-400" />
        <h2 className="text-lg font-semibold">Float Categories</h2>
      </div>
      
      <div className="space-y-3">
        {categoryEntries.map(([key, category]) => (
          <div key={key} className="bg-white/5 rounded-lg p-3 border border-white/10">
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
                  value={getFieldValue(key, 'min', category.min)}
                  onChange={(e) => updateDraftValue(key, 'min', e.target.value)}
                  onBlur={(e) => commitNumericField(key, 'min', e.target.value, 0, true)}
                  placeholder="0"
                  className={compactInputClass}
                  disabled={loading || saving}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Max Float</Label>
                <Input
                  type="number"
                  value={getFieldValue(key, 'max', category.max)}
                  onChange={(e) => updateDraftValue(key, 'max', e.target.value)}
                  onBlur={(e) => commitNumericField(key, 'max', e.target.value, 0, true)}
                  placeholder="Infinity"
                  className={compactInputClass}
                  disabled={loading || saving}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Color</Label>
                <select
                  value={category.color || ''}
                  onChange={(e) => updateFloatCategory(key, { color: e.target.value })}
                  className={compactSelectClass}
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
                  value={getFieldValue(key, 'positionMultiplier', category.positionMultiplier)}
                  onChange={(e) => updateDraftValue(key, 'positionMultiplier', e.target.value)}
                  onBlur={(e) => commitNumericField(key, 'positionMultiplier', e.target.value, 1)}
                  placeholder="1.0"
                  className={compactInputClass}
                  disabled={loading || saving}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Stop Loss %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={getFieldValue(key, 'stopLossPercent', category.stopLossPercent)}
                  onChange={(e) => updateDraftValue(key, 'stopLossPercent', e.target.value)}
                  onBlur={(e) => commitNumericField(key, 'stopLossPercent', e.target.value, 2)}
                  placeholder="3.0"
                  className={compactInputClass}
                  disabled={loading || saving}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Max Float %</Label>
                <Input
                  type="number"
                  step="0.05"
                  value={getFieldValue(key, 'maxFloatPercent', category.maxFloatPercent)}
                  onChange={(e) => updateDraftValue(key, 'maxFloatPercent', e.target.value)}
                  onBlur={(e) => commitNumericField(key, 'maxFloatPercent', e.target.value, 0.5)}
                  placeholder="0.5"
                  className={compactInputClass}
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


