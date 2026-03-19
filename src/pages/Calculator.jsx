import React from 'react';
import FloatPositionSizer from '@/components/calculator/FloatPositionSizer';
import { useLocation } from 'react-router-dom';

export default function Calculator() {
  const location = useLocation();
  const historyData = location.state?.historyItem;

  return (
    <div className="space-y-8">
      <section>
        <FloatPositionSizer historyData={historyData} />
      </section>
    </div>
  );
}