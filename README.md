# TradeDesk Pro

A React + Vite + Electron trading journal and analysis desktop/web app.

This app is centered around **trade logging**, **position sizing**, **post-trade analysis**, and **personal trading process management**.

---

## Table of Contents

1. [What this application does](#what-this-application-does)
2. [Tech stack](#tech-stack)
3. [How to run the app](#how-to-run-the-app)
4. [Environment variables](#environment-variables)
5. [Application architecture](#application-architecture)
6. [Feature-by-feature guide](#feature-by-feature-guide)
7. [Data model and persistence](#data-model-and-persistence)
8. [Project structure](#project-structure)
9. [Available scripts](#available-scripts)
10. [Electron behavior](#electron-behavior)
11. [Troubleshooting](#troubleshooting)

---

## What this application does

TradeDesk Pro provides:

- A **dashboard** with account-level performance snapshot and calendar
- A **journal** to add/edit/delete trades with screenshots and setup metadata
- A **position sizing calculator** with float-aware logic and history
- A **position analysis timer** in calculator output, configurable from Settings
- A **calculation history screen** to reload prior sizing setups
- A **settings center** for account/risk/float category configuration
- A **knowledge base** for custom learning entries + learning progress
- A **Do's & Don'ts rulebook** to maintain trading discipline with usage tracking
- A **performance analytics module** broken down by time/setup/price buckets

The current main navigation includes: Dashboard, Journal, Calculator, Calc History, Knowledge Base, Do's & Don'ts, Performance, Settings.

---

## Tech stack

- **Frontend:** React 18
- **Build tool:** Vite
- **Desktop shell:** Electron
- **Routing:** react-router-dom
- **Server/cache state:** @tanstack/react-query
- **UI primitives:** Radix UI + custom UI components
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Date utilities:** date-fns
- **Notifications/toasts:** sonner
- **Persistence:** localStorage (primary in current implementation)

---

## How to run the app

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```bash
npm install
```

### Run web development mode

```bash
npm run dev
```

Vite dev server runs on `http://localhost:5176` in this project.

### Run Electron + Vite together

```bash
npm run electron-dev
```

### Build web production bundle

```bash
npm run build
```

### Package Electron app

```bash
npm run electron-pack
```

---

## Environment variables

From `.env.example`:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Polygon
VITE_POLYGON_API_KEY=your_polygon_api_key
VITE_POLYGON_BASE_URL=https://api.polygon.io/v3

# Optional discipline coach AI overlay (backend endpoint)
VITE_DISCIPLINE_COACH_ENDPOINT=
VITE_DISCIPLINE_COACH_API_KEY=
VITE_DISCIPLINE_COACH_TIMEOUT_MS=12000

# Optional screenshot AI (Anthropic)
VITE_ANTHROPIC_API_KEY=
VITE_ANTHROPIC_BASE_URL=https://api.anthropic.com/v1/messages
VITE_ANTHROPIC_MODEL=claude-sonnet-4-20250514
VITE_ANTHROPIC_VERSION=2023-06-01

# Optional Base44 app params
VITE_BASE44_FUNCTIONS_VERSION=
VITE_BASE44_APP_BASE_URL=
```

Notes:

- Keep real values in `.env.local` only; never commit `.env.local`.
- `.gitignore` already excludes local env files and credential artifacts.
- Most journaling and analytics features are still persisted in localStorage for immediate offline behavior.

---

## Application architecture

### App bootstrap

- `src/main.jsx` mounts the app and wraps it with React Query provider.
- `src/App.jsx` wires routing and app-level providers:
  - `SettingsProvider`
  - `TradingProvider`
  - `BrowserRouter`
  - global toaster

### Routing model

Routes are defined in `src/pages.config.js` with a configurable `mainPage` and a global `Layout` wrapper.

### Layout and navigation

`src/Layout.jsx` provides:

- Collapsible desktop sidebar
- Mobile drawer navigation
- Electron-aware app version and shutdown button

### State and data

- **React Query** is used for query caching and invalidation.
- **localStorage** is used heavily for trades/settings/history/user-generated content.
- Cross-view sync for trades uses custom browser events (`trades-updated`).

---

## Feature-by-feature guide

## 1) Dashboard

Page: `src/pages/Dashboard.jsx`

Key behavior:

- Reads account settings and trade records
- Computes current balance from `account_size + cumulative PnL`
- Displays:
  - current balance
  - balance delta
  - date
  - trading calendar
  - improvement suggestions
  - performance breakdown

Main components:

- `components/dashboard/TradingCalendar.jsx`
- `components/dashboard/ImproveSection.jsx`
- `components/dashboard/PerformanceBreakdown.jsx`

## 2) Journal (core trading log)

Page: `src/pages/Journal.jsx`

### Capabilities

- Add, edit, delete trades
- Search/filter by symbol, notes, setup, direction, winners/losers, date range
- View modes:
  - **Compact table**
  - **Detailed cards**
- Right-side analysis panel with key performance stats
- Trade screenshot upload and preview
- Link trades to **Do/Don't rules** directly while logging

### Add/Edit Trade modal

Component: `components/journal/AddTradeModal/index.jsx`

Supports:

- Symbol, direction, entry/exit, size, fee
- Setup type and strategy preset
- Emotions and followed-plan flag
- Reflection notes:
  - What went wrong?
  - What did you learn?
- Screenshot upload
- Do/Don't selector:
  - Select existing rules
  - Create new rules from trade context
  - Apply suggestion chips and attach rules to the trade

### Add Trade modal architecture

`AddTradeModal` was split into focused modules:

- `AddTradeModal/index.jsx` (thin wrapper)
- `hooks/useAddTradeModalController.js` (state + submit logic)
- `components/AddTradeForm.jsx` (form layout)
- `utils/setupGrade.js` (VWAP grading helper)

### VWAP Pullback workflow

When setup type is `VWAP Pullback`, the modal displays:

- 3-step breakout checklist
- Per-step notes/time fields
- Auto-calculated setup quality grade (A+ to D/F options displayed, calculated field shown)

### Screenshot viewer behavior

In Add Trade modal, Compact view, and Detailed view:

- Click screenshot to open large overlay
- Zoom in / zoom out / reset buttons
- Mouse wheel zoom
- ESC to close

### Analysis panel

Provides:

- PnL summary and trade quality indicators
- risk and expectancy metrics
- winners-only / losers-only / all toggles

## 3) Calculator (Float Position Sizer)

Page: `src/pages/Calculator.jsx`

Main component: `components/calculator/FloatPositionSizer.jsx`

### Inputs

- Symbol
- Entry price
- Optional custom stop loss
- Direction (long/short)

### Calculation modes

Implemented in `useFloatPositionSizer`:

1. **Entry-only mode**
   - uses configured position sizing % and default stop loss %
2. **Entry + explicit stop mode**
   - sizes by risk amount and account balance constraints
3. **Symbol + float mode**
   - float-aware position logic with category data

### Output

- Shares, position value, stop loss, target, risk %, account impact
- Position Analysis timer controls:
  - Start / Pause
  - Reset
  - Countdown badge (`mm:ss`)
  - Uses Settings value `analysis_timer_seconds`

### Calculator state persistence

Calculator state is persisted so prior results survive navigation between pages.

Persisted fields include symbol, entry, stop, direction, float context, and latest calculation.

### Integration with Journal

- "Add to Journal" creates and saves trade payload from calculation context.

### Calculation history persistence

- Manual calculations are stored to `calcHistory` in localStorage.

## 4) Calculation History

Page: `src/pages/CalcHistory.jsx`

Features:

- View saved calculations
- Aggregate summary cards (risk, potential profit, etc.)
- Delete individual rows or clear all
- Click history item to preload Calculator inputs via navigation state

## 5) Settings

Page: `src/pages/Settings.jsx`

Provider: `components/settings/SettingsProvider.jsx`

Configurable settings include:

- account size
- position sizing %
- stop loss defaults
- risk amount
- position analysis timer seconds (`analysis_timer_seconds`)
- target profit and max dollars
- float category definitions and multipliers

Saved settings are persisted via `base44.entities.Settings` (backed by localStorage in current mock implementation).

## 6) Knowledge Base

Page: `src/pages/KnowledgeBase.jsx`

Main module: `components/knowledgebase/KnowledgeBase.jsx`

Features:

- Create, edit, delete custom knowledge entries
- Search, tags, type/category/difficulty filtering
- Sort options
- Dedicated learning tab for courses/tutorials/articles/videos
- Learning stats + learning path
- Course enrollment and module completion tracking

Persistence:

- Entries and learning progress are stored in localStorage.

## 7) Do's & Don'ts

Page: `src/pages/DosAndDonts.jsx`

Features:

- Track discipline rules grouped by category
- Search/filter rules
- Add/edit/delete rule cards
- View per-rule usage counts
- See aggregate usage and top-used rule in stats
- Rule usage automatically updates when attached/removed on trades

Persistence:

- Stored in localStorage key `dosAndDonts`.

## 8) Performance Analytics

Page: `src/pages/Performance.jsx`

Main module: `components/performance/Performance.jsx`

Analytics dimensions:

- by hour of day
- by day of week
- by month of year
- by price bucket
- by setup type

Data source:

- Reads journal trades from localStorage (`trades`) through query hooks.

---

## Data model and persistence

### Main localStorage keys used

- `trades` - journal trade records
- `calcHistory` - calculator history entries
- `userSettings` - persisted settings snapshot
- `dosAndDonts` - discipline rule items
- `calculator.floatPositionSizer.state.v1` - latest calculator working state/results
- knowledge base keys defined in knowledge base constants/hooks

### Key model fields added

- Trade:
  - `dos_donts_rule_ids` (array of linked Do/Don't rule IDs)
- Settings:
  - `analysis_timer_seconds` (integer seconds for calculator timer)
- Do/Don't item:
  - `usage_count` (how many times applied on trades)
  - `last_used_at` (ISO timestamp of most recent use)

### Entity schemas

See `/entities` for JSON definitions (Trade, Settings, Notification, etc.) used as model references.

---

## Project structure

```text
react-windows-jsx/
  public/
    electron.cjs            # Electron main process
    preload.js              # Electron preload bridge
  src/
    pages/                  # Route-level pages
    components/
      calculator/
      journal/
      dashboard/
      settings/
      performance/
      knowledgebase/
      dosanddonts/
      ui/
    lib/                    # Providers, utilities, contexts
    api/                    # API client(s)
    pages.config.js         # Auto route map
```

---

## Available scripts

- `npm run dev` - Run Vite dev server
- `npm run build` - Build production web bundle
- `npm run electron` - Launch Electron app
- `npm run electron-dev` - Run Vite + Electron together
- `npm run electron-pack` - Package desktop app with electron-builder

---

## Electron behavior

Electron entry: `public/electron.cjs`

Highlights:

- Opens Vite URL in dev and `dist/index.html` in production
- Uses preload bridge (`public/preload.js`) with `contextIsolation: true`
- Exposes safe APIs for:
  - app version
  - message boxes
  - close app
  - menu event subscriptions

---

## Troubleshooting

### App starts but no data appears

- Check browser dev tools for localStorage parsing errors.
- Ensure `trades` key contains valid JSON.

### Calculator history not visible

- Confirm calculation was triggered manually from calculator action.
- Verify `calcHistory` exists in localStorage.

### Electron launch issues

- Make sure Vite port `5176` is free for `electron-dev`.
- Delete `node_modules` and reinstall if Electron binaries are missing.

---

## Notes for contributors

- Follow existing component structure by feature folder.
- Keep persistence-compatible changes backward-safe for existing localStorage data.
- Prefer hook-based state logic and focused UI components.
