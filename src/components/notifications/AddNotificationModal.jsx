import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function AddNotificationModal({ open, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'reminder',
    trigger_time: '',
    is_recurring: false,
    recurrence_pattern: '',
    related_symbol: '',
    is_active: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = {
      ...formData,
      trigger_time: formData.trigger_time || null,
      related_symbol: formData.related_symbol?.toUpperCase() || null,
    };
    
    await onSave(data);
    setLoading(false);
    setFormData({
      title: '',
      message: '',
      type: 'reminder',
      trigger_time: '',
      is_recurring: false,
      recurrence_pattern: '',
      related_symbol: '',
      is_active: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Notification</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Market Open Reminder"
              className="bg-white/5 border-white/10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Check pre-market levels and confirm trade plans..."
              className="bg-white/5 border-white/10 min-h-[80px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="time_block">Time Block</SelectItem>
                  <SelectItem value="rule_alert">Rule Alert</SelectItem>
                  <SelectItem value="trade_alert">Trade Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Related Symbol</Label>
              <Input
                value={formData.related_symbol}
                onChange={(e) => setFormData({ ...formData, related_symbol: e.target.value })}
                placeholder="AAPL"
                className="bg-white/5 border-white/10 uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Trigger Time</Label>
            <Input
              type="datetime-local"
              value={formData.trigger_time}
              onChange={(e) => setFormData({ ...formData, trigger_time: e.target.value })}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <Label>Recurring</Label>
              <p className="text-xs text-white/50">Repeat this notification</p>
            </div>
            <Switch
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          {formData.is_recurring && (
            <div className="space-y-2">
              <Label>Recurrence Pattern</Label>
              <Select
                value={formData.recurrence_pattern}
                onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Notification
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}