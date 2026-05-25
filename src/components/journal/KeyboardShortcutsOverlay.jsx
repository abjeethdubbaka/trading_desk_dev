import React from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'N'], description: 'Log a new trade' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['?'], description: 'Show this overlay' },
  { keys: ['Esc'], description: 'Close drawer / modal / overlay' },
];

function Kbd({ children }) {
  return (
    <kbd className="inline-flex min-w-[24px] items-center justify-center rounded border border-white/20 bg-white/8 px-1.5 py-0.5 font-mono text-[11px] text-white/70">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsOverlay({ onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-[#111827] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-white/40" />
              <span className="text-sm font-semibold text-white/80">Keyboard Shortcuts</span>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            {SHORTCUTS.map(({ keys, description }) => (
              <div key={description} className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-white/65">{description}</span>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {keys.map((key, i) => (
                    <React.Fragment key={key}>
                      {i > 0 && <span className="text-[10px] text-white/30">+</span>}
                      <Kbd>{key}</Kbd>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
