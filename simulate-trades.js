// Trade Simulation Script
// Run this in the browser console to populate the journal with 100 sample trades

function generateSimulatedTrades() {
  const trades = [];
  const setupTypes = ['Breakout', 'Pullback', 'Reversal', 'Momentum', 'Scalp', 'Swing', 'Position', 'News'];
  const directions = ['long', 'short'];
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'];
  
  const now = new Date();
  
  for (let i = 0; i < 100; i++) {
    // Generate random trade data
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const setupType = setupTypes[Math.floor(Math.random() * setupTypes.length)];
    
    // Random prices (realistic ranges)
    const entryPrice = Math.random() * 500 + 50; // $50 - $550
    const priceMovement = (Math.random() - 0.5) * 20; // -10 to +10
    const exitPrice = Math.max(entryPrice + priceMovement, 1);
    
    // Position size
    const positionSize = Math.floor(Math.random() * 1000) + 100; // 100 - 1100 shares
    
    // Calculate P&L
    const grossPnL = direction === 'long' 
      ? (exitPrice - entryPrice) * positionSize 
      : (entryPrice - exitPrice) * positionSize;
    
    // Add some fees
    const fee = positionSize * 0.01; // $0.01 per share
    const netPnL = grossPnL - fee;
    
    // Calculate R-multiple
    const stopLoss = Math.abs(entryPrice - exitPrice) * 0.5; // Assume 50% of price movement as stop
    const rMultiple = positionSize > 0 && stopLoss > 0 ? (netPnL / (stopLoss * positionSize)) : 0;
    
    // Random date within last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const tradeDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    // Random entry and exit times
    const entryTime = new Date(tradeDate.getTime() + Math.random() * 8 * 60 * 60 * 1000); // Within 8 hours
    const exitTime = new Date(entryTime.getTime() + Math.random() * 4 * 60 * 60 * 1000); // Exit within 4 hours
    
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
}

// Function to clear existing trades and add simulated ones
function populateJournalWithSimulatedTrades() {
  try {
    // Clear existing trades
    localStorage.removeItem('trades');
    
    // Generate new trades
    const simulatedTrades = generateSimulatedTrades();
    
    // Save to localStorage
    localStorage.setItem('trades', JSON.stringify(simulatedTrades));
    
    console.log(`Successfully added ${simulatedTrades.length} simulated trades to the journal!`);
    console.log('Trade summary:');
    
    // Calculate some stats
    const totalPnL = simulatedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winners = simulatedTrades.filter(trade => trade.pnl > 0);
    const losers = simulatedTrades.filter(trade => trade.pnl < 0);
    const winRate = (winners.length / simulatedTrades.length) * 100;
    
    console.log(`Total P&L: $${totalPnL.toFixed(2)}`);
    console.log(`Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`Winners: ${winners.length}, Losers: ${losers.length}`);
    console.log(`Average Win: $${(winners.reduce((sum, t) => sum + t.pnl, 0) / winners.length).toFixed(2)}`);
    console.log(`Average Loss: $${(losers.reduce((sum, t) => sum + t.pnl, 0) / losers.length).toFixed(2)}`);
    
    // Refresh the page to see the trades
    console.log('Refreshing page to display trades...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('Error populating journal:', error);
  }
}

// Auto-run if this script is loaded
if (typeof window !== 'undefined') {
  populateJournalWithSimulatedTrades();
}
