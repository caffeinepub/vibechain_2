import { Music2, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { audioManager, usePlayerStore } from "../store/playerStore";

export function MiniPlayer() {
  const {
    queue,
    currentIndex,
    isPlaying,
    progress,
    duration,
    toggle,
    next,
    prev,
    clearPlayer,
  } = usePlayerStore();

  const song = queue[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;

  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  const getRatio = (e: React.MouseEvent | React.TouchEvent) => {
    if (!barRef.current) return null;
    const rect = barRef.current.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const doSeek = (ratio: number) => {
    if (duration > 0) audioManager.seek(ratio * duration);
  };

  const fmt = (s: number) => {
    if (!s || !Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const currentTime = progress * duration;
  const displayRatio = hoverRatio !== null ? hoverRatio : progress;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") doSeek(Math.min(1, progress + 0.05));
    if (e.key === "ArrowLeft") doSeek(Math.max(0, progress - 0.05));
  };

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

              {/* Time */}
              <div className="text-xs text-white/40 font-mono flex-shrink-0 tabular-nums select-none">
                {fmt(currentTime)}&nbsp;/&nbsp;{fmt(duration)}
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

                {/* Close / dismiss button */}
                <button
                  type="button"
                  data-ocid="miniplayer.close_button"
                  onClick={clearPlayer}
                  aria-label="Close player"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all ml-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Seekable progress bar */}
            <div
              ref={barRef}
              data-ocid="miniplayer.canvas_target"
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="relative h-[8px] bg-white/10 cursor-pointer select-none"
              onClick={(e) => {
                const r = getRatio(e);
                if (r !== null) doSeek(r);
              }}
              onKeyDown={handleKeyDown}
              onMouseMove={(e) => {
                setHoverRatio(getRatio(e));
                if (isDragging) {
                  const r = getRatio(e);
                  if (r !== null) doSeek(r);
                }
              }}
              onMouseDown={(e) => {
                setIsDragging(true);
                const r = getRatio(e);
                if (r !== null) doSeek(r);
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => {
                setHoverRatio(null);
                setIsDragging(false);
              }}
              onTouchStart={(e) => {
                const r = getRatio(e);
                if (r !== null) doSeek(r);
              }}
              onTouchMove={(e) => {
                const r = getRatio(e);
                if (r !== null) doSeek(r);
              }}
            >
              {/* Buffer shimmer */}
              <div
                className="absolute left-0 top-0 h-full bg-white/10 animate-pulse rounded-r-full transition-[width] duration-500"
                style={{ width: `${Math.min(progress * 100 + 12, 100)}%` }}
              />

              {/* Played fill */}
              <div
                className="absolute left-0 top-0 h-full rounded-r-full transition-[width] duration-100 ease-linear"
                style={{
                  width: `${displayRatio * 100}%`,
                  background: "oklch(0.62 0.26 295)",
                  boxShadow: "0 0 8px oklch(0.62 0.26 295 / 0.7)",
                }}
              />

              {/* Seek thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md pointer-events-none transition-opacity duration-150"
                style={{
                  left: `calc(${displayRatio * 100}% - 7px)`,
                  opacity: hoverRatio !== null || isDragging ? 1 : 0,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
