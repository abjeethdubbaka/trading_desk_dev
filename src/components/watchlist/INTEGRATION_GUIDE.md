# TradeDesk Pro — Feature Integration Guide

## What was built

### New files (drop-in, no changes needed)
| File | Location in your project |
|------|--------------------------|
| `performanceMetrics.js` | `src/lib/performanceMetrics.js` |
| `useTradeReview.js` | `src/lib/useTradeReview.js` |
| `useScreenshotAI.js` | `src/lib/useScreenshotAI.js` |
| `DashboardHeader.jsx` | `src/components/dashboard/` |
| `DailyGoalBar.jsx` | `src/components/dashboard/` |
| `StreakTracker.jsx` | `src/components/dashboard/` |
| `DayPanel.jsx` | `src/components/dashboard/` |
| `MorningBrief.jsx` | `src/components/dashboard/` |
| `EquityCurve.jsx` | `src/components/performance/` |
| `EmotionMatrix.jsx` | `src/components/performance/` |
| `PlanAdherenceCard.jsx` | `src/components/performance/` |
| `PeriodComparison.jsx` | `src/components/performance/` |
| `PriceLadder.jsx` | `src/components/calculator/` |
| `EdgePanel.jsx` | `src/components/calculator/` |
| `ScenarioTable.jsx` | `src/components/calculator/` |
| `PreTradeChecklist.jsx` | `src/components/calculator/` |
| `JournalStatsBar.jsx` | `src/components/journal/components/` |
| `TradeReviewPanel.jsx` | `src/components/journal/components/` |

### Pages to replace entirely
| File | Notes |
|------|-------|
| `src/pages/Dashboard.jsx` | Full rewrite — wires all new dashboard components |
| `src/pages/Performance.jsx` | Full rewrite — real data, new analytics tabs |
| `src/pages/Settings.jsx` | Full rewrite — tabbed, auto-save, live preview |
| `src/pages/Journal.jsx` | Full rewrite — stats bar + AI review wired |
| `src/pages/Calculator.jsx` | Small change — passes historyData |
| `src/components/calculator/FloatPositionSizer.jsx` | Full rewrite — price ladder, edge, checklist |
| `src/components/calculator/results/ResultsDisplay.jsx` | Critical fix — removes all debug code |

### Files that need a small patch (see `.patch.md` files)
| File | Change |
|------|--------|
| `TradingCalendar.jsx` | Add `onDaySelect` prop + onClick on day cells |
| `CompactView.jsx` | Add R, hold, emotion, plan columns + TradeReviewPanel |

---

## Critical fixes included

### 1. ResultsDisplay.jsx
- **Removed**: `Math.random()` render ID on every render
- **Removed**: `setInterval` logging every 2 seconds forever  
- **Removed**: `useEffect` that referenced React without importing it
- **Fixed**: Now accepts a `calculation` object directly (was expecting spread props)

### 2. PerformanceStatsCard / Performance page
- **Fixed**: Was returning hardcoded mock data (`total_pnl: 1250.50`) for every user
- **Fixed**: Now computes all metrics from real `journal-trades` data
- **Added**: Real Sharpe ratio calculation, real max drawdown

### 3. Dashboard polling removed
- **Removed**: `refetchInterval: 30000` — was polling localStorage every 30 seconds
- **Fixed**: Now uses shared `journal-trades` query key (was using separate `dashboard-trades`)
- **Result**: Single cache, event-driven updates only

---

## How auto-save works in Settings

`SettingsProvider.saveSettings()` is called with an 800ms debounce after any input change.
No save button needed. A subtle "Saved ✓" indicator appears briefly after each save.

## How MorningBrief caching works

On first dashboard load of the day, Claude analyzes your last 10 trades.
Result is stored in `localStorage` with today's date as the key.
On subsequent loads the same day, the cached version is shown instantly.
Click the refresh icon to regenerate mid-day.

## How AI Trade Review caching works

`useTradeReview` caches each review by `trade.id` in localStorage with a 24h TTL.
Editing a trade and re-reviewing will generate a fresh analysis.
`onClearReview(trade.id)` deletes the cache entry and triggers a new call.

## Pre-trade checklist logic

Reads `dosAndDonts` from localStorage, filters to `priority === 'high' && type === 'do'`.
Falls back to 5 sensible defaults if fewer than 3 rules are found.
"Add to Journal" button is disabled until all boxes are checked.
Checklist resets automatically when symbol, price, stop, or direction changes.

---

## Build order recommendation

1. Drop in `src/lib/performanceMetrics.js` first (everything else imports from it)
2. Replace `ResultsDisplay.jsx` (critical bug fix)
3. Replace `Dashboard.jsx` + drop in its 5 components
4. Replace `Performance.jsx` + drop in its 4 components  
5. Replace `Settings.jsx`
6. Drop in calculator components, replace `FloatPositionSizer.jsx` + `ResultsDisplay`
7. Drop in journal components, replace `Journal.jsx`
8. Apply `.patch.md` changes to `TradingCalendar.jsx` and `CompactView.jsx`
