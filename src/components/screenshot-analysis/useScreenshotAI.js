import { useState, useCallback } from 'react';
import { requestSecureAI, SECURE_AI_KINDS } from '@/lib/ai/services/secureAIBridge';

const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434/api/chat';
const OLLAMA_MODEL =
  import.meta.env.VITE_OLLAMA_SCREENSHOT_MODEL ||
  import.meta.env.VITE_OLLAMA_MODEL ||
  import.meta.env.VITE_OLLAMA_CHAT_MODEL;
const OLLAMA_API_KEY = import.meta.env.VITE_OLLAMA_API_KEY;
const OLLAMA_TIMEOUT_MS = Number(import.meta.env.VITE_OLLAMA_TIMEOUT_MS || 90000);
const OLLAMA_CONCURRENCY = Number(import.meta.env.VITE_OLLAMA_CONCURRENCY || 2);

const SYSTEM_PROMPT = `You are an expert trading chart analyst specializing in technical analysis, price action, and trading psychology. Your job is to analyze chart screenshots and extract structured insights.

When you receive a chart image, analyze it carefully and return only valid JSON.

Focus on:
- Price action and pattern recognition
- Volume if visible
- Key support/resistance levels visible in the chart
- Entry and exit quality if marked
- Setup classification based on what you can see

If something is not visible or determinable from the chart, use null for that field.`;

const USER_PROMPT = 'Analyze this trading chart screenshot and return structured JSON that follows the required schema exactly.';

const TIMING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['actual', 'deviation_type', 'deviation_minutes', 'cost_of_deviation'],
  properties: {
    actual: { type: ['string', 'null'] },
    deviation_type: { type: ['string', 'null'], enum: ['early', 'late', 'ideal', null] },
    deviation_minutes: { type: 'number' },
    cost_of_deviation: { type: 'number' },
  },
};

const SCREENSHOT_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'detected_setup',
    'trend_direction',
    'timeframe',
    'entry_quality_score',
    'confidence',
    'risk_signals',
    'strength_signals',
    'narrative',
    'price_levels',
    'pattern_match',
    'entry_timing',
    'exit_timing',
    'better_play',
    'one_thing_to_change',
    'entry_savings_potential',
    'exit_left_on_table',
    'advanced_analysis',
  ],
  properties: {
    detected_setup: {
      type: 'string',
      enum: ['VWAP Pullback', 'Breakout', 'Reversal', 'Continuation', 'Range', 'Momentum', 'Consolidation', 'Gap Fill', 'Unknown'],
    },
    trend_direction: { type: 'string', enum: ['up', 'down', 'sideways'] },
    timeframe: { type: ['string', 'null'] },
    entry_quality_score: { type: 'number' },
    confidence: { type: 'number' },
    risk_signals: { type: 'array', items: { type: 'string' } },
    strength_signals: { type: 'array', items: { type: 'string' } },
    narrative: { type: 'string' },
    price_levels: {
      type: 'object',
      additionalProperties: false,
      required: ['support', 'resistance', 'entry_zone'],
      properties: {
        support: { type: ['number', 'null'] },
        resistance: { type: ['number', 'null'] },
        entry_zone: { type: ['string', 'null'] },
      },
    },
    pattern_match: { type: ['string', 'null'] },
    entry_timing: { type: 'string', enum: ['ideal', 'early', 'late', 'unknown'] },
    exit_timing: { type: 'string', enum: ['ideal', 'early', 'late', 'cut_early', 'held_long', 'unknown'] },
    better_play: { type: 'string' },
    one_thing_to_change: { type: 'string' },
    entry_savings_potential: { type: ['string', 'null'] },
    exit_left_on_table: { type: ['string', 'null'] },
    advanced_analysis: {
      type: 'object',
      additionalProperties: false,
      required: ['execution', 'pattern_matching', 'improvement_analysis'],
      properties: {
        execution: {
          type: 'object',
          additionalProperties: false,
          required: ['entry', 'exit', 'position'],
          properties: {
            entry: {
              type: 'object',
              additionalProperties: false,
              required: ['grade', 'timing'],
              properties: {
                grade: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
                timing: TIMING_SCHEMA,
              },
            },
            exit: {
              type: 'object',
              additionalProperties: false,
              required: ['grade', 'timing'],
              properties: {
                grade: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
                timing: TIMING_SCHEMA,
              },
            },
            position: {
              type: 'object',
              additionalProperties: false,
              required: ['cost_of_size_mistake'],
              properties: {
                cost_of_size_mistake: { type: 'number' },
              },
            },
          },
        },
        pattern_matching: {
          type: 'object',
          additionalProperties: false,
          required: ['similar_trades_count', 'similar_trades_win_rate', 'similar_trades_avg_pnl', 'recommendation'],
          properties: {
            similar_trades_count: { type: 'number' },
            similar_trades_win_rate: { type: 'number' },
            similar_trades_avg_pnl: { type: 'number' },
            recommendation: { type: 'string' },
          },
        },
        improvement_analysis: {
          type: 'object',
          additionalProperties: false,
          required: ['primary_mistake', 'secondary_mistake', 'rewind', 'action_items'],
          properties: {
            primary_mistake: {
              type: 'object',
              additionalProperties: false,
              required: ['specific', 'cost'],
              properties: {
                specific: { type: 'string' },
                cost: { type: 'number' },
              },
            },
            secondary_mistake: {
              type: 'object',
              additionalProperties: false,
              required: ['specific', 'cost'],
              properties: {
                specific: { type: ['string', 'null'] },
                cost: { type: 'number' },
              },
            },
            rewind: {
              type: 'object',
              additionalProperties: false,
              required: ['projected_pnl', 'actual_vs_projected'],
              properties: {
                projected_pnl: { type: 'number' },
                actual_vs_projected: { type: 'number' },
              },
            },
            action_items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['description', 'priority', 'type'],
                properties: {
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  type: { type: 'string', enum: ['entry', 'exit', 'risk', 'psychology'] },
                },
              },
            },
          },
        },
      },
    },
  },
};

async function analyzeImageWithOllama(base64Data) {
  if (!base64Data) {
    throw new Error('Screenshot data is missing');
  }
  if (!String(OLLAMA_MODEL || '').trim()) {
    throw new Error('Screenshot model is not configured. Set VITE_OLLAMA_SCREENSHOT_MODEL or VITE_OLLAMA_MODEL.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const requestBody = {
      model: OLLAMA_MODEL,
      stream: false,
      format: SCREENSHOT_ANALYSIS_SCHEMA,
      options: {
        temperature: 0.2,
      },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: USER_PROMPT,
          images: [base64Data],
        },
      ],
    };

    const secureResponse = await requestSecureAI(
      SECURE_AI_KINDS.OLLAMA_CHAT,
      requestBody,
      { timeoutMs: OLLAMA_TIMEOUT_MS, allowFallback: true }
    );

    if (secureResponse) {
      const secureRawContent = secureResponse?.message?.content ?? secureResponse?.response ?? '';

      if (secureRawContent && typeof secureRawContent === 'object') {
        return secureRawContent;
      }

      const secureText = String(secureRawContent || '').trim();
      if (!secureText) {
        throw new Error('Ollama returned an empty response');
      }

      const cleanedSecureText = secureText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedSecureText);
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (OLLAMA_API_KEY) {
      headers.Authorization = `Bearer ${OLLAMA_API_KEY}`;
    }

    const response = await fetch(OLLAMA_BASE_URL, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const rawContent = data?.message?.content ?? data?.response ?? '';

    if (rawContent && typeof rawContent === 'object') {
      return rawContent;
    }

    const rawText = String(rawContent || '');

    if (!rawText) {
      throw new Error('Ollama returned an empty response');
    }

    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error(`Failed to parse Ollama response as JSON: ${rawText.slice(0, 200)}`);
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${OLLAMA_TIMEOUT_MS}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function useScreenshotAI() {
  // Per-image loading states: { [imageId]: 'idle' | 'loading' | 'done' | 'error' }
  const [imageStates, setImageStates] = useState({});
  // Per-image error messages
  const [imageErrors, setImageErrors] = useState({});

  const setImageState = useCallback((id, state) => {
    setImageStates((prev) => ({ ...prev, [id]: state }));
  }, []);

  const setImageError = useCallback((id, message) => {
    setImageErrors((prev) => ({ ...prev, [id]: message }));
  }, []);

  /**
   * Analyze a single screenshot.
   * Returns the parsed analysis object or null on failure.
   */
  const analyzeOne = useCallback(
    async (shot) => {
      setImageState(shot.id, 'loading');
      setImageError(shot.id, null);

      try {
        // shot.url is a data URL: "data:image/png;base64,<data>"
        const [, base64Data] = String(shot.url || '').split(',');

        const result = await analyzeImageWithOllama(base64Data);
        setImageState(shot.id, 'done');
        return { id: shot.id, result };
      } catch (err) {
        const message = err?.message || 'Analysis failed';
        setImageState(shot.id, 'error');
        setImageError(shot.id, message);
        return { id: shot.id, result: null, error: message };
      }
    },
    [setImageState, setImageError]
  );

  /**
   * Analyze all screenshots - processes them in parallel with a concurrency cap.
   * Calls onResult(id, analysisData) as each image completes so the UI updates live.
   */
  const analyzeAll = useCallback(
    async (screenshots, onResult) => {
      if (!screenshots?.length) return;

      // Reset states for all images
      const initialStates = {};
      screenshots.forEach((s) => {
        initialStates[s.id] = 'idle';
      });
      setImageStates(initialStates);
      setImageErrors({});

      // Concurrency-limited parallel execution
      const concurrency = Math.max(1, OLLAMA_CONCURRENCY);
      const queue = [...screenshots];
      const workers = [];

      const runNext = async () => {
        while (queue.length > 0) {
          const shot = queue.shift();
          const { id, result } = await analyzeOne(shot);
          if (result) onResult(id, result);
        }
      };

      // Seed initial concurrent requests
      const seeds = Math.min(concurrency, screenshots.length);
      for (let i = 0; i < seeds; i++) {
        workers.push(runNext());
      }

      await Promise.all(workers);
    },
    [analyzeOne]
  );

  const isAnyLoading = Object.values(imageStates).some((s) => s === 'loading');

  const getState = useCallback((id) => imageStates[id] || 'idle', [imageStates]);
  const getError = useCallback((id) => imageErrors[id] || null, [imageErrors]);

  return {
    analyzeAll,
    analyzeOne,
    getState,
    getError,
    isAnyLoading,
    imageStates,
  };
}
