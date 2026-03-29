import React from 'react';

const HeatmapHeader = ({ hours }) => {
  return (
    <div className="grid grid-cols-9 gap-2 mb-2">
      <div className="text-xs text-white/40 text-center"></div>
      {hours.map(hour => (
        <div 
          key={hour} 
          className="text-xs text-white/40 text-center font-medium"
        >
          {hour}
        </div>
      ))}
    </div>
  );
};

export default React.memo(HeatmapHeader);


