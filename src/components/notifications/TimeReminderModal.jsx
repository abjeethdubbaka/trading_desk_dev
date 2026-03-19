import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ListTodo,
  Target,
  Zap,
  Bell,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Menu,
  X,
  Calculator
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => base44.entities.Notification.filter({ is_read: false, is_active: true }),
    refetchInterval: 30000
  });

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Watchlist', icon: ListTodo, page: 'Watchlist' },
    { name: 'Plan Builder', icon: Target, page: 'PlanBuilder' },
    { name: 'Execution', icon: Zap, page: 'Execution' },
    { name: 'Journal', icon: BookOpen, page: 'Journal' },
    { name: 'Calculator', icon: Calculator, page: 'Calculator' },
    { name: 'Notifications', icon: Bell, page: 'Notifications', badge: notifications.length },
    { name: 'Settings', icon: Settings, page: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style>{`
        :root {
          --background: 0 0% 4%;
          --foreground: 0 0% 98%;
          --card: 0 0% 7%;
          --card-foreground: 0 0% 98%;
          --popover: 0 0% 7%;
          --popover-foreground: 0 0% 98%;
          --primary: 142 76% 46%;
          --primary-foreground: 0 0% 100%;
          --secondary: 0 0% 12%;
          --secondary-foreground: 0 0% 98%;
          --muted: 0 0% 15%;
          --muted-foreground: 0 0% 64%;
          --accent: 142 76% 46%;
          --accent-foreground: 0 0% 100%;
          --destructive: 0 84% 60%;
          --destructive-foreground: 0 0% 98%;
          --border: 0 0% 14%;
          --input: 0 0% 14%;
          --ring: 142 76% 46%;
        }
        body {
          background: #0a0a0f;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
        }
        .gradient-border {
          position: relative;
        }
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .glow-green {
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.1);
        }
        .glow-red {
          box-shadow: 0 0 40px rgba(239, 68, 68, 0.1);
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">TradeDesk</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white/70"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 pt-16">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {item.badge > 0 && (
                    <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-0">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 bottom-0 flex-col bg-[#0a0a0f] border-r border-white/5 z-40 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn(
          "h-20 flex items-center border-b border-white/5",
          collapsed ? "justify-center px-4" : "px-6"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center glow-green">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg tracking-tight">TradeDesk</h1>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Pro Trading Suite</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5",
                  collapsed && "justify-center px-3"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full" />
                )}
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="font-medium">{item.name}</span>
                    {item.badge > 0 && (
                      <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                    {item.badge}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full text-white/40 hover:text-white/80 hover:bg-white/5",
              collapsed && "px-3"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300 pt-16 lg:pt-0",
          collapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}