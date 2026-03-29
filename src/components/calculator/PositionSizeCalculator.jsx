import React from 'react';
import {
  usePositionSizeCalculator,
  PositionSizeHeader,
  DirectionToggle,
  TradeParameters,
  ResultsDisplay,
  TradeNotes,
  PositionWarning
} from './position-size';

export default function PositionSizeCalculator() {
  const {
    direction,
    setDirection,
    values,
    watchlist,
    accountBalance,
    riskAmount,
    effectiveStopLoss,
    shares,
    positionCost,
    rrRatio,
    targets,
    overallProfit,
    handleInputChange,
    handleSymbolSelect,
    handleStopLossPercentChange
  } = usePositionSizeCalculator();

  return (
    <div className="glass-card rounded-2xl p-6 gradient-border space-y-6">
      {/* Header */}
      <PositionSizeHeader riskAmount={riskAmount} />

      {/* Direction Toggle */}
      <DirectionToggle direction={direction} setDirection={setDirection} />

      {/* Trade Parameters */}
      <TradeParameters 
        values={values}
        watchlist={watchlist}
        handleInputChange={handleInputChange}
        handleSymbolSelect={handleSymbolSelect}
        handleStopLossPercentChange={handleStopLossPercentChange}
        effectiveStopLoss={effectiveStopLoss}
      />

      {/* Results */}
      <ResultsDisplay 
        key={`pos-${Date.now()}`} // Force re-render when props change
        shares={shares}
        positionCost={positionCost}
        riskAmount={riskAmount}
        rrRatio={rrRatio}
        targets={targets}
        overallProfit={overallProfit}
      />

      {/* Notes */}
      <TradeNotes values={values} handleInputChange={handleInputChange} />

      {/* Warning */}
      <PositionWarning positionCost={positionCost} accountBalance={accountBalance} />
    </div>
  );
}


