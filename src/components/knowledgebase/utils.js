// Utility functions for file handling and data migration
export const fileUtils = {
  compressImage: async (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  },
  
  readFileAsDataURL: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};

export const migrateDataStructure = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    ...item,
    type: item.type || 'note',
    tags: item.tags || [],
    images: item.images || [],
    formulas: item.formulas || [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    viewCount: item.viewCount || 0
  }));
};

export const getDefaultLearningContent = () => [
  // Technical Analysis Courses
  {
    id: 'ta-001',
    title: 'Introduction to Technical Analysis',
    content: 'Learn the fundamentals of technical analysis including chart patterns, indicators, and trend analysis. This comprehensive course covers everything from basic candlestick patterns to advanced technical indicators.',
    type: 'course',
    category: 'technical-analysis',
    difficulty: 'beginner',
    duration: '2 hours',
    modules: [
      { id: 'm1', title: 'Chart Basics & Candlestick Patterns', completed: false, duration: '30 min' },
      { id: 'm2', title: 'Support and Resistance Levels', completed: false, duration: '45 min' },
      { id: 'm3', title: 'Trend Lines and Channels', completed: false, duration: '45 min' }
    ],
    tags: ['technical-analysis', 'charts', 'beginner', 'patterns'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'ta-002',
    title: 'Candlestick Patterns Mastery',
    content: 'Master candlestick patterns and their implications for trading decisions. Learn to identify reversal patterns, continuation patterns, and understand market psychology through price action.',
    type: 'course',
    category: 'technical-analysis',
    difficulty: 'intermediate',
    duration: '3 hours',
    modules: [
      { id: 'm1', title: 'Single Candlestick Patterns', completed: false, duration: '60 min' },
      { id: 'm2', title: 'Double Candlestick Patterns', completed: false, duration: '60 min' },
      { id: 'm3', title: 'Triple Candlestick Patterns', completed: false, duration: '60 min' }
    ],
    tags: ['candlesticks', 'patterns', 'technical-analysis', 'price-action'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'ta-003',
    title: 'Moving Averages and Indicators',
    content: 'Deep dive into moving averages, RSI, MACD, and other essential technical indicators. Learn how to combine indicators for better trading signals.',
    type: 'course',
    category: 'technical-analysis',
    difficulty: 'intermediate',
    duration: '2.5 hours',
    modules: [
      { id: 'm1', title: 'Simple and Exponential Moving Averages', completed: false, duration: '45 min' },
      { id: 'm2', title: 'Oscillators (RSI, Stochastic)', completed: false, duration: '45 min' },
      { id: 'm3', title: 'Momentum Indicators (MACD, ADX)', completed: false, duration: '45 min' },
      { id: 'm4', title: 'Volume and Open Interest', completed: false, duration: '45 min' }
    ],
    tags: ['indicators', 'moving-averages', 'rsi', 'macd'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  
  // Risk Management Courses
  {
    id: 'rm-001',
    title: 'Risk Management Fundamentals',
    content: 'Essential risk management techniques for protecting your trading capital. Learn position sizing, stop loss strategies, and risk-reward ratios.',
    type: 'course',
    category: 'risk-management',
    difficulty: 'beginner',
    duration: '1.5 hours',
    modules: [
      { id: 'm1', title: 'Position Sizing Basics', completed: false, duration: '30 min' },
      { id: 'm2', title: 'Stop Loss Strategies', completed: false, duration: '30 min' },
      { id: 'm3', title: 'Risk-Reward Ratios', completed: false, duration: '30 min' }
    ],
    tags: ['risk-management', 'position-sizing', 'stop-loss', 'fundamentals'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'rm-002',
    title: 'Advanced Portfolio Risk Management',
    content: 'Learn to manage risk across multiple positions, correlation analysis, and portfolio-level risk metrics for professional traders.',
    type: 'course',
    category: 'risk-management',
    difficulty: 'advanced',
    duration: '3 hours',
    modules: [
      { id: 'm1', title: 'Correlation Analysis', completed: false, duration: '45 min' },
      { id: 'm2', title: 'Portfolio Heat Maps', completed: false, duration: '45 min' },
      { id: 'm3', title: 'Value at Risk (VaR)', completed: false, duration: '45 min' },
      { id: 'm4', title: 'Stress Testing', completed: false, duration: '45 min' }
    ],
    tags: ['portfolio', 'correlation', 'var', 'advanced-risk'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  
  // Trading Psychology
  {
    id: 'tp-001',
    title: 'Trading Psychology Masterclass',
    content: 'Overcome psychological barriers and develop the mindset of a successful trader. Master emotional control and discipline.',
    type: 'course',
    category: 'trading-psychology',
    difficulty: 'intermediate',
    duration: '2.5 hours',
    modules: [
      { id: 'm1', title: 'Understanding Trading Emotions', completed: false, duration: '45 min' },
      { id: 'm2', title: 'Fear and Greed Management', completed: false, duration: '45 min' },
      { id: 'm3', title: 'Developing Trading Discipline', completed: false, duration: '45 min' },
      { id: 'm4', title: 'Patience and Timing', completed: false, duration: '45 min' }
    ],
    tags: ['psychology', 'discipline', 'emotions', 'mindset'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },

  // Strategy Development
  {
    id: 'sd-001',
    title: 'Strategy Development Workshop',
    content: 'Learn to develop, test, and optimize your own trading strategies. From backtesting to live implementation.',
    type: 'course',
    category: 'strategy-development',
    difficulty: 'advanced',
    duration: '4 hours',
    modules: [
      { id: 'm1', title: 'Strategy Framework', completed: false, duration: '60 min' },
      { id: 'm2', title: 'Backtesting Basics', completed: false, duration: '60 min' },
      { id: 'm3', title: 'Optimization Techniques', completed: false, duration: '60 min' },
      { id: 'm4', title: 'Performance Metrics', completed: false, duration: '60 min' }
    ],
    tags: ['strategy', 'backtesting', 'optimization', 'performance'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'sd-002',
    title: 'Algorithmic Trading Introduction',
    content: 'Introduction to algorithmic trading concepts, basic coding strategies, and automated execution systems.',
    type: 'course',
    category: 'algorithmic-trading',
    difficulty: 'expert',
    duration: '5 hours',
    modules: [
      { id: 'm1', title: 'Algorithmic Trading Concepts', completed: false, duration: '75 min' },
      { id: 'm2', title: 'Basic Trading Algorithms', completed: false, duration: '75 min' },
      { id: 'm3', title: 'API Integration', completed: false, duration: '75 min' },
      { id: 'm4', title: 'Risk Management in Algorithms', completed: false, duration: '75 min' }
    ],
    tags: ['algorithmic', 'automation', 'coding', 'api'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },

  // Video Tutorials
  {
    id: 'vt-001',
    title: 'Live Trading Setup Tutorial',
    content: 'Complete walkthrough of setting up your trading platform, workspace, and essential tools for day trading.',
    type: 'video',
    category: 'market-structure',
    difficulty: 'beginner',
    duration: '45 min',
    videoUrl: '#',
    tags: ['setup', 'tutorial', 'beginner', 'platform'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'vt-002',
    title: 'Chart Pattern Recognition',
    content: 'Video guide to identifying common chart patterns in real-time market conditions with practical examples.',
    type: 'video',
    category: 'technical-analysis',
    difficulty: 'intermediate',
    duration: '60 min',
    videoUrl: '#',
    tags: ['patterns', 'recognition', 'real-time', 'examples'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },

  // Articles
  {
    id: 'ar-001',
    title: 'Market Structure Analysis',
    content: 'Understanding market cycles, phases, and structural analysis for better trading decisions. Learn to identify market trends and reversals.',
    type: 'article',
    category: 'market-structure',
    difficulty: 'intermediate',
    readTime: '15 min',
    tags: ['market-structure', 'analysis', 'cycles', 'trends'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'ar-002',
    title: 'The Psychology of Loss Aversion',
    content: 'Deep dive into how loss aversion affects trading decisions and strategies to overcome this cognitive bias.',
    type: 'article',
    category: 'trading-psychology',
    difficulty: 'intermediate',
    readTime: '20 min',
    tags: ['psychology', 'bias', 'loss-aversion', 'behavioral-finance'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },

  // Knowledge Base Entries
  {
    id: 'kb-001',
    title: 'Common Trading Mistakes to Avoid',
    content: 'A comprehensive list of common mistakes that new and experienced traders make, along with strategies to avoid them.',
    type: 'note',
    category: 'risk-management',
    difficulty: 'beginner',
    tags: ['mistakes', 'beginners', 'tips', 'warnings'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'kb-002',
    title: 'Essential Trading Terminology',
    content: 'Glossary of essential trading terms and concepts every trader should know, from basic to advanced terminology.',
    type: 'note',
    category: 'fundamental-analysis',
    difficulty: 'beginner',
    tags: ['terminology', 'glossary', 'basics', 'reference'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'kb-003',
    title: 'Position Sizing Calculator Formula',
    content: 'Mathematical formula for calculating optimal position size based on risk tolerance and account size.',
    type: 'formula',
    category: 'risk-management',
    difficulty: 'intermediate',
    formulas: [
      { id: 'f1', latex: 'Position Size = \\frac{Account Risk \\times Risk Percentage}{Stop Loss Distance}' }
    ],
    tags: ['formula', 'position-sizing', 'math', 'calculation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'kb-004',
    title: 'RSI Calculation Formula',
    content: 'Relative Strength Index calculation formula and interpretation guidelines for overbought/oversold conditions.',
    type: 'formula',
    category: 'technical-analysis',
    difficulty: 'intermediate',
    formulas: [
      { id: 'f1', latex: 'RSI = 100 - \\frac{100}{1 + \\frac{Average Gain}{Average Loss}}' }
    ],
    tags: ['formula', 'rsi', 'indicator', 'calculation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'kb-005',
    title: 'Swing Trading Strategy Template',
    content: 'Complete swing trading strategy template including entry criteria, exit rules, and risk management guidelines.',
    type: 'strategy',
    category: 'strategy-development',
    difficulty: 'intermediate',
    tags: ['strategy', 'swing-trading', 'template', 'complete'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'kb-006',
    title: 'Day Trading Scalping Strategy',
    content: 'High-frequency scalping strategy for day traders focusing on small price movements and quick exits.',
    type: 'strategy',
    category: 'strategy-development',
    difficulty: 'advanced',
    tags: ['strategy', 'scalping', 'day-trading', 'high-frequency'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'kb-007',
    title: 'Market Observation: Earnings Season Patterns',
    content: 'Observed patterns and behaviors during earnings season based on historical data analysis.',
    type: 'observation',
    category: 'fundamental-analysis',
    difficulty: 'intermediate',
    tags: ['earnings', 'patterns', 'seasonal', 'observation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  },
  {
    id: 'kb-008',
    title: 'Market Observation: Volume Spikes Analysis',
    content: 'Analysis of unusual volume spikes and their predictive value for price movements.',
    type: 'observation',
    category: 'technical-analysis',
    difficulty: 'intermediate',
    tags: ['volume', 'spikes', 'analysis', 'patterns'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
  }
];


