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
          onClose={onClose}
          onUpdateField={controller.updateField}
          onUploadFiles={controller.handleUploadFiles}
          onRemoveById={controller.handleRemoveById}
          onReflectionChange={controller.handleReflectionChange}
          onStrategyStepResultChange={controller.handleStrategyStepResultChange}
          onBreakoutChecklistChange={controller.handleBreakoutChecklistChange}
          onBreakoutMetaChange={controller.handleBreakoutMetaChange}
          onSubmit={controller.handleSubmit}
          formData={controller.formData}
          symbolError={controller.symbolError}
          presets={controller.presets}
          screenshotIds={controller.screenshotIds}
          uploading={controller.uploading}
          selectedRuleIds={controller.selectedRuleIds}
          suggestionTrade={controller.suggestionTrade}
          setupTypeOptions={controller.setupTypeOptions}
          strategySteps={controller.strategyStepsForSetup}
          strategyStepResults={controller.strategyStepResults}
          preTradeAlert={controller.preTradeAlert}
          loading={controller.loading}
        />
      </DialogContent>
    </Dialog>
  );
}
