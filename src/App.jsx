import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/config/query-client'
import NavigationTracker from '@/lib/context/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/components/PageNotFound';
import { TradingProvider } from './lib/context/TradingContext';
import { SettingsProvider } from './lib/context/SettingsContext';
import { AnalysisTimerProvider } from './lib/context/AnalysisTimerContext';
import { AuthProvider } from './lib/context/AuthContext';
import { Suspense } from 'react';
import LimitNotificationsWatcher from '@/components/notifications/LimitNotificationsWatcher';
import AppErrorBoundary from '@/lib/components/AppErrorBoundary';
import GlobalErrorWatcher from '@/lib/components/GlobalErrorWatcher';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const App = () => {
  // Loading fallback for lazy loaded components
  const LoadingFallback = () => (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090d15] text-white">
      <div className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-cyan-500/15 blur-[110px]" />

      <div className="rounded-2xl border border-white/10 bg-[#111827]/70 px-8 py-7 text-center backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-300/40 border-t-emerald-200" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-white/90">Preparing Workspace</p>
        <p className="mt-1 text-xs text-white/55">Loading modules and data...</p>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <Suspense fallback={<LoadingFallback />}>
            <MainPage />
          </Suspense>
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Suspense fallback={<LoadingFallback />}>
                <Page />
              </Suspense>
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function RootApp() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <SettingsProvider>
            <AnalysisTimerProvider>
              <TradingProvider>
                <Router future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}>
                  <GlobalErrorWatcher />
                  <NavigationTracker />
                  <LimitNotificationsWatcher />
                  <App />
                </Router>
                <Toaster />
              </TradingProvider>
            </AnalysisTimerProvider>
          </SettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}

export default RootApp


