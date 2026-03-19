import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Trash2, TrendingUp, TrendingDown, Calculator, X, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CalcHistory() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('calcHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading calc history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('calcHistory', JSON.stringify(history));
    }
  }, [history]);

  // Clear all history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calcHistory');
  };

  // Delete specific history item
  const deleteItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // Load history item into calculator
  const loadHistoryItem = (historyItem) => {
    // Navigate back to calculator with the history item data
    navigate(createPageUrl('Calculator'), { 
      state: { 
        historyItem: {
          symbol: historyItem.symbol,
          entryPrice: historyItem.entryPrice.toString(),
          direction: historyItem.direction
        }
      } 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'High': return 'bg-red-500/20 text-red-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  const getFloatCategoryColor = (category) => {
    switch (category) {
      case 'micro': return 'bg-red-500/20 text-red-400';
      case 'small': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'large': return 'bg-blue-500/20 text-blue-400';
      case 'mega': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(createPageUrl('Calculator'))}
              variant="ghost"
              className="text-white/60 hover:text-white/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Calculator
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <History className="w-6 h-6 text-blue-400" />
                Calculation History
              </h1>
              <p className="text-white/60 mt-1">
                Review and reload your previous calculations
              </p>
            </div>
          </div>
          
          {history.length > 0 && (
            <Button
              onClick={clearHistory}
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* History Content */}
        {history.length === 0 ? (
          <Card className="bg-[#1a1a24] border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calculator className="w-16 h-16 text-white/20 mb-4" />
              <h3 className="text-xl font-semibold text-white/40 mb-2">
                No calculation history yet
              </h3>
              <p className="text-white/40 mb-6">
                Complete a calculation in the calculator to see it here
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Calculator'))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Calculator
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-[#1a1a24] border-white/10">
                <CardContent className="p-4">
                  <p className="text-white/60 text-sm">Total Calculations</p>
                  <p className="text-2xl font-bold text-white">{history.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a24] border-white/10">
                <CardContent className="p-4">
                  <p className="text-white/60 text-sm">Total Risk</p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(history.reduce((sum, item) => sum + item.actualRisk, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a24] border-white/10">
                <CardContent className="p-4">
                  <p className="text-white/60 text-sm">Total Profit Potential</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(history.reduce((sum, item) => sum + item.potentialProfit, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a24] border-white/10">
                <CardContent className="p-4">
                  <p className="text-white/60 text-sm">Float Analysis</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {history.filter(item => item.useIntelligentFlow).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* History Items */}
            <div className="space-y-3">
              {history.map((item) => (
                <Card 
                  key={item.id} 
                  className="bg-[#1a1a24] border-white/10 hover:bg-[#1a1a24]/80 transition-colors cursor-pointer"
                  onClick={() => loadHistoryItem(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                            {item.symbol}
                            {item.direction === 'short' ? (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            )}
                          </h3>
                          <Badge className={getRiskLevelColor(item.riskLevel)}>
                            {item.riskLevel}
                          </Badge>
                          {item.useIntelligentFlow && item.floatCategory && typeof item.floatCategory === 'string' && (
                            <Badge className={getFloatCategoryColor(item.floatCategory)}>
                              {item.floatCategory.charAt(0).toUpperCase() + item.floatCategory.slice(1)} Float
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-white/40">Entry Price</p>
                            <p className="text-white font-medium">{formatCurrency(item.entryPrice)}</p>
                          </div>
                          <div>
                            <p className="text-white/40">Shares</p>
                            <p className="text-white font-medium">{item.shares.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-white/40">Position Value</p>
                            <p className="text-white font-medium">{formatCurrency(item.positionValue)}</p>
                          </div>
                          <div>
                            <p className="text-white/40">Risk Amount</p>
                            <p className="text-red-400 font-medium">{formatCurrency(item.actualRisk)}</p>
                          </div>
                          <div>
                            <p className="text-white/40">Profit Potential</p>
                            <p className="text-emerald-400 font-medium">{formatCurrency(item.potentialProfit)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-white/40">
                          <span>{formatDate(item.timestamp)}</span>
                          <div className="flex items-center gap-4">
                            <span>Stop Loss: {formatCurrency(item.stopLossPrice)}</span>
                            <span>Target: {formatCurrency(item.targetPrice)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
