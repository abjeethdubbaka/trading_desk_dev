/**
 * @file src/lib/ai/prompts/screenshotPrompts.js
 *
 * AI prompts for screenshot analysis.
 */

export const SYSTEM_PROMPT = `You are an expert trading chart analyst specializing in technical analysis, price action, and trading psychology. Your job is to analyze chart screenshots and extract structured insights.

When you receive a chart image, analyze it carefully and return ONLY a valid JSON object — no markdown, no explanation, no backticks. Just the raw JSON.

Focus on:
- Price action and pattern recognition
- Volume if visible
- Key support/resistance levels visible in the chart
- Entry and exit quality if marked
- Setup classification based on what you can see

If something is not visible or determinable from the chart, use null for that field.`;

export const USER_PROMPT = `Analyze this trading chart screenshot and return ONLY this JSON structure with no other text:

{
  "detected_setup": "<one of: VWAP Pullback | Breakout | Reversal | Continuation | Range | Momentum | Consolidation | Gap Fill | Unknown>",
  "trend_direction": "<up | down | sideways>",
  "timeframe": "<detected timeframe string, e.g. '1m', '5m', '15m', '1h', 'daily' — or null if not visible>",
  "entry_quality_score": <number 0-10, where 10 is a textbook perfect entry>,
  "confidence": <number 0.0 to 1.0 — your confidence in this analysis>,
  "risk_signals": ["<signal1>", "<signal2>"],
  "strength_signals": ["<signal1>", "<signal2>"],
  "narrative": "<2-3 sentence trade narrative describing what you see happening in the chart>",
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


