import React from 'react';

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 rounded ${color}`} />
    <span className="text-white/40 text-xs">{label}</span>
  </div>
);

const HeatmapLegend = () => {
  return (
    <div className="flex items-center justify-center gap-6 mt-6 text-xs">
      <LegendItem color="bg-red-500/40" label="Heavy Loss" />
      <LegendItem color="bg-red-500/25" label="Moderate Loss" />
      <LegendItem color="bg-red-500/10" label="Light Loss" />
      <LegendItem color="bg-white/5" label="Neutral" />
      <LegendItem color="bg-emerald-500/10" label="Light Profit" />
      <LegendItem color="bg-emerald-500/25" label="Moderate Profit" />
      <LegendItem color="bg-emerald-500/40" label="Strong Profit" />
    </div>
  );
};

export default React.memo(HeatmapLegend);


