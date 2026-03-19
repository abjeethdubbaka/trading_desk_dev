export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function detectSetupFromName(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('vwap')) return 'vwap_pullback';
  if (lower.includes('breakout')) return 'breakout';
  if (lower.includes('reversal')) return 'reversal';
  if (lower.includes('trend')) return 'trend_continuation';
  if (lower.includes('fakeout')) return 'fakeout';
  if (lower.includes('base')) return 'base_build';
  return 'unknown';
}

const defaultReflectionFields = {
  entry_timing: '',
  entry_price_actual: '',
  entry_price_ideal: '',
  entry_savings_potential: '',
  exit_timing: '',
  exit_price_actual: '',
  exit_price_ideal: '',
  exit_left_on_table: '',
  better_play: '',
  one_thing_to_change: '',
  rewind_moment: ''
};

export function generateSuggestion(name) {
  const setup = detectSetupFromName(name);

  if (setup === 'vwap_pullback') {
    return {
      detected_setup: setup,
      entry_quality_score: 7,
      risk_signals: 'late_entry, no_confirmation',
      strength_signals: 'clean_pullback, vwap_respect',
      narrative: 'VWAP pullback structure appears present; confirm entry timing and risk discipline.',
      confidence: 0.68,
      status: 'suggested',
      user_notes: '',
      entry_timing: 'too_early',
      entry_price_actual: '',
      entry_price_ideal: '',
      entry_savings_potential: '',
      exit_timing: 'cut_early',
      exit_price_actual: '',
      exit_price_ideal: '',
      exit_left_on_table: '',
      better_play: 'Wait for volume confirmation before entry',
      one_thing_to_change: 'Enter after 3 low-volume candles',
      rewind_moment: 'At 10:32 AM - wait 2 more candles'
    };
  }

  if (setup === 'breakout') {
    return {
      detected_setup: setup,
      entry_quality_score: 6,
      risk_signals: 'chasing_breakout',
      strength_signals: 'momentum_alignment',
      narrative: 'Breakout-like structure detected; check if volume confirmation was strong enough.',
      confidence: 0.64,
      status: 'suggested',
      user_notes: '',
      entry_timing: 'too_late',
      entry_price_actual: '',
      entry_price_ideal: '',
      entry_savings_potential: '',
      exit_timing: '',
      exit_price_actual: '',
      exit_price_ideal: '',
      exit_left_on_table: '',
      better_play: 'Wait for pullback instead of chasing extension',
      one_thing_to_change: 'Enter on retest with smaller risk',
      rewind_moment: 'At breakout candle close - wait for retest'
    };
  }

  return {
    detected_setup: setup,
    entry_quality_score: 5,
    risk_signals: 'unclear_setup',
    strength_signals: 'none',
    narrative: 'Setup is unclear from filename-only heuristic. Manual review recommended.',
    confidence: 0.4,
    status: 'needs_review',
    user_notes: '',
    ...defaultReflectionFields
  };
}

export function generateAdvancedAnalysis(name) {
  const setup = detectSetupFromName(name);

  return {
    detected_setup: setup,
    entry_quality_score: 7,
    confidence: 0.68,
    status: 'suggested',

    execution: {
      entry: {
        timing: {
          actual: '',
          ideal: '',
          deviation_minutes: 0,
          deviation_type: '',
          cost_of_deviation: 0
        },
        price: {
          actual: 0,
          ideal: 0,
          slippage: 0,
          slippage_pct: 0
        },
        volume: {
          at_entry: 0,
          required: 0,
          met_criteria: false
        },
        vwap: {
          distance_at_entry: 0,
          relationship: ''
        },
        grade: ''
      },

      exit: {
        timing: {
          actual: '',
          ideal: '',
          deviation_minutes: 0,
          deviation_type: '',
          cost_of_deviation: 0
        },
        price: {
          actual: 0,
          ideal: 0,
          left_on_table: 0,
          left_on_table_pct: 0
        },
        reason: '',
        grade: ''
      },

      position: {
        size: 0,
        risk_percent: 0,
        recommended_size: 0,
        size_mistake: '',
        cost_of_size_mistake: 0
      },

      execution_score: 0
    },

    psychology: {
      pre_trade: {
        emotion: '',
        hours_slept: 0,
        consecutive_trades: 0,
        previous_trade_result: '',
        tilt_risk: 0
      },

      during_trade: {
        emotion: '',
        checked_phone: false,
        deviated_from_plan: false
      },

      post_trade: {
        emotion: '',
        revenge_trade_next: false,
        took_break: false
      },

      psychological_score: 0
    },

    setup_quality: {
      step1: {
        smooth_pullback: { value: false, weight: 25 },
        red_candles_controlled: { value: false, weight: 25 },
        sellers_below_vwap: { value: false, weight: 25 },
        long_lower_wicks: { value: false, weight: 25 },
        score: 0
      },
      step2: {
        tight_range: { value: false, weight: 25 },
        volume_dried: { value: false, weight: 25 },
        higher_lows: { value: false, weight: 25 },
        vwap_sloping_up: { value: false, weight: 25 },
        score: 0
      },
      step3: {
        break_above_base: { value: false, weight: 34 },
        volume_increased: { value: false, weight: 33 },
        vwap_rising: { value: false, weight: 33 },
        score: 0
      },

      overall_setup_score: 0,
      setup_grade: ''
    },

    market_context: {
      trend: '',
      volatility: '',
      time_of_day: '',
      day_of_week: '',
      economic_news: '',
      sector_strength: '',
      market_score: 0
    },

    improvement_analysis: {
      primary_mistake: {
        category: '',
        specific: '',
        cost: 0,
        frequency: 0
      },

      secondary_mistake: {
        category: '',
        specific: '',
        cost: 0,
        frequency: 0
      },

      action_items: [
        {
          description: 'Wait for 3 low-volume candles before entry',
          type: 'rule',
          priority: 'high'
        },
        {
          description: 'Set alert at resistance instead of watching',
          type: 'tool',
          priority: 'medium'
        }
      ],

      rewind: {
        moment: '',
        alternative_action: '',
        projected_outcome: '',
        projected_pnl: 0,
        actual_vs_projected: 0
      },

      lesson: '',
      add_to_rules: false
    },

    pattern_matching: {
      similar_trades_count: 0,
      similar_trades_win_rate: 0,
      similar_trades_avg_pnl: 0,
      pattern_name: '',
      recommendation: ''
    }
  };
}

export function parseDollarish(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateMostCommonIssue(entries) {
  const issues = {
    too_early: entries.filter((e) => e.entry_timing === 'too_early').length,
    too_late: entries.filter((e) => e.entry_timing === 'too_late').length,
    cut_early: entries.filter((e) => e.exit_timing === 'cut_early').length,
    held_long: entries.filter((e) => e.exit_timing === 'held_long').length
  };

  return Object.entries(issues).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
}

export function formatIssueLabel(issue) {
  if (!issue || issue === 'none') return 'Mixed patterns - review individually';
  return issue
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
