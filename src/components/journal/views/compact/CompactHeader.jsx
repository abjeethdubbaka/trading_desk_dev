import React from 'react';

export function CompactHeader() {
  return (
    <div className="flex items-center gap-0 px-3 py-2 border-b border-white/[0.06] bg-white/[0.015]">
      <div className="w-5 mr-2 flex-shrink-0" />
      <div className="w-[82px] flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Date/Time</span>
      </div>
      <div className="w-[110px] flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Symbol</span>
      </div>
      <div className="w-[100px] flex-shrink-0 hidden sm:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Entry -&gt; Exit</span>
      </div>
      <div className="w-[58px] flex-shrink-0 hidden md:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Size</span>
      </div>
      <div className="w-[150px] flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">P&amp;L</span>
      </div>
      <div className="w-[52px] flex-shrink-0 hidden lg:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">R</span>
      </div>
      <div className="w-[110px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Setup</span>
      </div>
      <div className="w-[120px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Emotions</span>
      </div>
      <div className="w-[90px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Quality</span>
      </div>
      <div className="w-[120px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Plan</span>
      </div>
      <div className="w-20 flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Img</span>
      </div>
    </div>
  );
}
