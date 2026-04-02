import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useSettings } from './SettingsContext';

const DEFAULT_TIMER_SECONDS = 180;

const AnalysisTimerContext = createContext(null);

const toTimerSeconds = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_TIMER_SECONDS;
  return Math.round(numeric);
};

const getWarningThresholdSeconds = (durationSeconds) => (
  Math.min(15, Math.max(5, Math.ceil(durationSeconds * 0.1)))
);

export const formatAnalysisTimer = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function AnalysisTimerProvider({ children }) {
  const { settings } = useSettings();
  const timerDurationSeconds = useMemo(
    () => toTimerSeconds(settings?.analysis_timer_seconds),
    [settings?.analysis_timer_seconds]
  );
  const previousDurationRef = useRef(timerDurationSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(timerDurationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const previousDuration = previousDurationRef.current;
    previousDurationRef.current = timerDurationSeconds;

    setRemainingSeconds((current) => {
      if (!hasStarted) return timerDurationSeconds;

      const elapsedSeconds = Math.max(0, previousDuration - current);
      return Math.max(0, timerDurationSeconds - elapsedSeconds);
    });
  }, [hasStarted, timerDurationSeconds]);

  useEffect(() => {
    if (!isTimerRunning) return undefined;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isTimerRunning]);

  useEffect(() => {
    if (remainingSeconds !== 0 || !isTimerRunning) return;
    setIsTimerRunning(false);
    toast.success('Position analysis timer finished.');
  }, [remainingSeconds, isTimerRunning]);

  const toggleTimer = useCallback(() => {
    setHasStarted(true);

    if (remainingSeconds <= 0) {
      setRemainingSeconds(timerDurationSeconds);
      setIsTimerRunning(true);
      return;
    }

    setIsTimerRunning((previous) => !previous);
  }, [remainingSeconds, timerDurationSeconds]);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setHasStarted(false);
    setRemainingSeconds(timerDurationSeconds);
  }, [timerDurationSeconds]);

  const warningThresholdSeconds = useMemo(
    () => getWarningThresholdSeconds(timerDurationSeconds),
    [timerDurationSeconds]
  );

  const isNearEnd = hasStarted && remainingSeconds > 0 && remainingSeconds <= warningThresholdSeconds;
  const isExpired = hasStarted && remainingSeconds === 0;
  const status = isExpired
    ? 'expired'
    : isTimerRunning
      ? 'running'
      : hasStarted
        ? 'paused'
        : 'idle';

  const value = useMemo(() => ({
    timerDurationSeconds,
    remainingSeconds,
    isTimerRunning,
    hasStarted,
    isNearEnd,
    isExpired,
    isVisible: hasStarted,
    status,
    toggleTimer,
    resetTimer,
  }), [
    hasStarted,
    isExpired,
    isNearEnd,
    isTimerRunning,
    remainingSeconds,
    resetTimer,
    status,
    timerDurationSeconds,
    toggleTimer,
  ]);

  return (
    <AnalysisTimerContext.Provider value={value}>
      {children}
    </AnalysisTimerContext.Provider>
  );
}

export function useAnalysisTimer() {
  const context = useContext(AnalysisTimerContext);

  if (!context) {
    return {
      timerDurationSeconds: DEFAULT_TIMER_SECONDS,
      remainingSeconds: DEFAULT_TIMER_SECONDS,
      isTimerRunning: false,
      hasStarted: false,
      isNearEnd: false,
      isExpired: false,
      isVisible: false,
      status: 'idle',
      toggleTimer: () => {},
      resetTimer: () => {},
    };
  }

  return context;
}

