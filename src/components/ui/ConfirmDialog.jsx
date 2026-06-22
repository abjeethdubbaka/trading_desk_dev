import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Drop-in replacement for window.confirm.
 *
 * Usage (imperative, via hook):
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Delete trade?', description: 'This cannot be undone.' })) { ... }
 *
 * Or declarative:
 *   <ConfirmDialog open={open} title="..." onConfirm={...} onCancel={...} />
 */
export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel?.(); }}>
      <DialogContent className="max-w-sm bg-[#13131e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className={description ? 'text-white/50' : 'sr-only'}>
            {description || 'Confirm this action.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            className="hover:bg-white/10"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={
              destructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Imperative confirm hook. Returns a promise that resolves true/false.
 */
export function useConfirm() {
  const [state, setState] = React.useState(null);
  const resolveRef = React.useRef(null);

  const confirm = React.useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState(options);
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    resolveRef.current?.(true);
    setState(null);
  }, []);

  const handleCancel = React.useCallback(() => {
    resolveRef.current?.(false);
    setState(null);
  }, []);

  const dialog = state ? (
    <ConfirmDialog
      open
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      destructive={state.destructive ?? true}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return [confirm, dialog];
}
