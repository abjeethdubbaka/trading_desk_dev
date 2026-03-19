import React, { createContext, useContext, useState, useMemo } from 'react';

const TradingContext = createContext(null);

export const useTradingContext = () => {
  const ctx = useContext(TradingContext);
  if (!ctx) {
    throw new Error('useTradingContext must be used within TradingProvider');
  }
  return ctx;
};

export const TradingProvider = ({ children }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedEntryPrice, setSelectedEntryPrice] = useState(null);
  const [selectedTradeId, setSelectedTradeId] = useState(null);

  const value = useMemo(
    () => ({
      selectedSymbol,
      selectedEntryPrice,
      selectedTradeId,
      setSelectedFromTrade: (trade) => {
        if (!trade) {
          setSelectedSymbol('');
          setSelectedEntryPrice(null);
          setSelectedTradeId(null);
          return;
        }
        setSelectedSymbol(trade.symbol || '');
        setSelectedEntryPrice(trade.entry_price ?? null);
        setSelectedTradeId(trade.id ?? null);
      },
      clearSelection: () => {
        setSelectedSymbol('');
        setSelectedEntryPrice(null);
        setSelectedTradeId(null);
      },
    }),
    [selectedSymbol, selectedEntryPrice, selectedTradeId],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};

