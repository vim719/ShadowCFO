import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const SHARDS_DATA = [
  { w: 30, h: 140, opacity: 0.7, x: 0, color: "linear-gradient(180deg, #3B82F6, #22D3EE)" },
  { w: 45, h: 180, opacity: 0.5, x: 40, color: "linear-gradient(180deg, #6366F1, #3B82F6)" },
  { w: 25, h: 110, opacity: 0.8, x: 90, color: "linear-gradient(180deg, #22D3EE, #6366F1)" },
  { w: 55, h: 220, opacity: 0.4, x: 120, color: "linear-gradient(180deg, #3B82F6, #22D3EE)" },
  { w: 35, h: 160, opacity: 0.6, x: 180, color: "linear-gradient(180deg, #6366F1, #3B82F6)" },
  { w: 50, h: 240, opacity: 0.3, x: 230, color: "linear-gradient(180deg, #22D3EE, #6366F1)" },
  { w: 20, h: 120, opacity: 0.9, x: 290, color: "linear-gradient(180deg, #3B82F6, #22D3EE)" },
  { w: 40, h: 190, opacity: 0.5, x: 320, color: "linear-gradient(180deg, #6366F1, #3B82F6)" },
];

const TESTIMONIALS_DATA = [
  {
    quote: "Shadow CFO turned my messy books into a truly plug-and-play experience; it just worked with our banking stack out of the box. We stopped burning time on one-off reconciliation.",
    author: "Sharon Yeh",
    title: "Staff Product Manager, Deepgram",
    avatar: "https://i.pravatar.cc/150?u=sharon"
  },
  {
    quote: "Shadow CFO is the first AI that actually surfaces real money leaks. We found $4,200 in idle seats within the first 48 hours of connecting our accounts.",
    author: "Sarah Yeh",
    title: "Head of Operations, Stealth Startup",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  }
];

function ShardCluster({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className="relative w-full h-[320px] flex items-center justify-center overflow-hidden">
      <motion.div
        animate={{ x: reverse ? [-400, 400] : [400, -400] }}
        transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
        className="flex gap-1.5 items-end"
      >
        {[...SHARDS_DATA, ...SHARDS_DATA, ...SHARDS_DATA].map((s, i) => (
          <div
            key={i}
            className="rounded-[2px] shrink-0"
            style={{
              width: s.w,
              height: s.h,
              background: s.color,
              opacity: s.opacity,
              transform: `skewX(-18deg) translateY(${i % 3 === 0 ? "0px" : i % 3 === 1 ? "30px" : "60px"})`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default function SocialProofHero() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-[#F9FAFB] py-8">
      {/* ── TOP SHARD CLUSTER ── */}
      <div className="w-full">
        <ShardCluster />
      </div>

      {/* ── TESTIMONIAL SANDWICH ── */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            <blockquote className="text-[1.75rem] sm:text-[2rem] font-medium text-[#1F2937] leading-[1.4] mb-12 tracking-tight">
              “{TESTIMONIALS_DATA[index]?.quote.split("Shadow CFO").map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i < (TESTIMONIALS_DATA[index]?.quote.split("Shadow CFO").length || 0) - 1 && (
                    <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>SHADOW CFO</span>
                  )}
                </React.Fragment>
              ))}”
            </blockquote>

            <div className="flex items-center gap-4 text-left">
              <img
                src={TESTIMONIALS_DATA[index]?.avatar}
                alt={TESTIMONIALS_DATA[index]?.author}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div className="flex flex-col">
                <div className="font-bold text-[#111827] text-base leading-tight">
                  {TESTIMONIALS_DATA[index]?.author}
                </div>
                <div className="text-[#6B7280] text-[0.8125rem] font-medium mt-0.5">
                  {TESTIMONIALS_DATA[index]?.title}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BOTTOM SHARD CLUSTER ── */}
      <div className="w-full rotate-180">
        <ShardCluster reverse />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --accent-gold: #D4AF37;
        }
      `}} />
    </section>
  );
}
