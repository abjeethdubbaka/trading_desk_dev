import React from 'react';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Trash2,
  Check
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const typeIcons = {
  time_block: Clock,
  rule_alert: AlertTriangle,
  trade_alert: TrendingUp,
  reminder: Bell
};

const typeColors = {
  time_block: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  rule_alert: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  trade_alert: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  reminder: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

export default function NotificationCard({ notification, onToggle, onMarkRead, onDelete, userId = 'user-123' }) {
  const queryClient = useQueryClient();
  const Icon = typeIcons[notification.type] || Bell;

  // Toggle notification active status mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Notification.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', userId]);
      onToggle?.(notification.id, !notification.is_active);
    }
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', userId]);
      onMarkRead?.(notification.id);
    }
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', userId]);
      onDelete?.(notification.id);
    }
  });

  const handleToggle = (is_active) => {
    toggleMutation.mutate({ id: notification.id, is_active });
  };

  const handleMarkRead = () => {
    markReadMutation.mutate(notification.id);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this notification?')) {
      deleteMutation.mutate(notification.id);
    }
  };

  return (
    <div className={cn(
      "glass-card rounded-xl p-4 gradient-border transition-all",
      notification.is_read && "opacity-60"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          notification.is_read ? "bg-white/5" : "bg-white/10"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            notification.is_read ? "text-white/40" : "text-white/80"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={cn(
              "font-semibold",
              notification.is_read && "text-white/60"
            )}>
              {notification.title}
            </h3>
            <Badge variant="outline" className={cn("text-xs flex-shrink-0", typeColors[notification.type])}>
              {notification.type?.replace('_', ' ')}
            </Badge>
          </div>
          
          <p className="text-sm text-white/50 mb-2">{notification.message}</p>
          
          <div className="flex items-center gap-4 text-xs text-white/40">
            {notification.trigger_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(notification.trigger_time), 'MMM d, h:mm a')}
              </span>
            )}
            {notification.related_symbol && (
              <span className="font-medium text-white/60">{notification.related_symbol}</span>
            )}
            {notification.is_recurring && (
              <Badge className="text-xs bg-white/10 text-white/60">
                {notification.recurrence_pattern}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Active</span>
            <Switch
              checked={notification.is_active}
              onCheckedChange={() => handleToggle(!notification.is_active)}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
          
          <div className="flex gap-1">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMarkRead}
                className="h-7 w-7 text-white/40 hover:text-emerald-400"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-7 w-7 text-white/40 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}