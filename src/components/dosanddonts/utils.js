import { FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiClock, FiTarget, FiShield, FiZap, FiBarChart2, FiActivity, FiEye, FiSearch } from 'react-icons/fi';

export const getDefaultItems = () => [
  // DO's
  {
    id: '1',
    type: 'do',
    category: 'risk-management',
    title: 'Always Use Stop Loss',
    description: 'Set a stop loss for every trade to limit potential losses to 1-2% of your trading capital.',
    icon: FiShield,
    priority: 'high',
    examples: ['Buy at $50, set stop loss at $48.50', 'Risk only 1% of account per trade'],
    tags: ['risk', 'stop-loss', 'essential']
  },
  {
    id: '2',
    type: 'do',
    category: 'planning',
    title: 'Have a Trading Plan',
    description: 'Enter every trade with a clear plan including entry, exit, and risk management rules.',
    icon: FiTarget,
    priority: 'high',
    examples: ['Write down your thesis before trading', 'Define profit targets in advance'],
    tags: ['planning', 'strategy', 'discipline']
  },
  {
    id: '3',
    type: 'do',
    category: 'analysis',
    title: 'Do Your Research',
    description: 'Thoroughly research companies, understand their business model, financial health, and market position.',
    icon: FiSearch,
    priority: 'medium',
    examples: ['Read quarterly reports', 'Analyze competitor performance', 'Check insider trading'],
    tags: ['research', 'fundamentals', 'due-diligence']
  },
  {
    id: '4',
    type: 'do',
    category: 'psychology',
    title: 'Control Your Emotions',
    description: 'Make decisions based on logic and analysis, not fear, greed, or excitement.',
    icon: FiActivity,
    priority: 'high',
    examples: ['Take breaks when emotional', 'Stick to your plan', 'Avoid revenge trading'],
    tags: ['psychology', 'discipline', 'emotions']
  },
  {
    id: '5',
    type: 'do',
    category: 'portfolio',
    title: 'Diversify Your Portfolio',
    description: 'Spread risk across different sectors, asset classes, and company sizes.',
    icon: FiBarChart2,
    priority: 'medium',
    examples: ['Maximum 10% in one stock', 'Invest in different sectors', 'Balance growth and value'],
    tags: ['diversification', 'portfolio', 'risk']
  },
  {
    id: '6',
    type: 'do',
    category: 'learning',
    title: 'Keep Learning',
    description: 'Continuously educate yourself about market trends, strategies, and new trading techniques.',
    icon: FiTrendingUp,
    priority: 'medium',
    examples: ['Read trading books', 'Follow market news', 'Analyze your trades'],
    tags: ['learning', 'education', 'improvement']
  },
  {
    id: '7',
    type: 'do',
    category: 'timing',
    title: 'Be Patient',
    description: 'Wait for the right setup and don\'t force trades that don\'t meet your criteria.',
    icon: FiClock,
    priority: 'medium',
    examples: ['Wait for confirmation signals', 'Don\'t chase the market', 'Let setups come to you'],
    tags: ['patience', 'timing', 'discipline']
  },
  {
    id: '8',
    type: 'do',
    category: 'execution',
    title: 'Review Your Trades',
    description: 'Regularly analyze your winning and losing trades to identify patterns and improve your strategy.',
    icon: FiEye,
    priority: 'medium',
    examples: ['Keep a trading journal', 'Review weekly performance', 'Identify mistakes'],
    tags: ['review', 'analysis', 'improvement']
  },

  // DON'Ts
  {
    id: '9',
    type: 'dont',
    category: 'risk-management',
    title: 'Don\'t Risk More Than You Can Afford',
    description: 'Never risk money you cannot afford to lose, especially with leverage.',
    icon: FiAlertTriangle,
    priority: 'high',
    examples: ['Don\'t use rent money', 'Avoid margin calls', 'Keep emergency fund separate'],
    tags: ['risk', 'capital-preservation', 'essential']
  },
  {
    id: '10',
    type: 'dont',
    category: 'psychology',
    title: 'Don\'t Trade Emotionally',
    description: 'Avoid making trading decisions based on fear, greed, excitement, or revenge.',
    icon: FiAlertTriangle,
    priority: 'high',
    examples: ['No revenge trading after losses', 'Don\'t FOMO into rallies', 'Stay calm during volatility'],
    tags: ['psychology', 'emotions', 'discipline']
  },
  {
    id: '11',
    type: 'dont',
    category: 'planning',
    title: 'Don\'t Chase Losses',
    description: 'Accept small losses and move on rather than trying to win back losses immediately.',
    icon: FiTrendingDown,
    priority: 'high',
    examples: ['Don\'t double down', 'Accept the loss', 'Stick to your stop loss'],
    tags: ['losses', 'discipline', 'risk-management']
  },
  {
    id: '12',
    type: 'dont',
    category: 'portfolio',
    title: 'Don\'t Put All Eggs in One Basket',
    description: 'Avoid concentrating too much capital in a single stock or sector.',
    icon: FiAlertTriangle,
    priority: 'high',
    examples: ['Maximum 10-20% per position', 'Diversify across sectors', 'Balance asset classes'],
    tags: ['diversification', 'concentration-risk', 'portfolio']
  },
  {
    id: '13',
    type: 'dont',
    category: 'timing',
    title: 'Don\'t Overtrade',
    description: 'Avoid excessive trading that leads to high fees and poor decision-making.',
    icon: FiClock,
    priority: 'medium',
    examples: ['Limit daily trades', 'Focus on quality setups', 'Avoid boredom trading'],
    tags: ['overtrading', 'fees', 'quality']
  },
  {
    id: '14',
    type: 'dont',
    category: 'analysis',
    title: 'Don\'t Follow Tips Blindly',
    description: 'Never trade based on tips without doing your own research and analysis.',
    icon: FiAlertTriangle,
    priority: 'medium',
    examples: ['Do your own due diligence', 'Verify information', 'Question sources'],
    tags: ['tips', 'research', 'due-diligence']
  },
  {
    id: '15',
    type: 'dont',
    category: 'execution',
    title: 'Don\'t Ignore Your Strategy',
    description: 'Stick to your proven strategy and don\'t deviate based on short-term emotions.',
    icon: FiZap,
    priority: 'medium',
    examples: ['Follow your rules', 'Don\'t improvise mid-trade', 'Maintain discipline'],
    tags: ['strategy', 'discipline', 'rules']
  },
  {
    id: '16',
    type: 'dont',
    category: 'analysis',
    title: 'Don\'t Ignore Risk',
    description: 'Never ignore warning signs or risk factors because you want a trade to work out.',
    icon: FiAlertTriangle,
    priority: 'high',
    examples: ['Respect risk signals', 'Don\'t ignore red flags', 'Stay objective'],
    tags: ['risk', 'analysis', 'objectivity']
  }
];

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'text-red-400 bg-red-500/20 border border-red-500/30';
    case 'medium': return 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30';
    case 'low': return 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border border-gray-500/30';
  }
};


