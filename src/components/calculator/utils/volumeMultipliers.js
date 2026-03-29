export const VOLUME_MULTIPLIERS = [
  { min: 0, max: 1, multiplier: 0.5, label: 'Very Low', color: 'text-red-400', description: 'Poor liquidity, high slippage' },
  { min: 1, max: 2, multiplier: 0.7, label: 'Low', color: 'text-orange-400', description: 'Below average liquidity' },
  { min: 2, max: 5, multiplier: 1.0, label: 'Average', color: 'text-yellow-400', description: 'Standard liquidity' },
  { min: 5, max: 10, multiplier: 1.3, label: 'Good', color: 'text-blue-400', description: 'Above average liquidity' },
  { min: 10, max: 20, multiplier: 1.5, label: 'Excellent', color: 'text-emerald-400', description: 'High liquidity, low slippage' },
  { min: 20, max: Infinity, multiplier: 2.0, label: 'Exceptional', color: 'text-purple-400', description: 'Exceptional liquidity' }
];

export function getVolumeMultiplier(volumeToFloatRatio) {
  if (!volumeToFloatRatio && volumeToFloatRatio !== 0) return 1.0;
  
  for (const range of VOLUME_MULTIPLIERS) {
    if (volumeToFloatRatio >= range.min && volumeToFloatRatio < range.max) {
      return range.multiplier;
    }
  }
  return 1.0;
}

export function getVolumeMultiplierInfo(volumeToFloatRatio) {
  if (!volumeToFloatRatio && volumeToFloatRatio !== 0) return VOLUME_MULTIPLIERS[2];
  
  for (const range of VOLUME_MULTIPLIERS) {
    if (volumeToFloatRatio >= range.min && volumeToFloatRatio < range.max) {
      return range;
    }
  }
  return VOLUME_MULTIPLIERS[2];
}

export function getSlippageEstimate(volumeToFloatRatio) {
  if (volumeToFloatRatio < 1) return 30;
  if (volumeToFloatRatio < 2) return 20;
  if (volumeToFloatRatio < 5) return 10;
  if (volumeToFloatRatio > 20) return 1;
  return 5; // Base 5 bps
}


