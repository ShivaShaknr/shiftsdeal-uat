'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'w-full max-h-[90vh] flex flex-col',
              sizes[size]
            )}
          >
            <div
              className={cn(
                'bg-background-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full',
                className
              )}
            >
              {title && (
                <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-background-light rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-foreground-muted" />
                  </button>
                </div>
              )}
              <div className={cn('overflow-y-auto flex-1', !title && 'pt-4')}>{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
