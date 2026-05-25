import { useEffect } from 'react';

export function useJournalKeyboardShortcuts({
  onNewTrade,
  onFocusSearch,
  onToggleShortcutsOverlay,
  onEscape,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }

      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditing =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        document.activeElement?.isContentEditable;

      if (isEditing) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        onNewTrade?.();
        return;
      }

      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        // Toolbar listens for this to focus its search input
        window.dispatchEvent(new CustomEvent('journal-focus-search'));
        onFocusSearch?.();
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        onToggleShortcutsOverlay?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewTrade, onFocusSearch, onToggleShortcutsOverlay, onEscape]);
}
