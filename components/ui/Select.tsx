'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground-muted mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full bg-background-card border border-border rounded-xl px-4 py-3 text-foreground appearance-none cursor-pointer transition-all duration-200',
              'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
              error && 'border-error focus:border-error focus:ring-error/20',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-foreground-muted">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-background-card">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
