import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';

export default function SavedSessionsCard({ sessionHistory }) {
  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardHeader>
        <CardTitle className="text-base">Saved Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessionHistory.length === 0 ? (
          <p className="text-sm text-white/50">No saved sessions yet.</p>
        ) : (
          sessionHistory.slice(0, 10).map((session) => (
            <div key={session.id} className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{new Date(session.created_at).toLocaleString()}</p>
                <p className="text-xs text-white/50">
                  {session.summary?.image_count || 0} images • Avg score {session.summary?.avg_quality_score ?? 0}
                </p>
                <p className="text-xs text-yellow-300/80 mt-1">
                  Potential savings: ${(session.summary?.total_potential_savings || 0).toFixed(2)}
                </p>
              </div>
              <ImageIcon className="w-4 h-4 text-white/40" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}


