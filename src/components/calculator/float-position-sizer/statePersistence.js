const CALCULATOR_STATE_KEY = 'calculator.floatPositionSizer.state.v1';

export const loadCalculatorState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CALCULATOR_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export const saveCalculatorState = (state) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CALCULATOR_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write errors (quota/private mode).
  }
};

export const clearCalculatorState = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CALCULATOR_STATE_KEY);
  } catch {
    // Ignore storage cleanup errors.
  }
};
