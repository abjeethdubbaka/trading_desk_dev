const TIER_CUSTOMIZATIONS_STORAGE_KEY = 'trade_desk_tier_customizations';

function loadTierCustomizations() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(TIER_CUSTOMIZATIONS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistTierCustomizations(customizations) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      TIER_CUSTOMIZATIONS_STORAGE_KEY,
      JSON.stringify(customizations)
    );
  } catch {
    // no-op
  }
}

let tierCustomizations = loadTierCustomizations();

export function getTierCustomizations(tierId) {
  return tierCustomizations[tierId] || {};
}

export function saveTierCustomizations(tierId, customizations) {
  tierCustomizations[tierId] = { ...customizations };
  persistTierCustomizations(tierCustomizations);
}
