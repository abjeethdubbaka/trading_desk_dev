import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils/general';

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f17]',
          'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]',

          variant === 'default' &&
            'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_6px_20px_rgba(16,185,129,0.26)] hover:brightness-105',
          variant === 'destructive' &&
            'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-[0_6px_20px_rgba(244,63,94,0.28)] hover:brightness-105',
          variant === 'outline' &&
            'border border-white/15 bg-white/[0.03] text-white/85 hover:border-white/25 hover:bg-white/[0.06]',
          variant === 'secondary' &&
            'bg-white/[0.08] text-white/85 hover:bg-white/[0.12]',
          variant === 'ghost' && 'text-white/75 hover:bg-white/[0.06] hover:text-white',
          variant === 'link' && 'text-emerald-300 underline-offset-4 hover:underline',

          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-9 px-3 text-xs',
          size === 'lg' && 'h-11 px-8',
          size === 'icon' && 'h-10 w-10',
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button };
