import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowParticles from "@/components/shared/GlowParticles";
import CounterAnimation from "@/components/shared/CounterAnimation";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.65], [1, 0.88]);
  const y = useTransform(scrollYProgress, [0, 0.65], [0, 80]);
  const ringScale = useTransform(scrollYProgress, [0, 0.65], [1, 1.4]);
  const ringOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Particle mesh */}
      <GlowParticles count={65} />

      {/* ── PORTAL: concentric glow rings ── */}
      <motion.div
        style={{ scale: ringScale, opacity: ringOpacity }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        {/* Outer ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(900px, 120vw)",
            height: "min(900px, 120vw)",
            border: "1px solid rgba(0,198,224,0.06)",
            boxShadow: "0 0 80px rgba(0,198,224,0.04) inset",
          }}
        />
        {/* Mid ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(640px, 90vw)",
            height: "min(640px, 90vw)",
            border: "1px solid rgba(0,198,224,0.1)",
            boxShadow: "0 0 60px rgba(0,198,224,0.06) inset",
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(420px, 70vw)",
            height: "min(420px, 70vw)",
            border: "1px solid rgba(0,198,224,0.18)",
            boxShadow: "0 0 120px rgba(0,198,224,0.08) inset",
          }}
        />
        {/* Core glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(280px, 60vw)",
            height: "min(280px, 60vw)",
            background:
              "radial-gradient(ellipse at center, rgba(0,198,224,0.12) 0%, rgba(0,198,224,0.04) 50%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* Perspective grid floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--bg-base) 100%)",
          zIndex: 1,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden"
        style={{ height: "260px", zIndex: 0 }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "-20%",
            right: "-20%",
            height: "260px",
            backgroundImage:
              "linear-gradient(rgba(0,198,224,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,198,224,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            transform: "perspective(300px) rotateX(60deg)",
            transformOrigin: "bottom center",
            opacity: 0.6,
          }}
        />
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--bg-base))",
          zIndex: 2,
        }}
      />

      <motion.div
        style={{ opacity, scale, y, zIndex: 10 }}
        className="relative flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto"
      >
        {/* Label chip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 mb-8"
          style={{ position: "relative", zIndex: 10 }}
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(0,198,224,0.08)",
              border: "1px solid rgba(0,198,224,0.28)",
              color: "var(--accent-cyan)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.1em",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--accent-cyan)" }}
            />
            YOUR SHADOW CFO IS WATCHING
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-display-xl mb-6"
          style={{ color: "var(--text-primary)", position: "relative", zIndex: 10 }}
        >
          Your accounts are
          <br />
          <span style={{ color: "var(--accent-cyan)", textShadow: "0 0 40px rgba(0,198,224,0.4)" }}>
            bleeding{" "}
            <CounterAnimation target={347} prefix="$" suffix="/mo" duration={2400} />
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-base sm:text-lg max-w-xl mb-10 leading-relaxed"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", position: "relative", zIndex: 10 }}
        >
          Shadow CFO scans your statements, surfaces the highest-confidence money
          leaks, and turns them into guided fixes — explaining every move before
          you make it.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center gap-3"
          style={{ position: "relative", zIndex: 10 }}
        >
          <Button
            size="lg"
            onClick={onGetStarted}
            className="font-bold text-base h-13 px-9 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "var(--accent-cyan)",
              color: "var(--bg-base)",
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 40px rgba(0,198,224,0.35), 0 4px 16px rgba(0,0,0,0.4)",
              height: "3.25rem",
            }}
          >
            See What I Found
            <ArrowRight size={18} />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 px-6 text-base"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "0.75rem",
            }}
            onClick={() => {
              const el = document.querySelector("#how-it-works");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            How it works
          </Button>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="flex flex-wrap items-center justify-center gap-5 mt-12"
          style={{ position: "relative", zIndex: 10 }}
        >
          {[
            "🔒 Read-only access",
            "⚡ ACH-grade rails",
            "📋 Consent logged",
          ].map((item) => (
            <span
              key={item}
              className="text-xs"
              style={{ color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}
            >
              {item}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        style={{ color: "var(--text-subtle)", zIndex: 10 }}
      >
        <ChevronDown size={20} />
      </motion.div>
    </section>
  );
}
