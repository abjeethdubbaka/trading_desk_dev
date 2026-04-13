import { useCallback, useEffect, useState } from 'react';
import {
  clearLearningLoopData,
  getLearningLoopScorecard,
  getLearningLoopUpdatedEventName,
} from '../services/learningLoopService';

export function useLearningLoopScorecard() {
  const [scorecard, setScorecard] = useState(() => getLearningLoopScorecard());

  const refresh = useCallback(() => {
    setScorecard(getLearningLoopScorecard());
  }, []);

  const reset = useCallback(() => {
    clearLearningLoopData();
    refresh();
  }, [refresh]);

  useEffect(() => {
    const eventName = getLearningLoopUpdatedEventName();
    const handleUpdate = () => refresh();

    window.addEventListener(eventName, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(eventName, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  return {
    scorecard,
    refresh,
    reset,
  };
}
