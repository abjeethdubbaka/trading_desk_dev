import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/config/query-client'
import NavigationTracker from '@/lib/context/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/components/PageNotFound';
import { TradingProvider } from './lib/context/TradingContext';
import { SettingsProvider } from './lib/context/SettingsContext';
import { LocalImagesProvider } from './lib/hooks/useLocalImages';
import { AnalysisTimerProvider } from './lib/context/AnalysisTimerContext';
import { AuthProvider } from './lib/context/AuthContext';
import { Suspense } from 'react';
import LimitNotificationsWatcher from '@/components/notifications/LimitNotificationsWatcher';
import AppErrorBoundary from '@/lib/components/AppErrorBoundary';
import PageErrorBoundary from '@/lib/components/PageErrorBoundary';
import GlobalErrorWatcher from '@/lib/components/GlobalErrorWatcher';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

/**
 * Shown inside the app frame while a page's code arrives. The sidebar stays
 * put, so this only needs to hold the page's place: a heading bar and a few
 * blocks, faint enough that a quick load reads as no flash at all.
 */
const LoadingFallback = () => (
  <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading page">
    <div className="h-7 w-48 rounded-lg bg-white/[0.05]" />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="h-24 rounded-xl bg-white/[0.035]" />
      <div className="h-24 rounded-xl bg-white/[0.035]" />
      <div className="h-24 rounded-xl bg-white/[0.035]" />
    </div>
    <div className="h-64 rounded-xl bg-white/[0.03]" />
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <PageErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <MainPage />
            </Suspense>
          </PageErrorBoundary>
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <PageErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <Page />
                </Suspense>
              </PageErrorBoundary>
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
            <LocalImagesProvider>
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
            </LocalImagesProvider>
          </SettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}

export default RootApp


