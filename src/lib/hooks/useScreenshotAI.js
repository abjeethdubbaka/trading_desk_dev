/**
 * @file src/lib/useScreenshotAI.js
 *
 * Screenshot AI functionality - re-export from split AI module for backward compatibility.
 */

export { useScreenshotAI } from './ai/hooks/useScreenshotAI.js';
export { analyzeImageWithClaude } from './ai/services/claudeService.js';
export { SYSTEM_PROMPT, USER_PROMPT } from './ai/prompts/screenshotPrompts.js';


