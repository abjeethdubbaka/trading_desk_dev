/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';

// Lazy load non-critical pages for faster startup
const Calculator = lazy(() => import('./pages/Calculator'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Journal = lazy(() => import('./pages/Journal'));
const Settings = lazy(() => import('./pages/Settings'));
const CalcHistory = lazy(() => import('./pages/CalcHistory'));
// const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase')); // retired — replaced by Informative Images, commented out, not deleted
const DosAndDonts = lazy(() => import('./pages/DosAndDonts'));
const Performance = lazy(() => import('./pages/Performance'));
const Reports = lazy(() => import('./pages/Reports'));
// const ScreenshotAnalysis = lazy(() => import('./pages/ScreenshotAnalysis')); // not in use — commented out, not deleted
const InformativeImages = lazy(() => import('./pages/InformativeImages'));
const Playbook = lazy(() => import('./pages/Playbook'));
const Finance = lazy(() => import('./pages/Finance'));
import __Layout from './Layout.jsx';

// Module preloaders — call these on nav hover to warm the chunk before the user clicks
export const PAGE_PRELOADERS = {
  Dashboard:          () => import('./pages/Dashboard'),
  Journal:            () => import('./pages/Journal'),
  Performance:        () => import('./pages/Performance'),
  Reports:            () => import('./pages/Reports'),
  Calculator:         () => import('./pages/Calculator'),
  CalcHistory:        () => import('./pages/CalcHistory'),
  Settings:           () => import('./pages/Settings'),
  // Knowledge: () => import('./pages/KnowledgeBase'), // retired — replaced by Informative Images, commented out, not deleted
  DosAndDonts:        () => import('./pages/DosAndDonts'),
  // ScreenshotAnalysis: () => import('./pages/ScreenshotAnalysis'), // not in use — commented out, not deleted
  InformativeImages:  () => import('./pages/InformativeImages'),
  Playbook:           () => import('./pages/Playbook'),
  Finance:            () => import('./pages/Finance'),
};

export const PAGES = {
    "Dashboard": Dashboard,
    "Journal": Journal,
    "Calculator": Calculator,
    "Settings": Settings,
    "CalcHistory": CalcHistory,
    // "Knowledge": KnowledgeBase, // retired — replaced by Informative Images, commented out, not deleted
    "DosAndDonts": DosAndDonts,
    "Performance": Performance,
    "Reports": Reports,
    // "ScreenshotAnalysis": ScreenshotAnalysis, // not in use — commented out, not deleted
    "InformativeImages": InformativeImages,
    "Playbook": Playbook,
    "Finance": Finance,
}

export const pagesConfig = {
    mainPage: "Calculator",
    Pages: PAGES,
    Layout: __Layout,
};


