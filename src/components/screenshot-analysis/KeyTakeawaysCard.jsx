import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIssueLabel, parseDollarish } from './utils';

export default function KeyTakeawaysCard({ analysisMap }) {
  const entries = Object.values(analysisMap || {});

  if (entries.length === 0) {
    return null;
  }

  const earlyEntries = entries.filter((e) => e.entry_timing === 'too_early').length;
  const lateEntries = entries.filter((e) => e.entry_timing === 'too_late').length;
  const cutEarly = entries.filter((e) => e.exit_timing === 'cut_early').length;
  const heldLong = entries.filter((e) => e.exit_timing === 'held_long').length;

  const totalPotential = entries.reduce((sum, e) => {
    const saved = parseDollarish(e.entry_savings_potential);
    const left = parseDollarish(e.exit_left_on_table);
    return sum + saved + left;
  }, 0);

  let commonIssue = 'none';
  if (earlyEntries > lateEntries && earlyEntries >= cutEarly && earlyEntries >= heldLong) {
    commonIssue = 'too_early';
  } else if (lateEntries > earlyEntries && lateEntries >= cutEarly && lateEntries >= heldLong) {
    commonIssue = 'too_late';
  } else if (cutEarly > heldLong && cutEarly >= earlyEntries && cutEarly >= lateEntries) {
    commonIssue = 'cut_early';
  } else if (heldLong > cutEarly && heldLong >= earlyEntries && heldLong >= lateEntries) {
    commonIssue = 'held_long';
  }

  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-yellow-400">*</span> Key Takeaways From This Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="rounded bg-white/5 p-2 text-center">
              <p className="text-xs text-white/50">Early Entries</p>
              <p className="text-lg font-semibold">{earlyEntries}</p>
            </div>
            <div className="rounded bg-white/5 p-2 text-center">
              <p className="text-xs text-white/50">Late Entries</p>
              <p className="text-lg font-semibold">{lateEntries}</p>
            </div>
            <div className="rounded bg-white/5 p-2 text-center">
              <p className="text-xs text-white/50">Cut Early</p>
              <p className="text-lg font-semibold">{cutEarly}</p>
            </div>
            <div className="rounded bg-white/5 p-2 text-center">
              <p className="text-xs text-white/50">Held Too Long</p>
              <p className="text-lg font-semibold">{heldLong}</p>
            </div>
          </div>

          {totalPotential > 0 && (
            <div className="rounded-lg bg-yellow-400/10 border border-yellow-400/20 p-3">
              <p className="text-sm">
                <span className="font-medium">Potential improvement:</span>{' '}
                <span className="text-yellow-400 font-bold">${totalPotential.toFixed(2)}</span>{' '}
                left on table across {entries.length} trades
              </p>
              <p className="text-xs text-white/50 mt-1">
                Fixing entry/exit timing could add this to your P&L
              </p>
            </div>
          )}

          <div className="text-sm">
            <p className="font-medium mb-1">Most common theme:</p>
            <p className="text-white/70">{formatIssueLabel(commonIssue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
