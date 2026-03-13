import { Music2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePlayerStore } from "../store/playerStore";

export function MiniPlayer() {
  const { queue, currentIndex, isPlaying, progress, toggle, next, prev } =
    usePlayerStore();

  const song = queue[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;

  return (
    <AnimatePresence>
      {queue.length > 0 && song && (
        <motion.div
          data-ocid="miniplayer.panel"
          className="fixed bottom-16 left-0 right-0 z-50 px-3 pb-2"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
        >
          <div
            className="relative rounded-2xl overflow-hidden border border-white/10"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.14 0.03 295 / 0.95) 0%, oklch(0.12 0.05 295 / 0.98) 100%)",
              backdropFilter: "blur(24px)",
              boxShadow:
                "0 -2px 24px oklch(0.62 0.26 295 / 0.15), 0 8px 32px oklch(0 0 0 / 0.4)",
            }}
          >
            {/* Content row */}
            <div className="flex items-center gap-3 px-3 py-2.5 h-[68px]">
              {/* Album art */}
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted/40">
                {song.artworkUrl ? (
                  <img
                    src={song.artworkUrl}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={16} className="text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight truncate text-white">
                  {song.title}
                </p>
                <p className="text-xs text-white/50 truncate mt-0.5">
                  {song.artist}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  data-ocid="miniplayer.prev_button"
                  onClick={prev}
                  disabled={!hasPrev}
                  aria-label="Previous song"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <SkipBack size={16} />
                </button>

                <button
                  type="button"
                  data-ocid="miniplayer.toggle"
                  onClick={toggle}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-white transition-all"
                  style={{
                    background: isPlaying
                      ? "oklch(0.62 0.26 295)"
                      : "oklch(0.55 0.22 295)",
                    boxShadow: isPlaying
                      ? "0 0 16px oklch(0.62 0.26 295 / 0.6)"
                      : "none",
                  }}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <button
                  type="button"
                  data-ocid="miniplayer.next_button"
                  onClick={next}
                  disabled={!hasNext}
                  aria-label="Next song"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>

            {/* Linear progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
              <div
                className="h-full bg-primary transition-[width] duration-300 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
