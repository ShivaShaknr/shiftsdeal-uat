'use client';

import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface WatermarkedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  watermarkClassName?: string;
  watermarkSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<WatermarkedImageProps['watermarkSize']>, string> = {
  sm: 'w-[8%] min-w-10 max-w-16',
  md: 'w-[9%] min-w-12 max-w-20',
  lg: 'w-[10%] min-w-14 max-w-24',
};

export default function WatermarkedImage({
  src,
  alt,
  className,
  imageClassName,
  watermarkClassName,
  watermarkSize = 'md',
  ...imgProps
}: WatermarkedImageProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img src={src} alt={alt} {...imgProps} className={cn('h-full w-full object-cover', imageClassName)} />
      <div className={cn('pointer-events-none absolute bottom-5 right-5 opacity-[0.72]', sizeClasses[watermarkSize], watermarkClassName)}>
        <img src="/logo-light.png" alt="ShiftDeals watermark" className="w-full h-auto object-contain drop-shadow-lg" />
      </div>
    </div>
  );
}