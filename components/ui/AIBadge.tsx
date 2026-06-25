'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Wand2 } from 'lucide-react';

interface AIBadgeProps {
  score?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AIBadge({ score, label, size = 'md', className }: AIBadgeProps) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'bg-primary/10 text-primary border border-primary/30',
        'ai-glow-subtle',
        sizes[size],
        className
      )}
    >
      <Wand2 className={cn(iconSizes[size], 'animate-pulse')} />
      {score !== undefined && (
        <span className="font-bold">{score}%</span>
      )}
      {label && <span>{label}</span>}
      {!score && !label && <span>AI Match</span>}
    </motion.div>
  );
}
