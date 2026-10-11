import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/context/SettingsContext';
import { getCalculatorAffirmations } from '@/lib/constants/calculatorBanner';
import { getActiveFocusLines, readWorkflowStore } from '@/lib/review/weeklyWorkflow';

/**
 * A single line of affirmations rolling beside the clock — who you are while
 * you trade. The list is the trader's own, edited in Settings; clearing it
 * there hides the banner entirely, so it never becomes wallpaper nobody
 * reads.
 *
 * The track is rendered twice and shifted by exactly half its width, which is
 * what makes the loop seamless; hovering pauses it so a line can be read.
 */
export default function AffirmationBanner({ className }) {
  const { settings } = useSettings();
  const affirmations = getCalculatorAffirmations(settings);

  // This week's process goals from the weekly review. They ride in the same
  // roll but in red: an affirmation is who you are, a goal is a commitment
  // you have already broken once if you are reading past it.
  const [focusLines, setFocusLines] = useState([]);
  useEffect(() => {
    setFocusLines(getActiveFocusLines(readWorkflowStore()));
  }, []);

  const items = [
    ...focusLines.map((text) => ({ text, kind: 'focus' })),
    ...affirmations.map((text) => ({ text, kind: 'affirmation' })),
  ];

  if (items.length === 0) return null;

  // Slow enough to read, and scaled to the list so a long one is not a blur.
  const durationSeconds = Math.max(24, items.length * 6);

  return (
    <div className={cn(
      'group relative overflow-hidden rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] py-1.5 shadow-[0_0_18px_rgba(6,182,212,0.12)]',
      className,
    )}>
      <style>{`
        @keyframes tradedesk-affirmation-roll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      {/* Faded edges, so lines arrive and leave rather than snapping. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#090d15] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#090d15] to-transparent" />

      <div
        className="flex w-max items-center group-hover:[animation-play-state:paused]"
        style={{
          animation: `tradedesk-affirmation-roll ${durationSeconds}s linear infinite`,
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
            {items.map((item) => (
              <span key={`${copy}-${item.kind}-${item.text}`} className="flex items-center whitespace-nowrap">
                <span className={cn(
                  'px-5 text-xs font-medium tracking-wide',
                  item.kind === 'focus' ? 'font-semibold text-rose-300' : 'text-cyan-100/85',
                )}>
                  {item.text}
                </span>
                <span className={item.kind === 'focus' ? 'text-rose-400/50' : 'text-cyan-400/40'}>•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
