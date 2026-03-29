import React from 'react';
import HeatmapCell from './HeatmapCell';

const HeatmapRow = ({ day, dayIndex, hours, heatmapData, minPnl, maxPnl, onCellClick }) => {
  return (
    <div className="grid grid-cols-9 gap-2">
      <div className="text-xs text-white/40 text-right pr-2 flex items-center justify-end font-medium">
        {day}
      </div>
      {hours.map((hour, hourIndex) => {
        // Convert display hour back to 24-hour format for the key
        let realHour;
        if (hour === '12') {
          realHour = 12; // 12 PM
        } else if (hour === '9' || hour === '10' || hour === '11') {
          realHour = parseInt(hour); // 9-11 AM
        } else {
          // 1-8 PM (displayed as 1-8) convert to 13-16
          realHour = parseInt(hour) + 12;
        }
        
        const key = `${dayIndex + 1}-${realHour}`;
        const data = heatmapData[key] || { pnl: 0, count: 0 };
        const hasTrades = data.count > 0;

        return (
          <HeatmapCell
            key={`${day}-${hour}`}
            data={data}
            minPnl={minPnl}
            maxPnl={maxPnl}
            hasTrades={hasTrades}
            onClick={() => onCellClick?.(day, hour, data)}
          />
        );
      })}
    </div>
  );
};

export default React.memo(HeatmapRow);


