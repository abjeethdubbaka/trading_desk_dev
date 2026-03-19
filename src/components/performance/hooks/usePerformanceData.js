import { useQuery } from '@tanstack/react-query';
import { 
  calculatePerformanceByDayOfWeek,
  calculatePerformanceByPrice,
  calculatePerformanceByHourOfDay,
  calculatePerformanceByMonthOfYear,
  calculatePerformanceBySetupType
} from '../utils';

export function usePerformanceData() {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['journal-trades'],
    queryFn: () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = window.localStorage.getItem('trades');
          return stored ? JSON.parse(stored) : [];
        }
      } catch (e) {
        console.error('Failed to load trades from localStorage:', e);
        return [];
      }
    }
  });

  const performanceByDayOfWeek = calculatePerformanceByDayOfWeek(trades);
  const performanceByPrice = calculatePerformanceByPrice(trades);
  const performanceByHourOfDay = calculatePerformanceByHourOfDay(trades);
  const performanceByMonthOfYear = calculatePerformanceByMonthOfYear(trades);
  const performanceBySetupType = calculatePerformanceBySetupType(trades);

  return {
    trades,
    isLoading,
    performanceByDayOfWeek,
    performanceByPrice,
    performanceByHourOfDay,
    performanceByMonthOfYear,
    performanceBySetupType
  };
}
