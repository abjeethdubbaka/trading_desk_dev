import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

const KEYS = {
  expenses: ['finance', 'expenses'],
  netWorth: ['finance', 'netWorth'],
  holdings: ['finance', 'holdings'],
  budget:   ['finance', 'budget'],
};

const STALE = 1000 * 60 * 5;
const GC    = 1000 * 60 * 30;

// ── Expenses ──────────────────────────────────────────────────────────────────
export function useExpenses() {
  return useQuery({
    queryKey: KEYS.expenses,
    queryFn: () => db.finance.expenses.list(),
    staleTime: STALE,
    gcTime: GC,
  });
}

export function useExpenseMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.expenses });

  const add = useMutation({
    mutationFn: (data) => db.finance.expenses.create(data),
    onSuccess: invalidate,
  });

  const edit = useMutation({
    mutationFn: ({ id, ...data }) => db.finance.expenses.update(id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id) => db.finance.expenses.delete(id),
    onSuccess: invalidate,
  });

  return { add, edit, remove };
}

// ── Net Worth ─────────────────────────────────────────────────────────────────
export function useNetWorth() {
  return useQuery({
    queryKey: KEYS.netWorth,
    queryFn: () => db.finance.netWorth.list(),
    staleTime: STALE,
    gcTime: GC,
  });
}

export function useNetWorthMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.netWorth });

  const add = useMutation({
    mutationFn: (data) => db.finance.netWorth.create(data),
    onSuccess: invalidate,
  });

  const edit = useMutation({
    mutationFn: ({ id, ...data }) => db.finance.netWorth.update(id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id) => db.finance.netWorth.delete(id),
    onSuccess: invalidate,
  });

  return { add, edit, remove };
}

// ── Holdings ──────────────────────────────────────────────────────────────────
export function useHoldings() {
  return useQuery({
    queryKey: KEYS.holdings,
    queryFn: () => db.finance.holdings.list(),
    staleTime: STALE,
    gcTime: GC,
  });
}

export function useHoldingsMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.holdings });

  const add = useMutation({
    mutationFn: (data) => db.finance.holdings.create(data),
    onSuccess: invalidate,
  });

  const edit = useMutation({
    mutationFn: ({ id, ...data }) => db.finance.holdings.update(id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id) => db.finance.holdings.delete(id),
    onSuccess: invalidate,
  });

  return { add, edit, remove };
}

// ── Income ────────────────────────────────────────────────────────────────────
export function useIncome() {
  return useQuery({
    queryKey: ['finance', 'income'],
    queryFn: () => db.finance.income.list(),
    staleTime: STALE,
    gcTime: GC,
  });
}

export function useIncomeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['finance', 'income'] });

  const add = useMutation({
    mutationFn: (data) => db.finance.income.create(data),
    onSuccess: invalidate,
  });

  const edit = useMutation({
    mutationFn: ({ id, ...data }) => db.finance.income.update(id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id) => db.finance.income.delete(id),
    onSuccess: invalidate,
  });

  return { add, edit, remove };
}

// ── Savings ───────────────────────────────────────────────────────────────────
export function useSavingsGoals() {
  return useQuery({
    queryKey: ['finance', 'savingsGoals'],
    queryFn: () => db.finance.savingsGoals.list(),
    staleTime: STALE,
    gcTime: GC,
  });
}

export function useSavingsContributions() {
  return useQuery({
    queryKey: ['finance', 'savingsContributions'],
    queryFn: () => db.finance.savingsContributions.list(),
    staleTime: STALE,
    gcTime: GC,
  });
}

export function useSavingsMutations() {
  const qc = useQueryClient();
  const invalidateGoals = () => qc.invalidateQueries({ queryKey: ['finance', 'savingsGoals'] });
  const invalidateContributions = () => qc.invalidateQueries({ queryKey: ['finance', 'savingsContributions'] });

  const addGoal = useMutation({
    mutationFn: (data) => db.finance.savingsGoals.create(data),
    onSuccess: invalidateGoals,
  });

  const editGoal = useMutation({
    mutationFn: ({ id, ...data }) => db.finance.savingsGoals.update(id, data),
    onSuccess: invalidateGoals,
  });

  const deleteGoal = useMutation({
    mutationFn: (id) => db.finance.savingsGoals.delete(id),
    onSuccess: invalidateGoals,
  });

  const addContribution = useMutation({
    mutationFn: (data) => db.finance.savingsContributions.create(data),
    onSuccess: invalidateContributions,
  });

  const deleteContribution = useMutation({
    mutationFn: (id) => db.finance.savingsContributions.delete(id),
    onSuccess: invalidateContributions,
  });

  return { addGoal, editGoal, deleteGoal, addContribution, deleteContribution };
}

// ── Budget ────────────────────────────────────────────────────────────────────
export function useBudget() {
  return useQuery({
    queryKey: KEYS.budget,
    queryFn: () => db.finance.budget.list(),
    staleTime: STALE,
    gcTime: GC,
  });
}

export function useBudgetMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.budget });

  const upsert = useMutation({
    mutationFn: (data) => db.finance.budget.upsert(data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id) => db.finance.budget.delete(id),
    onSuccess: invalidate,
  });

  return { upsert, remove };
}
