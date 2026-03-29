import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Play, 
  Trash2, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  RefreshCw
} from 'lucide-react';

const TradeSimulator = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const generateSimulatedTrades = (count) => {
    const trades = [];
    const setupTypes = ['Breakout', 'Pullback', 'Reversal', 'Momentum', 'Scalp', 'Swing', 'Position', 'News'];
    const directions = ['long', 'short'];
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'];
    
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const setupType = setupTypes[Math.floor(Math.random() * setupTypes.length)];
      
      const entryPrice = Math.random() * 500 + 50;
      const priceMovement = (Math.random() - 0.5) * 20;
      const exitPrice = Math.max(entryPrice + priceMovement, 1);
      
      const positionSize = Math.floor(Math.random() * 1000) + 100;
      
      const grossPnL = direction === 'long' 
        ? (exitPrice - entryPrice) * positionSize 
        : (entryPrice - exitPrice) * positionSize;
      
      const fee = positionSize * 0.01;
      const netPnL = grossPnL - fee;
      
      const stopLoss = Math.abs(entryPrice - exitPrice) * 0.5;
      const rMultiple = positionSize > 0 && stopLoss > 0 ? (netPnL / (stopLoss * positionSize)) : 0;
      
      const daysAgo = Math.floor(Math.random() * 90);
      const tradeDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      const entryTime = new Date(tradeDate.getTime() + Math.random() * 8 * 60 * 60 * 1000);
      const exitTime = new Date(entryTime.getTime() + Math.random() * 4 * 60 * 60 * 1000);
      
      const trade = {
        id: Date.now() + i,
        symbol: symbol,
        direction: direction,
        setup_type: setupType,
        entry_price: parseFloat(entryPrice.toFixed(2)),
        exit_price: parseFloat(exitPrice.toFixed(2)),
        position_size: positionSize,
        pnl: parseFloat(netPnL.toFixed(2)),
        r_multiple: parseFloat(rMultiple.toFixed(2)),
        fee: parseFloat(fee.toFixed(2)),
        stop_loss: parseFloat(stopLoss.toFixed(2)),
        entry_time: entryTime.toISOString(),
        exit_time: exitTime.toISOString(),
        notes: `Simulated trade #${i + 1} - ${setupType} setup`,
        tags: [setupType.toLowerCase(), direction],
        created_at: tradeDate.toISOString(),
        updated_at: tradeDate.toISOString()
      };
      
      trades.push(trade);
    }
    
    return trades;
  };

  const addTradesToJournal = (count) => {
    setIsSimulating(true);
    
    try {
      // Get existing trades
      const existingTrades = JSON.parse(localStorage.getItem('trades') || '[]');
      const newTrades = generateSimulatedTrades(count);
      const allTrades = [...existingTrades, ...newTrades];
      
      // Save to localStorage
      localStorage.setItem('trades', JSON.stringify(allTrades));
      
      // Calculate stats
      const totalPnL = allTrades.reduce((sum, trade) => sum + trade.pnl, 0);
      const winners = allTrades.filter(trade => trade.pnl > 0);
      const losers = allTrades.filter(trade => trade.pnl < 0);
      const winRate = (winners.length / allTrades.length) * 100;
      
      setSimulationResult({
        added: count,
        total: allTrades.length,
        totalPnL,
        winRate,
        winners: winners.length,
        losers: losers.length,
        avgWin: winners.length > 0 ? winners.reduce((sum, t) => sum + t.pnl, 0) / winners.length : 0,
        avgLoss: losers.length > 0 ? losers.reduce((sum, t) => sum + t.pnl, 0) / losers.length : 0
      });
      
      // Trigger a refresh of the journal data
      window.dispatchEvent(new Event('storage'));
      // Also trigger a custom event for React Query
      window.dispatchEvent(new CustomEvent('trades-updated', { detail: allTrades }));
      
    } catch (error) {
      
      setSimulationResult({
        error: error.message
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const clearAllTrades = () => {
    try {
      localStorage.removeItem('trades');
      setSimulationResult({
        cleared: true,
        total: 0
      });
      
      // Trigger a refresh
      window.dispatchEvent(new Event('storage'));
      // Also trigger a custom event for React Query
      window.dispatchEvent(new CustomEvent('trades-updated', { detail: [] }));
      
    } catch (error) {
      
      setSimulationResult({
        error: error.message
      });
    }
  };

  const getCurrentTradeCount = () => {
    try {
      const trades = JSON.parse(localStorage.getItem('trades') || '[]');
      return trades.length;
    } catch {
      return 0;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Trade Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Generate realistic sample trades to test the journal functionality.
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => addTradesToJournal(25)}
            disabled={isSimulating}
            variant="outline"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Add 25 Trades
          </Button>
          
          <Button 
            onClick={() => addTradesToJournal(50)}
            disabled={isSimulating}
            variant="outline"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Add 50 Trades
          </Button>
          
          <Button 
            onClick={() => addTradesToJournal(100)}
            disabled={isSimulating}
            variant="default"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Add 100 Trades
          </Button>
          
          <Button 
            onClick={clearAllTrades}
            disabled={isSimulating}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <BarChart3 className="w-4 h-4" />
          Current trades: <Badge variant="secondary">{getCurrentTradeCount()}</Badge>
        </div>

        {isSimulating && (
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Simulating trades...
          </div>
        )}

        {simulationResult && !simulationResult.error && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h4 className="font-medium">Simulation Results:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Trades Added:</span>
                <div className="font-medium">{simulationResult.added || simulationResult.cleared ? 'All cleared' : 'N/A'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Trades:</span>
                <div className="font-medium">{simulationResult.total || 0}</div>
              </div>
              {simulationResult.totalPnL !== undefined && (
                <>
                  <div>
                    <span className="text-muted-foreground">Total P&L:</span>
                    <div className={`font-medium flex items-center gap-1 ${
                      simulationResult.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {simulationResult.totalPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      ${simulationResult.totalPnL.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Win Rate:</span>
                    <div className="font-medium">{simulationResult.winRate?.toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Winners:</span>
                    <div className="font-medium">{simulationResult.winners}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Losers:</span>
                    <div className="font-medium">{simulationResult.losers}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {simulationResult?.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="text-sm text-destructive">Error: {simulationResult.error}</div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-4">
          <strong>Note:</strong> This simulator creates realistic trade data for testing purposes. 
          The trades include various symbols, setup types, and realistic P&L calculations.
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeSimulator;


