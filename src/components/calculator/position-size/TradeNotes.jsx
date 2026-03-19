import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function TradeNotes({ values, handleInputChange }) {
  return (
    <div className="space-y-2">
      <Label>Trade Notes</Label>
      <Textarea
        value={values.notes}
        onChange={(e) => handleInputChange('notes', e.target.value)}
        placeholder="Strategy, setup type, market conditions..."
        className="bg-white/5 border-white/10 min-h-[80px]"
      />
    </div>
  );
}
