import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export class PositionCalculator {
  constructor() {
    // Position calculator initialization
  }

  getFloatCategory(floatSize, floatCategories = {}) {
    if (!floatSize || !floatCategories) return null;
    
    for (const [key, category] of Object.entries(floatCategories)) {
      if (floatSize >= category.min && floatSize < category.max) {
        return { key, ...category };
      }
    }
    
    return null;
  }

  getDynamicAdjustments(floatSize, floatCategories) {
    if (!floatSize) return [];
    
    const category = this.getFloatCategory(floatSize, floatCategories);
    if (!category) return [];
    
    const adjustments = [];
    
    // Position size adjustment based on float category
    if (category.positionMultiplier && category.positionMultiplier !== 1) {
      adjustments.push({
        type: 'Position Size',
        factor: category.positionMultiplier
      });
    }
    
    // Stop loss adjustment based on float category
    if (category.stopLossPercent) {
      adjustments.push({
        type: 'Stop Loss',
        factor: category.stopLossPercent
      });
    }
    
    return adjustments;
  }

  getFloatBasedTargetProfit(floatSize, actualRisk, settings, floatCategories = {}) {
    if (!floatSize || !actualRisk) return settings.targetProfitDollars || 500;
    
    const category = this.getFloatCategory(floatSize, floatCategories);
    if (!category) return settings.targetProfitDollars || 500;
    
    // Use category-specific R:R ratios from the float category settings
    const minR = category.minR || 1;
    const maxR = category.maxR || 2;
    
    // Use average of min and max R for target profit
    const avgR = (minR + maxR) / 2;
    return actualRisk * avgR;
  }

  calculatePosition(params) {
    const {
      entryPrice,
      accountSize,
      positionSizingPercent,
      stopLossPercent,
      stopLossPrice,
      direction,
      symbol,
      shareFloat,
      floatCategory,
      floatCategories = {},
      settings = {}
    } = params;

    if (!entryPrice || !accountSize) {
      throw new Error('Missing required parameters');
    }

    const entry = parseFloat(entryPrice);
    const account = parseFloat(accountSize);
    
    // For intelligent flow, both symbol AND shareFloat must be provided
    const useIntelligentFlow = symbol && shareFloat && symbol !== 'STOCK'; // Don't use intelligent flow for default symbol
    
    if (entry <= 0 || account <= 0 || positionSizingPercent <= 0) {
      throw new Error('Invalid input values');
    }
    
    if (!useIntelligentFlow && (!stopLossPercent || stopLossPercent <= 0)) {
      throw new Error('Stop loss percent must be greater than 0 for manual calculation');
    }

    let finalShares, riskAmount, actualRisk, stopLossPriceCalculated, riskPerShare, positionValue, actualStopLossPercent, actualCategoryInfo;
    
    // Use custom stop loss price if provided
    if (stopLossPrice) {
      
      // Use actual stop loss input value
      if (direction === 'long') {
        riskPerShare = entry - parseFloat(stopLossPrice);
        stopLossPriceCalculated = parseFloat(stopLossPrice);
      } else if (direction === 'short') {
        // For short positions: risk is stop loss price (higher) minus entry price (lower)
        riskPerShare = parseFloat(stopLossPrice) - entry;
        stopLossPriceCalculated = parseFloat(stopLossPrice);
      }
      
      if (riskPerShare <= 0) {
        throw new Error('Stop loss price must be different from entry price. For long positions, stop loss must be below entry. For short positions, stop loss must be above entry.');
      }
      
      // Position Size Formula: Position Size = Risk Amount ÷ Risk Per Share
      const hasSettings = settings && typeof settings === 'object' && Object.keys(settings).length > 0;
      const hasValidRiskAmount = hasSettings && typeof settings.risk_amount === 'number' && settings.risk_amount > 0;
      
      const riskAmount = hasValidRiskAmount ? settings.risk_amount : 1500;
      finalShares = Math.round(riskAmount / riskPerShare); // Simple rounding instead of floor
      
      positionValue = finalShares * entry;
      actualRisk = finalShares * riskPerShare;
      actualStopLossPercent = (riskPerShare / entry) * 100;
      
    } else {
      // Original calculation logic when no custom stop loss price is provided
      if (useIntelligentFlow) {
      // Intelligent flow with float data - position size as % of account
      positionValue = account * (positionSizingPercent / 100);
      let baseShares = Math.floor(positionValue / entry);
      
      // Get category info from settings only
      const category = floatCategory || 'medium';
      const categoryInfo = floatCategories[category];
      
      if (!categoryInfo) {
        throw new Error(`Float category "${category}" not found in settings. Please configure float categories in Settings.`);
      }
      
      // Track the actual category info being used
      actualCategoryInfo = categoryInfo;
      
      // Use category-specific stop loss percent from settings, fallback to provided stopLossPercent
      const categoryStopLossPercent = categoryInfo.stopLossPercent ?? stopLossPercent;
      
      if (!categoryStopLossPercent) {
        throw new Error(`Stop loss percentage not configured for category "${category}". Please configure stopLossPercent in Settings.`);
      }
      
      // Track the actual stop loss percent being used
      actualStopLossPercent = categoryStopLossPercent;
      
      // Calculate stop loss based on category-specific stop loss percentage
      if (direction === 'long') {
        stopLossPriceCalculated = entry * (1 - actualStopLossPercent / 100);
        riskPerShare = entry - stopLossPriceCalculated;
      } else {
        stopLossPriceCalculated = entry * (1 + actualStopLossPercent / 100);
        riskPerShare = stopLossPriceCalculated - entry;
      }
      
      if (riskPerShare <= 0) {
        throw new Error('Stop loss percent must be greater than 0');
      }
      
      const adjustedShares = Math.floor(baseShares * categoryInfo.positionMultiplier);
      const maxSharesByFloat = Math.floor(shareFloat * (categoryInfo.maxFloatPercent / 100));
      finalShares = Math.min(adjustedShares, maxSharesByFloat);
      
      positionValue = finalShares * entry;
      actualRisk = finalShares * riskPerShare;
      riskAmount = actualRisk;
      
    } else {
      // Default flow without float data
      positionValue = account * (positionSizingPercent / 100);
      finalShares = Math.floor(positionValue / entry);
      
      // Track the actual stop loss percent being used
      actualStopLossPercent = stopLossPercent;
      // No category info in default flow
      actualCategoryInfo = null;
      
      if (direction === 'long') {
        stopLossPriceCalculated = entry * (1 - actualStopLossPercent / 100);
        riskPerShare = entry - stopLossPriceCalculated;
      } else {
        stopLossPriceCalculated = entry * (1 + actualStopLossPercent / 100);
        riskPerShare = stopLossPriceCalculated - entry;
      }
      
      if (riskPerShare <= 0) {
        throw new Error('Stop loss percent must be greater than 0');
      }
      
      positionValue = finalShares * entry;
      actualRisk = finalShares * riskPerShare;
      riskAmount = actualRisk;
    }
    } // End of else block for when no custom stop loss price is provided

    if (!finalShares || finalShares <= 0) {
      throw new Error('Calculated position size is zero');
    }

    const percentOfAccount = (positionValue / account) * 100;
    const actualRiskPercent = (actualRisk / account) * 100;

    // Determine risk level
    let riskLevel = 'Low';
    if (actualRiskPercent > 2) {
      riskLevel = 'High';
    } else if (actualRiskPercent > 1) {
      riskLevel = 'Medium';
    }

    const riskColor = riskLevel === 'High' ? 'text-red-400' : 
                    riskLevel === 'Medium' ? 'text-yellow-400' : 
                    'text-emerald-400';

    return {
      symbol: symbol ? symbol.toUpperCase() : '',
      entryPrice: entry,
      accountSize: account,
      riskPercent: positionSizingPercent,
      stopLossPercent: actualStopLossPercent, // Use the actual stop loss percent applied
      stopLossPrice: stopLossPriceCalculated,
      shares: finalShares,
      positionValue,
      percentOfAccount,
      riskAmount,
      actualRisk,
      actualRiskPercent,
      riskLevel,
      riskColor,
      direction,
      useIntelligentFlow,
      floatCategory: actualCategoryInfo // Include float category info for UI
    };
  }

  calculateTargets(calculation, targetProfitDollars, floatSize = null, settings = {}, floatCategories = {}) {
    const { actualRisk, shares, entryPrice, direction, stopLossPercent } = calculation;
    
    let calculatedTargetProfit = targetProfitDollars;
    // Use float-based target profit when share float data is available (not just mega caps)
    if (floatSize && actualRisk) {
      calculatedTargetProfit = this.getFloatBasedTargetProfit(floatSize, actualRisk, settings, floatCategories);
    }
    
    const targetPrice = direction === 'long' 
      ? entryPrice + (calculatedTargetProfit / shares)
      : entryPrice - (calculatedTargetProfit / shares);
    
    // Get float category for additional context
    const floatCategory = floatSize ? this.getFloatCategory(floatSize, floatCategories) : null;
    
    // Calculate stop loss price
    const stopLossPrice = direction === 'long' 
      ? entryPrice * (1 - (stopLossPercent / 100))
      : entryPrice * (1 + (stopLossPercent / 100));
    
    // Calculate default position sizing amount
    const defaultPositionValue = calculation.accountSize * (calculation.percentOfAccount / 100);
    
    // Calculate default target price
    const calculatedDefaultTargetPrice = direction === 'long' 
      ? entryPrice + (targetProfitDollars / shares)
      : entryPrice - (targetProfitDollars / shares);
    
    const result = {
      targetPrice,
      targetProfit: calculatedTargetProfit,
      defaultTargetProfit: targetProfitDollars,
      defaultTargetPrice: calculatedDefaultTargetPrice,
      usingDynamicTarget: calculatedTargetProfit !== targetProfitDollars,
      riskRewardRatio: actualRisk ? calculatedTargetProfit / actualRisk : 0,
      shareFloat: floatSize,
      floatCategory: floatCategory?.label || null,
      floatUtilization: shares && floatSize ? (shares / floatSize) * 100 : 0,
      dynamicAdjustments: this.getDynamicAdjustments(floatSize, floatCategories),
      stopLossPrice: stopLossPrice,
      actualRisk: actualRisk,
      maxDollars: settings?.max_dollars ? parseFloat(settings.max_dollars) : (settings?.max_dollars === '0' ? 0 : 5000),
      maxShares: settings?.max_dollars && calculatedDefaultTargetPrice && entryPrice ? 
        Math.floor(parseFloat(settings.max_dollars) / (calculatedDefaultTargetPrice - entryPrice)) : null
    };
    
    return result;
  }
}
