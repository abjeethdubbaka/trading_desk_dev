import React, { useState, useEffect, useMemo } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { cn } from "@/lib/utils";
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { buildDisciplineSnapshot } from '@/lib/calculations/discipline';
import { toast } from 'sonner';

// Custom hooks
import { useTradeForm } from './hooks/useTradeForm';
import { useMedia, useMediaMutation } from '@/lib/hooks/useCalcHistory';

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
  const [screenshotsInitialized, setScreenshotsInitialized] = useState(false);
  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';

  const { data: tierTrades = [] } = useTrades({
    filters: { account_tier: currentTier },
    enabled: open,
  });

  const disciplineSnapshot = useMemo(
    () => buildDisciplineSnapshot(tierTrades, settings),
    [tierTrades, settings]
  );

  const preTradeAlert = useMemo(() => {
    const priority = ['warning', 'focus'];
    return disciplineSnapshot?.alerts?.find((a) => priority.includes(a.type)) || null;
  }, [disciplineSnapshot]);
  
  // Fetch strategy presets
  const { data: presets = [] } = useQuery({
    queryKey: ['strategy-presets', userId],
    queryFn: () => db.strategyPresets.list({ userId }),
    enabled: open // Only fetch when modal is open
  });

  // Form state management - pass initialData directly, handle screenshots separately
  const { formData, updateField, prepareForSubmission } = useTradeForm(initialData, userId);
  
  // Media management - separate from form initialization
  const initialIds = initialData?.screenshots?.map(s => s.id) || [];
  const { media: screenshots } = useMedia({ filters: { ids: initialIds } });
  const { uploadFile, deleteMedia, isUploading: uploading } = useMediaMutation();
  
  // Extract screenshot IDs from media
  const screenshotIds = screenshots?.map(s => s.id) || initialIds;
  
  // Initialize screenshots only once when modal opens
  useEffect(() => {
    if (open && !screenshotsInitialized && screenshotIds.length > 0) {
      updateField('screenshots', screenshotIds);
      setScreenshotsInitialized(true);
    }
    if (!open) {
      setScreenshotsInitialized(false);
    }
  }, [open, screenshotIds, screenshotsInitialized, updateField]);

  // Handle file uploads
  const handleUploadFiles = async (files) => {
    const uploadPromises = files.map(file => uploadFile({ file, metadata: { media_type: 'screenshot' } }));
    const results = await Promise.all(uploadPromises);
    const newIds = results.map(result => result.id);
    
    // Update form data directly
    const currentScreenshots = formData.screenshots || [];
    updateField('screenshots', [...currentScreenshots, ...newIds]);
    
    return newIds;
  };

  // Handle screenshot removal
  const handleRemoveById = async (id) => {
    await deleteMedia(id);
    
    // Update form data directly
    const currentScreenshots = formData.screenshots || [];
    const updatedScreenshots = currentScreenshots.filter(screenshotId => screenshotId !== id);
    updateField('screenshots', updatedScreenshots);
  };

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

    const symbol = String(formData.symbol || '').trim();
    if (symbol && !/^[A-Z]{1,5}$/.test(symbol)) {
      toast.error('Trade validation failed: symbol: Must be a valid stock symbol (1-5 uppercase letters)');
      return;
    }
    
    // Validate exit time
    if (formData.exit_time && !isValidExitTime(formData.entry_time, formData.exit_time)) {
      alert('Exit time must be after entry time');
      return;
    }
    
    setLoading(true);
    
    try {
      const submissionData = {
        ...prepareForSubmission(),
        screenshots: screenshotIds,  // IDs, not base64
      };
      
      // Convert times to UTC for storage - this is the correct place
      const entryTimeUTC = localToUTCISO(formData.entry_time);
      const exitTimeUTC = formData.exit_time ? localToUTCISO(formData.exit_time) : null;
      
      submissionData.entry_time = entryTimeUTC;
      submissionData.exit_time = exitTimeUTC;
      
      await onSave(submissionData);
    } catch (error) {
      // Parent handler (Journal) already surfaces save errors via toast.
    } finally {
      setLoading(false);
    }
  };

  const symbolError = (() => {
    const symbol = String(formData.symbol || '').trim();
    if (!symbol) return null;
    return /^[A-Z]{1,5}$/.test(symbol)
      ? null
      : 'Trade validation failed: symbol: Must be a valid stock symbol (1-5 uppercase letters)';
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Log'} Trade</DialogTitle>
          <DialogDescription className="text-white/50">
            Enter your trade details, then submit to save it in your journal.
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

          {/* Prices and Size */}
          <PriceFields
            values={{
              entry_price: formData.entry_price,
              exit_price: formData.exit_price,
              stop_loss: formData.stop_loss,
              position_size: formData.position_size,
              fee: formData.fee
            }}
            onChange={updateField}
          />

          {/* Metrics Display */}
          <TradeMetrics
            entry_price={formData.entry_price}
            exit_price={formData.exit_price}
            stop_loss={formData.stop_loss}
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
              screenshotIds={screenshotIds}
              uploading={uploading}
              onUpload={handleUploadFiles}
              onRemove={handleRemoveById}
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

          {preTradeAlert && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-300">Soft guardrail: {preTradeAlert.title}</p>
                  <p className="text-xs text-amber-200/90 mt-0.5">{preTradeAlert.message}</p>
                  <p className="text-[10px] text-amber-100/70 mt-1.5">
                    Guidance only — you can still log this trade.
                  </p>
                </div>
              </div>
            </div>
          )}

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


