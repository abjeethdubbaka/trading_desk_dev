import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import DirectionToggle from './DirectionToggle';
import PriceFields from './PriceFields';
import TimeFields from './TimeFields';
import TradeMetrics from './TradeMetrics';
import EmotionsSelect from './EmotionsSelect';
import NotesFields from './NotesFields';
import ScreenshotUpload from './ScreenshotUpload';
import { SETUP_TYPE_OPTIONS as DEFAULT_SETUP_TYPE_OPTIONS } from '../constants/tradeConstants';
import { TagSelector } from '../../components/TagSelector';

const CAP_OPTIONS = [
  { value: 'micro', label: 'Micro (<10M)' },
  { value: 'small', label: 'Small (10M-50M)' },
  { value: 'medium', label: 'Medium (50M-200M)' },
  { value: 'large', label: 'Large (200M-1B)' },
  { value: 'mega', label: 'Mega (1B+)' },
];

export default function AddTradeForm({
  initialData,
  controller,
  onClose,
}) {
  const {
    formData,
    symbolError,
    presets,
    screenshotIds,
    uploading,
    setupTypeOptions = DEFAULT_SETUP_TYPE_OPTIONS,
    exitReasonOptions = [],
    marketEnvironmentOptions = [],
    stopLossReasonOptions = [],
    mistakeOptions = [],
    learningOptions = [],
    loading,
    handleSubmit,
    updateField,
    handleUploadFiles,
    handleRemoveById,
    handleReflectionChange,
    handleBreakoutChecklistChange,
    handleBreakoutMetaChange,
  } = controller;
  const selectedCapValue = formData.float_category || formData.share_float_range || 'none';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol *</Label>
          <Input
            id="symbol"
            value={formData.symbol}
            onChange={(event) => updateField('symbol', event.target.value.toUpperCase())}
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
          onChange={(value) => updateField('direction', value)}
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
        onChange={updateField}
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
        onEntryChange={(value) => updateField('entry_time', value)}
        onExitChange={(value) => updateField('exit_time', value)}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Setup Type</Label>
          <Select
            value={formData.setup_type}
            onValueChange={(value) => updateField('setup_type', value)}
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

        <div className="space-y-2">
          <Label>S/L Reason</Label>
          <Select
            value={formData.stop_loss_reason || ''}
            onValueChange={(value) => updateField('stop_loss_reason', value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Why this stop loss?" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              {stopLossReasonOptions.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Exit Reason</Label>
          <Select
            value={formData.exit_reason || ''}
            onValueChange={(value) => updateField('exit_reason', value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Why did you exit?" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              {exitReasonOptions.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Market Env</Label>
          <Select
            value={formData.market_condition || ''}
            onValueChange={(value) => updateField('market_condition', value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="What was the market like?" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              {marketEnvironmentOptions.map((env) => (
                <SelectItem key={env} value={env}>
                  {env}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Cap</Label>
          <Select
            value={selectedCapValue}
            onValueChange={(value) => {
              const nextValue = value === 'none' ? null : value;
              updateField('float_category', nextValue);
              updateField('share_float_range', nextValue);
            }}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select cap" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a24] border-white/10">
              <SelectItem value="none">Unknown</SelectItem>
              {CAP_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScreenshotUpload
          screenshotIds={screenshotIds}
          uploading={uploading}
          onUpload={handleUploadFiles}
          onRemove={handleRemoveById}
        />
      </div>


      {presets.length > 0 && (
        <div className="space-y-2">
          <Label>Strategy Preset</Label>
          <Select
            value={formData.strategy_preset_id || ''}
            onValueChange={(value) => updateField('strategy_preset_id', value || null)}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <EmotionsSelect
          value={formData.emotions}
          onChange={(value) => updateField('emotions', value)}
        />

        <div className="space-y-2">
          <Label>Tags</Label>
          <TagSelector
            value={Array.isArray(formData.tags) ? formData.tags : []}
            onChange={(tags) => updateField('tags', tags)}
            placeholder="Add tags…"
          />
        </div>
      </div>

      <NotesFields
        setupType={formData.setup_type}
        setupGrade={formData.setup_grade}
        breakoutChecklist={formData.breakout_checklist}
        reflectionAnswers={formData.reflection_answers}
        mistakeOptions={mistakeOptions}
        learningOptions={learningOptions}
        onReflectionChange={handleReflectionChange}
        onBreakoutChecklistChange={handleBreakoutChecklistChange}
        onBreakoutMetaChange={handleBreakoutMetaChange}
      />

      <div className="space-y-2">
        <Label>O/R</Label>
        <div className="flex h-10 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = Number(formData.overall_rating) >= star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => updateField('overall_rating', formData.overall_rating === star ? null : star)}
                className="p-0.5"
                title={`${star} star${star === 1 ? '' : 's'}`}
              >
                <Star
                  className={cn(
                    'w-4 h-4 transition-colors',
                    filled ? 'fill-amber-400 text-amber-400' : 'text-white/25'
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

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
