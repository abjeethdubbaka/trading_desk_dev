import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { 
  calculatePerformanceByDayOfWeek,
  calculatePerformanceByPrice,
  calculatePerformanceByHourOfDay,
  calculatePerformanceByMonthOfYear,
  calculatePerformanceBySetupType
} from '../utils';

export function usePerformanceData() {
  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const { data: trades = [], isLoading } = useTrades({
    filters: { account_tier: currentTier },
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


