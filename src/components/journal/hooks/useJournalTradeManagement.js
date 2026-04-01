import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { validateTrade } from '@/lib/validation/trades';

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

  return {
    showModal,
    editingTrade,
    openCreateModal,
    handleEdit,
    handleClose,
    handleSave,
    handleDelete,
  };
}
