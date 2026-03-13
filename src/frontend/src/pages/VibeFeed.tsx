import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Music2, Pause, Play, Plus, RefreshCw, Waves } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { VibeFeedEntry } from "../backend";
import { BottomNav } from "../components/BottomNav";
import { useCallerProfile, useVibeFeed } from "../hooks/useQueries";
import { usePlayerStore } from "../store/playerStore";
import { getMoodConfig } from "../utils/moodUtils";

function FeedCard({ entry, index }: { entry: VibeFeedEntry; index: number }) {
  const mood = getMoodConfig(entry.currentMood);
  const { queue, currentIndex, isPlaying, setQueue, toggle } = usePlayerStore();
  const currentSong = queue[currentIndex];
  const isThisSongPlaying =
    isPlaying &&
    currentSong &&
    entry.currentSong &&
    currentSong.previewUrl === entry.currentSong.previewUrl;

  const handlePlay = () => {
    if (!entry.currentSong?.previewUrl) return;
    if (
      currentSong &&
      currentSong.previewUrl === entry.currentSong.previewUrl
    ) {
      toggle();
    } else {
      setQueue([entry.currentSong], 0);
    }
  };

  return (
    <motion.div
      data-ocid={`feed.item.${index + 1}`}
      className="glass-card rounded-2xl p-4 border border-border/30 transition-all duration-200 hover:border-primary/20"
      style={{ boxShadow: `0 0 20px ${mood.glowColor.replace("0.6", "0.15")}` }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar orb */}
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${mood.glowColor.replace(
              "0.6",
              "0.5",
            )}, oklch(0.15 0.05 285))`,
            boxShadow: `0 0 16px ${mood.glowColor.replace("0.6", "0.4")}`,
          }}
        >
          {entry.username.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{entry.username}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full bg-muted/40 ${mood.textColor}`}
            >
              {mood.emoji} {mood.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mood.description}
          </p>

          {entry.currentSong && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-border/30">
              {entry.currentSong.artworkUrl ? (
                <img
                  src={entry.currentSong.artworkUrl}
                  alt={entry.currentSong.title}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Music2 size={14} className="text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">
                  {entry.currentSong.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {entry.currentSong.artist}
                </p>
              </div>
              {/* Play/Pause or Waveform */}
              <div className="ml-auto flex-shrink-0 flex items-center">
                {entry.currentSong.previewUrl ? (
                  <motion.button
                    data-ocid={`feed.item.${index + 1}.toggle`}
                    onClick={handlePlay}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isThisSongPlaying
                        ? mood.glowColor.replace("0.6", "0.3")
                        : "oklch(0.25 0.04 285 / 0.6)",
                      boxShadow: isThisSongPlaying
                        ? `0 0 10px ${mood.glowColor.replace("0.6", "0.5")}`
                        : "none",
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.88 }}
                    aria-label={isThisSongPlaying ? "Pause" : "Play"}
                  >
                    {isThisSongPlaying ? (
                      <Pause size={12} className="text-white" />
                    ) : (
                      <Play size={12} className="text-white ml-0.5" />
                    )}
                  </motion.button>
                ) : (
                  <div className="flex items-end gap-0.5">
                    {[1, 2, 3, 4].map((b) => (
                      <div
                        key={b}
                        className={`w-0.5 rounded-full ${mood.textColor.replace("text-", "bg-")}`}
                        style={{
                          height: `${6 + b * 3}px`,
                          animation: `waveform ${0.5 + b * 0.15}s ease-in-out infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function VibeFeedPage() {
  const navigate = useNavigate();
  const { data: feed, isLoading, isError, refetch, isFetching } = useVibeFeed();
  const { data: profile } = useCallerProfile();
  const [tab, setTab] = useState<"everyone" | "mine">("everyone");

  const displayFeed =
    tab === "mine" && profile
      ? (feed ?? []).filter((e) => e.username === profile.username)
      : (feed ?? []);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-2xl font-black">
            <span className="text-gradient">VIBE</span>
            <span className="text-foreground">CHAIN</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw
                size={16}
                className={isFetching ? "animate-spin" : ""}
              />
            </Button>
            <Button
              onClick={() => navigate({ to: "/mood" })}
              data-ocid="feed.change_vibe_button"
              size="sm"
              className="text-sm"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
              }}
            >
              <Waves size={14} className="mr-1" />
              Change My Vibe
            </Button>
          </div>
        </div>

        {/* Tab toggle — only shown when authenticated */}
        {profile && (
          <div className="max-w-2xl mx-auto mt-3">
            <div className="inline-flex rounded-full p-0.5 bg-muted/30 border border-border/30 backdrop-blur-sm">
              <button
                type="button"
                data-ocid="feed.everyone_tab"
                onClick={() => setTab("everyone")}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  tab === "everyone"
                    ? "text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={
                  tab === "everyone"
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
                        boxShadow: "0 0 12px oklch(0.55 0.26 295 / 0.4)",
                      }
                    : {}
                }
              >
                Everyone
              </button>
              <button
                type="button"
                data-ocid="feed.my_vibes_tab"
                onClick={() => setTab("mine")}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  tab === "mine"
                    ? "text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={
                  tab === "mine"
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
                        boxShadow: "0 0 12px oklch(0.55 0.26 295 / 0.4)",
                      }
                    : {}
                }
              >
                My Vibes
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-3" data-ocid="feed.loading_state">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="glass-card rounded-2xl p-4 flex gap-3">
                <Skeleton className="w-12 h-12 rounded-full shimmer" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 shimmer" />
                  <Skeleton className="h-3 w-48 shimmer" />
                  <Skeleton className="h-12 w-full rounded-xl shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20" data-ocid="feed.error_state">
            <p className="text-destructive mb-4">
              Could not load the vibe feed
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : tab === "mine" &&
          profile &&
          displayFeed.length === 0 &&
          !isLoading ? (
          <motion.div
            data-ocid="feed.empty_state"
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="font-display text-xl font-bold mb-2">
              You haven't shared a vibe yet
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Let the world feel your frequency
            </p>
            <Button
              onClick={() => navigate({ to: "/mood" })}
              data-ocid="feed.share_vibe_button"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
              }}
            >
              Share My Vibe
            </Button>
          </motion.div>
        ) : !feed || feed.length === 0 ? (
          <motion.div
            data-ocid="feed.empty_state"
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-6xl mb-4">🌊</div>
            <h3 className="font-display text-xl font-bold mb-2">
              The vibe space is quiet
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Be the first soul to share your frequency
            </p>
            <Button
              onClick={() => navigate({ to: "/mood" })}
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
              }}
            >
              Share My Vibe
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3" data-ocid="feed.list">
            <AnimatePresence>
              {displayFeed.slice(0, 20).map((entry, i) => (
                <FeedCard
                  key={`${entry.username}-${i}`}
                  entry={entry}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* FAB */}
      <motion.button
        data-ocid="feed.add_vibe_button"
        onClick={() => navigate({ to: "/mood" })}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl glow-accent"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Add my vibe"
      >
        <Plus size={24} className="text-white" />
      </motion.button>

      <BottomNav />
    </div>
  );
}
