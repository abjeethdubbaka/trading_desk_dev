import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { toPointValue, toTickValue } from '@/lib/calculations/trades';

const formatNumber = (value) => (value == null ? '' : String(value));

/**
 * A contract's dollar value per point (MES: $5). Sizing and P&L count in
 * ticks, so this stores the tick value it implies and keeps the text as
 * typed — a half-entered "5." is not rewritten under the cursor.
 */
export default function PointValueInput({ tickSize, tickValue, onTickValueChange, className, disabled, id }) {
  const derived = formatNumber(toPointValue(tickSize, tickValue));
  const [text, setText] = useState(derived);
  const lastSent = useRef(null);

  // Follow changes made elsewhere (a contract picked, a tick size edited),
  // but not the echo of what was just typed here.
  useEffect(() => {
    if (lastSent.current !== null && String(tickValue) === lastSent.current) return;
    lastSent.current = null;
    setText(derived);
  }, [derived, tickValue]);

  const handleChange = (event) => {
    const next = event.target.value;
    setText(next);
    const tick = toTickValue(tickSize, next);
    if (next.trim() === '' || tick == null) return;
    lastSent.current = String(tick);
    onTickValueChange?.(String(tick));
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      placeholder="5"
      className={className}
      disabled={disabled || !(Number(tickSize) > 0)}
      title={Number(tickSize) > 0 ? `$${formatNumber(tickValue) || '0'} per tick` : 'Set the tick size first'}
    />
  );
}
