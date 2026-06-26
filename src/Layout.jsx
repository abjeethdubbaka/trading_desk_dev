import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { PAGE_PRELOADERS } from './pages.config';
import { useElectron } from '@/lib/hooks/useElectron';
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  TrendingUp,
  Menu,
  X,
  Calculator,
  Power,
  History,
  Book,
  CheckCircle,
  BarChart3,
  FileBarChart,
  // ScanSearch, // only used by the commented-out Screenshot Analysis nav item
  NotebookPen,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatAnalysisTimer, useAnalysisTimer } from '@/lib/context/AnalysisTimerContext';
import { useTrades } from '@/lib/hooks/useTrades';
import { useExpenses } from '@/lib/hooks/useFinance';

// AI assistant not in use — flow commented out, not deleted, in case it's revived later.
// const ChatDock = lazy(() => import('@/components/chat/ChatDock'));

const navItems = [
  {
    name: 'Dashboard',
    description: 'Daily P&L pulse, streaks, and discipline context.',
    icon: LayoutDashboard,
    page: 'Dashboard',
  },
  {
    name: 'Journal',
    description: 'Review, tag, and refine execution trade by trade.',
    icon: BookOpen,
    page: 'Journal',
  },
  {
    name: 'Notes',
    description: 'All trade notes in one searchable feed.',
    icon: NotebookPen,
    page: 'Notes',
  },
  {
    name: 'Calculator',
    description: 'Build risk-sized entries with float-aware sizing.',
    icon: Calculator,
    page: 'Calculator',
  },
  {
    name: 'Calc History',
    description: 'Replay previous calculator outcomes and assumptions.',
    icon: History,
    page: 'CalcHistory',
  },
  {
    name: 'Playbook',
    description: 'Define setup entry, exit, invalidations, and expected R.',
    icon: BookOpen,
    page: 'Playbook',
  },
  {
    name: 'Knowledge Base',
    description: 'Reference playbooks, notes, and process docs.',
    icon: Book,
    page: 'Knowledge',
  },
  {
    name: "Do's & Don'ts",
    description: 'Track your personal execution rules and accountability.',
    icon: CheckCircle,
    page: 'DosAndDonts',
  },
  {
    name: 'Performance',
    description: 'Analyze edge quality across timing, setup, and behavior.',
    icon: BarChart3,
    page: 'Performance',
  },
  {
    name: 'Reports',
    description: 'Monthly breakdowns of P&L, setups, and behavior with month-over-month comparison.',
    icon: FileBarChart,
    page: 'Reports',
  },
  // Screenshot Analysis nav item — not in use, commented out, not deleted.
  // {
  //   name: 'Screenshot Analysis',
  //   description: 'Inspect chart captures and summarize missed edge.',
  //   icon: ScanSearch,
  //   page: 'ScreenshotAnalysis',
  // },
  {
    name: 'Finance',
    description: 'Daily spending, net worth, portfolio, and budget tracking.',
    icon: Wallet,
    page: 'Finance',
  },
  {
    name: 'Settings',
    description: 'Configure account, risk, and app preferences.',
    icon: Settings,
    page: 'Settings',
  },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isElectron, closeApp } = useElectron();

  const { data: allTrades = [] } = useTrades();
  const { data: allExpenses = [] } = useExpenses();
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayTrades = allTrades.filter(t => (t.entry_time || t.date || '').slice(0, 10) === todayISO);
  const alertPages = {
    Journal: todayTrades.length > 0 && todayTrades.some(t => !t.notes?.trim()),
    Finance: !allExpenses.some(e => e.date === todayISO),
  };
  const {
    isVisible: isTimerVisible,
    remainingSeconds,
    isTimerRunning,
    isNearEnd,
    isExpired,
  } = useAnalysisTimer();
  const isTimerUrgentBlink = isTimerRunning && remainingSeconds > 0 && remainingSeconds <= 10;

  const activeNavItem = useMemo(
    () => navItems.find((item) => item.page === currentPageName) ?? navItems[0],
    [currentPageName]
  );

  // Preload page chunks on nav hover — fires 200 ms after hover starts so quick passes don't trigger
  const preloadTimer = useRef(null);
  const handleNavMouseEnter = useCallback((page) => {
    clearTimeout(preloadTimer.current);
    preloadTimer.current = setTimeout(() => {
      PAGE_PRELOADERS[page]?.();
    }, 200);
  }, []);
  const handleNavMouseLeave = useCallback(() => {
    clearTimeout(preloadTimer.current);
  }, []);

  return (
    <div className="app-shell relative isolate min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-emerald-500/15 blur-[110px]" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-60px] left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#090d15]/85 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-[0_0_22px_rgba(16,185,129,0.45)]">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white">{activeNavItem.name}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-white/45">TradeDesk</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="text-white/70"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 pt-16 backdrop-blur-sm lg:hidden">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-3 py-3 transition-all',
                    isActive
                      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
                  )}
                >
                  <span className="relative flex-shrink-0 mt-0.5">
                    <item.icon className="h-5 w-5" />
                    {alertPages[item.page] && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-black/80" />
                    )}
                  </span>
                  <div className="flex flex-1 items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-white/45">{item.description}</p>
                    </div>
                    {alertPages[item.page] && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <aside
        className="fixed bottom-0 left-0 top-0 z-40 hidden lg:flex flex-col border-r border-white/10 bg-[#0b0f17]/90 backdrop-blur-xl transition-[width] duration-200 ease-in-out w-[72px] hover:w-[260px] overflow-hidden group/nav"
      >
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-4">
          <div className="flex items-center gap-3 min-w-max">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-[0_0_26px_rgba(16,185,129,0.42)]">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150">
              <h1 className="text-lg font-bold tracking-tight">TradeDesk</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Execution OS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl border px-[14px] group-hover/nav:px-3 py-2.5 transition-all duration-200 min-w-max',
                  isActive
                    ? 'nav-item-active border-emerald-400/25 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                    : 'border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.04] hover:text-white/85',
                )}
                title={item.name}
                onMouseEnter={() => handleNavMouseEnter(item.page)}
                onMouseLeave={handleNavMouseLeave}
              >
                <span className="relative shrink-0">
                  <item.icon className="h-5 w-5" />
                  {alertPages[item.page] && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-[#0b0f17]" />
                  )}
                </span>
                <span className="flex flex-1 items-center whitespace-nowrap text-sm font-medium opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150">
                  <span className="flex-1">{item.name}</span>
                  {alertPages[item.page] && (
                    <span className="ml-2 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  )}
                </span>
              </Link>
            );
          })}

          {isTimerVisible && (
            <div
              className={cn(
                'mt-3 rounded-2xl border px-3 py-3 min-w-max',
                isExpired
                  ? 'border-rose-400/40 bg-rose-500/15'
                  : isNearEnd
                    ? 'timer-alert-blink border-amber-300/55 bg-amber-300/15'
                    : isTimerRunning
                      ? 'border-emerald-400/30 bg-emerald-500/10'
                      : 'border-white/12 bg-white/[0.04]'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  isExpired ? 'bg-rose-500/25 text-rose-200'
                    : isNearEnd ? 'bg-amber-300/20 text-amber-100'
                    : isTimerRunning ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/10 text-white/75'
                )}>
                  <History className="h-4 w-4" />
                </div>
                <div className="whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Analysis Timer</p>
                  <p className="text-xs text-white/70">{isExpired ? 'Time up' : isTimerRunning ? 'Running' : 'Paused'}</p>
                </div>
                <p className={cn(
                  'whitespace-nowrap font-mono text-sm font-semibold tracking-[0.18em] opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150',
                  isTimerRunning
                    ? isTimerUrgentBlink
                      ? 'animate-pulse text-amber-100 drop-shadow-[0_0_10px_rgba(253,224,71,1)]'
                      : 'animate-pulse text-emerald-100 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                    : 'text-white/90'
                )}>
                  {formatAnalysisTimer(remainingSeconds)}
                </p>
              </div>
            </div>
          )}
        </nav>

        {isElectron && (
          <div className="shrink-0 border-t border-white/10 p-3">
            <button
              type="button"
              onClick={closeApp}
              title="Shutdown App"
              className="flex w-full min-w-max items-center gap-3 rounded-lg px-[14px] group-hover/nav:px-3 py-2 text-red-300/80 hover:bg-red-500/10 hover:text-red-200 transition-colors"
            >
              <Power className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap text-sm opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150">Shutdown</span>
            </button>
          </div>
        )}
      </aside>

      <main className="min-h-screen pt-16 lg:pt-0 lg:pl-[72px] lg:pr-[24px]">
        <div className="px-4 pb-8 pt-4 lg:px-8 lg:pt-7">
          <div className="animate-fade-up">{children}</div>
        </div>
      </main>

      {/* AI assistant not in use — flow commented out, not deleted, in case it's revived later.
      <Suspense fallback={null}>
        <ChatDock isOpen={isChatOpen} onToggle={() => setIsChatOpen((prev) => !prev)} />
      </Suspense>
      */}
    </div>
  );
}
