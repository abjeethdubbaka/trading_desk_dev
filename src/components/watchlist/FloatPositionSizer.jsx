import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTradingContext } from '@/lib/TradingContext';
import FloatInputForm from '@/components/calculator/input/FloatInputForm';
import ResultsDisplay from '@/components/calculator/results/ResultsDisplay';
import FloatInfoBox from '@/components/calculator/input/FloatInfoBox';
import PriceLadder from '@/components/calculator/PriceLadder';
import EdgePanel from '@/components/calculator/EdgePanel';
import ScenarioTable from '@/components/calculator/ScenarioTable';
import PreTradeChecklist from '@/components/calculator/PreTradeChecklist';
import useFloatPositionSizer from '@/components/calculator/float-position-sizer/useFloatPositionSizer';
import { TradeCreator } from '@/components/calculator/float-position-sizer/TradeCreator';

export default function FloatPositionSizer({ historyData }) {
  const { selectedSymbol, selectedEntryPrice } = useTradingContext();
  const [checklistDone, setChecklistDone] = useState(false);
  const [showScenarios, setShowScenarios]  = useState(false);

  const {
    symbol, setSymbol, entryPrice, setEntryPrice,
    direction, setDirection, customStopLossPrice, setCustomStopLossPrice,
    loading, shareFloat, floatCategory, calculation, floatData,
    fetchShareFloat, calculatePosition,
  } = useFloatPositionSizer({ selectedSymbol, selectedEntryPrice });

  React.useEffect(()=>{
    if (selectedSymbol) setSymbol(selectedSymbol.toUpperCase());
    if (selectedEntryPrice) setEntryPrice(selectedEntryPrice.toString());
  },[selectedSymbol,selectedEntryPrice]);

  React.useEffect(()=>{
    if (!historyData||!setSymbol) return;
    setSymbol(historyData.symbol);
    setEntryPrice(historyData.entryPrice);
    setDirection(historyData.direction);
    toast.success(`Loaded ${historyData.symbol} from history`);
  },[historyData]);

  // Reset checklist whenever inputs change
  React.useEffect(()=>{ setChecklistDone(false); },[symbol,entryPrice,customStopLossPrice,direction]);

  const handleAddToJournal = async () => {
    if (!entryPrice) { toast.error('Enter entry price first'); return; }
    const sym = symbol?.trim()||'N/A';
    try {
      const tradeData = await TradeCreator.createTrade({
        symbol:sym, entryPrice, direction, calculation,
        shares:calculation?.shares, floatData, floatCategory,
      });
      await TradeCreator.saveTrade(tradeData);
      toast.success(`Trade created for ${sym.toUpperCase()} @ $${entryPrice}`);
      window.dispatchEvent(new CustomEvent('tradeCreated',{detail:{trade:tradeData}}));
      setChecklistDone(false); // reset for next trade
    } catch { toast.error('Failed to create trade. Try again.'); }
  };

  const hasCalc = !!calculation;
  const hasStop = !!customStopLossPrice;

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <Card className="bg-[#1a1a24] border-white/10">
        <CardContent className="space-y-6 pt-6">
          <FloatInputForm
            symbol={symbol} setSymbol={setSymbol}
            entryPrice={entryPrice} setEntryPrice={setEntryPrice}
            customStopLossPrice={customStopLossPrice} setCustomStopLossPrice={setCustomStopLossPrice}
            direction={direction} setDirection={setDirection}
            loading={loading} fetchShareFloat={fetchShareFloat} onCalculate={calculatePosition}
          />
        </CardContent>
      </Card>

      {/* Historical edge — shows when symbol is typed */}
      {symbol?.length>=1 && <EdgePanel symbol={symbol} setupType={null} />}

      {/* Float info */}
      {shareFloat&&floatData && <FloatInfoBox shareFloat={shareFloat} floatData={floatData} floatCategory={floatCategory} />}

      {/* Calculation results */}
      {hasCalc && <ResultsDisplay calculation={calculation} />}

      {/* Price ladder */}
      {hasCalc && <PriceLadder calculation={calculation} />}

      {/* Scenario comparison */}
      {hasCalc&&hasStop && (
        <div>
          <button onClick={()=>setShowScenarios(s=>!s)} className="text-xs text-white/35 hover:text-white/60 transition-colors mb-2">
            {showScenarios?'▲ Hide':'▼ Show'} scenario comparison
          </button>
          {showScenarios && (
            <ScenarioTable
              entryPrice={entryPrice}
              stopLossPrice={customStopLossPrice}
              riskAmount={calculation?.riskAmount||1000}
              direction={direction}
            />
          )}
        </div>
      )}

      {/* Pre-trade checklist + Add to Journal */}
      {hasCalc && (
        <div className="space-y-3 pt-4 border-t border-white/10">
          <PreTradeChecklist onAllChecked={()=>setChecklistDone(true)} />
          <div className="flex justify-end">
            <Button
              onClick={handleAddToJournal}
              disabled={!checklistDone||!calculation}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-opacity"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Journal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
