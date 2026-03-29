import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SessionSummaryCard({ summary }) {
  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardHeader>
        <CardTitle className="text-base">Session Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/50">Analyzed Images</p>
          <p className="text-xl font-semibold">{summary.count}</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/50">Avg Quality Score</p>
          <p className="text-xl font-semibold">{summary.avgScore.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/50">Needs Review</p>
          <p className="text-xl font-semibold">{summary.reviewRequired}</p>
        </div>
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
          <p className="text-xs text-yellow-200/80">Potential Savings</p>
          <p className="text-xl font-semibold text-yellow-300">${summary.totalPotential.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
}


