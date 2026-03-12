import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { MoodOrbs } from "../components/MoodOrbs";

export function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Hero background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/assets/generated/vibechain-hero-bg.dim_1920x1080.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-background/60" />

      <MoodOrbs />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-full glass border border-primary/30 text-primary mb-6">
            Feel the frequency
          </span>
          <h1 className="font-display text-6xl sm:text-8xl font-black tracking-tight leading-none">
            <span className="text-gradient">VIBE</span>
            <span className="text-foreground">CHAIN</span>
          </h1>
        </motion.div>

        <motion.p
          className="text-xl sm:text-2xl text-muted-foreground font-light max-w-lg mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          Feel the frequency.{" "}
          <span className="text-foreground font-medium italic">
            Share your soul.
          </span>
        </motion.p>

        <motion.p
          className="text-sm text-muted-foreground/70 max-w-md mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          Where moods and music replace followers and filters. Connect
          emotionally through real-time vibe circles — no judgment, only genuine
          bonds.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <Link
            to="/login"
            data-ocid="landing.enter_button"
            className="px-8 py-4 rounded-xl font-semibold text-lg text-accent-foreground transition-all duration-200 hover:scale-105 active:scale-95 glow-accent"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
            }}
          >
            Enter the Vibe
          </Link>
          <Link
            to="/signup"
            data-ocid="landing.join_button"
            className="px-8 py-4 rounded-xl font-semibold text-lg glass border border-primary/50 text-foreground hover:border-primary hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Join VIBECHAIN
          </Link>
        </motion.div>

        {/* Mood preview pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
        >
          {[
            "😄 Happy",
            "😢 Sad",
            "⚡ Energetic",
            "🌊 Calm",
            "🌙 Melancholic",
            "🔥 Angry",
            "💜 Romantic",
            "🌀 Anxious",
          ].map((mood) => (
            <span
              key={mood}
              className="px-3 py-1 text-xs rounded-full glass border border-border/50 text-muted-foreground"
            >
              {mood}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="absolute bottom-6 text-center text-xs text-muted-foreground/50 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </motion.footer>
    </div>
  );
}
