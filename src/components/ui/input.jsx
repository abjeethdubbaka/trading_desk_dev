import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, value, ...props }, ref) => {
  return (
    <input
      type={type}
      value={value}
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white ring-offset-background",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f17]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }


