// Copy and paste this script into the browser console when the journal is open
// This will add 100 simulated trades to test the functionality

function addSimulatedTrades() {
    const trades = [];
    const setupTypes = ['Breakout', 'Pullback', 'Reversal', 'Momentum', 'Scalp', 'Swing', 'Position', 'News'];
    const directions = ['long', 'short'];
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'];
    
    const now = new Date();
    
    for (let i = 0; i < 100; i++) {
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
    
    // Get existing trades
    const existingTrades = JSON.parse(localStorage.getItem('trades') || '[]');
    const allTrades = [...existingTrades, ...trades];
    
    // Save to localStorage
    localStorage.setItem('trades', JSON.stringify(allTrades));
    
    console.log(`Added ${trades.length} simulated trades! Total trades: ${allTrades.length}`);
    
    // Calculate stats
    const totalPnL = allTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winners = allTrades.filter(trade => trade.pnl > 0);
    const losers = allTrades.filter(trade => trade.pnl < 0);
    const winRate = (winners.length / allTrades.length) * 100;
    
    console.log('Trade Statistics:');
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
}

// Run the function
addSimulatedTrades();
