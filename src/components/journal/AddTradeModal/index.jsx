import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { cn } from "@/lib/utils";

// Custom hooks
import { useTradeForm } from './hooks/useTradeForm';
import { useScreenshotUpload } from './hooks/useScreenshotUpload';

// Components
import DirectionToggle from './components/DirectionToggle';
import PriceFields from './components/PriceFields';
import TimeFields from './components/TimeFields';
import TradeMetrics from './components/TradeMetrics';
import EmotionsSelect from './components/EmotionsSelect';
import NotesFields from './components/NotesFields';
import ScreenshotUpload from './components/ScreenshotUpload';

// Utils
import { localToUTCISO, isValidExitTime } from './utils/dateUtils';
import { calculatePnL } from './utils/calculationUtils';
import { SETUP_TYPE_OPTIONS } from './constants/tradeConstants';

const getAutoSetupGrade = (breakoutChecklist) => {
  const step1 = breakoutChecklist?.step1 || {};
  const step2 = breakoutChecklist?.step2 || {};
  const step3 = breakoutChecklist?.step3 || {};

  const step1Checks = ['smoothVWAPPullback', 'controlledRedCandles', 'holdsAboveVWAP', 'lowerWicksDipBuyers'];
  const step2Checks = ['tightRange3to6Candles', 'volumeDriesUp', 'higherLowsForming', 'vwapSlopesUpward'];
  const step3Checks = ['breakAboveBaseHigh', 'volumeIncreases', 'vwapRising'];

  const yesCount = [
    ...step1Checks.map((key) => !!step1[key]),
    ...step2Checks.map((key) => !!step2[key]),
    ...step3Checks.map((key) => !!step3[key])
  ].filter(Boolean).length;

  const step1Passed = step1Checks.every((key) => !!step1[key]);
  const step2Passed = step2Checks.every((key) => !!step2[key]);
  const step3Passed = step3Checks.every((key) => !!step3[key]);
  const passedSteps = [step1Passed, step2Passed, step3Passed].filter(Boolean).length;

  if (yesCount === 11) return 'A+';
  if (passedSteps === 3 && yesCount >= 9) return 'A';
  if (passedSteps === 2) return 'B';
  if (passedSteps === 1) return 'C';
  return 'D';
};

export default function AddTradeModal({ open, onClose, onSave, initialData }) {
  const [loading, setLoading] = useState(false);
  const [userId] = useState('user-123');
  
  // Fetch strategy presets
  const { data: presets = [] } = useQuery({
    queryKey: ['strategy-presets', userId],
    queryFn: () => db.strategyPresets.list({ userId }),
    enabled: open // Only fetch when modal is open
  });

  // Form state management
  const { formData, updateField, prepareForSubmission } = useTradeForm(initialData, userId);
  
  // Screenshot management
  const {
    screenshots,
    uploading,
    uploadFiles,
    removeScreenshot,
    setScreenshots
  } = useScreenshotUpload(initialData?.screenshots);

  // Update screenshots in form data when they change
  React.useEffect(() => {
    updateField('screenshots', screenshots);
  }, [screenshots, updateField]);

  const handleBreakoutChecklistChange = React.useCallback((stepKey, itemKey, value) => {
    const current = formData.breakout_checklist || {};
    const currentStep = current[stepKey] || {};
    updateField('breakout_checklist', {
      ...current,
      [stepKey]: {
        ...currentStep,
        [itemKey]: value
      }
    });
  }, [formData.breakout_checklist, updateField]);

  const handleBreakoutMetaChange = React.useCallback((key, value) => {
    const current = formData.breakout_checklist || {};
    updateField('breakout_checklist', {
      ...current,
      [key]: value
    });
  }, [formData.breakout_checklist, updateField]);

  React.useEffect(() => {
    const isVWAPPullback = (formData.setup_type || '').toLowerCase().trim() === 'vwap pullback';
    if (!isVWAPPullback) return;

    const nextGrade = getAutoSetupGrade(formData.breakout_checklist);
    if (formData.setup_grade !== nextGrade) {
      updateField('setup_grade', nextGrade);
    }
  }, [formData.setup_type, formData.breakout_checklist, formData.setup_grade, updateField]);

  const { pnl: calculatedPnl } = React.useMemo(() => {
    return calculatePnL({
      entryPrice: formData.entry_price,
      exitPrice: formData.exit_price,
      positionSize: formData.position_size,
      direction: formData.direction,
      fee: formData.fee
    });
  }, [formData.direction, formData.entry_price, formData.exit_price, formData.fee, formData.position_size]);

  const pnlValue = Number(calculatedPnl) || 0;

  const handleReflectionChange = React.useCallback((key, value) => {
    updateField('reflection_answers', {
      ...(formData.reflection_answers || {}),
      [key]: value
    });
  }, [formData.reflection_answers, updateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate exit time
    if (formData.exit_time && !isValidExitTime(formData.entry_time, formData.exit_time)) {
      alert('Exit time must be after entry time');
      return;
    }
    
    setLoading(true);
    
    try {
      const submissionData = prepareForSubmission();
      
      // Convert times to UTC for storage - this is the correct place
      const entryTimeUTC = localToUTCISO(formData.entry_time);
      const exitTimeUTC = formData.exit_time ? localToUTCISO(formData.exit_time) : null;
      
      submissionData.entry_time = entryTimeUTC;
      submissionData.exit_time = exitTimeUTC;
      
      await onSave(submissionData);
      onClose();
    } catch (error) {
      console.error('Error saving trade:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Log'} Trade</DialogTitle>
          <DialogDescription className="text-white/50">
            {initialData 
              ? 'Edit your trade details and update the information.' 
              : 'Record a new trade with all relevant details including entry, exit, and performance metrics.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Symbol and Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => updateField('symbol', e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="bg-white/5 border-white/10 uppercase font-mono"
                required
                maxLength={10}
              />
            </div>
            <DirectionToggle
              value={formData.direction}
              onChange={(value) => updateField('direction', value)}
            />
          </div>

          {/* Prices and Size */}
          <PriceFields
            values={{
              entry_price: formData.entry_price,
              exit_price: formData.exit_price,
              position_size: formData.position_size,
              fee: formData.fee
            }}
            onChange={updateField}
          />

          {/* Metrics Display */}
          <TradeMetrics
            entry_price={formData.entry_price}
            exit_price={formData.exit_price}
            position_size={formData.position_size}
            direction={formData.direction}
            fee={formData.fee}
          />

          {/* Times */}
          <TimeFields
            entryTime={formData.entry_time}
            exitTime={formData.exit_time}
            onEntryChange={(value) => updateField('entry_time', value)}
            onExitChange={(value) => updateField('exit_time', value)}
          />

          {/* Setup and Screenshots */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setup Type</Label>
              {formData.setup_type === 'Manual' ? (
                <Input
                  value={formData.custom_setup_type || ''}
                  onChange={(e) => updateField('custom_setup_type', e.target.value)}
                  placeholder="Enter custom setup name..."
                  className="bg-white/5 border-white/10 text-white placeholder-white/50"
                />
              ) : (
                <Select
                  value={formData.setup_type}
                  onValueChange={(value) => updateField('setup_type', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select setup" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a24] border-white/10">
                    {SETUP_TYPE_OPTIONS.map(setup => (
                      <SelectItem key={setup} value={setup}>
                        {setup}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <ScreenshotUpload
              screenshots={screenshots}
              uploading={uploading}
              onUpload={uploadFiles}
              onRemove={removeScreenshot}
            />
          </div>

          {/* Strategy Preset Select */}
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
                  {presets.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Emotions and Plan */}
          <div className="grid grid-cols-2 gap-4">
            <EmotionsSelect
              value={formData.emotions}
              onChange={(value) => updateField('emotions', value)}
            />
            <div className="space-y-2">
              <Label>Followed Plan?</Label>
              <div className="flex items-center gap-2 h-10">
                <Checkbox
                  id="followed-plan"
                  checked={formData.followed_plan}
                  onCheckedChange={(checked) => updateField('followed_plan', checked)}
                  className="border-white/20 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Label htmlFor="followed-plan" className="text-sm cursor-pointer">
                  Yes, I followed my trading plan
                </Label>
              </div>
            </div>
          </div>

          {/* Notes and Lessons */}
          <NotesFields
            pnlValue={pnlValue}
            setupType={formData.setup_type}
            setupGrade={formData.setup_grade}
            breakoutChecklist={formData.breakout_checklist}
            reflectionAnswers={formData.reflection_answers}
            onReflectionChange={handleReflectionChange}
            onBreakoutChecklistChange={handleBreakoutChecklistChange}
            onBreakoutMetaChange={handleBreakoutMetaChange}
          />

          {/* Form Actions */}
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
      </DialogContent>
    </Dialog>
  );
}