import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { validateTrade } from '@/lib/validation/trades';
import { getTradeNotesText } from '../utils/notes';
import {
  normalizeDuplicateTrade,
  buildMinimalDuplicateTrade,
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

export function useJournalModal({ createTrade, updateTrade }) {
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

  const handleDuplicateTrade = useCallback(async (trade) => {
    try {
      let duplicatePayload = normalizeDuplicateTrade(trade);
      let validation = validateTrade(duplicatePayload);

      if (!validation.isValid) {
        const fallbackPayload = buildMinimalDuplicateTrade(trade);
        const fallbackValidation = validateTrade(fallbackPayload);

        if (!fallbackValidation.isValid) {
          const allErrors = [...new Set([...(validation.errors || []), ...(fallbackValidation.errors || [])])];
          toast.error(`Trade validation failed: ${allErrors.join(', ')}`);
          return;
        }

        duplicatePayload = fallbackPayload;
        validation = fallbackValidation;
      }

      if (!validation.isValid) {
        toast.error(`Trade validation failed: ${(validation.errors || []).join(', ')}`);
        return;
      }

      const created = await createTrade(duplicatePayload);
      toast.success(`${created?.symbol || trade?.symbol || 'Trade'} duplicated`);
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

  return {
    showModal,
    editingTrade,
    openCreateModal,
    handleEdit,
    handleClose,
    handleSave,
    handleDuplicateTrade,
    handleCopyNotes,
  };
}
