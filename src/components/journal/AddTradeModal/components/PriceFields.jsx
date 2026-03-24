import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PriceFields = ({ values, onChange }) => {
  return (
    <div className="grid grid-cols-5 gap-4">
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
        <Label htmlFor="stop-loss">Stop Loss</Label>
        <Input
          id="stop-loss"
          type="number"
          step="0.01"
          value={values.stop_loss || ''}
          onChange={(e) => onChange('stop_loss', e.target.value)}
          className="bg-white/5 border-white/10"
          placeholder="0.00"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="position-size">Size *</Label>
        <Input
          id="position-size"
          type="number"
          value={values.position_size}
          onChange={(e) => onChange('position_size', e.target.value)}
          className="bg-white/5 border-white/10"
          required
          placeholder="100"
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
  );
};

export default React.memo(PriceFields);
