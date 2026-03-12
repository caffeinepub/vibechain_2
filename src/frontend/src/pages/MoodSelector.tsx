import { useNavigate } from "@tanstack/react-router";
import { Camera, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Mood } from "../backend";
import { BottomNav } from "../components/BottomNav";
import { useGetMusicSuggestions } from "../hooks/useQueries";
import { useVibeStore } from "../store/vibeStore";
import { MOOD_CONFIGS } from "../utils/moodUtils";

export function MoodSelectorPage() {
  const navigate = useNavigate();
  const [activeMood, setActiveMood] = useState<Mood | null>(null);
  const { mutateAsync: getMusicSuggestions, isPending } =
    useGetMusicSuggestions();
  const setMoodAndSongs = useVibeStore((s) => s.setMoodAndSongs);

  const handleMoodSelect = async (mood: Mood) => {
    setActiveMood(mood);
    try {
      const songs = await getMusicSuggestions(mood);
      setMoodAndSongs(mood, songs);
      navigate({ to: "/pick-song" });
    } catch {
      toast.error("Could not load music suggestions. Try again.");
      setActiveMood(null);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-gradient">
            How are you feeling?
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Pick your vibe and we'll find your soundtrack
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Detect My Vibe button */}
        <motion.button
          data-ocid="mood.detect_button"
          onClick={() => navigate({ to: "/detect-mood" })}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full glass-card rounded-2xl px-5 py-4 flex items-center gap-4 border border-violet-500/30 hover:border-violet-500/60 transition-all relative overflow-hidden group"
          style={{
            boxShadow: "0 0 20px oklch(0.65 0.25 290 / 0.2)",
          }}
        >
          {/* Pulsing glow background */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, oklch(0.65 0.25 290 / 0.15) 0%, transparent 70%)",
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-violet-500/20 border border-violet-500/30 shrink-0">
            <Camera className="w-5 h-5 text-violet-300" />
          </div>
          <div className="relative text-left">
            <p className="font-semibold text-foreground">
              Detect My Vibe with Camera
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Let AI read your facial expression
            </p>
          </div>
          <motion.div
            className="relative ml-auto text-violet-400"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            →
          </motion.div>
        </motion.button>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {MOOD_CONFIGS.map((config, i) => {
            const isLoading = isPending && activeMood === config.mood;
            return (
              <motion.button
                key={config.mood}
                data-ocid={`mood.item.${i + 1}`}
                onClick={() => !isPending && handleMoodSelect(config.mood)}
                disabled={isPending}
                className={`relative glass-card rounded-2xl p-5 text-left transition-all duration-200 border ${
                  config.borderColor
                } hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden`}
                style={{
                  boxShadow:
                    activeMood === config.mood
                      ? `0 0 30px ${config.glowColor}`
                      : undefined,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 + 0.1, duration: 0.4 }}
                whileHover={{ scale: isPending ? 1 : 1.03 }}
                whileTap={{ scale: isPending ? 1 : 0.97 }}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} rounded-2xl`}
                />

                <div className="relative">
                  <div className="text-3xl mb-2">
                    {isLoading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    ) : (
                      config.emoji
                    )}
                  </div>
                  <div
                    className={`font-display text-lg font-bold ${config.textColor}`}
                  >
                    {config.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">
                    {config.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
