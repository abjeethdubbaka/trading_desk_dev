/**
 * @file src/lib/ai/hooks/useScreenshotAI.js
 *
 * React hook for screenshot AI analysis.
 */

import { useCallback, useState } from 'react';
import { analyzeImageWithClaude } from '../services/claudeService.js';
import { validateAnalysisResult } from '../utils/validation.js';

export function useScreenshotAI() {
  const [imageStates, setImageStates] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  const setImageState = useCallback((id, state) => {
    setImageStates((prev) => ({ ...prev, [id]: state }));
  }, []);

  const setImageError = useCallback((id, message) => {
    setImageErrors((prev) => ({ ...prev, [id]: message }));
  }, []);

  const analyzeOne = useCallback(async (shot) => {
    setImageState(shot.id, 'loading');
    setImageError(shot.id, null);

    try {
      const [header, base64Data] = shot.url.split(',');
      const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/png';

      const result = await analyzeImageWithClaude(base64Data, mediaType);
      
      // Validate the result
      const validatedResult = validateAnalysisResult(result);
      
      setImageState(shot.id, 'done');
      return { id: shot.id, result: validatedResult };
    } catch (err) {
      setImageState(shot.id, 'error');
      setImageError(shot.id, err.message);
      return { id: shot.id, result: null, error: err.message };
    }
  }, [setImageError, setImageState]);

  const analyzeAll = useCallback(async (screenshots, onResult, onProgress) => {
    if (!screenshots?.length) {
      return;
    }

    const initialStates = {};
    screenshots.forEach((s) => {
      initialStates[s.id] = 'idle';
    });
    setImageStates(initialStates);
    setImageErrors({});

    const total = screenshots.length;
    let done = 0;
    if (onProgress) {
      onProgress({ done, total });
    }

    for (const shot of screenshots) {
      const { id, result } = await analyzeOne(shot);
      done += 1;

      if (result && onResult) {
        onResult(id, result);
      }

      if (onProgress) {
        onProgress({ done, total });
      }
    }
  }, [analyzeOne]);

  const isAnyLoading = Object.values(imageStates).some((state) => state === 'loading');

  return {
    analyzeAll,
    analyzeOne,
    getState: (id) => imageStates[id] || 'idle',
    getError: (id) => imageErrors[id] || null,
    isAnyLoading,
    imageStates,
    imageErrors,
  };
}


