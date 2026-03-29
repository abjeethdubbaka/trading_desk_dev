import { useState, useCallback } from 'react';

// ─── Prompt ────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert trading chart analyst specializing in technical analysis, price action, and trading psychology. Your job is to analyze chart screenshots and extract structured insights.

When you receive a chart image, analyze it carefully and return ONLY a valid JSON object — no markdown, no explanation, no backticks. Just the raw JSON.

Focus on:
- Price action and pattern recognition
- Volume if visible
- Key support/resistance levels visible in the chart
- Entry and exit quality if marked
- Setup classification based on what you can see

If something is not visible or determinable from the chart, use null for that field.`;

const USER_PROMPT = `Analyze this trading chart screenshot and return ONLY this JSON structure with no other text:

{
  "detected_setup": "<one of: VWAP Pullback | Breakout | Reversal | Continuation | Range | Momentum | Consolidation | Gap Fill | Unknown>",
  "trend_direction": "<up | down | sideways>",
  "timeframe": "<detected timeframe string, e.g. '1m', '5m', '15m', '1h', 'daily' — or null if not visible>",
  "entry_quality_score": <number 0-10, where 10 is a textbook perfect entry>,
  "confidence": <number 0.0 to 1.0 — your confidence in this analysis>,
  "risk_signals": ["<signal1>", "<signal2>"],
  "strength_signals": ["<signal1>", "<signal2>"],
  "narrative": "<2-3 sentence trade narrative describing what you see happening in the chart>",
  "price_levels": {
    "support": <number or null>,
    "resistance": <number or null>,
    "entry_zone": "<price range string or null>"
  },
  "pattern_match": "<specific pattern name if clearly identified, e.g. 'Bull flag', 'VWAP reclaim', 'Double bottom' — or null>",
  "entry_timing": "<ideal | early | late | unknown>",
  "exit_timing": "<ideal | early | late | cut_early | held_long | unknown>",
  "better_play": "<1-2 sentences: what would have been the better entry or exit based on what the chart shows>",
  "one_thing_to_change": "<single most impactful change this trader should make next time>",
  "entry_savings_potential": "<dollar amount string if determinable, e.g. '$45' — or null>",
  "exit_left_on_table": "<dollar amount string if determinable — or null>",
  "advanced_analysis": {
    "execution": {
      "entry": {
        "grade": "<A | B | C | D | F>",
        "timing": {
          "actual": "<time string or null>",
          "deviation_type": "<early | late | ideal | null>",
          "deviation_minutes": <number or 0>,
          "cost_of_deviation": <number or 0>
        }
      },
      "exit": {
        "grade": "<A | B | C | D | F>",
        "timing": {
          "actual": "<time string or null>",
          "deviation_type": "<early | late | ideal | null>",
          "deviation_minutes": <number or 0>,
          "cost_of_deviation": <number or 0>
        }
      },
      "position": {
        "cost_of_size_mistake": <number or 0>
      }
    },
    "pattern_matching": {
      "similar_trades_count": <number 0-20, estimated>,
      "similar_trades_win_rate": <number 0-100>,
      "similar_trades_avg_pnl": <number>,
      "recommendation": "<one sentence recommendation based on pattern>"
    },
    "improvement_analysis": {
      "primary_mistake": {
        "specific": "<short label for the main mistake, e.g. 'Chasing entry'>",
        "cost": <number or 0>
      },
      "secondary_mistake": {
        "specific": "<short label or null>",
        "cost": <number or 0>
      },
      "rewind": {
        "projected_pnl": <number or 0>,
        "actual_vs_projected": <number or 0>
      },
      "action_items": [
        {
          "description": "<specific actionable improvement>",
          "priority": "<high | medium | low>",
          "type": "<entry | exit | risk | psychology>"
        }
      ]
    }
  }
}`;

// ─── API Call ───────────────────────────────────────────────────────────────
async function analyzeImageWithClaude(base64Data, mediaType = 'image/png') {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: USER_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const rawText = data.content?.find((b) => b.type === 'text')?.text || '';

  // Strip any accidental markdown fences
  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${rawText.slice(0, 200)}`);
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────
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
        const [header, base64Data] = shot.url.split(',');
        const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/png';

        const result = await analyzeImageWithClaude(base64Data, mediaType);
        setImageState(shot.id, 'done');
        return { id: shot.id, result };
      } catch (err) {
        
        setImageState(shot.id, 'error');
        setImageError(shot.id, err.message);
        return { id: shot.id, result: null, error: err.message };
      }
    },
    [setImageState, setImageError]
  );

  /**
   * Analyze all screenshots — processes them in parallel with a concurrency cap of 3.
   * Calls onResult(id, analysisData) as each image completes so the UI updates live.
   */
  const analyzeAll = useCallback(
    async (screenshots, onResult) => {
      if (!screenshots?.length) return;

      // Reset states for all images
      const initialStates = {};
      screenshots.forEach((s) => { initialStates[s.id] = 'idle'; });
      setImageStates(initialStates);
      setImageErrors({});

      // Concurrency-limited parallel execution (max 3 at once)
      const CONCURRENCY = 3;
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
      const seeds = Math.min(CONCURRENCY, screenshots.length);
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


