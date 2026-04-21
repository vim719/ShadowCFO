import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const SHARDS_DATA = [
  { w: 40, h: 120, opacity: 0.6, blur: 0, x: 0, color: "linear-gradient(180deg, #3B82F6, #22D3EE)" },
  { w: 60, h: 180, opacity: 0.4, blur: 0, x: 80, color: "linear-gradient(180deg, #6366F1, #3B82F6)" },
  { w: 30, h: 100, opacity: 0.7, blur: 0, x: 160, color: "linear-gradient(180deg, #22D3EE, #6366F1)" },
  { w: 80, h: 200, opacity: 0.3, blur: 0, x: 220, color: "linear-gradient(180deg, #3B82F6, #22D3EE)" },
  { w: 45, h: 140, opacity: 0.5, blur: 0, x: 300, color: "linear-gradient(180deg, #6366F1, #3B82F6)" },
  { w: 70, h: 220, opacity: 0.2, blur: 0, x: 400, color: "linear-gradient(180deg, #22D3EE, #6366F1)" },
  { w: 35, h: 110, opacity: 0.8, blur: 0, x: 500, color: "linear-gradient(180deg, #3B82F6, #22D3EE)" },
  { w: 55, h: 160, opacity: 0.4, blur: 0, x: 580, color: "linear-gradient(180deg, #6366F1, #3B82F6)" },
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
    <div className="relative w-full h-[300px] flex items-center justify-center overflow-hidden">
      <motion.div
        animate={{ x: reverse ? [-600, 600] : [600, -600] }}
        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
        className="flex gap-2 items-end"
      >
        {[...SHARDS_DATA, ...SHARDS_DATA].map((s, i) => (
          <div
            key={i}
            className="rounded-sm shrink-0 shadow-lg"
            style={{
              width: s.w,
              height: s.h,
              background: s.color,
              opacity: s.opacity,
              transform: `skewX(-15deg) translateY(${i % 2 === 0 ? "0px" : "40px"})`,
              mixBlendMode: "multiply",
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
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-[#F3F4F6] py-10">
      {/* ── TOP SHARD CLUSTER (WATERFALL) ── */}
      <div className="w-full">
        <ShardCluster />
      </div>

      {/* ── TESTIMONIAL SANDWICH ── */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >
            <blockquote className="text-2xl sm:text-3xl font-medium text-[#1F2937] leading-relaxed mb-10 tracking-tight">
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
                className="w-12 h-12 rounded-full object-cover grayscale-[0.2]"
              />
              <div>
                <div className="font-bold text-[#111827] leading-tight">
                  {TESTIMONIALS_DATA[index]?.author}
                </div>
                <div className="text-[#6B7280] text-sm font-medium">
                  {TESTIMONIALS_DATA[index]?.title}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BOTTOM SHARD CLUSTER (WATERFALL) ── */}
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
