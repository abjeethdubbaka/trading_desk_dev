const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create database setup file
const dbSetup = `
-- Run this SQL in your Base44 database dashboard

-- 1. Create Trades table
CREATE TABLE IF NOT EXISTS Trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  direction VARCHAR(5) NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price DECIMAL(10,2) NOT NULL,
  exit_price DECIMAL(10,2),
  position_size INTEGER NOT NULL,
  pnl DECIMAL(10,2),
  r_multiple DECIMAL(5,2),
  setup_type VARCHAR(50),
  notes TEXT,
  emotions VARCHAR(20) CHECK (emotions IN ('confident', 'disciplined', 'neutral', 'nervous', 'fomo', 'revenge')),
  followed_plan BOOLEAN DEFAULT true,
  mistakes JSONB DEFAULT '[]',
  lessons TEXT,
  screenshots JSONB DEFAULT '[]',
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  created_date TIMESTAMP DEFAULT NOW(),
  updated_date TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR(255)
);

-- 2. Create StrategyPresets table
CREATE TABLE IF NOT EXISTS StrategyPresets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  risk_per_trade DECIMAL(5,2) DEFAULT 2.00,
  max_positions INTEGER DEFAULT 3,
  target_rr DECIMAL(5,2) DEFAULT 1.50,
  min_win_rate DECIMAL(5,2),
  max_daily_loss DECIMAL(10,2),
  setup_types JSONB DEFAULT '[]',
  time_frames JSONB DEFAULT '[]',
  symbols JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_date TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR(255)
);

-- 3. Create PerformanceMetrics table
CREATE TABLE IF NOT EXISTS PerformanceMetrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  total_trades INTEGER DEFAULT 0,
  profitable_trades INTEGER DEFAULT 0,
  total_pnl DECIMAL(15,2) DEFAULT 0,
  avg_pnl DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  largest_win DECIMAL(10,2) DEFAULT 0,
  largest_loss DECIMAL(10,2) DEFAULT 0,
  avg_r_multiple DECIMAL(5,2) DEFAULT 0,
  sharpe_ratio DECIMAL(10,4),
  max_drawdown DECIMAL(10,2),
  period VARCHAR(10) CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  created_date TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, user_id, period)
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON Trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON Trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_direction ON Trades(direction);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON Trades(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_user_date ON PerformanceMetrics(user_id, date);

-- 5. Insert sample strategy presets
INSERT INTO StrategyPresets (name, risk_per_trade, max_positions, target_rr, setup_types, active)
VALUES 
  ('Scalping Strategy', 1.00, 5, 1.00, '["Breakout", "Pullback"]', true),
  ('Swing Trading', 2.00, 3, 2.00, '["Reversal", "Continuation"]', true),
  ('Position Trading', 3.00, 2, 3.00, '["Trend Following", "Range"]', true)
ON CONFLICT DO NOTHING;

-- 6. Create triggers for automatic calculations
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

CREATE OR REPLACE FUNCTION update_performance_metrics()
RETURNS TRIGGER AS $$
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

console.log('Database setup SQL generated. Copy and run in Base44 dashboard.');

// Write setup file
fs.writeFileSync(path.join(__dirname, '../db-setup.sql'), dbSetup);

console.log('✅ Database setup file created: db-setup.sql');
console.log('✅ Base44 client configured');
console.log('✅ Frontend components ready');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Create .env.local with your BASE44_API_KEY');
console.log('3. Run the SQL from db-setup.sql in Base44 dashboard');
console.log('4. Start the app: npm run dev');
