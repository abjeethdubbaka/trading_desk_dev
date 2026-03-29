import React from 'react';

const PlanBuilder = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Plan Builder</h1>
        <p className="text-white/60">Create and manage your trading strategies</p>
      </div>
      
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Create New Trading Plan</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 mb-2">Plan Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
              placeholder="Enter plan name"
            />
          </div>
          
          <div>
            <label className="block text-white/60 mb-2">Strategy Type</label>
            <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
              <option>Day Trading</option>
              <option>Swing Trading</option>
              <option>Position Trading</option>
            </select>
          </div>
          
          <div>
            <label className="block text-white/60 mb-2">Risk Tolerance</label>
            <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          
          <button className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanBuilder;


