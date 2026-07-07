import { useCallback, useReducer } from 'react';

const initialState = {
  drawerTradeId: null,
  showShortcutsOverlay: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'OPEN_DRAWER':
      return { ...state, drawerTradeId: action.payload };
    case 'CLOSE_DRAWER':
      return { ...state, drawerTradeId: null };
    case 'TOGGLE_SHORTCUTS':
      return { ...state, showShortcutsOverlay: !state.showShortcutsOverlay };
    case 'CLOSE_SHORTCUTS':
      return { ...state, showShortcutsOverlay: false };
    case 'ESCAPE':
      if (state.drawerTradeId) return { ...state, drawerTradeId: null };
      return { ...state, showShortcutsOverlay: false };
    default:
      return state;
  }
}

export function useJournalUi() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // dispatch is stable from useReducer, so no deps needed
  const handleEscape = useCallback(() => dispatch({ type: 'ESCAPE' }), []);
  const toggleShortcuts = useCallback(() => dispatch({ type: 'TOGGLE_SHORTCUTS' }), []);

  return {
    drawerTradeId: state.drawerTradeId,
    showShortcutsOverlay: state.showShortcutsOverlay,
    openDrawer: useCallback((tradeId) => dispatch({ type: 'OPEN_DRAWER', payload: tradeId }), []),
    closeDrawer: useCallback(() => dispatch({ type: 'CLOSE_DRAWER' }), []),
    toggleShortcuts,
    closeShortcuts: useCallback(() => dispatch({ type: 'CLOSE_SHORTCUTS' }), []),
    handleEscape,
  };
}
