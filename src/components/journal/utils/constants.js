/**
 * The journal's filter chips and periods. Defined once in the day-group
 * module, so the toolbar, the filter hook and the tests read the same list.
 */
import { PERIODS, TRADE_FILTERS } from '@/lib/journal/dayGroups';

export const FILTER_OPTIONS = TRADE_FILTERS.map(({ key, label }) => ({ value: key, label }));
export const DATE_RANGE_OPTIONS = PERIODS.map(({ key, label }) => ({ value: key, label }));
