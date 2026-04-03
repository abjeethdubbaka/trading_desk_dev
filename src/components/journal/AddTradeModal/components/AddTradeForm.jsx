import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldAlert } from 'lucide-react';
import { cn } from "@/lib/utils";
import DirectionToggle from './DirectionToggle';
import PriceFields from './PriceFields';
import TimeFields from './TimeFields';
import TradeMetrics from './TradeMetrics';
import EmotionsSelect from './EmotionsSelect';
import NotesFields from './NotesFields';
import ScreenshotUpload from './ScreenshotUpload';
import DosAndDontsSelector from './DosAndDontsSelector';
import { SETUP_TYPE_OPTIONS as DEFAULT_SETUP_TYPE_OPTIONS } from '../constants/tradeConstants';

export default function AddTradeForm({
  initialData,
  formData,
  symbolError,
  presets,
  screenshotIds,
  uploading,
  selectedRuleIds,
  suggestionTrade,
  preTradeAlert,
  setupTypeOptions = DEFAULT_SETUP_TYPE_OPTIONS,
  strategySteps = [],
  strategyStepResults = [],
  loading,
  onClose,
  onSubmit,
  onUpdateField,
  onUploadFiles,
  onRemoveById,
  onReflectionChange,
  onStrategyStepResultChange = () => {},
  onBreakoutChecklistChange,
  onBreakoutMetaChange,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol *</Label>
          <Input
            id="symbol"
            value={formData.symbol}
            onChange={(event) => onUpdateField('symbol', event.target.value.toUpperCase())}
            placeholder="AAPL"
            className={cn(
              "bg-white/5 border-white/10 uppercase font-mono",
              symbolError && "border-red-500/60 focus-visible:ring-red-500/50"
            )}
            required
            maxLength={10}
          />
          {symbolError && (
            <p className="text-[11px] text-red-300">{symbolError}</p>
          )}
        </div>

        <DirectionToggle
          value={formData.direction}
          onChange={(value) => onUpdateField('direction', value)}
        />
      </div>

      <PriceFields
        values={{
          entry_price: formData.entry_price,
          exit_price: formData.exit_price,
          stop_loss: formData.stop_loss,
          position_size: formData.position_size,
          fee: formData.fee,
        }}
        onChange={onUpdateField}
      />

      <TradeMetrics
        entry_price={formData.entry_price}
        exit_price={formData.exit_price}
        stop_loss={formData.stop_loss}
        position_size={formData.position_size}
        direction={formData.direction}
        fee={formData.fee}
      />

      <TimeFields
        entryTime={formData.entry_time}
        exitTime={formData.exit_time}
        onEntryChange={(value) => onUpdateField('entry_time', value)}
        onExitChange={(value) => onUpdateField('exit_time', value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Setup Type</Label>
          <Select
            value={formData.setup_type}
            onValueChange={(value) => onUpdateField('setup_type', value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select setup" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              {setupTypeOptions.map((setup) => (
                <SelectItem key={setup} value={setup}>
                  {setup}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScreenshotUpload
          screenshotIds={screenshotIds}
          uploading={uploading}
          onUpload={onUploadFiles}
          onRemove={onRemoveById}
        />
      </div>

      {presets.length > 0 && (
        <div className="space-y-2">
          <Label>Strategy Preset</Label>
          <Select
            value={formData.strategy_preset_id || ''}
            onValueChange={(value) => onUpdateField('strategy_preset_id', value || null)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              <SelectItem value="">None</SelectItem>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <EmotionsSelect
          value={formData.emotions}
          onChange={(value) => onUpdateField('emotions', value)}
        />
        <div className="space-y-2">
          <Label>Followed Plan?</Label>
          <div className="flex items-center gap-2 h-10">
            <Checkbox
              id="followed-plan"
              checked={formData.followed_plan}
              onCheckedChange={(checked) => onUpdateField('followed_plan', checked)}
              className="border-white/20 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <Label htmlFor="followed-plan" className="text-sm cursor-pointer">
              Yes, I followed my trading plan
            </Label>
          </div>
        </div>
      </div>

      <NotesFields
        setupType={formData.setup_type}
        setupGrade={formData.setup_grade}
        breakoutChecklist={formData.breakout_checklist}
        reflectionAnswers={formData.reflection_answers}
        strategySteps={strategySteps}
        strategyStepResults={strategyStepResults}
        onReflectionChange={onReflectionChange}
        onStrategyStepResultChange={onStrategyStepResultChange}
        onBreakoutChecklistChange={onBreakoutChecklistChange}
        onBreakoutMetaChange={onBreakoutMetaChange}
      />

      <DosAndDontsSelector
        tradeDraft={suggestionTrade}
        selectedRuleIds={selectedRuleIds}
        onSelectionChange={(ids) => onUpdateField('dos_donts_rule_ids', ids)}
      />

      {preTradeAlert && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-300">Soft guardrail: {preTradeAlert.title}</p>
              <p className="text-xs text-amber-200/90 mt-0.5">{preTradeAlert.message}</p>
              <p className="text-[10px] text-amber-100/70 mt-1.5">
                Guidance only - you can still log this trade.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="hover:bg-white/10"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 transition-all min-w-[100px]"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? 'Update' : 'Log'} Trade
        </Button>
      </div>
    </form>
  );
}
