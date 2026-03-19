import React from 'react';

const Execution = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Execution</h1>
        <p className="text-white/60">Execute trades and manage positions</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Trade</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 mb-2">Symbol</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
                placeholder="Enter symbol"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 mb-2">Quantity</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-white/60 mb-2">Order Type</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option>Market</option>
                  <option>Limit</option>
                  <option>Stop</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                Buy
              </button>
              <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                Sell
              </button>
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Active Positions</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80">AAPL Long</span>
              <span className="text-emerald-400">+$450</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">TSLA Short</span>
              <span className="text-red-400">-$120</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">MSFT Long</span>
              <span className="text-emerald-400">+$280</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Execution;
