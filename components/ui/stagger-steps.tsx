"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface StepItem {
  number: string;
  title: string;
  description: string;
}

interface StaggerStepsProps {
  items: StepItem[];
  className?: string;
}

export function StaggerSteps({ items, className }: StaggerStepsProps) {
  const loopItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div className="step-track flex gap-5 py-2 hover:[animation-play-state:paused]">
        {loopItems.map((item, index) => (
          <div
            key={`${item.number}-${index}`}
            className="min-w-[280px] md:min-w-[360px] lg:min-w-[420px] rounded-2xl border border-white/20 bg-black/70 p-6 backdrop-blur-sm"
          >
            <p className="text-lg font-semibold text-white/70 mb-3">{item.number}</p>
            <h3 className="text-3xl font-semibold text-white mb-3">{item.title}</h3>
            <p className="text-white/75 text-xl leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
