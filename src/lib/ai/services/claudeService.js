/**
 * @file src/lib/ai/services/claudeService.js
 *
 * Claude AI service for image analysis.
 */

import { SYSTEM_PROMPT, USER_PROMPT } from '../prompts/screenshotPrompts.js';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const ANTHROPIC_BASE_URL = import.meta.env.VITE_ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = import.meta.env.VITE_ANTHROPIC_VERSION || '2023-06-01';

function hasAnthropicKey() {
  return Boolean(ANTHROPIC_API_KEY);
}

export async function analyzeImageWithClaude(base64Data, mediaType = 'image/png') {
  if (!hasAnthropicKey()) {
    throw new Error('Anthropic API key is not configured (VITE_ANTHROPIC_API_KEY)');
  }

  const response = await fetch(ANTHROPIC_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: USER_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const rawText = data.content?.find((b) => b.type === 'text')?.text || '';
  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${rawText.slice(0, 200)}`);
  }
}


