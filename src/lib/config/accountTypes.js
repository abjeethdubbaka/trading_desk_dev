/**
 * @file src/lib/accountTypes.js
 *
 * Account type presets for TradeDesk Pro.
 * Each tier defines sensible defaults for every risk parameter.
 * Users can select a tier and override individual fields.
 */
export { ACCOUNT_TIERS, ACCOUNT_TIER_IDS } from './accountTypes/tiers.js';
export { getTierCustomizations, saveTierCustomizations } from './accountTypes/customizations.js';
export {
  getTierSettingsWithCustomizations,
  getTierSettingsFields,
  detectTierFromSettings,
} from './accountTypes/utils.js';


