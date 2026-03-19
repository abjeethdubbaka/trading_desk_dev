// Mock base44 client for demonstration
const base44 = {
  entities: {
    Notification: {
      filter: async (filters) => {
        // Return mock notifications
        return [
          { id: 1, message: 'Trade executed successfully', is_read: false, is_active: true },
          { id: 2, message: 'Price alert triggered', is_read: false, is_active: true },
        ];
      }
    },
    Trade: {
      list: async (sort, limit) => {
        // Return mock trades
        return [
          {
            id: 1,
            symbol: 'AAPL',
            direction: 'long',
            entry_price: 150.25,
            exit_price: 155.50,
            position_size: 100,
            entry_time: '2024-01-15T10:30:00Z',
            exit_time: '2024-01-15T11:45:00Z',
            pnl: 525.00,
            r_multiple: 2.1,
            setup_type: 'breakout',
            notes: 'Strong momentum',
            emotions: 'confident',
            followed_plan: true,
            created_date: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            symbol: 'TSLA',
            direction: 'short',
            entry_price: 245.80,
            exit_price: 242.30,
            position_size: 50,
            entry_time: '2024-01-15T14:20:00Z',
            exit_time: '2024-01-15T15:30:00Z',
            pnl: 175.00,
            r_multiple: 1.4,
            setup_type: 'pullback',
            notes: 'Resistance level held',
            emotions: 'disciplined',
            followed_plan: true,
            created_date: '2024-01-15T14:20:00Z'
          },
          {
            id: 3,
            symbol: 'NVDA',
            direction: 'long',
            entry_price: 480.50,
            exit_price: 475.20,
            position_size: 25,
            entry_time: '2024-01-16T09:45:00Z',
            exit_time: '2024-01-16T11:15:00Z',
            pnl: -132.50,
            r_multiple: -0.8,
            setup_type: 'breakout',
            notes: 'Failed breakout',
            emotions: 'nervous',
            followed_plan: false,
            created_date: '2024-01-16T09:45:00Z'
          }
        ];
      },
      create: async (data) => {
        // Persist to localStorage so UI can see saved values
        const record = { id: Date.now(), ...data };
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            // Store in localStorage with trade prefix
            const existingTrades = JSON.parse(window.localStorage.getItem('trades') || '[]');
            existingTrades.push(record);
            window.localStorage.setItem('trades', JSON.stringify(existingTrades));
          }
        } catch (e) {
          console.warn('Failed to write trades to localStorage', e);
        }
        return record;
      },
      update: async (id, data) => {
        // Update trade in localStorage
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const existingTrades = JSON.parse(window.localStorage.getItem('trades') || '[]');
            const tradeIndex = existingTrades.findIndex(trade => trade.id === id);
            if (tradeIndex !== -1) {
              existingTrades[tradeIndex] = { ...existingTrades[tradeIndex], ...data };
              window.localStorage.setItem('trades', JSON.stringify(existingTrades));
            }
          }
        } catch (e) {
          console.warn('Failed to update trade in localStorage', e);
        }
        return { id, ...data };
      },
      delete: async (id) => {
        // Delete trade from localStorage
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const existingTrades = JSON.parse(window.localStorage.getItem('trades') || '[]');
            const filteredTrades = existingTrades.filter(trade => trade.id !== id);
            window.localStorage.setItem('trades', JSON.stringify(filteredTrades));
          }
        } catch (e) {
          console.warn('Failed to delete trade from localStorage', e);
        }
        return { success: true };
      }
    },
    TradePlan: {
      filter: async (filters) => {
        // Return mock trade plans
        return [
          {
            id: 1,
            symbol: 'MSFT',
            direction: 'long',
            entry_price: 380.00,
            stop_loss: 375.00,
            target_1: 390.00,
            target_2: 400.00,
            target_3: 410.00,
            position_size: 50,
            risk_amount: 250.00,
            setup_type: 'consolidation_breakout',
            timeframe: 'daily',
            notes: 'Earnings beat expectations',
            status: 'planned',
            strategy_preset_id: '1'
          },
          {
            id: 2,
            symbol: 'META',
            direction: 'short',
            entry_price: 485.00,
            stop_loss: 490.00,
            target_1: 475.00,
            target_2: 465.00,
            target_3: 455.00,
            position_size: 30,
            risk_amount: 150.00,
            setup_type: 'resistance_test',
            timeframe: '4h',
            notes: 'Key resistance level',
            status: 'planned',
            strategy_preset_id: '2'
          }
        ];
      }
    },
    Settings: {
      list: async () => {
        // Try to load from localStorage first so settings persist for the user
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem('userSettings');
            if (raw) {
              const parsed = JSON.parse(raw);
              return [parsed];
            }
          }
        } catch (e) {
          console.warn('Failed to read userSettings from localStorage', e);
        }

        // Fallback default settings
        const defaults = {
          id: 1,
          account_size: 50000,
          default_risk_percent: 1,
          position_sizing_percent: 1,
          default_stop_loss_percent: 4,
          target_profit_dollars: 500,
          // Float categories settings
          float_categories: {
            micro: { 
              min: 0, 
              max: 20000000, 
              label: 'Micro', 
              color: 'text-red-400', 
              positionMultiplier: 0.3, 
              stopLossPercent: 3.0, 
              maxFloatPercent: 0.1 
            },
            small: { 
              min: 20000000, 
              max: 50000000, 
              label: 'Small', 
              color: 'text-orange-400', 
              positionMultiplier: 0.5, 
              stopLossPercent: 3.5, 
              maxFloatPercent: 0.25 
            },
            medium: { 
              min: 50000000, 
              max: 200000000, 
              label: 'Medium', 
              color: 'text-yellow-400', 
              positionMultiplier: 0.8, 
              stopLossPercent: 4.0, 
              maxFloatPercent: 0.5 
            },
            large: { 
              min: 200000000, 
              max: 1000000000, 
              label: 'Large', 
              color: 'text-blue-400', 
              positionMultiplier: 1.2, 
              stopLossPercent: 5.0, 
              maxFloatPercent: 0.75 
            },
            mega: { 
              min: 1000000000, 
              max: Infinity, 
              label: 'Mega', 
              color: 'text-emerald-400', 
              positionMultiplier: 1.5, 
              stopLossPercent: 6.0, 
              maxFloatPercent: 1.0 
            }
          },
          // Float R:R ratios (keeping existing for backward compatibility)
          float_10m_min_r: 4,
          float_10m_max_r: 7,
          float_10_50m_min_r: 3,
          float_10_50m_max_r: 5,
          float_50_200m_min_r: 2,
          float_50_200m_max_r: 3,
          float_200m_min_r: 1,
          float_200m_max_r: 2,
          created_at: new Date().toISOString()
        };

        return [defaults];
      },
      create: async (data) => {
        // Persist to localStorage so the UI can see the saved values
        const record = { id: Date.now(), ...data };
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('userSettings', JSON.stringify(record));
          }
        } catch (e) {
          console.warn('Failed to write userSettings to localStorage', e);
        }
        return record;
      },
      update: async (id, data) => {
        const record = { id, ...data };
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('userSettings', JSON.stringify(record));
          }
        } catch (e) {
          console.warn('Failed to write userSettings to localStorage', e);
        }
        return record;
      }
    },
    WatchlistItem: {
      list: async () => {
        // Return mock watchlist items
        return [
          {
            id: 1,
            symbol: 'AAPL',
            notes: 'Strong earnings, potential breakout',
            catalyst: 'Q4 earnings beat',
            premarket_high: 152.50,
            premarket_low: 149.80,
            premarket_volume: 2500000,
            float_size: 'large',
            sector: 'Technology',
            priority: 'high',
            status: 'ready'
          },
          {
            id: 2,
            symbol: 'TSLA',
            notes: 'Model 3 production increase',
            catalyst: 'Production announcement',
            premarket_high: 248.20,
            premarket_low: 244.60,
            premarket_volume: 1800000,
            float_size: 'mid',
            sector: 'Automotive',
            priority: 'medium',
            status: 'ready'
          },
          {
            id: 3,
            symbol: 'NVDA',
            notes: 'AI chip demand surge',
            catalyst: 'Data center expansion',
            premarket_high: 485.20,
            premarket_low: 480.60,
            premarket_volume: 3200000,
            float_size: 'large',
            sector: 'Technology',
            priority: 'high',
            status: 'ready'
          },
          {
            id: 4,
            symbol: 'AMD',
            notes: 'Competitive positioning',
            catalyst: 'New product launch',
            premarket_high: 125.80,
            premarket_low: 123.40,
            premarket_volume: 1500000,
            float_size: 'mid',
            sector: 'Technology',
            priority: 'medium',
            status: 'watching'
          }
        ];
      },
      filter: async (filters) => {
        // Return mock watchlist items (for backward compatibility)
        return [
          {
            id: 1,
            symbol: 'AAPL',
            notes: 'Strong earnings, potential breakout',
            catalyst: 'Q4 earnings beat',
            premarket_high: 152.50,
            premarket_low: 149.80,
            premarket_volume: 2500000,
            float_size: 'large',
            sector: 'Technology',
            priority: 'high',
            status: 'ready'
          },
          {
            id: 2,
            symbol: 'TSLA',
            notes: 'Model 3 production increase',
            catalyst: 'Production announcement',
            premarket_high: 248.20,
            premarket_low: 244.60,
            premarket_volume: 1800000,
            float_size: 'mid',
            sector: 'Automotive',
            priority: 'medium',
            status: 'ready'
          }
        ];
      }
    },
    StrategyPreset: {
      list: async () => {
        // Return mock strategy presets
        return [
          {
            id: 1,
            name: 'Momentum Scalping',
            description: 'Quick trades on strong momentum moves',
            max_risk_per_trade: 0.5,
            max_daily_loss: 500,
            max_positions: 3,
            default_risk_reward: 2,
            entry_rules: ['Wait for confirmation', 'Check volume', 'Verify trend direction'],
            exit_rules: ['Scale out at targets', 'Trail stop at breakeven'],
            is_active: true
          },
          {
            id: 2,
            name: 'Breakout Trading',
            description: 'Trade breakouts from consolidation patterns',
            max_risk_per_trade: 1.0,
            max_daily_loss: 1000,
            max_positions: 2,
            default_risk_reward: 2.5,
            entry_rules: ['Identify consolidation', 'Wait for breakout volume', 'Enter on confirmation'],
            exit_rules: ['Take partial profits at 1R', 'Move stop to breakeven', 'Let winners run'],
            is_active: false
          }
        ];
      },
      create: async (data) => {
        // Mock create
        return { id: Date.now(), ...data };
      },
      update: async (id, data) => {
        // Mock update
        return { id, ...data };
      },
      delete: async (id) => {
        // Mock delete
        return { success: true };
      }
    }
  }
};

// Mock data generator for development
export const generateMockTrades = (count = 20) => {
  const symbols = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'NFLX'];
  const setups = ['Breakout', 'Pullback', 'Reversal', 'Continuation', 'Range'];
  const emotions = ['confident', 'disciplined', 'neutral', 'nervous'];
  
  return Array.from({ length: count }, (_, i) => {
    const isLong = Math.random() > 0.5;
    const entryPrice = Math.random() * 500 + 100;
    const exitPrice = entryPrice + (Math.random() * 50 - 25) * (isLong ? 1 : -1);
    const positionSize = Math.floor(Math.random() * 100) + 10;
    const pnl = (exitPrice - entryPrice) * positionSize * (isLong ? 1 : -1);
    const rMultiple = pnl > 0 ? Math.random() * 3 + 0.5 : -(Math.random() * 2);
    
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - Math.floor(Math.random() * 30));
    entryDate.setHours(9 + Math.floor(Math.random() * 7));
    
    const exitDate = new Date(entryDate);
    exitDate.setHours(exitDate.getHours() + Math.random() * 4);
    
    return {
      id: `trade-${i}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      direction: isLong ? 'long' : 'short',
      entry_price: parseFloat(entryPrice.toFixed(2)),
      exit_price: parseFloat(exitPrice.toFixed(2)),
      position_size: positionSize,
      pnl: parseFloat(pnl.toFixed(2)),
      r_multiple: parseFloat(rMultiple.toFixed(1)),
      setup_type: setups[Math.floor(Math.random() * setups.length)],
      notes: `Trade ${i + 1} notes...`,
      emotions: emotions[Math.floor(Math.random() * emotions.length)],
      followed_plan: Math.random() > 0.3,
      mistakes: Math.random() > 0.7 ? ['Overtrading', 'No stop loss'] : [],
      lessons: Math.random() > 0.5 ? 'Always set stop loss before entry' : '',
      screenshots: Math.random() > 0.8 ? ['https://example.com/screenshot.png'] : [],
      entry_time: entryDate.toISOString(),
      exit_time: exitDate.toISOString(),
      created_date: entryDate.toISOString(),
      user_id: 'user-123',
    };
  });
};

export { base44 };
