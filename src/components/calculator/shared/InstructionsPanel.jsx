import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Info } from 'lucide-react';

export default function InstructionsPanel() {
  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardHeader>
        <CardTitle>How to Use</CardTitle>
        <CardDescription>Step-by-step guide to using the Float Position Sizer</CardDescription>
      </CardHeader>
      
      <CardContent>
        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Enter Stock Symbol</p>
              <p className="text-sm text-white/60">Type the stock ticker (e.g., TSLA, AAPL)</p>
            </div>
          </li>
          
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Set Entry Price</p>
              <p className="text-sm text-white/60">Enter the price you plan to buy at</p>
            </div>
          </li>
          
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">Configure Account & Risk</p>
              <p className="text-sm text-white/60">Set your account size and trading style</p>
            </div>
          </li>
          
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium">Get Dynamic Calculation</p>
              <p className="text-sm text-white/60">System calculates optimal position based on float</p>
            </div>
          </li>
        </ol>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Why Float Matters?
          </h4>
          <ul className="space-y-1 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
              <span><strong>Micro/Small floats</strong> are more volatile - position size is reduced</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span><strong>Mega/Large floats</strong> have better liquidity - position size can be increased</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
              <span>Stop losses are tighter for riskier (smaller float) stocks</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>Prevents you from buying too much of a low-float stock</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}


