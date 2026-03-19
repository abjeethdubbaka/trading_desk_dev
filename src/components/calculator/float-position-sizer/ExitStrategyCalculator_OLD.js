/**
 * Exit Strategy Calculator
 * Handles professional exit rules with ATR, partial profit taking, and trailing stops
 */
export class ExitStrategyCalculator {
  constructor() {
    this.atrPeriod = 14; // Standard ATR period
  }

  /**
   * Calculate Average True Range (ATR)
   * ATR = Average of True Range over specified period
   * True Range = max(high - low, abs(high - prevClose), abs(low - prevClose))
   */
  calculateATR(priceData, period = 14) {
    if (!priceData || priceData.length < period) {
      // Fallback: Estimate ATR as 2% of current price for demo purposes
      return {
        atr: 0,
        atrPercent: 2.0,
        estimated: true,
        message: `ATR estimated at 2% (insufficient data - need ${period} periods)`
      };
    }

    const trueRanges = [];
    
    for (let i = 1; i < priceData.length; i++) {
      const current = priceData[i];
      const previous = priceData[i - 1];
      
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      
      trueRanges.push(tr);
    }

    // Calculate ATR using simple moving average
    const atr = trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
    const currentPrice = priceData[priceData.length - 1].close;
    const atrPercent = (atr / currentPrice) * 100;

    return {
      atr,
      atrPercent,
      estimated: false,
      period,
      dataPoints: priceData.length
    };
  }

  /**
   * Calculate initial stop loss using ATR
   * Rule: 1 ATR below entry (for long) or above entry (for short)
   */
  calculateATRStopLoss(entryPrice, atr, direction = 'long') {
    if (direction === 'long') {
      return {
        stopLossPrice: entryPrice - atr,
        stopLossPercent: ((entryPrice - (entryPrice - atr)) / entryPrice) * 100,
        type: 'ATR-based',
        description: `1 ATR below entry (${atr.toFixed(2)} below ${entryPrice.toFixed(2)})`
      };
    } else {
      return {
        stopLossPrice: entryPrice + atr,
        stopLossPercent: (((entryPrice + atr) - entryPrice) / entryPrice) * 100,
        type: 'ATR-based',
        description: `1 ATR above entry (${atr.toFixed(2)} above ${entryPrice.toFixed(2)})`
      };
    }
  }

  /**
   * Find previous high/low for partial profit taking
   * Rule: Take 40% at previous high (for long) or low (for short)
   */
  findPreviousHighLow(priceData, direction = 'long', lookbackPeriod = 20) {
    if (!priceData || priceData.length < lookbackPeriod) {
      return {
        targetPrice: null,
        found: false,
        message: `Insufficient data for previous high/low analysis (need ${lookbackPeriod} periods)`
      };
    }

    const recentData = priceData.slice(-lookbackPeriod);
    let targetPrice;

    if (direction === 'long') {
      // Find highest high in the lookback period
      targetPrice = Math.max(...recentData.map(d => d.high));
    } else {
      // Find lowest low in the lookback period  
      targetPrice = Math.min(...recentData.map(d => d.low));
    }

    return {
      targetPrice,
      found: true,
      direction,
      lookbackPeriod,
      dataPoints: recentData.length,
      description: `${direction === 'long' ? 'Highest' : 'Lowest'} ${direction === 'long' ? 'high' : 'low'} in last ${lookbackPeriod} periods`
    };
  }

  /**
   * Calculate 2x risk target for partial profit taking
   * Rule: Take 35% at 2× risk
   */
  calculate2xRiskTarget(entryPrice, stopLossPrice, direction = 'long') {
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    const targetProfit = riskPerShare * 2;

    let targetPrice;
    if (direction === 'long') {
      targetPrice = entryPrice + targetProfit;
    } else {
      targetPrice = entryPrice - targetProfit;
    }

    const targetPercent = (targetProfit / entryPrice) * 100;

    return {
      targetPrice,
      riskPerShare,
      targetProfit,
      targetPercent,
      type: '2x Risk',
      description: `2× risk target (${targetProfit.toFixed(2)} profit per share)`
    };
  }

  /**
   * Calculate 20 EMA trailing stop
   * Rule: Trail 20 EMA on remaining 25%
   */
  calculate20EMATrailingStop(priceData, direction = 'long') {
    if (!priceData || priceData.length < 20) {
      return {
        ema: null,
        trailingStop: null,
        found: false,
        message: 'Insufficient data for 20 EMA calculation (need 20+ periods)'
      };
    }

    // Calculate 20 EMA
    const ema = this.calculateEMA(priceData.slice(-20).map(d => d.close), 20);
    const currentPrice = priceData[priceData.length - 1].close;

    let trailingStop;
    if (direction === 'long') {
      trailingStop = ema; // For long, trail below the 20 EMA
    } else {
      trailingStop = ema; // For short, trail above the 20 EMA
    }

    return {
      ema,
      trailingStop,
      found: true,
      currentPrice,
      direction,
      description: `20 EMA trailing stop at ${ema.toFixed(2)}`
    };
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  calculateEMA(prices, period) {
    if (prices.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Calculate complete exit strategy
   */
  calculateExitStrategy(entryPrice, shares, direction, priceData = null, stopLossPrice = null) {
    console.log('🔍 Debug: ExitStrategyCalculator.calculateExitStrategy called with:', {
      entryPrice,
      shares,
      direction,
      hasPriceData: !!priceData,
      priceDataPoints: priceData?.length || 0,
      stopLossPrice
    });
    
    const strategy = {
      entryPrice,
      shares,
      direction,
      totalShares: shares,
      rules: [],
      summary: {
        totalShares: shares,
        remainingShares: shares
      }
    };

    // Rule 1: Initial stop loss - percentage based
    const initialStopLoss = stopLossPrice || (direction === 'long' ? entryPrice * 0.96 : entryPrice * 1.04);
    const stopLossPercent = Math.abs((initialStopLoss - entryPrice) / entryPrice) * 100;
    }
  };

  // Rule 1: Initial stop loss - percentage based
  const initialStopLoss = stopLossPrice || (direction === 'long' ? entryPrice * 0.96 : entryPrice * 1.04);
  const stopLossPercent = Math.abs((initialStopLoss - entryPrice) / entryPrice) * 100;
  
  strategy.rules.push({
    id: 1,
    name: 'Initial Stop Loss',
    description: `Stop loss at ${initialStopLoss.toFixed(2)} (${stopLossPercent.toFixed(1)}% ${direction === 'long' ? 'below' : 'above'} entry)`,
    stopLossPrice: initialStopLoss,
    stopLossPercent,
    type: 'percentage',
    shares: shares,
    action: 'stop_loss'
  });

  // Rule 2: Take 40% profit at 1R
    const shares40Percent = Math.floor(shares * 0.4);
    const riskPerShare = Math.abs(entryPrice - initialStopLoss);
    const targetPrice1R = direction === 'long' ? entryPrice + riskPerShare : entryPrice - riskPerShare;
    
    strategy.rules.push({
      id: 2,
      name: 'Take 40% at 1R',
      description: `Take 40% at ${targetPrice1R.toFixed(2)} (1x risk)`,
      targetPrice: targetPrice1R,
      targetPercent: ((targetPrice1R - entryPrice) / entryPrice * 100).toFixed(1),
      shares: shares40Percent,
      percentage: 40,
      action: 'partial_profit',
      type: '1x_risk'
    });
    strategy.summary.remainingShares -= shares40Percent;

    // Rule 3: Take 35% profit at 2R
    const shares35Percent = Math.floor(shares * 0.35);
    const targetPrice2R = direction === 'long' ? entryPrice + (2 * riskPerShare) : entryPrice - (2 * riskPerShare);
    
    strategy.rules.push({
      id: 3,
      name: 'Take 35% at 2R',
      description: `Take 35% at ${targetPrice2R.toFixed(2)} (2x risk)`,
      targetPrice: targetPrice2R,
      targetPercent: ((targetPrice2R - entryPrice) / entryPrice * 100).toFixed(1),
      shares: shares35Percent,
      percentage: 35,
      action: 'partial_profit',
      type: '2x_risk'
    });
    strategy.summary.remainingShares -= shares35Percent;

    // Rule 4: Trail 20 EMA on remaining 25%
    const shares25Percent = shares - shares40Percent - shares35Percent; // Remaining shares
    
    const emaTrailing = this.calculate20EMATrailingStop(priceData, direction);
    strategy.rules.push({
      id: 4,
      name: 'Trail 20 EMA on Remaining 25%',
      description: emaTrailing.description || '20 EMA trailing stop',
      trailingStop: emaTrailing.trailingStop,
      shares: shares25Percent,
      percentage: 25,
      action: 'trailing_stop',
      type: 'ema_trailing'
    });

    // Rule 5: If no move in 20 min, exit
    strategy.rules.push({
      id: 5,
      name: 'Time-based Exit',
      description: 'If no move in 20 minutes, exit remaining position',
      timeLimit: 20, // minutes
      shares: strategy.summary.remainingShares,
      action: 'time_exit',
      type: 'time_based'
    });

    console.log('🔍 Debug: ExitStrategyCalculator returning strategy with:', {
      totalRules: strategy.rules.length,
      ruleNames: strategy.rules.map(r => r.name),
      totalShares: strategy.totalShares,
      sharesAllocated: strategy.rules.reduce((sum, rule) => sum + (rule.shares || 0), 0)
    });

    return strategy;
  }
  

  /**
   * Generate exit strategy summary for display
   */
  generateExitSummary(exitStrategy) {
    const summary = {
      totalRules: exitStrategy.rules.length,
      partialProfitRules: exitStrategy.rules.filter(r => r.action === 'partial_profit').length,
      stopLossRules: exitStrategy.rules.filter(r => r.action === 'stop_loss').length,
      trailingStopRules: exitStrategy.rules.filter(r => r.action === 'trailing_stop').length,
      timeExitRules: exitStrategy.rules.filter(r => r.action === 'time_exit').length,
      totalSharesAllocated: exitStrategy.rules.reduce((sum, rule) => sum + (rule.shares || 0), 0)
    };

    return summary;
  }


export default ExitStrategyCalculator;
