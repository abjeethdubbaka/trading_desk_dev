export const EXPENSE_CATEGORIES = [
  { id: 'housing',       label: 'Housing',        color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25'   },
  { id: 'food',          label: 'Food & Dining',   color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  { id: 'transport',     label: 'Transportation',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/25'   },
  { id: 'entertainment', label: 'Entertainment',   color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25' },
  { id: 'shopping',      label: 'Shopping',        color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/25'   },
  { id: 'healthcare',    label: 'Healthcare',      color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25'    },
  { id: 'utilities',     label: 'Utilities',       color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25' },
  { id: 'subscriptions', label: 'Subscriptions',   color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25' },
  { id: 'savings',       label: 'Savings',         color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/25'},
  { id: 'investments',   label: 'Investments',     color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/25'   },
  { id: 'other',         label: 'Other',           color: 'text-white/60',   bg: 'bg-white/5',       border: 'border-white/15'      },
];

export const CATEGORY_MAP = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.id, c]));

export const INCOME_CATEGORIES = [
  { id: 'salary',     label: 'Salary',          color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  { id: 'freelance',  label: 'Freelance',        color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/25'    },
  { id: 'dividends',  label: 'Dividends',        color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/25'    },
  { id: 'trading',    label: 'Trading P&L',      color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/25'    },
  { id: 'rental',     label: 'Rental',           color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/25'  },
  { id: 'bonus',      label: 'Bonus',            color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/25'  },
  { id: 'side',       label: 'Side Income',      color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25'  },
  { id: 'gift',       label: 'Gift / Transfer',  color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/25'    },
  { id: 'other',      label: 'Other',            color: 'text-white/60',    bg: 'bg-white/5',        border: 'border-white/15'       },
];

export const INCOME_CATEGORY_MAP = Object.fromEntries(INCOME_CATEGORIES.map(c => [c.id, c]));

export const getIncomeDisplay = (entry) =>
  entry.category === 'other' && entry.custom_category?.trim()
    ? { label: entry.custom_category.trim(), ...INCOME_CATEGORY_MAP.other }
    : (INCOME_CATEGORY_MAP[entry.category] ?? INCOME_CATEGORY_MAP.other);

export const HOLDING_TYPES = [
  { id: 'stock',        label: 'Stock'        },
  { id: 'etf',          label: 'ETF'          },
  { id: 'crypto',       label: 'Crypto'       },
  { id: 'bond',         label: 'Bond'         },
  { id: 'real_estate',  label: 'Real Estate'  },
  { id: 'cash',         label: 'Cash'         },
  { id: 'other',        label: 'Other'        },
];

export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 'Other'];

export const fmt = (n, digits = 2) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '$0';
  return `$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};

export const fmtK = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '$0';
  if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `$${(num / 1_000).toFixed(1)}k`;
  return `$${num.toFixed(0)}`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const isoToday = (isoDate) => {
  return isoDate?.slice(0, 10) === todayISO();
};

export const currentMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};
