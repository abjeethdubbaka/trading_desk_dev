import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { TradingProvider } from '@/lib/TradingContext';
import { SettingsProvider } from '@/lib/SettingsContext';
import { AuthProvider } from '@/lib/AuthContext';
// Import test utilities to make them available in console
import '@/lib/testFirebase';
import '@/lib/runMigration';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const App = () => {
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
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
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <SettingsProvider>
          <TradingProvider>
            <Router>
              <NavigationTracker />
              <App />
            </Router>
            <Toaster />
          </TradingProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default RootApp
