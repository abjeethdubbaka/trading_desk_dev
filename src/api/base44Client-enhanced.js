// Base44 API Client with enhanced functionality
class Base44Client {
  constructor() {
    this.baseUrl = 'https://api.base44.com/v1';
    this.apiKey = process.env.NEXT_PUBLIC_BASE44_API_KEY;
  }

  // Helper method for API calls
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Database operations for Trades table
  database = {
    Trades: {
      findMany: async (query = {}) => {
        try {
          const response = await this.request('/database/trades/query', {
            method: 'POST',
            body: JSON.stringify(query),
          });
          return response;
        } catch (error) {
          console.error('Error fetching trades:', error);
          return { data: [], error: error.message };
        }
      },

      create: async (tradeData) => {
        try {
          const response = await this.request('/database/trades', {
            method: 'POST',
            body: JSON.stringify({
              ...tradeData,
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
            }),
          });
          return response;
        } catch (error) {
          console.error('Error creating trade:', error);
          return { error: error.message };
        }
      },

      update: async (id, tradeData) => {
        try {
          const response = await this.request(`/database/trades/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              ...tradeData,
              updated_date: new Date().toISOString(),
            }),
          });
          return response;
        } catch (error) {
          console.error('Error updating trade:', error);
          return { error: error.message };
        }
      },

      delete: async (id) => {
        try {
          const response = await this.request(`/database/trades/${id}`, {
            method: 'DELETE',
          });
          return response;
        } catch (error) {
          console.error('Error deleting trade:', error);
          return { error: error.message };
        }
      },

      // Aggregated queries for statistics
      getStats: async (userId, timeRange = 'all') => {
        try {
          const response = await this.request('/database/trades/stats', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, time_range: timeRange }),
          });
          return response;
        } catch (error) {
          console.error('Error fetching stats:', error);
          return { error: error.message };
        }
      },

      // Get trades for heatmap
      getHeatmapData: async (userId) => {
        try {
          const response = await this.request('/database/trades/heatmap', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
          });
          return response;
        } catch (error) {
          console.error('Error fetching heatmap data:', error);
          return { error: error.message };
        }
      },
    },

    StrategyPresets: {
      findMany: async (query = {}) => {
        try {
          const response = await this.request('/database/strategy_presets/query', {
            method: 'POST',
            body: JSON.stringify(query),
          });
          return response;
        } catch (error) {
          console.error('Error fetching presets:', error);
          return { data: [], error: error.message };
        }
      },

      create: async (presetData) => {
        try {
          const response = await this.request('/database/strategy_presets', {
            method: 'POST',
            body: JSON.stringify(presetData),
          });
          return response;
        } catch (error) {
          console.error('Error creating preset:', error);
          return { error: error.message };
        }
      },

      update: async (id, presetData) => {
        try {
          const response = await this.request(`/database/strategy_presets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(presetData),
          });
          return response;
        } catch (error) {
          console.error('Error updating preset:', error);
          return { error: error.message };
        }
      },
    },

    PerformanceMetrics: {
      getOrCalculate: async (userId, period = 'daily') => {
        try {
          const response = await this.request('/database/performance_metrics', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, period }),
          });
          return response;
        } catch (error) {
          console.error('Error fetching performance metrics:', error);
          return { error: error.message };
        }
      },
    },
  };

  // File upload integration
  integrations = {
    Core: {
      UploadFile: async ({ file, type = 'screenshot' }) => {
        try {
          console.log('Starting upload:', { fileName: file.name, fileType: file.type, fileSize: file.size, type });
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', type);

          console.log('Making request to:', `${this.baseUrl}/integrations/core/upload`);
          
          const response = await fetch(`${this.baseUrl}/integrations/core/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: formData,
          });

          console.log('Upload response status:', response.status, response.statusText);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload failed with response:', errorText);
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Upload successful response:', data);
          return { file_url: data.url, file_id: data.id };
        } catch (error) {
          console.error('Error uploading file:', error);
          console.log('Using fallback: creating object URL for local preview');
          
          // Fallback to local URL for development/offline use
          try {
            const fallbackUrl = URL.createObjectURL(file);
            console.log('Created fallback URL:', fallbackUrl);
            return { file_url: fallbackUrl, file_id: `local-${Date.now()}` };
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw new Error('Upload failed and fallback also failed');
          }
        }
      },

      InvokeLLM: async ({ prompt, response_json_schema }) => {
        try {
          const response = await this.request('/integrations/core/llm', {
            method: 'POST',
            body: JSON.stringify({
              prompt,
              response_json_schema,
              model: 'gpt-4',
              temperature: 0.3,
            }),
          });
          return response.data;
        } catch (error) {
          console.error('Error invoking LLM:', error);
          // Return mock data for development
          return {
            patterns: {
              best_setups: ['Breakout', 'Pullback'],
              worst_setups: ['FOMO Entries'],
              emotional_insights: 'You perform better when following your plan.'
            },
            strategy_recommendations: {
              suggested_risk_per_trade: 1.5,
              suggested_max_positions: 2,
              suggested_risk_reward: 2.0,
              reasoning: 'Based on your current win rate of 55%'
            },
            risk_warnings: [
              {
                warning: 'High emotional trading on Fridays',
                severity: 'medium',
                recommendation: 'Consider reducing position size on Friday trades'
              }
            ],
            top_recommendations: [
              'Focus on breakout setups which have 65% success rate',
              'Reduce position size when trading nervous',
              'Always set stop-loss before entering a trade'
            ]
          };
        }
      },
    },
  };

  // Real-time subscriptions
  subscribeToTrades(userId, callback) {
    // Implement WebSocket or SSE for real-time updates
    console.log('Subscribing to trades for user:', userId);
    // Return unsubscribe function
    return () => console.log('Unsubscribed from trades');
  }
}

// Create singleton instance
export const base44 = new Base44Client();

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

// SQL trigger for automatic P&L calculation
export const tradePnLTrigger = `
CREATE OR REPLACE FUNCTION calculate_trade_pnl()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entry_price IS NOT NULL AND NEW.exit_price IS NOT NULL AND NEW.position_size IS NOT NULL THEN
    IF NEW.direction = 'long' THEN
      NEW.pnl = (NEW.exit_price - NEW.entry_price) * NEW.position_size;
    ELSE
      NEW.pnl = (NEW.entry_price - NEW.exit_price) * NEW.position_size;
    END IF;
  END IF;
  
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trade_pnl_calculation
BEFORE INSERT OR UPDATE ON Trades
FOR EACH ROW
EXECUTE FUNCTION calculate_trade_pnl();
`;

// SQL trigger for automatic performance metrics calculation
export const performanceMetricsTrigger = `
CREATE OR REPLACE FUNCTION update_performance_metrics()
RETURNS TRIGGER AS $$
DECLARE
  metrics_record RECORD;
BEGIN
  -- Calculate daily metrics
  INSERT INTO PerformanceMetrics (
    date, user_id, total_trades, profitable_trades,
    total_pnl, avg_pnl, win_rate, largest_win,
    largest_loss, avg_r_multiple, period
  )
  SELECT
    DATE(NEW.entry_time),
    NEW.user_id,
    COUNT(*),
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END),
    SUM(pnl),
    AVG(pnl),
    (SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)),
    MAX(CASE WHEN pnl > 0 THEN pnl ELSE 0 END),
    MIN(CASE WHEN pnl < 0 THEN pnl ELSE 0 END),
    AVG(r_multiple),
    'daily'
  FROM Trades
  WHERE user_id = NEW.user_id
    AND DATE(entry_time) = DATE(NEW.entry_time)
  GROUP BY DATE(entry_time), user_id
  ON CONFLICT (date, user_id, period) 
  DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    profitable_trades = EXCLUDED.profitable_trades,
    total_pnl = EXCLUDED.total_pnl,
    avg_pnl = EXCLUDED.avg_pnl,
    win_rate = EXCLUDED.win_rate,
    largest_win = EXCLUDED.largest_win,
    largest_loss = EXCLUDED.largest_loss,
    avg_r_multiple = EXCLUDED.avg_r_multiple,
    created_date = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metrics_trigger
AFTER INSERT OR UPDATE ON Trades
FOR EACH ROW
EXECUTE FUNCTION update_performance_metrics();
`;
