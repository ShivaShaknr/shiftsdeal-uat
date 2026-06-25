"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SQRT_5000 = Math.sqrt(5000);

const testimonials = [
  {
    tempId: 0,
    testimonial: "My favorite solution in the market. We work 5x faster with COMPANY.",
    by: "Alex, CEO at TechCorp",
    imgSrc: "https://i.pravatar.cc/150?img=1",
  },
  {
    tempId: 1,
    testimonial: "I'm confident my data is safe with COMPANY. I can't say that about other providers.",
    by: "Dan, CTO at SecureNet",
    imgSrc: "https://i.pravatar.cc/150?img=2",
  },
  {
    tempId: 2,
    testimonial: "I know it's cliche, but we were lost before we found COMPANY. Can't thank you guys enough!",
    by: "Stephanie, COO at InnovateCo",
    imgSrc: "https://i.pravatar.cc/150?img=3",
  },
  {
    tempId: 3,
    testimonial: "COMPANY's products make planning for the future seamless. Can't recommend them enough!",
    by: "Marie, CFO at FuturePlanning",
    imgSrc: "https://i.pravatar.cc/150?img=4",
  },
  {
    tempId: 4,
    testimonial: "If I could give 11 stars, I'd give 12.",
    by: "Andre, Head of Design at CreativeSolutions",
    imgSrc: "https://i.pravatar.cc/150?img=5",
  },
];

interface StaggerItem {
  tempId: number;
  testimonial: string;
  by: string;
  imgSrc?: string;
  heading?: string;
  description?: string;
  points?: string[];
}

interface StaggerTestimonialsProps {
  items?: StaggerItem[];
}

interface TestimonialCardProps {
  position: number;
  testimonial: StaggerItem;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  testimonial,
  handleMove,
  cardSize,
}) => {
  const isCenter = position === 0;
  const isNear = Math.abs(position) <= 3;
  const heading = testimonial.heading;
  const description = testimonial.description ?? testimonial.testimonial;
  const points = testimonial.points ?? [];

  if (!isNear) return null;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-6 transition-all duration-500 ease-in-out",
        isCenter
          ? "z-20 bg-[#dddddd] text-black border-white/80"
          : "z-10 bg-black text-white border-white/20 hover:border-white/35"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath:
          "polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)",
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.58) * position}px)
          translateY(${isCenter ? -54 : position % 2 ? 10 : -10}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.2 : -2.2}deg)
        `,
        opacity: isCenter ? 1 : Math.abs(position) === 1 ? 0.72 : 0.48,
        boxShadow: isCenter ? "0px 8px 0px 4px rgba(255,255,255,0.12)" : "0px 0px 0px 0px transparent",
      }}
    >
      <span
        className={cn("absolute block origin-top-right rotate-45", isCenter ? "bg-black/30" : "bg-white/25")}
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2,
        }}
      />

      {testimonial.imgSrc ? (
        <img
          src={testimonial.imgSrc}
          alt={`${testimonial.by.split(",")[0]}`}
          className="mb-4 h-14 w-12 bg-muted object-cover object-top"
          style={{
            boxShadow: "3px 3px 0px hsl(var(--background))",
          }}
        />
      ) : null}

      <div className={cn("pr-1", isCenter ? "max-h-[76%] overflow-y-auto" : "max-h-[68%] overflow-hidden")}>
        {heading ? (
          <h3 className={cn("text-lg sm:text-2xl font-semibold mb-3", isCenter ? "text-black" : "text-white")}>{heading}</h3>
        ) : null}

        <p
          className={cn(
            "whitespace-pre-line leading-relaxed",
            isCenter ? "text-sm sm:text-lg text-black" : "text-sm sm:text-base text-white/90 line-clamp-5"
          )}
        >
          {description}
        </p>

        {isCenter && points.length ? (
          <ul className="mt-4 space-y-1 text-base sm:text-[1.15rem] list-disc pl-5 text-black/95">
            {points.map((point, index) => (
              <li key={`${testimonial.tempId}-point-${index}`}>{point}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <p
        className={cn(
          "absolute bottom-6 left-6 right-6 mt-2 text-sm italic",
          isCenter ? "text-black/70" : "text-white/72"
        )}
      >
        - {testimonial.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC<StaggerTestimonialsProps> = ({ items }) => {
  const [cardSize, setCardSize] = useState(420);
  const [testimonialsList, setTestimonialsList] = useState<StaggerItem[]>(items?.length ? items : testimonials);

  useEffect(() => {
    // update testimonials when `items` prop changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTestimonialsList(items?.length ? items : testimonials);
  }, [items]);

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 420 : 300);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/20 bg-black/95" style={{ height: 600 }}>
      {testimonialsList.map((testimonial, index) => {
        const len = testimonialsList.length;
        const half = Math.floor(len / 2);
        let position = index;

        // For even-length lists, place the tie card on the left side to avoid
        // stacking two dense background cards on the same side.
        if (len % 2 === 0 && position === half) {
          position = -half;
        } else if (position > half) {
          position -= len;
        }

        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-black border border-white/30 text-white hover:bg-white hover:text-black",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Previous testimonial"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-black border border-white/30 text-white hover:bg-white hover:text-black",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Next testimonial"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};
