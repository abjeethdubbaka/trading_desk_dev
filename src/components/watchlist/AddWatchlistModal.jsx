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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function AddWatchlistModal({ open, onClose, onSave, initialData }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    symbol: '',
    catalyst: '',
    notes: '',
    premarket_high: '',
    premarket_low: '',
    premarket_volume: '',
    float_size: '',
    sector: '',
    priority: 'medium',
    status: 'watching'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = {
      ...formData,
      symbol: formData.symbol.toUpperCase(),
      premarket_high: formData.premarket_high ? parseFloat(formData.premarket_high) : null,
      premarket_low: formData.premarket_low ? parseFloat(formData.premarket_low) : null,
      premarket_volume: formData.premarket_volume ? parseFloat(formData.premarket_volume) : null,
    };
    
    await onSave(data);
    setLoading(false);
    setFormData({
      symbol: '',
      catalyst: '',
      notes: '',
      premarket_high: '',
      premarket_low: '',
      premarket_volume: '',
      float_size: '',
      sector: '',
      priority: 'medium',
      status: 'watching'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add'} Watchlist Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Symbol *</Label>
              <Input
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="AAPL"
                className="bg-white/5 border-white/10 uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Catalyst</Label>
            <Input
              value={formData.catalyst}
              onChange={(e) => setFormData({ ...formData, catalyst: e.target.value })}
              placeholder="Earnings beat, FDA approval..."
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>PM High</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.premarket_high}
                onChange={(e) => setFormData({ ...formData, premarket_high: e.target.value })}
                placeholder="0.00"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>PM Low</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.premarket_low}
                onChange={(e) => setFormData({ ...formData, premarket_low: e.target.value })}
                placeholder="0.00"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Float Size</Label>
              <Select
                value={formData.float_size}
                onValueChange={(value) => setFormData({ ...formData, float_size: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a24] border-white/10">
                  <SelectItem value="micro">Micro</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              className="bg-white/5 border-white/10 min-h-[80px]"
            />
          </div>

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
              {initialData ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}