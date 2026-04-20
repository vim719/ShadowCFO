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

export default function SocialProofHero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-32 bg-white">
      {/* ── FLYING COLORS (Geometric Shards) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Shard Cluster Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[40%]">
          {[
            { color: "var(--accent-cyan)", delay: 0, x: -150, y: -20, rotate: -15, width: 300, height: 100, opacity: 0.05 },
            { color: "var(--accent-solv)", delay: 2, x: 50, y: 30, rotate: -15, width: 250, height: 80, opacity: 0.03 },
            { color: "var(--accent-cyan)", delay: 4, x: -300, y: 80, rotate: -15, width: 400, height: 120, opacity: 0.02 },
          ].map((s, i) => (
            <motion.div
              key={`top-${i}`}
              animate={{ 
                x: [s.x - 10, s.x + 10, s.x - 10], 
                y: [s.y - 10, s.y + 10, s.y - 10],
                rotate: [s.rotate - 1, s.rotate + 1, s.rotate - 1]
              }}
              transition={{ repeat: Infinity, duration: 8 + s.delay, ease: "easeInOut" }}
              className="absolute blur-2xl"
              style={{
                left: `calc(50% + ${s.x}px)`,
                top: `${s.y}px`,
                width: `${s.width}px`,
                height: `${s.height}px`,
                background: s.color,
                opacity: s.opacity,
                transform: `rotate(${s.rotate}deg) skewX(-20deg)`,
                borderRadius: "20px",
              }}
            />
          ))}
        </div>

        {/* Shard Cluster Bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[40%]">
          {[
            { color: "var(--accent-amber)", delay: 1, x: 100, y: -50, rotate: 15, width: 350, height: 90, opacity: 0.04 },
            { color: "var(--accent-gold)", delay: 3, x: -200, y: -20, rotate: 15, width: 300, height: 110, opacity: 0.03 },
            { color: "var(--accent-amber)", delay: 5, x: 250, y: 20, rotate: 15, width: 450, height: 130, opacity: 0.02 },
          ].map((s, i) => (
            <motion.div
              key={`bottom-${i}`}
              animate={{ 
                x: [s.x - 12, s.x + 12, s.x - 12], 
                y: [s.y - 12, s.y + 12, s.y - 12],
                rotate: [s.rotate - 1, s.rotate + 1, s.rotate - 1]
              }}
              transition={{ repeat: Infinity, duration: 10 + s.delay, ease: "easeInOut" }}
              className="absolute blur-2xl"
              style={{
                left: `calc(50% + ${s.x}px)`,
                bottom: `${Math.abs(s.y)}px`,
                width: `${s.width}px`,
                height: `${s.height}px`,
                background: s.color,
                opacity: s.opacity,
                transform: `rotate(${s.rotate}deg) skewX(20deg)`,
                borderRadius: "20px",
              }}
            />
          ))}
        </div>
        
        {/* Subtle radial center glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,112,243,0.01)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Massive Bold Intro */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <h1 className="text-[clamp(3.5rem,10vw,8rem)] font-black tracking-tighter leading-[0.9] text-slate-900 mb-10 uppercase">
            Meet Your <br />
            <span className="inline-block mt-2" style={{ color: "var(--accent-gold)", textShadow: "0 10px 40px rgba(212,175,55,0.2)" }}>
              SHADOW CFO
            </span>
          </h1>
          <div className="w-24 h-1.5 bg-slate-900 mx-auto mb-10 rounded-full" />
        </motion.div>

        {/* Vertical Testimonial & Feature Loop */}
        <div className="relative h-[500px] overflow-hidden mask-fade-y">
          <motion.div
            animate={{ y: [0, -2000] }}
            transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
            className="flex flex-col gap-20"
          >
            {[...TESTIMONIALS, ...FEATURES, ...TESTIMONIALS, ...FEATURES, ...TESTIMONIALS].map((item, i) => {
              const isFeature = typeof item === "string";
              return (
                <div key={i} className="py-4">
                  {isFeature ? (
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-300 tracking-tight leading-tight uppercase">
                      {item.split("Shadow CFO").map((part, index) => (
                        <React.Fragment key={index}>
                          {part}
                          {index < item.split("Shadow CFO").length - 1 && (
                            <span className="text-5xl sm:text-6xl" style={{ color: "var(--accent-gold)" }}>SHADOW CFO</span>
                          )}
                        </React.Fragment>
                      ))}
                    </h2>
                  ) : (
                    <div className="max-w-4xl mx-auto">
                      <p className="text-5xl sm:text-7xl font-black text-slate-900 mb-6 leading-[0.95] tracking-tighter">
                        "{item.text.split("Shadow CFO").map((part, index) => (
                          <React.Fragment key={index}>
                            {part}
                            {index < item.text.split("Shadow CFO").length - 1 && (
                              <span style={{ color: "var(--accent-gold)" }}>SHADOW CFO</span>
                            )}
                          </React.Fragment>
                        ))}"
                      </p>
                      <cite className="text-xl font-black uppercase tracking-[0.2em] text-slate-400 not-italic">
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-24 flex flex-col items-center gap-6"
        >
          <span className="text-sm font-black uppercase tracking-[0.4em] text-slate-900">Scroll to Audit Leaks</span>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-24 bg-gradient-to-b from-slate-900 to-transparent" 
          />
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
