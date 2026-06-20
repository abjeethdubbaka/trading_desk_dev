import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { currentMonth } from '@/components/finance/constants';
import TodayTab     from '@/components/finance/TodayTab';
import SpendingTab  from '@/components/finance/SpendingTab';
import IncomeTab    from '@/components/finance/IncomeTab';
import NetWorthTab  from '@/components/finance/NetWorthTab';
import PortfolioTab from '@/components/finance/PortfolioTab';
import BudgetTab    from '@/components/finance/BudgetTab';
import SavingsTab   from '@/components/finance/SavingsTab';

const TABS = [
  { id: 'today',     label: 'Today' },
  { id: 'spending',  label: 'Spending' },
  { id: 'income',    label: 'Income' },
  { id: 'savings',   label: 'Savings' },
  { id: 'networth',  label: 'Net Worth' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'budget',    label: 'Budget' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Finance() {
  const [activeTab, setActiveTab] = useState('today');
  const init = currentMonth();
  const [year,  setYear]  = useState(init.year);
  const [month, setMonth] = useState(init.month);

  const needsMonthNav = activeTab === 'spending' || activeTab === 'budget' || activeTab === 'income';

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const now = currentMonth();
    if (year > now.year || (year === now.year && month >= now.month)) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = useMemo(() => {
    const now = currentMonth();
    return year === now.year && month === now.month;
  }, [year, month]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Journal</h1>
          <p className="text-sm text-white/40 mt-0.5">Spending · Income · Savings · Portfolio · Net Worth</p>
        </div>

        {needsMonthNav && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-white/80 min-w-[90px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button type="button" onClick={nextMonth} disabled={isCurrentMonth}
              className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tab bar — scrollable on small screens, wraps on medium */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 min-w-max sm:min-w-0 sm:grid sm:grid-cols-7">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                  : 'text-white/40 hover:text-white/70',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — full width */}
      {activeTab === 'today'     && <TodayTab />}
      {activeTab === 'spending'  && <SpendingTab year={year} month={month} />}
      {activeTab === 'income'    && <IncomeTab year={year} month={month} />}
      {activeTab === 'savings'   && <SavingsTab />}
      {activeTab === 'networth'  && <NetWorthTab />}
      {activeTab === 'portfolio' && <PortfolioTab />}
      {activeTab === 'budget'    && <BudgetTab year={year} month={month} />}
    </div>
  );
}
