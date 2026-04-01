/**
 * @file src/lib/ai/index.js
 *
 * AI functionality - screenshot analysis and related services.
 */

export { useScreenshotAI } from './hooks/useScreenshotAI.js';
export { analyzeImageWithClaude } from './services/claudeService.js';
export { SYSTEM_PROMPT, USER_PROMPT } from './prompts/screenshotPrompts.js';
export { validateAnalysisResult } from './utils/validation.js';
export { parseDollarAmount } from './utils/parsers.js';
export { calculateSessionMetrics } from './utils/metrics.js';


