import { 
  getFloatCategory, 
  getCategoryInfo, 
  getMaxFloatPercent, 
  getRiskMultiplier, 
  getStopLossPercent, 
  getMaxAccountPercent 
} from './floatCategories';
import { getVolumeMultiplier, getSlippageEstimate } from './volumeMultipliers';

export function calculatePosition(floatData, entryPrice, accountSize, tradingStyle, options = {}) {
  const {
    useAdvanced = false,
    customRiskPercent = 1.0,
    customStopPercent = null
  } = options;

  if (!floatData || !entryPrice || !accountSize) return null;

  const floatSize = floatData.share_float || 100000000;
  const entry = parseFloat(entryPrice);
  const account = parseFloat(accountSize);
  
  // Get float category and rules
  const floatCategory = getFloatCategory(floatSize);
  const categoryInfo = getCategoryInfo(floatSize);
  const maxFloatPercent = getMaxFloatPercent(floatSize);
  const riskMultiplier = getRiskMultiplier(floatSize);
  const maxAccountPercent = getMaxAccountPercent(floatSize);
  
  // Get stop loss percentage
  const stopPercent = customStopPercent || getStopLossPercent(floatSize);
  
  // Calculate stop loss and risk per share
  const stopLossPrice = entry * (1 - stopPercent / 100);
  const riskPerShare = entry - stopLossPrice;
  
  // Risk amount based on trading style
  const riskAmount = account * (customRiskPercent / 100);
  
  // Base shares (risk-based calculation)
  const baseShares = Math.floor(riskAmount / riskPerShare);
  const basePositionValue = baseShares * entry;
  
  // Get volume and liquidity multipliers
  const volumeToFloat = floatData.volume_to_float_ratio || 0;
  const volumeMultiplier = getVolumeMultiplier(volumeToFloat);
  const liquidityScore = floatData.liquidity_score || 50;
  const liquidityMultiplier = liquidityScore / 100;
  
  // Apply dynamic adjustments
  let adjustedShares = Math.floor(
    baseShares * 
    riskMultiplier * 
    volumeMultiplier * 
    liquidityMultiplier
  );
  
  // Apply float constraint
  const maxSharesByFloat = Math.floor(floatSize * (maxFloatPercent / 100));
  adjustedShares = Math.min(adjustedShares, maxSharesByFloat);
  
  // Apply account constraint
  const maxValueByAccount = account * (maxAccountPercent / 100);
  const maxSharesByAccount = Math.floor(maxValueByAccount / entry);
  adjustedShares = Math.min(adjustedShares, maxSharesByAccount);
  
  // Ensure at least 1 share
  const finalShares = Math.max(1, adjustedShares);
  const positionValue = finalShares * entry;
  const percentOfAccount = (positionValue / account) * 100;
  const percentOfFloat = (finalShares / floatSize) * 100;
  const actualRisk = finalShares * riskPerShare;
  const actualRiskPercent = (actualRisk / account) * 100;
  
  // Slippage and risk assessment
  const slippageBps = getSlippageEstimate(volumeToFloat);
  const slippageCost = positionValue * (slippageBps / 10000);
  
  // Determine risk level
  let riskLevel = 'Low';
  let riskColor = 'text-emerald-400';
  if (percentOfFloat > maxFloatPercent * 0.8) {
    riskLevel = 'High';
    riskColor = 'text-red-400';
  } else if (percentOfFloat > maxFloatPercent * 0.5) {
    riskLevel = 'Medium';
    riskColor = 'text-yellow-400';
  }
  
  return {
    // Inputs
    symbol: floatData.symbol || '',
    entryPrice: entry,
    accountSize: account,
    tradingStyle: tradingStyle,
    riskPercent: customRiskPercent,
    stopPercent,
    
    // Float data
    floatSize,
    floatCategory,
    categoryInfo,
    volumeToFloat,
    liquidityScore,
    
    // Calculations
    shares: finalShares,
    positionValue,
    percentOfAccount,
    percentOfFloat,
    maxFloatPercent,
    stopLossPrice,
    riskAmount,
    actualRisk,
    actualRiskPercent,
    
    // Multipliers
    riskMultiplier,
    volumeMultiplier,
    liquidityMultiplier,
    totalMultiplier: riskMultiplier * volumeMultiplier * liquidityMultiplier,
    
    // Constraints
    maxSharesByFloat,
    maxValueByAccount,
    baseShares,
    basePositionValue,
    
    // Additional
    slippageBps,
    slippageCost,
    riskLevel,
    riskColor,
    calculatedAt: new Date().toISOString()
  };
}

export function getRiskLevel(percentOfFloat, maxFloatPercent) {
  if (percentOfFloat > maxFloatPercent * 0.8) return 'High';
  if (percentOfFloat > maxFloatPercent * 0.5) return 'Medium';
  return 'Low';
}

export function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case 'High': return 'text-red-400';
    case 'Medium': return 'text-yellow-400';
    default: return 'text-emerald-400';
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(number, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}
