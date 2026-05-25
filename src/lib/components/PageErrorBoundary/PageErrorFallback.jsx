import React from 'react';

function getErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  return 'Unknown error';
}

export default function PageErrorFallback({ error, errorAt, componentStack, onTryAgain }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-5 text-white">
      <div className="w-full max-w-xl rounded-2xl border border-red-500/30 bg-[#111827]/85 p-5 shadow-xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.16em] text-red-300/85">Page Error</p>
        <h2 className="mt-2 text-lg font-semibold text-white">This page ran into a problem</h2>
        <p className="mt-1.5 text-sm text-white/75">
          The rest of the app is still running. Try again or navigate to another page.
        </p>

        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2">
          <p className="text-sm text-red-100">{getErrorMessage(error)}</p>
          {errorAt && (
            <p className="mt-1 text-[11px] text-red-100/70">Time: {errorAt}</p>
          )}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={onTryAgain}
            className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
          >
            Try Again
          </button>
        </div>

        {componentStack && (
          <details className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
            <summary className="cursor-pointer text-xs text-white/70">Technical details</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px] text-white/65">
              {componentStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
