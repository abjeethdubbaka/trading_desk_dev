import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { validateTrade } from '@/lib/validation/trades';
import { getTradeNotesText } from '../utils/notes';
import {
  normalizeDuplicateTrade,
  buildMinimalDuplicateTrade,
  buildInlineUpdatePayload,
} from '../utils/tradePayloadMappers';

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
      let duplicatePayload = normalizeDuplicateTrade(trade);
      let validation = validateTrade(duplicatePayload);

      if (!validation.isValid) {
        const fallbackPayload = buildMinimalDuplicateTrade(trade);
        const fallbackValidation = validateTrade(fallbackPayload);

        if (!fallbackValidation.isValid) {
          const allErrors = [...new Set([...(validation.errors || []), ...(fallbackValidation.errors || [])])];
          const message = `Trade validation failed: ${allErrors.join(', ')}`;
          toast.error(message);
          return;
        }

        duplicatePayload = fallbackPayload;
        validation = fallbackValidation;
      }

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
    const notes = getTradeNotesText(trade);
    if (!notes) {
      toast.info('No notes to copy');
      return;
    }

    try {
      await writeTextToClipboard(notes);
      toast.success('Notes copied');
    } catch {
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
