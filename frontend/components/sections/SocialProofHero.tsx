import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "#2563EB", "#06B6D4", "#6366F1", "#8B5CF6", 
  "#FFCF00", "#F72585", "#10B981", "#FF6B6B"
];

const TESTIMONIALS = [
  {
    quote: "Shadow CFO turned my messy books into a truly plug-and-play experience; it just worked with our banking stack out of the box. We stopped burning time on one-off reconciliation.",
    author: "Sharon Yeh",
    role: "Staff Product Manager",
    company: "Deepgram",
    avatar: "https://i.pravatar.cc/150?u=sharon"
  },
  {
    quote: "Shadow CFO is the first AI that actually surfaces real money leaks. We found $4,200 in idle seats within the first 48 hours of connecting our accounts.",
    author: "Sarah Yeh",
    role: "Head of Operations",
    company: "Stealth Startup",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    quote: "The most powerful financial tool I've ever used. Shadow CFO handles the leaks while we focus on scaling the business.",
    author: "Michael B.",
    role: "Managing Partner",
    company: "Ventures Inc",
    avatar: "https://i.pravatar.cc/150?u=michael"
  }
];

interface BarProps {
  id: number;
  isTop: boolean;
}

const Bar = ({ isTop }: BarProps) => {
  const config = useMemo(() => {
    const width = Math.floor(Math.random() * (22 - 6 + 1)) + 6;
    const height = Math.floor(Math.random() * (280 - 120 + 1)) + 120;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const opacity = (Math.random() * (0.95 - 0.82) + 0.82).toFixed(2);
    const duration = Math.floor(Math.random() * (14 - 6 + 1)) + 6;
    const delay = -(Math.random() * duration); // Negative delay for mid-flight start
    const direction = Math.random() > 0.5 ? 1 : -1;
    const top = isTop 
      ? Math.floor(Math.random() * 50) - 20 // -20% to 30% of viewport
      : Math.floor(Math.random() * 55) + 55; // 55% to 110% of viewport
    const rotation = Math.floor(Math.random() * 16) - 8; // -8deg to 8deg skew/rotate
    
    return { width, height, color, opacity, duration, delay, direction, top, rotation };
  }, [isTop]);

  return (
    <div
      aria-hidden="true"
      className="absolute bar-animation"
      style={{
        width: config.width,
        height: config.height,
        background: config.color,
        opacity: config.opacity,
        top: `${config.top}%`,
        borderRadius: "4px",
        zIndex: Math.floor(Math.random() * 3) + 1,
        "--duration": `${config.duration}s`,
        "--delay": `${config.delay}s`,
        "--distance": config.direction === 1 ? "160vw" : "-160vw",
        "--start-x": config.direction === 1 ? "-60vw" : "160vw",
        "--rotation": `${config.rotation}deg`,
      } as any}
    />
  );
};

export default function SocialProofHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const topBars = useMemo(() => Array.from({ length: 15 }, (_, i) => i), []);
  const bottomBars = useMemo(() => Array.from({ length: 15 }, (_, i) => i), []);

  return (
    <section 
      id="social-proof"
      className="relative w-full h-screen min-h-[500px] overflow-hidden bg-[#F0F0F0] snap-start"
      style={{ scrollSnapAlign: "start" }}
    >
      {/* ── GEOMETRIC BARS ── */}
      <div className="absolute inset-0 pointer-events-none">
        {topBars.map(id => <Bar key={`top-${id}`} id={id} isTop={true} />)}
        {bottomBars.map(id => <Bar key={`bottom-${id}`} id={id} isTop={false} />)}
      </div>

      {/* ── TESTIMONIAL CARD ── */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-[680px] px-8 text-center"
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <blockquote 
              className="font-medium text-[#1A1A2E] leading-[1.45] tracking-[-0.02em] mb-10"
              style={{ fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)" }}
            >
              “{TESTIMONIALS[index].quote}”
            </blockquote>

            <div className="flex items-center gap-3.5">
              <img 
                src={TESTIMONIALS[index].avatar} 
                alt="" 
                className="w-[44px] h-[44px] rounded-full object-cover"
              />
              <div className="text-left">
                <div className="font-medium text-[#1A1A2E] text-[15px]">
                  {TESTIMONIALS[index].author}
                </div>
                <div className="text-[#6B7280] text-[14px] font-normal">
                  {TESTIMONIALS[index].role}, {TESTIMONIALS[index].company}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drift {
          from { transform: translateX(var(--start-x)) rotate(var(--rotation)); }
          to { transform: translateX(var(--distance)) rotate(var(--rotation)); }
        }
        .bar-animation {
          animation: drift var(--duration) linear infinite;
          animation-delay: var(--delay);
        }
        @media (max-width: 768px) {
          .bar-animation {
            opacity: 0.6 !important;
            transform: scale(0.7) rotate(var(--rotation)) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bar-animation {
            animation: none !important;
          }
        }
        html {
          scroll-behavior: smooth;
        }
      `}} />
    </section>
  );
}
