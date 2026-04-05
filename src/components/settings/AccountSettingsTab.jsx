import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AccountTierSelector from '@/components/settings/AccountTierSelector';
import Field from '@/components/settings/Field';
import InfoHint from '@/components/ui/InfoHint';

const STRATEGY_STEP_GRADE_OPTIONS = ['A++', 'A+', 'A', 'B', 'C', 'D', 'F'];
const ADD_SETUP_VALUE = '__add_setup__';

export default function AccountSettingsTab({
  getDisplayValue,
  handleFieldChange,
  commitDraftField,
  isLoading,
  strategySetupsDraft,
  selectedStrategySetupIndex,
  selectedStrategySetupName,
  handleStrategySetupSelect,
  handleAddStrategySetupWithName,
  handleRemoveStrategySetup,
  strategySetupCount,
  strategyStepsDraft,
  handleStrategyStepChange,
  handleStrategyStepBlur: _handleStrategyStepBlur,
  handleAddStrategyStep,
  handleRemoveStrategyStep,
  handleStrategyRelativeGradeChange,
  handleAddStrategyRelativeGrade,
  handleRemoveStrategyRelativeGrade,
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
  const handleSetupDropdownChange = (value) => {
    if (value === ADD_SETUP_VALUE) {
      const defaultSetupName = `Setup ${availableSetups.length + 1}`;
      const setupName = window.prompt('Enter new setup name', defaultSetupName);
      if (setupName == null) return;
      handleAddStrategySetupWithName(setupName);
      return;
    }

    handleStrategySetupSelect(value);
  };

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

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Select
              value={String(selectedSetupIndex)}
              onValueChange={handleSetupDropdownChange}
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
                <SelectSeparator className="bg-white/10" />
                <SelectItem value={ADD_SETUP_VALUE}>
                  + Add Setup
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const setupName = availableSetups[selectedSetupIndex] || `Strategy ${selectedSetupIndex + 1}`;
                const confirmed = window.confirm(`Delete setup "${setupName}" and all of its steps?`);
                if (!confirmed) return;
                handleRemoveStrategySetup(selectedSetupIndex);
              }}
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
              <div key={`strategy-step-${index}`} className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                <div className="grid grid-cols-1 md:grid-cols-[56px_minmax(0,1fr)_140px_auto] gap-2 items-center">
                  <span className="text-[11px] text-white/45">Step {index + 1}</span>
                  <Input
                    value={typeof step === 'string' ? step : (step?.label || '')}
                    onChange={(event) => handleStrategyStepChange(index, event.target.value, 'label')}
                    placeholder="Describe this step..."
                    className={compactInputClass}
                    disabled={isLoading}
                  />
                  <Select
                    value={
                      typeof step === 'string'
                        ? 'none'
                        : (step?.grade || 'none')
                    }
                    onValueChange={(value) => {
                      handleStrategyStepChange(index, value === 'none' ? '' : value, 'grade');
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={compactInputClass}>
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/10">
                      <SelectItem value="none">No grade</SelectItem>
                      {STRATEGY_STEP_GRADE_OPTIONS.map((grade) => (
                        <SelectItem key={`strategy-step-grade-${grade}`} value={grade}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                {Array.isArray(step?.relativeGrades) && step.relativeGrades.length > 0 && (
                  <div className="space-y-1.5 md:pl-[56px]">
                    {step.relativeGrades.map((mapping, mappingIndex) => (
                      <div key={`strategy-step-${index}-relative-${mappingIndex}`} className="grid grid-cols-1 md:grid-cols-[56px_minmax(0,1fr)_140px_auto] gap-2 items-center">
                        <span className="text-[10px] text-cyan-200/70">Alt {mappingIndex + 1}</span>
                        <Input
                          value={mapping?.label || ''}
                          onChange={(event) => handleStrategyRelativeGradeChange(index, mappingIndex, event.target.value, 'label')}
                          placeholder="Relative graded wording..."
                          className={compactInputClass}
                          disabled={isLoading}
                        />
                        <Select
                          value={mapping?.grade || 'none'}
                          onValueChange={(value) => {
                            handleStrategyRelativeGradeChange(index, mappingIndex, value === 'none' ? '' : value, 'grade');
                          }}
                          disabled={isLoading}
                        >
                          <SelectTrigger className={compactInputClass}>
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a24] border-white/10">
                            <SelectItem value="none">No grade</SelectItem>
                            {STRATEGY_STEP_GRADE_OPTIONS.map((grade) => (
                              <SelectItem key={`strategy-step-relative-grade-${index}-${mappingIndex}-${grade}`} value={grade}>
                                Grade {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            handleRemoveStrategyRelativeGrade(index, mappingIndex);
                          }}
                          disabled={isLoading}
                          className="h-9 w-9 text-white/45 hover:text-rose-300 hover:bg-rose-500/10"
                          title="Remove relative grade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="md:pl-[56px]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddStrategyRelativeGrade(index)}
                    disabled={isLoading}
                    className="h-8 text-cyan-200/80 hover:text-cyan-100 hover:bg-cyan-500/10"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Map Relative Grade
                  </Button>
                </div>
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
