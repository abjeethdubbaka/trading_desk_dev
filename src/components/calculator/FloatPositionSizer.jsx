import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTradingContext } from '@/lib/TradingContext';

// Import modular components from float-position-sizer folder
import FloatInputForm from './input/FloatInputForm';
import ResultsDisplay from './results/ResultsDisplay';
import FloatInfoBox from './input/FloatInfoBox';
import useFloatPositionSizer from "./float-position-sizer/useFloatPositionSizer";
import { TradeCreator } from "./float-position-sizer/TradeCreator";

export default function FloatPositionSizer({ historyData }) {
  const { selectedSymbol, selectedEntryPrice } = useTradingContext();

  const {
    // State
    symbol,
    setSymbol,
    entryPrice,
    setEntryPrice,
    direction,
    setDirection,
    customStopLossPrice,
    setCustomStopLossPrice,
    loading,
    shareFloat,
    floatCategory,
    calculation,
    floatData,
    
    // Actions
    fetchShareFloat,
    calculatePosition,
  } = useFloatPositionSizer({
    selectedSymbol,
    selectedEntryPrice
  });

  // Sync local state from shared trading context when selection changes
  React.useEffect(() => {
    if (setSymbol && setEntryPrice) {
      if (selectedSymbol) {
        setSymbol(selectedSymbol.toUpperCase());
      }
      if (selectedEntryPrice) {
        setEntryPrice(selectedEntryPrice.toString());
      }
    }
  }, [selectedSymbol, selectedEntryPrice, setSymbol, setEntryPrice]);

  // Load history data when provided (from CalcHistory navigation)
  React.useEffect(() => {
    if (historyData && setSymbol && setEntryPrice && setDirection) {
      try {
        console.log('Loading history data into calculator:', historyData);
        setSymbol(historyData.symbol);
        setEntryPrice(historyData.entryPrice);
        setDirection(historyData.direction);
        
        toast.success(`Loaded calculation for ${historyData.symbol} from history`);
      } catch (error) {
        console.error('Error loading history data:', error);
      }
    }
  }, [historyData, setSymbol, setEntryPrice, setDirection]);

  const handleAddToJournal = async () => {
    if (!entryPrice) {
      toast.error('Please enter entry price to create a trade');
      return;
    }

    const normalizedSymbol = symbol?.trim() ? symbol.trim() : 'N?N';

    try {
      const tradeData = await TradeCreator.createTrade({
        symbol: normalizedSymbol,
        entryPrice,
        direction,
        calculation,
        shares: calculation?.shares,
        floatData,
        floatCategory
      });

      const response = await TradeCreator.saveTrade(tradeData);

      if (response) {
        toast.success(`Comprehensive trade created for ${normalizedSymbol.toUpperCase()} at $${entryPrice}`);
        
        // Trigger refresh event
        window.dispatchEvent(new CustomEvent('tradeCreated', { 
          detail: { trade: response }
        }));
      }
    } catch (error) {
      console.error('Error in handleAddToJournal:', error);
      toast.error('Failed to create trade. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Form */}
      <Card className="bg-[#1a1a24] border-white/10">
        <CardContent className="space-y-6">
          <FloatInputForm
            symbol={symbol}
            setSymbol={setSymbol}
            entryPrice={entryPrice}
            setEntryPrice={setEntryPrice}
            customStopLossPrice={customStopLossPrice}
            setCustomStopLossPrice={setCustomStopLossPrice}
            direction={direction}
            setDirection={setDirection}
            loading={loading}
            fetchShareFloat={fetchShareFloat}
            onCalculate={calculatePosition}
          />
        </CardContent>
      </Card>

      {/* Float Information */}
      {shareFloat && floatData && (
        <FloatInfoBox
          shareFloat={shareFloat}
          floatData={floatData}
          floatCategory={floatCategory}
        />
      )}

      {/* Calculation Results */}
      <ResultsDisplay
        key={`calc-${calculation?.calculatedAt || Date.now()}`}
        calculation={calculation}
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button
          onClick={handleAddToJournal}
          disabled={!entryPrice || !calculation}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to Journal
        </Button>
      </div>
    </div>
  );
}
