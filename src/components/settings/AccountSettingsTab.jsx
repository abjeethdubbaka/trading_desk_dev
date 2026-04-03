import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AccountTierSelector from '@/components/settings/AccountTierSelector';
import Field from '@/components/settings/Field';
import InfoHint from '@/components/ui/InfoHint';

export default function AccountSettingsTab({
  getDisplayValue,
  handleFieldChange,
  commitDraftField,
  isLoading,
  strategySetupsDraft,
  selectedStrategySetupIndex,
  selectedStrategySetupName,
  handleStrategySetupSelect,
  newStrategySetupDraft,
  handleNewStrategySetupDraftChange,
  handleAddStrategySetup,
  handleRemoveStrategySetup,
  strategySetupCount,
  strategyStepsDraft,
  handleStrategyStepChange,
  handleStrategyStepBlur,
  handleAddStrategyStep,
  handleRemoveStrategyStep,
  strategyStepCount,
}) {
  const compactInputClass = 'h-9 rounded-lg px-2.5 bg-white/5 border-white/10';
  const availableSetups = Array.isArray(strategySetupsDraft) && strategySetupsDraft.length > 0
    ? strategySetupsDraft
    : [''];
  const selectedSetupIndex = Math.min(
    Math.max(selectedStrategySetupIndex ?? 0, 0),
    availableSetups.length - 1
  );

  return (
    <div className="space-y-4">
      <AccountTierSelector />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Account size ($)">
          <Input
            type="number"
            value={getDisplayValue('account_size')}
            onChange={handleFieldChange('account_size')}
            onBlur={() => commitDraftField('account_size')}
            placeholder="50000"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

        <Field label="Daily profit target ($)">
          <Input
            type="number"
            step="50"
            value={getDisplayValue('target_profit_dollars')}
            onChange={handleFieldChange('target_profit_dollars')}
            onBlur={() => commitDraftField('target_profit_dollars')}
            placeholder="500"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

        <Field label="Max daily loss ($)">
          <Input
            type="number"
            step="50"
            value={getDisplayValue('max_dollars')}
            onChange={handleFieldChange('max_dollars')}
            onBlur={() => commitDraftField('max_dollars')}
            placeholder="250"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

        <div className="md:col-span-2 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white/75">Strategy Setup Types</p>
            </div>
            <span className="text-[10px] text-cyan-300/80">
              {strategySetupCount} setups
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)_auto_auto] gap-2">
            <Select
              value={String(selectedSetupIndex)}
              onValueChange={handleStrategySetupSelect}
              disabled={isLoading}
            >
              <SelectTrigger className={compactInputClass}>
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                {availableSetups.map((setup, index) => (
                  <SelectItem key={`strategy-setup-${index}`} value={String(index)}>
                    {setup?.trim() ? setup : `Strategy ${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={newStrategySetupDraft}
              onChange={(event) => handleNewStrategySetupDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                handleAddStrategySetup();
              }}
              placeholder="Add setup (e.g. VWAP Pullback)"
              className={compactInputClass}
              disabled={isLoading}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStrategySetup}
              disabled={isLoading}
              className="h-9"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Setup
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveStrategySetup(selectedSetupIndex)}
              disabled={isLoading || availableSetups.length <= 1}
              className="h-9 text-white/45 hover:text-rose-300 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete Setup
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-white/75">Strategy Steps</p>
              <InfoHint text={`Steps for ${selectedStrategySetupName || 'selected strategy'}.`} />
            </div>
            <span className="text-[10px] text-emerald-300/80">
              {strategyStepCount} saved
            </span>
          </div>

          <div className="space-y-2">
            {(strategyStepsDraft || ['']).map((step, index) => (
              <div key={`strategy-step-${index}`} className="flex items-center gap-2">
                <span className="w-12 flex-shrink-0 text-[11px] text-white/45">Step {index + 1}</span>
                <Input
                  value={step}
                  onChange={(event) => handleStrategyStepChange(index, event.target.value)}
                  onBlur={handleStrategyStepBlur}
                  placeholder="Describe this step..."
                  className={compactInputClass}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveStrategyStep(index)}
                  disabled={isLoading}
                  className="h-9 w-9 text-white/45 hover:text-rose-300 hover:bg-rose-500/10"
                  title="Remove step"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStrategyStep}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Step
          </Button>
        </div>
      </div>
    </div>
  );
}
