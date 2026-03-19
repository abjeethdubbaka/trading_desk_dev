import React from 'react';
import { PerformanceByHourOfDay } from './components/PerformanceByHourOfDay';
import { PerformanceByDayOfWeek } from './components/PerformanceByDayOfWeek';
import { PerformanceByPrice } from './components/PerformanceByPrice';
import { PerformanceByMonthOfYear } from './components/PerformanceByMonthOfYear';
import { PerformanceBySetupType } from './components/PerformanceBySetupType';
import { usePerformanceData } from './hooks/usePerformanceData';

export default function Performance() {
  const {
    performanceByDayOfWeek,
    performanceByPrice,
    performanceByHourOfDay,
    performanceByMonthOfYear,
    performanceBySetupType,
    isLoading
  } = usePerformanceData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4 lg:p-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Performance Analytics</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="glass-card rounded-xl p-6">
                <div className="h-64 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 lg:p-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PerformanceByHourOfDay data={performanceByHourOfDay} />
          <PerformanceBySetupType data={performanceBySetupType} />
          <PerformanceByPrice data={performanceByPrice} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceByDayOfWeek data={performanceByDayOfWeek} />
          <PerformanceByMonthOfYear data={performanceByMonthOfYear} />
        </div>
      </div>
    </div>
  );
}
