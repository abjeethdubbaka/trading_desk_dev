import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useElectron } from '@/lib/hooks/useElectron';
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Menu,
  X,
  Calculator,
  Power,
  History,
  Book,
  CheckCircle,
  BarChart3,
  ScanSearch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatAnalysisTimer, useAnalysisTimer } from '@/lib/context/AnalysisTimerContext';

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
    name: 'Screenshot Analysis',
    description: 'Inspect chart captures and summarize missed edge.',
    icon: ScanSearch,
    page: 'ScreenshotAnalysis',
  },
  {
    name: 'Settings',
    description: 'Configure account, risk, and app preferences.',
    icon: Settings,
    page: 'Settings',
  },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isElectron, closeApp } = useElectron();
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
                  <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-white/45">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-40 hidden flex-col border-r border-white/10 bg-[#0b0f17]/75 backdrop-blur-xl transition-all duration-300 lg:flex',
          collapsed ? 'w-[88px]' : 'w-[280px]'
        )}
      >
        <div className={cn('flex h-20 items-center border-b border-white/10', collapsed ? 'justify-center px-3' : 'px-5')}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-[0_0_26px_rgba(16,185,129,0.42)]">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold tracking-tight">TradeDesk</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Execution OS</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-3">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200',
                  isActive
                    ? 'nav-item-active border-emerald-400/25 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                    : 'border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.04] hover:text-white/85',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}

          {isTimerVisible && (
            <div
              className={cn(
                'mt-4 rounded-2xl border px-3 py-3 transition-all duration-300',
                collapsed ? 'space-y-2 text-center' : 'space-y-2',
                isExpired
                  ? 'border-rose-400/40 bg-rose-500/15'
                  : isNearEnd
                    ? 'timer-alert-blink border-amber-300/55 bg-amber-300/15'
                    : isTimerRunning
                      ? 'border-emerald-400/30 bg-emerald-500/10'
                      : 'border-white/12 bg-white/[0.04]'
              )}
            >
              <div className={cn('flex items-center gap-2', collapsed ? 'justify-center' : 'justify-between')}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      isExpired
                        ? 'bg-rose-500/25 text-rose-200'
                        : isNearEnd
                          ? 'bg-amber-300/20 text-amber-100'
                          : isTimerRunning
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/10 text-white/75'
                    )}
                  >
                    <History className="h-4 w-4" />
                  </div>
                  {!collapsed && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Analysis Timer</p>
                      <p className="text-xs text-white/70">
                        {isExpired ? 'Time up' : isTimerRunning ? 'Running' : 'Paused'}
                      </p>
                    </div>
                  )}
                </div>

                {!collapsed && (
                  <p className={cn(
                    'font-mono text-sm font-semibold tracking-[0.18em]',
                    isTimerRunning
                      ? isTimerUrgentBlink
                        ? 'animate-pulse text-amber-100 drop-shadow-[0_0_10px_rgba(253,224,71,1)]'
                        : 'animate-pulse text-emerald-100 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                      : 'text-white/90'
                  )}>
                    {formatAnalysisTimer(remainingSeconds)}
                  </p>
                )}
              </div>

              {collapsed && (
                <>
                  <p className={cn(
                    'font-mono text-[11px] font-semibold tracking-[0.16em]',
                    isTimerRunning
                      ? isTimerUrgentBlink
                        ? 'animate-pulse text-amber-100 drop-shadow-[0_0_10px_rgba(253,224,71,1)]'
                        : 'animate-pulse text-emerald-100 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                      : 'text-white/90'
                  )}>
                    {formatAnalysisTimer(remainingSeconds)}
                  </p>
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/45">
                    {isExpired ? 'Done' : isTimerRunning ? 'Run' : 'Pause'}
                  </p>
                </>
              )}
            </div>
          )}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn('w-full justify-center text-white/55 hover:text-white', !collapsed && 'justify-start px-3')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Collapse
              </>
            )}
          </Button>

          {isElectron && (
            <Button
              variant="ghost"
              size="sm"
              onClick={closeApp}
              className={cn(
                'w-full text-red-300/80 hover:bg-red-500/10 hover:text-red-200',
                collapsed ? 'justify-center' : 'justify-start px-3'
              )}
              title={collapsed ? 'Shutdown App' : undefined}
            >
              <Power className={cn('h-4 w-4', !collapsed && 'mr-2')} />
              {!collapsed && 'Shutdown'}
            </Button>
          )}
        </div>
      </aside>

      <main
        className={cn(
          'min-h-screen pt-16 transition-[padding] duration-300 lg:pt-0',
          collapsed ? 'lg:pl-[88px]' : 'lg:pl-[280px]'
        )}
      >
        <div className="px-4 pb-8 pt-4 lg:px-8 lg:pt-7">
          <div className="animate-fade-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
