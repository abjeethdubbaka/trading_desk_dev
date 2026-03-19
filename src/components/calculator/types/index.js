export const FloatCategories = {
  MICRO: 'micro',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  MEGA: 'mega'
};

export const TradingStyles = {
  CONSERVATIVE: 'conservative',
  MODERATE: 'moderate',
  AGGRESSIVE: 'aggressive'
};

export const RiskLevels = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
};

export const FloatData = {
  symbol: String,
  company_name: String,
  share_float: Number,
  outstanding_shares: Number,
  market_cap: Number,
  float_percentage: Number,
  average_volume: Number,
  volume_to_float_ratio: Number,
  institution_ownership: Number,
  insider_ownership: Number,
  short_interest: Number,
  days_to_cover: Number,
  float_category: String,
  liquidity_score: Number,
  volatility_score: Number,
  data_source: String,
  last_updated: String,
  next_update: String,
  is_active: Boolean
};

export const CalculationResult = {
  // Inputs
  symbol: String,
  entryPrice: Number,
  accountSize: Number,
  tradingStyle: String,
  riskPercent: Number,
  stopPercent: Number,
  
  // Float data
  floatSize: Number,
  floatCategory: String,
  categoryInfo: Object,
  volumeToFloat: Number,
  liquidityScore: Number,
  
  // Calculations
  shares: Number,
  positionValue: Number,
  percentOfAccount: Number,
  percentOfFloat: Number,
  maxFloatPercent: Number,
  stopLossPrice: Number,
  riskAmount: Number,
  actualRisk: Number,
  actualRiskPercent: Number,
  
  // Multipliers
  riskMultiplier: Number,
  volumeMultiplier: Number,
  liquidityMultiplier: Number,
  totalMultiplier: Number,
  
  // Constraints
  maxSharesByFloat: Number,
  maxValueByAccount: Number,
  baseShares: Number,
  basePositionValue: Number,
  
  // Additional
  slippageBps: Number,
  slippageCost: Number,
  riskLevel: String,
  riskColor: String,
  calculatedAt: String
};
