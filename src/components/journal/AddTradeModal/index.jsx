import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AddTradeForm from './components/AddTradeForm';
import { useAddTradeModalController } from './hooks/useAddTradeModalController';

export default function AddTradeModal({ open, onClose, onSave, initialData }) {
  const controller = useAddTradeModalController({
    open,
    onSave,
    initialData,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Log'} Trade</DialogTitle>
          <DialogDescription className="text-white/50">
            Enter your trade details, then submit to save it in your journal.
          </DialogDescription>
        </DialogHeader>

        <AddTradeForm
          initialData={initialData}
          controller={controller}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
