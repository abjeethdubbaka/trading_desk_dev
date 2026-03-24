/**
 * Query keys for React Query
 */

export const settingsKeys = {
  all: ['settings'],
  detail: () => [...settingsKeys.all, 'detail']
};

export const tradesKeys = {
  all: ['trades'],
  detail: (id) => [...tradesKeys.all, id],
  list: () => [...tradesKeys.all, 'list']
};

export const mediaKeys = {
  all: ['media'],
  detail: (id) => [...mediaKeys.all, id],
  list: () => [...mediaKeys.all, 'list']
};
