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
  const timerSoundEnabled = settings?.notifications?.analysis_timer_sound !== false;
  const previousDurationRef = useRef(timerDurationSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(timerDurationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioContextRef = useRef(null);
  const finishTonePlayedRef = useRef(false);
  const countdownSecondRef = useRef(null);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    return audioContextRef.current;
  }, []);

  const playTone = useCallback((options = {}) => {
    if (!timerSoundEnabled) return;

    const context = ensureAudioContext();
    if (!context) return;

    const {
      frequency = 880,
      duration = 0.08,
      type = 'sine',
      volume = 0.04,
      delay = 0,
    } = options;
    const safeDuration = Math.max(0.04, Number(duration) || 0.08);
    const startTime = context.currentTime + Math.max(0, Number(delay) || 0);

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + safeDuration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + safeDuration + 0.02);
  }, [ensureAudioContext, timerSoundEnabled]);

  const playPattern = useCallback((tones = []) => {
    tones.forEach((tone) => playTone(tone));
  }, [playTone]);

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

    if (!finishTonePlayedRef.current) {
      playPattern([
        { frequency: 740, duration: 0.1, volume: 0.045, type: 'triangle' },
        { frequency: 988, duration: 0.16, volume: 0.055, type: 'triangle', delay: 0.12 },
      ]);
      finishTonePlayedRef.current = true;
    }

    setIsTimerRunning(false);
    toast.success('Position analysis timer finished.');
  }, [remainingSeconds, isTimerRunning, playPattern]);

  useEffect(() => {
    if (remainingSeconds > 0) {
      finishTonePlayedRef.current = false;
    }
  }, [remainingSeconds]);

  useEffect(() => {
    if (!isTimerRunning || remainingSeconds <= 0 || remainingSeconds > 10) {
      countdownSecondRef.current = null;
      return;
    }

    if (countdownSecondRef.current === remainingSeconds) return;
    countdownSecondRef.current = remainingSeconds;

    const isCriticalCountdown = remainingSeconds <= 3;
    playTone({
      frequency: isCriticalCountdown ? 1280 : 980,
      duration: isCriticalCountdown ? 0.1 : 0.075,
      volume: isCriticalCountdown ? 0.055 : 0.045,
      type: isCriticalCountdown ? 'square' : 'sine',
    });
  }, [isTimerRunning, remainingSeconds, playTone]);

  const toggleTimer = useCallback(() => {
    setHasStarted(true);
    ensureAudioContext();

    if (remainingSeconds <= 0) {
      setRemainingSeconds(timerDurationSeconds);
      setIsTimerRunning(true);
      playPattern([
        { frequency: 830, duration: 0.07, volume: 0.04, type: 'triangle' },
        { frequency: 1040, duration: 0.09, volume: 0.05, type: 'triangle', delay: 0.08 },
      ]);
      return;
    }

    if (isTimerRunning) {
      setIsTimerRunning(false);
      playTone({ frequency: 450, duration: 0.08, volume: 0.035, type: 'triangle' });
      return;
    }

    setIsTimerRunning(true);
    playTone({ frequency: 880, duration: 0.08, volume: 0.045, type: 'triangle' });
  }, [ensureAudioContext, isTimerRunning, playPattern, playTone, remainingSeconds, timerDurationSeconds]);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setHasStarted(false);
    setRemainingSeconds(timerDurationSeconds);
    playTone({ frequency: 520, duration: 0.075, volume: 0.03, type: 'sine' });
  }, [playTone, timerDurationSeconds]);

  useEffect(() => () => {
    if (!audioContextRef.current) return;
    audioContextRef.current.close().catch(() => {});
    audioContextRef.current = null;
  }, []);

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
    timerSoundEnabled,
  }), [
    hasStarted,
    isExpired,
    isNearEnd,
    isTimerRunning,
    remainingSeconds,
    resetTimer,
    status,
    timerSoundEnabled,
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
      timerSoundEnabled: true,
    };
  }

  return context;
}
