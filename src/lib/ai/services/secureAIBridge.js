export const SECURE_AI_KINDS = Object.freeze({
  OLLAMA_CHAT: 'ollama_chat',
  TRADE_REVIEW: 'trade_review',
  MORNING_BRIEF: 'morning_brief',
  DISCIPLINE_COACH: 'discipline_coach',
});

function getSecureBridge() {
  if (typeof window === 'undefined') return null;

  const bridge = window?.electronAPI?.secureAIRequest;
  return typeof bridge === 'function' ? bridge : null;
}

function isFallbackSafeBridgeError(error) {
  const message = String(error?.message || '').toLowerCase();

  return (
    message.includes('not configured') ||
    message.includes('unsupported kind') ||
    message.includes('missing kind') ||
    message.includes('requires a subscription') ||
    message.includes('403')
  );
}

export function hasSecureAIBridge() {
  return Boolean(getSecureBridge());
}

export async function requestSecureAI(kind, body, options = {}) {
  const bridge = getSecureBridge();
  if (!bridge) return null;

  const { timeoutMs, allowFallback = true } = options;

  try {
    return await bridge({
      kind,
      body,
      timeoutMs,
    });
  } catch (error) {
    if (allowFallback && isFallbackSafeBridgeError(error)) {
      return null;
    }
    throw error;
  }
}
