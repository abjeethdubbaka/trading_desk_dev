export const CONSTANTS = {
  LOCAL_STORAGE_KEY: 'knowledgeBase',
  LEARNING_PROGRESS_KEY: 'learningProgress',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ENTRY_TYPES: {
    NOTE: 'note',
    FORMULA: 'formula',
    STRATEGY: 'strategy',
    OBSERVATION: 'observation',
    COURSE: 'course',
    TUTORIAL: 'tutorial',
    ARTICLE: 'article',
    VIDEO: 'video'
  },
  SORT_OPTIONS: {
    CREATED_DESC: 'created_desc',
    CREATED_ASC: 'created_asc',
    UPDATED_DESC: 'updated_desc',
    UPDATED_ASC: 'updated_asc',
    TITLE_ASC: 'title_asc',
    TITLE_DESC: 'title_desc'
  },
  DIFFICULTY_LEVELS: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert'
  },
  LEARNING_CATEGORIES: {
    TECHNICAL_ANALYSIS: 'technical-analysis',
    FUNDAMENTAL_ANALYSIS: 'fundamental-analysis',
    RISK_MANAGEMENT: 'risk-management',
    TRADING_PSYCHOLOGY: 'trading-psychology',
    MARKET_STRUCTURE: 'market-structure',
    STRATEGY_DEVELOPMENT: 'strategy-development',
    PORTFOLIO_MANAGEMENT: 'portfolio-management',
    ALGORITHMIC_TRADING: 'algorithmic-trading'
  }
};
