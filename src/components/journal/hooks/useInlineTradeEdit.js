import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Per-trade hook for optimistic inline cell edits.
 *
 * Usage:
 *   const { saving, savingField, editField } = useInlineTradeEdit({ trade, onInlineUpdateTrade });
 *   <EditableCell onSave={(v) => editField('exit_price', v)} loading={savingField === 'exit_price'} />
 */
export function useInlineTradeEdit({ trade, onInlineUpdateTrade }) {
  const [savingField, setSavingField] = useState(null);

  const editField = useCallback(async (field, value) => {
    if (!onInlineUpdateTrade) return;
    setSavingField(field);
    try {
      await onInlineUpdateTrade(trade, { [field]: value });
    } catch (err) {
      toast.error(`Failed to update ${field}: ${err?.message || 'Unknown error'}`);
      throw err;
    } finally {
      setSavingField(null);
    }
  }, [trade, onInlineUpdateTrade]);

  return { savingField, editField };
}
