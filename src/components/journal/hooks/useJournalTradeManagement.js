import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { validateTrade } from '@/lib/validation/trades';

const toPositiveNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toOptionalNumber = (value) => {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toIsoStringOrNow = (value) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

async function writeTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function normalizeDuplicateTrade(trade) {
  const symbol = String(trade?.symbol || '').trim().toUpperCase();
  const entryPrice = toPositiveNumber(trade?.entry_price, 0);
  const quantity = toPositiveNumber(trade?.quantity ?? trade?.position_size, 0);
  const positionSize = toPositiveNumber(trade?.position_size ?? trade?.quantity, quantity || 0);

  return {
    ...trade,
    symbol,
    entry_price: entryPrice,
    quantity,
    position_size: positionSize || quantity,
    direction: trade?.direction === 'short' ? 'short' : 'long',
    entry_time: new Date().toISOString(),
    exit_time: null,
    exit_price: null,
    hold_duration_minutes: null,
    pnl: 0,
    pnl_percent: 0,
    r_multiple: null,
    total_pnl: 0,
    gross_pnl: 0,
    screenshots: [],
    screenshot_url: null,
    notes: String(trade?.notes || '').trim(),
    emotions: Array.isArray(trade?.emotions)
      ? trade.emotions.filter(Boolean)
      : trade?.emotions
        ? [trade.emotions]
        : [],
    followed_plan: Boolean(trade?.followed_plan ?? true),
    created_date: undefined,
    updated_date: undefined,
    created_at: undefined,
    updated_at: undefined,
    id: undefined,
  };
}

function buildInlineUpdatePayload(trade, changes) {
  const nextSymbol = String(changes?.symbol ?? trade?.symbol ?? '').trim().toUpperCase();
  const nextEntryPrice = toPositiveNumber(changes?.entry_price ?? trade?.entry_price, 0);
  const nextQuantity = toPositiveNumber(
    changes?.quantity ?? changes?.position_size ?? trade?.quantity ?? trade?.position_size,
    0
  );

  const payload = {
    symbol: nextSymbol,
    entry_price: nextEntryPrice,
    quantity: nextQuantity,
    entry_time: toIsoStringOrNow(changes?.entry_time ?? trade?.entry_time ?? trade?.created_date),
    ...changes,
  };

  if (Object.prototype.hasOwnProperty.call(changes, 'position_size')) {
    payload.position_size = toPositiveNumber(changes.position_size, nextQuantity);
    payload.quantity = toPositiveNumber(changes.position_size, nextQuantity);
  } else if (trade?.position_size != null) {
    payload.position_size = toPositiveNumber(trade.position_size, nextQuantity);
  }

  if (Object.prototype.hasOwnProperty.call(changes, 'entry_price')) {
    payload.entry_price = toPositiveNumber(changes.entry_price, nextEntryPrice);
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'exit_price')) {
    payload.exit_price = toOptionalNumber(changes.exit_price);
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'notes')) {
    payload.notes = String(changes.notes ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'setup_type')) {
    payload.setup_type = String(changes.setup_type ?? '').trim();
  }

  return payload;
}

export function useJournalTradeManagement({ createTrade, updateTrade, deleteTrade }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);

  useEffect(() => {
    const handleOpenModal = (event) => {
      setEditingTrade(event.detail?.tradeData ?? null);
      setShowModal(true);
    };

    window.addEventListener('open-add-trade-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-trade-modal', handleOpenModal);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingTrade(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((trade) => {
    setEditingTrade(trade);
    setShowModal(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setEditingTrade(null);
  }, []);

  const handleSave = useCallback(async (data) => {
    const validation = validateTrade(data);

    if (!validation.isValid) {
      const message = `Trade validation failed: ${(validation.errors || []).join(', ')}`;
      toast.error(message);
      throw new Error(message);
    }

    try {
      if (editingTrade) {
        await updateTrade({ id: editingTrade.id, data });
        toast.success(`${data.symbol} updated`);
      } else {
        console.info('[Journal] create trade requested', {
          symbol: data?.symbol,
          entry_price: data?.entry_price,
          quantity: data?.quantity,
          share_float: data?.share_float ?? null,
          share_float_range: data?.share_float_range ?? null,
        });
        await createTrade(data);
        toast.success(`${data.symbol} logged`);
      }

      setShowModal(false);
      setEditingTrade(null);
      return true;
    } catch (error) {
      const codeText = error?.code ? ` (${error.code})` : '';
      toast.error(`Failed to save${codeText}: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }, [createTrade, editingTrade, updateTrade]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this trade?')) return;
    try {
      await deleteTrade(id);
      toast.success('Trade deleted');
    } catch (error) {
      toast.error(`Delete failed: ${error.message}`);
    }
  }, [deleteTrade]);

  const handleDuplicateTrade = useCallback(async (trade) => {
    try {
      const duplicatePayload = normalizeDuplicateTrade(trade);
      const validation = validateTrade(duplicatePayload);

      if (!validation.isValid) {
        const message = `Trade validation failed: ${(validation.errors || []).join(', ')}`;
        toast.error(message);
        return;
      }

      const created = await createTrade(duplicatePayload);
      const label = created?.symbol || trade?.symbol || 'Trade';
      toast.success(`${label} duplicated`);
    } catch (error) {
      toast.error(`Duplicate failed: ${error?.message || 'Unknown error'}`);
    }
  }, [createTrade]);

  const handleCopyNotes = useCallback(async (trade) => {
    const notes = String(trade?.notes || '').trim();
    if (!notes) {
      toast.info('No notes to copy');
      return;
    }

    try {
      await writeTextToClipboard(notes);
      toast.success('Notes copied');
    } catch (error) {
      toast.error('Failed to copy notes');
    }
  }, []);

  const handleInlineUpdateTrade = useCallback(async (trade, changes) => {
    if (!trade?.id) {
      throw new Error('Missing trade id');
    }

    const payload = buildInlineUpdatePayload(trade, changes);
    const validation = validateTrade(payload);

    if (!validation.isValid) {
      const message = `Trade validation failed: ${(validation.errors || []).join(', ')}`;
      toast.error(message);
      throw new Error(message);
    }

    try {
      const updated = await updateTrade({ id: trade.id, data: payload });
      toast.success(`${updated?.symbol || trade.symbol || 'Trade'} updated`);
      return updated;
    } catch (error) {
      const codeText = error?.code ? ` (${error.code})` : '';
      toast.error(`Inline update failed${codeText}: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }, [updateTrade]);

  return {
    showModal,
    editingTrade,
    openCreateModal,
    handleEdit,
    handleClose,
    handleSave,
    handleDelete,
    handleDuplicateTrade,
    handleCopyNotes,
    handleInlineUpdateTrade,
  };
}
