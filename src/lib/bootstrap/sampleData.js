/**
 * @file src/lib/bootstrap/sampleData.js
 *
 * Sample data loader for development.
 */

import { db } from '../db/index.js';
import { createTradeService } from '../services/TradeService.js';

export async function loadSampleData() {
  const tradeService = createTradeService(db);
  
  const sampleTrades = [
    {
      symbol: 'AAPL',
      entry_price: 150.25,
      exit_price: 152.80,
      quantity: 100,
      entry_time: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
      exit_time: new Date(Date.now() - 86400000 * 5).toISOString(),
      direction: 'long',
      setup_type: 'breakout',
      emotions: ['confident', 'patient'],
      followed_plan: true,
      notes: 'Good breakout from consolidation',
      stop_loss: 148.50,
      target_price: 155.00
    },
    {
      symbol: 'TSLA',
      entry_price: 245.60,
      exit_price: 242.10,
      quantity: 50,
      entry_time: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
      exit_time: new Date(Date.now() - 86400000 * 3).toISOString(),
      direction: 'long',
      setup_type: 'support',
      emotions: ['hesitant', 'rushed'],
      followed_plan: false,
      notes: 'Exited too early, should have held',
      stop_loss: 242.00,
      target_price: 252.00
    }
  ];
  
  for (const trade of sampleTrades) {
    try {
      await tradeService.create(trade);
    } catch (error) {
      
    }
  }
}


