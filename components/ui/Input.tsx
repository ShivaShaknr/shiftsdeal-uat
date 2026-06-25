'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, required, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground-muted mb-2">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-background-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted/50 transition-all duration-200',
              'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-error focus:border-error focus:ring-error/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
