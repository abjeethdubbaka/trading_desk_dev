import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function PriceAlertModal({ open, onClose, symbol }) {
  const [values, setValues] = useState({
    targetPrice: '',
    condition: 'above',
    message: ''
  });

  const queryClient = useQueryClient();

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Notification.create({
        title: `Price Alert: ${symbol}`,
        message: data.message || `${symbol} ${data.condition} $${data.targetPrice}`,
        type: 'trade_alert',
        related_symbol: symbol,
        is_active: true,
        trigger_time: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onClose();
      setValues({ targetPrice: '', condition: 'above', message: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!values.targetPrice) return;
    createAlertMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a24] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Set Price Alert for {symbol}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={values.condition} onValueChange={(v) => setValues({ ...values, condition: v })}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Above
                    </div>
                  </SelectItem>
                  <SelectItem value="below">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      Below
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Price ($)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={values.targetPrice}
                onChange={(e) => setValues({ ...values, targetPrice: e.target.value })}
                placeholder="100.00"
                className="bg-white/5 border-white/10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Message (Optional)</Label>
            <Input
              value={values.message}
              onChange={(e) => setValues({ ...values, message: e.target.value })}
              placeholder={`${symbol} ${values.condition} $${values.targetPrice || '...'}`}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAlertMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}