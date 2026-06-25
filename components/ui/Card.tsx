'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, glow = false, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        'bg-background-card border border-border rounded-2xl overflow-hidden',
        hover && 'cursor-pointer card-hover',
        glow && 'ai-glow ai-border',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
