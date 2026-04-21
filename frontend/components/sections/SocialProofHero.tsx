import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const SHARDS_DATA = [
  { w: 12, h: 140, opacity: 0.8, color: "linear-gradient(180deg, #3B82F6, #22D3EE)" },
  { w: 22, h: 180, opacity: 0.5, color: "linear-gradient(180deg, #6366F1, #3B82F6)" },
  { w: 10, h: 110, opacity: 0.9, color: "linear-gradient(180deg, #22D3EE, #6366F1)" },
  { w: 18, h: 220, opacity: 0.4, color: "linear-gradient(180deg, #3B82F6, #22D3EE)" },
  { w: 14, h: 160, opacity: 0.7, color: "linear-gradient(180deg, #6366F1, #3B82F6)" },
  { w: 25, h: 240, opacity: 0.3, color: "linear-gradient(180deg, #22D3EE, #6366F1)" },
  { w: 8, h: 120, opacity: 0.9, color: "linear-gradient(180deg, #3B82F6, #22D3EE)" },
  { w: 20, h: 190, opacity: 0.6, color: "linear-gradient(180deg, #6366F1, #3B82F6)" },
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
        animate={{ x: reverse ? [-300, 300] : [300, -300] }}
        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
        className="flex gap-1.5 items-end px-20"
      >
        {[...SHARDS_DATA, ...SHARDS_DATA, ...SHARDS_DATA, ...SHARDS_DATA].map((s, i) => (
          <div
            key={i}
            className="rounded-full shrink-0"
            style={{
              width: s.w,
              height: s.h,
              background: s.color,
              opacity: s.opacity,
              transform: `skewX(-15deg) translateY(${i % 4 === 0 ? "0px" : i % 4 === 1 ? "40px" : i % 4 === 2 ? "20px" : "60px"})`,
              filter: "blur(0.5px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
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
    <section className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-[#F9FAFB] py-10">
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
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            <blockquote className="text-[1.85rem] sm:text-[2.1rem] font-bold text-[#111827] leading-[1.3] mb-12 tracking-tight max-w-2xl">
              “{TESTIMONIALS_DATA[index]?.quote.split("Shadow CFO").map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i < (TESTIMONIALS_DATA[index]?.quote.split("Shadow CFO").length || 0) - 1 && (
                    <span style={{ color: "var(--accent-gold)", fontWeight: 900 }}>SHADOW CFO</span>
                  )}
                </React.Fragment>
              ))}”
            </blockquote>

            <div className="flex items-center gap-4 text-left">
              <img
                src={TESTIMONIALS_DATA[index]?.avatar}
                alt={TESTIMONIALS_DATA[index]?.author}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
              />
              <div className="flex flex-col">
                <div className="font-extrabold text-[#111827] text-[1.05rem] leading-tight">
                  {TESTIMONIALS_DATA[index]?.author}
                </div>
                <div className="text-[#6B7280] text-[0.875rem] font-semibold mt-1">
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
