import React, { useState, useCallback } from 'react';
import { ACCOUNT_TIERS, ACCOUNT_TIER_IDS, getTierSettingsWithCustomizations, detectTierFromSettings, getTierSettingsFields, saveTierCustomizations } from '@/lib/config/accountTypes';
import { useSettings } from '@/lib/context/SettingsContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AccountTierSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateFields, isLoading } = useSettings();

  const currentTierId = (settings?.account_tier && ACCOUNT_TIERS[settings.account_tier])
    ? settings.account_tier
    : detectTierFromSettings(settings) || '25K';
  
  const currentTier = ACCOUNT_TIERS[currentTierId];
  
  const handleTierSelect = useCallback((tierId) => {
    try {
      // Preserve current tier customizations before switching away
      if (currentTierId && currentTierId !== 'custom') {
        const baseTier = getTierSettingsFields(currentTierId);
        const customizations = {};

        Object.keys(baseTier).forEach((key) => {
          if (key === 'account_tier') return;
          if (settings?.[key] !== undefined && settings[key] !== baseTier[key]) {
            customizations[key] = settings[key];
          }
        });

        saveTierCustomizations(currentTierId, customizations);
      }

      if (tierId === 'custom') {
        updateFields({ account_tier: 'custom' });
      } else {
        const tierSettings = getTierSettingsWithCustomizations(tierId);
        updateFields(tierSettings);
      }

      setIsOpen(false);
    } catch (error) {
      // Handle error silently
    }
  }, [currentTierId, settings, updateFields]);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-white/80">
        <Settings className="w-4 h-4" />
        Account Tier
      </label>
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isLoading}
            className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentTier?.icon}</span>
              <span>{currentTier?.display}</span>
              <Badge variant="secondary" className="text-xs">
                {currentTier?.badge}
              </Badge>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80 bg-gray-900 border-white/10">
          <div className="p-2 space-y-1">
            {ACCOUNT_TIER_IDS.map((tierId) => {
              const tier = ACCOUNT_TIERS[tierId];
              const isSelected = tierId === currentTierId;
              
              return (
                <DropdownMenuItem
                  key={tierId}
                  onClick={() => handleTierSelect(tierId)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'hover:bg-white/5 text-white'
                  }`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <span className="text-xl mt-0.5">{tier.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{tier.display}</span>
                        <Badge variant="outline" className="text-xs">
                          {tier.badge}
                        </Badge>
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-xs text-white/60 mb-2">{tier.description}</p>
                      
                      {tierId !== 'custom' && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-white/40">Daily Target:</span>
                            <span className="ml-1 text-white/80">${tier.daily_profit_target}</span>
                          </div>
                          <div>
                            <span className="text-white/40">Max Loss:</span>
                            <span className="ml-1 text-red-400">${tier.max_dollars}</span>
                          </div>
                          <div>
                            <span className="text-white/40">Risk/Trade:</span>
                            <span className="ml-1 text-white/80">${tier.risk_amount}</span>
                          </div>
                          <div>
                            <span className="text-white/40">Position Size:</span>
                            <span className="ml-1 text-white/80">{(tier.position_sizing_percent * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {currentTier && currentTier.rules.length > 0 && (
        <Card className="bg-white/5 border-white/10 p-3">
          <h4 className="text-xs font-medium text-white/60 mb-2">Tier Rules:</h4>
          <ul className="space-y-1">
            {currentTier.rules.map((rule, index) => (
              <li key={index} className="text-xs text-white/40 flex items-start gap-1">
                <span className="text-blue-400 mt-0.5">•</span>
                {rule}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}


