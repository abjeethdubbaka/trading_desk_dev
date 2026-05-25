import { useCallback, useReducer } from 'react';
import { VIEW_MODES } from '../../utils/constants';

const initialState = {
  viewMode: VIEW_MODES.COMPACT,
  drawerTradeId: null,
  showShortcutsOverlay: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
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
    viewMode: state.viewMode,
    drawerTradeId: state.drawerTradeId,
    showShortcutsOverlay: state.showShortcutsOverlay,
    setViewMode: useCallback((mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }), []),
    openDrawer: useCallback((tradeId) => dispatch({ type: 'OPEN_DRAWER', payload: tradeId }), []),
    closeDrawer: useCallback(() => dispatch({ type: 'CLOSE_DRAWER' }), []),
    toggleShortcuts,
    closeShortcuts: useCallback(() => dispatch({ type: 'CLOSE_SHORTCUTS' }), []),
    handleEscape,
  };
}
