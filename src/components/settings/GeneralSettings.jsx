import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DollarSign,
  Target,
  Percent,
  TrendingUp
} from 'lucide-react';
import { useSettings } from './SettingsProvider';

export default function GeneralSettings() {
  const { settings, loading, saving, updateSettings, updateRiskAmount, riskAmount } = useSettings();

  return (
    <div className="glass-card rounded-2xl p-5 gradient-border max-w-md">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-white/40" />
            Account Size ($)
          </Label>
          <Input
            type="number"
            value={settings.account_size || ''}
            onChange={(e) => updateSettings({ account_size: e.target.value })}
            placeholder="25000"
            className="bg-white/5 border-white/10"
            disabled={loading || saving}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-white/40" />
            Position Sizing (%)
          </Label>
          <Input
            type="number"
            step="0.1"
            value={settings.position_sizing_percent || ''}
            onChange={(e) => updateSettings({ position_sizing_percent: e.target.value })}
            placeholder="1"
            className="bg-white/5 border-white/10"
            disabled={loading || saving}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-white/40" />
            Default Stop Loss (%)
          </Label>
          <Input
            type="number"
            step="0.1"
            value={settings.default_stop_loss_percent || ''}
            onChange={(e) => updateSettings({ default_stop_loss_percent: e.target.value })}
            placeholder="3"
            className="bg-white/5 border-white/10"
            disabled={loading || saving}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-white/40" />
            Target Profit ($)
          </Label>
          <Input
            type="number"
            step="50"
            value={settings.target_profit_dollars || ''}
            onChange={(e) => updateSettings({ target_profit_dollars: e.target.value })}
            placeholder="500"
            className="bg-white/5 border-white/10"
            disabled={loading || saving}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-white/40" />
            Max $
          </Label>
          <Input
            type="number"
            step="100"
            value={settings.max_dollars || ''}
            onChange={(e) => updateSettings({ max_dollars: e.target.value })}
            placeholder="5000"
            className="bg-white/5 border-white/10"
            disabled={loading || saving}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Target className="w-4 h-4 text-white/40" />
            Risk Amount ($)
          </Label>
          <Input
            type="number"
            step="50"
            value={riskAmount || ''}
            onChange={(e) => {
              updateRiskAmount(e.target.value);
            }}
            placeholder="1000"
            className="bg-white/5 border-white/10"
            disabled={loading || saving}
          />
        </div>
      </div>
    </div>
  );
}
