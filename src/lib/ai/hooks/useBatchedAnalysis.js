/**
 * @file src/lib/ai/hooks/useBatchedAnalysis.js
 *
 * Batched AI analysis for performance optimization.
 */

import { useCallback, useState } from 'react';
import { analyzeImageWithClaude } from '../services/claudeService.js';

export function useBatchedAnalysis(batchSize = 3, delay = 1000) {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const chunk = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const analyzeInBatches = useCallback(async (screenshots, onResult, onProgress) => {
    if (!screenshots?.length) return;

    setProcessing(true);
    const batches = chunk(screenshots, batchSize);
    const total = screenshots.length;
    let processed = 0;

    try {
      for (const batch of batches) {
        const batchPromises = batch.map(async (shot) => {
          try {
            const [header, base64Data] = shot.url.split(',');
            const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
            
            const result = await analyzeImageWithClaude(base64Data, mediaType);
            processed++;
            
            if (onResult) {
              onResult(shot.id, result);
            }
            
            if (onProgress) {
              onProgress({ done: processed, total });
            }
            
            return { id: shot.id, result };
          } catch (error) {
            processed++;
            
            return { id: shot.id, result: null, error: error.message };
          }
        });

        await Promise.all(batchPromises);
        
        // Rate limiting between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await delay(delay);
        }
      }
    } finally {
      setProcessing(false);
    }
  }, [batchSize, delay]);

  return {
    analyzeInBatches,
    processing,
    queue
  };
}


