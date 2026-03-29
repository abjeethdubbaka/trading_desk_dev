import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import WatchlistCard from '@/components/watchlist/WatchlistCard';
import AddWatchlistModal from '@/components/watchlist/AddWatchlistModal';
import PriceAlertModal from '@/components/watchlist/PriceAlertModal';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Watchlist() {
  const [showModal, setShowModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => base44.entities.WatchlistItem.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WatchlistItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist']);
      setShowModal(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WatchlistItem.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['watchlist'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchlistItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['watchlist'])
  });

  const handleStatusChange = (id, status) => {
    updateMutation.mutate({ id, data: { status } });
  };

  const handleSetAlert = (item) => {
    setSelectedSymbol(item.symbol);
    setShowAlertModal(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.catalyst?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || item.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const statusCounts = {
    all: items.length,
    watching: items.filter(i => i.status === 'watching').length,
    ready: items.filter(i => i.status === 'ready').length,
    triggered: items.filter(i => i.status === 'triggered').length,
    passed: items.filter(i => i.status === 'passed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pre-Market Watchlist</h1>
          <p className="text-white/50 mt-1">Track potential trading opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="border-white/10 text-white/60 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Symbol
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search symbols or catalysts..."
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="ready" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              Ready ({statusCounts.ready})
            </TabsTrigger>
            <TabsTrigger value="watching" className="data-[state=active]:bg-white/10">
              Watching ({statusCounts.watching})
            </TabsTrigger>
            <TabsTrigger value="triggered" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              Triggered ({statusCounts.triggered})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Watchlist Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card rounded-xl p-4 h-48 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="space-y-2">
                  <div className="h-5 w-20 bg-white/10 rounded" />
                  <div className="h-4 w-32 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center gradient-border">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-white/50 mb-6">
            {searchTerm ? 'Try adjusting your search' : 'Add your first watchlist item to get started'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Symbol
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <WatchlistCard
              key={item.id}
              item={item}
              onDelete={(id) => deleteMutation.mutate(id)}
              onStatusChange={handleStatusChange}
              onCreatePlan={(item) => {
                navigate(createPageUrl(`PlanBuilder?symbol=${item.symbol}&pm_high=${item.premarket_high || ''}&pm_low=${item.premarket_low || ''}`));
              }}
              onSetAlert={handleSetAlert}
            />
          ))}
        </div>
      )}

      <AddWatchlistModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={(data) => createMutation.mutate(data)}
      />

      <PriceAlertModal
        open={showAlertModal}
        onClose={() => {
          setShowAlertModal(false);
          setSelectedSymbol(null);
        }}
        symbol={selectedSymbol}
      />
    </div>
  );
}


