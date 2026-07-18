import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FUTURES_CONTRACTS } from '@/lib/calculations/trades';

const PriceFields = ({ values, onChange, instrumentType = 'stocks' }) => {
  const isFutures = instrumentType === 'futures';

  return (
    <div className="space-y-3">
      {/* Futures contract selector */}
      {isFutures && (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="futures-preset">Contract</Label>
            <select
              id="futures-preset"
              value={values.futures_preset || 'ES'}
              onChange={(e) => {
                const key = e.target.value;
                onChange('futures_preset', key);
                const spec = FUTURES_CONTRACTS[key];
                if (spec) {
                  onChange('tick_size', String(spec.tickSize));
                  onChange('tick_value', String(spec.tickValue));
                }
              }}
              className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/90 outline-none"
            >
              {Object.entries(FUTURES_CONTRACTS).map(([key, spec]) => (
                <option key={key} value={key} style={{ backgroundColor: '#0d1520' }}>
                  {key} — {spec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tick-size">Tick Size</Label>
            <Input
              id="tick-size"
              type="number"
              step="any"
              value={values.tick_size || ''}
              onChange={(e) => onChange('tick_size', e.target.value)}
              className="bg-white/5 border-white/10"
              placeholder="0.25"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tick-value">Tick Value ($)</Label>
            <Input
              id="tick-value"
              type="number"
              step="any"
              value={values.tick_value || ''}
              onChange={(e) => onChange('tick_value', e.target.value)}
              className="bg-white/5 border-white/10"
              placeholder="12.50"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entry-price">Entry *</Label>
          <Input
            id="entry-price"
            type="number"
            step="0.01"
            value={values.entry_price}
            onChange={(e) => onChange('entry_price', e.target.value)}
            className="bg-white/5 border-white/10"
            required
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exit-price">Exit</Label>
          <Input
            id="exit-price"
            type="number"
            step="0.01"
            value={values.exit_price}
            onChange={(e) => onChange('exit_price', e.target.value)}
            className="bg-white/5 border-white/10"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position-size">{isFutures ? 'Contracts *' : 'Size *'}</Label>
          <Input
            id="position-size"
            type="number"
            value={values.position_size}
            onChange={(e) => onChange('position_size', e.target.value)}
            className="bg-white/5 border-white/10"
            required
            placeholder={isFutures ? '1' : '100'}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee">Fee</Label>
          <Input
            id="fee"
            type="number"
            step="0.01"
            value={values.fee}
            onChange={(e) => onChange('fee', e.target.value)}
            className="bg-white/5 border-white/10"
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(PriceFields);


