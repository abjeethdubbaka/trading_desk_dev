"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-1 text-white/60",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ring-offset-background transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f17]",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:border data-[state=active]:border-white/15 data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.25)]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f17]",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }


