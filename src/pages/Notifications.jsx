import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bell, BellOff, CheckCheck, Clock } from 'lucide-react';
import NotificationCard from '@/components/notifications/NotificationCard';
import AddNotificationModal from '@/components/notifications/AddNotificationModal';
import TimeReminderModal from '@/components/notifications/TimeReminderModal';

export default function Notifications() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setShowModal(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Notification.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const handleToggle = (id, isActive) => {
    updateMutation.mutate({ id, data: { is_active: isActive } });
  };

  const handleMarkRead = (id) => {
    updateMutation.mutate({ id, data: { is_read: true } });
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { is_read: true });
    }
    queryClient.invalidateQueries(['notifications']);
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'active') return n.is_active && !n.is_read;
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-white/50 mt-1">Manage alerts and reminders</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllRead}
              className="border-white/10"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button 
            onClick={() => setShowTimeModal(true)}
            variant="outline"
            className="border-white/10"
          >
            <Clock className="w-4 h-4 mr-2" />
            Time Reminders
          </Button>
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 gradient-border">
          <p className="text-white/50 text-sm">Total</p>
          <p className="text-2xl font-bold">{notifications.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 gradient-border">
          <p className="text-white/50 text-sm">Unread</p>
          <p className="text-2xl font-bold text-amber-400">{unreadCount}</p>
        </div>
        <div className="glass-card rounded-xl p-4 gradient-border">
          <p className="text-white/50 text-sm">Active</p>
          <p className="text-2xl font-bold text-emerald-400">
            {notifications.filter(n => n.is_active).length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 gradient-border">
          <p className="text-white/50 text-sm">Recurring</p>
          <p className="text-2xl font-bold">
            {notifications.filter(n => n.is_recurring).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
            All
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            Active
          </TabsTrigger>
          <TabsTrigger value="unread" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read" className="data-[state=active]:bg-white/10">
            Read
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center gradient-border">
          <BellOff className="w-16 h-16 mx-auto mb-4 text-white/30" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-white/50 mb-6">
            {activeTab !== 'all' 
              ? 'No notifications in this category' 
              : 'Create your first alert to stay on top of your trading'}
          </p>
          {activeTab === 'all' && (
            <Button 
              onClick={() => setShowModal(true)} 
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onToggle={handleToggle}
              onMarkRead={handleMarkRead}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <AddNotificationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={(data) => createMutation.mutate(data)}
      />

      <TimeReminderModal
        open={showTimeModal}
        onClose={() => setShowTimeModal(false)}
      />
    </div>
  );
}
