import { ReactNode, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      children?: ReactNode;
      className?: string;
      type?: string;
      value?: string | number;
      checked?: boolean;
      onChange?: (e: any) => void;
      onCheckedChange?: (checked: boolean) => void;
      onClick?: (e: any) => void;
      placeholder?: string;
      required?: boolean;
      step?: string;
      inputMode?: string;
      ref?: any;
      variant?: string;
      size?: string;
      asChild?: boolean;
      disabled?: boolean;
    }
  }
}

export {};
