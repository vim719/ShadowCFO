import React from "react";
import { motion } from "framer-motion";

const TESTIMONIALS = [
  { text: "The most powerful financial tool I've ever used.", author: "Sarah C., CEO" },
  { text: "Shadow CFO found $1,200 in leaks in the first 5 minutes.", author: "James T., Founder" },
  { text: "Finally, an AI that actually executes on my data.", author: "Elena R., Operations" },
  { text: "Shadow CFO is my secret weapon for capital efficiency.", author: "Michael B., VC" },
  { text: "No more spreadsheets. Just autonomous financial growth.", author: "David L., Serial Entrepreneur" },
];

const FEATURES = [
  "Shadow CFO scans 11,000+ banks in seconds.",
  "Shadow CFO surfaces duplicate and idle subscriptions.",
  "Shadow CFO routes idle cash to high-yield destinations.",
  "Shadow CFO logs every consent for audit-ready compliance.",
];

const SHARDS_TOP = [
  { color: "linear-gradient(90deg, #0070F3, #7928CA)", width: 400, x: 0 },
  { color: "linear-gradient(90deg, #3291FF, #00C896)", width: 300, x: 500 },
  { color: "linear-gradient(90deg, #7928CA, #0070F3)", width: 450, x: 900 },
  { color: "linear-gradient(90deg, #00C896, #3291FF)", width: 350, x: 1500 },
];

const SHARDS_BOTTOM = [
  { color: "linear-gradient(90deg, #F0A500, #D4AF37)", width: 400, x: 200 },
  { color: "linear-gradient(90deg, #D4AF37, #F0A500)", width: 350, x: 700 },
  { color: "linear-gradient(90deg, #F0A500, #D4AF37)", width: 500, x: 1200 },
  { color: "linear-gradient(90deg, #D4AF37, #F0A500)", width: 300, x: 1800 },
];

export default function SocialProofHero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white">
      {/* ── COMPOSIO STYLE FLYING BARS (SHARDS) ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Shards Ticker */}
        <div className="absolute top-12 left-0 w-full h-32 overflow-hidden">
          <motion.div
            animate={{ x: [0, -2000] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex gap-20 whitespace-nowrap"
          >
            {[...SHARDS_TOP, ...SHARDS_TOP].map((shard, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl blur-[2px] opacity-20"
                style={{
                  width: shard.width,
                  background: shard.color,
                  transform: "skewX(-25deg)",
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Bottom Shards Ticker */}
        <div className="absolute bottom-12 left-0 w-full h-32 overflow-hidden">
          <motion.div
            animate={{ x: [-2000, 0] }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            className="flex gap-20 whitespace-nowrap"
          >
            {[...SHARDS_BOTTOM, ...SHARDS_BOTTOM].map((shard, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl blur-[2px] opacity-20"
                style={{
                  width: shard.width,
                  background: shard.color,
                  transform: "skewX(25deg)",
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col items-center justify-center min-h-[60vh]">
        {/* Massive Bold Intro */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-black tracking-tighter leading-[0.9] text-slate-900 uppercase">
            Meet Your <br />
            <span className="inline-block mt-2" style={{ color: "var(--accent-gold)" }}>
              SHADOW CFO
            </span>
          </h1>
        </motion.div>

        {/* Vertical Testimonial Sandwich */}
        <div className="w-full relative h-[300px] flex items-center justify-center overflow-hidden mask-fade-y">
          <div className="absolute inset-x-0 top-0 h-px bg-slate-100" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-slate-100" />
          
          <motion.div
            animate={{ y: [0, -1500] }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            className="flex flex-col items-center gap-24"
          >
            {[...TESTIMONIALS, ...FEATURES, ...TESTIMONIALS, ...FEATURES].map((item, i) => {
              const isFeature = typeof item === "string";
              return (
                <div key={i} className="text-center px-4">
                  {isFeature ? (
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Core Feature</div>
                      <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-tight uppercase max-w-4xl">
                        {item.split("Shadow CFO").map((part, index) => (
                          <React.Fragment key={index}>
                            {part}
                            {index < item.split("Shadow CFO").length - 1 && (
                              <span style={{ color: "var(--accent-gold)" }}>SHADOW CFO</span>
                            )}
                          </React.Fragment>
                        ))}
                      </h2>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto">
                      <div className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Testimonial</div>
                      <p className="text-5xl sm:text-7xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tighter">
                        "{item.text.split("Shadow CFO").map((part, index) => (
                          <React.Fragment key={index}>
                            {part}
                            {index < item.text.split("Shadow CFO").length - 1 && (
                              <span style={{ color: "var(--accent-gold)" }}>SHADOW CFO</span>
                            )}
                          </React.Fragment>
                        ))}"
                      </p>
                      <cite className="text-xl font-black uppercase tracking-[0.2em] text-slate-500 not-italic">
                        — {item.author}
                      </cite>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mt-16 flex flex-col items-center gap-4"
        >
          <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-900">Scroll to Audit Leaks</span>
          <div className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center">
             <div className="w-1 h-2 bg-slate-900 rounded-full animate-bounce" />
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mask-fade-y {
          mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
        }
      `}} />
    </section>
  );
}
