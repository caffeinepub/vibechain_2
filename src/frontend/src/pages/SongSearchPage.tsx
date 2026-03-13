import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Clock,
  Music2,
  Pause,
  Play,
  SearchIcon,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Song } from "../backend";
import { BottomNav } from "../components/BottomNav";
import { useSetMood } from "../hooks/useQueries";
import { useSearchHistory } from "../hooks/useSearchHistory";
import { usePlayerStore } from "../store/playerStore";
import { useVibeStore } from "../store/vibeStore";

interface ItunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl?: string;
}

function toSong(r: ItunesResult): Song {
  return {
    trackId: BigInt(r.trackId),
    title: r.trackName,
    artist: r.artistName,
    artworkUrl: r.artworkUrl100,
    previewUrl: r.previewUrl ?? "",
  };
}

export function SongSearchPage() {
  const navigate = useNavigate();
  const { selectedMood } = useVibeStore();
  const { mutateAsync: setMood, isPending: isSettingMood } = useSetMood();
  const { setQueue, isPlaying, queue, currentIndex } = usePlayerStore();
  const { history, addToHistory, removeFromHistory, clearHistory } =
    useSearchHistory();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [settingVibeId, setSettingVibeId] = useState<bigint | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSong = queue[currentIndex];

  const searchItunes = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setHasSearched(false);
      setHasError(false);
      return;
    }
    setIsLoading(true);
    setHasError(false);
    setHasSearched(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=25`,
      );
      if (!res.ok) throw new Error("iTunes API error");
      const data = await res.json();
      const songs = (data.results as ItunesResult[]).map(toSong);
      setResults(songs);
      if (songs.length > 0) {
        addToHistory(term.trim());
      }
    } catch {
      setHasError(true);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchItunes(val), 400);
  };

  const handleHistoryItem = (item: string) => {
    handleInput(item);
    setQuery(item);
  };

  const togglePlay = (song: Song, index: number) => {
    if (!song.previewUrl) return;
    const isCurrent = currentSong?.trackId === song.trackId;
    if (isCurrent && isPlaying) {
      usePlayerStore.getState().pause();
    } else if (isCurrent && !isPlaying) {
      usePlayerStore.getState().play();
    } else {
      setQueue(results, index);
    }
  };

  const handleSetVibe = async (song: Song) => {
    if (!selectedMood) {
      toast.error("Pick a mood first 🎭");
      navigate({ to: "/mood" });
      return;
    }
    setSettingVibeId(song.trackId);
    usePlayerStore.getState().pause();
    try {
      await setMood({ mood: selectedMood, song });
      toast.success("Vibe set! Your soul speaks. 🎵");
      navigate({ to: "/feed" });
    } catch {
      toast.error("Failed to set vibe. Try again.");
    } finally {
      setSettingVibeId(null);
    }
  };

  const showHistory = !hasSearched && !isLoading && history.length > 0;
  const showIdlePrompt = !hasSearched && !isLoading && history.length === 0;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <SearchIcon size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold leading-none">
                Song Search
              </h1>
              <p className="text-muted-foreground text-xs mt-0.5">
                Find your sound, feel your soul
              </p>
            </div>
          </div>
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              data-ocid="search.search_input"
              type="text"
              placeholder="Search artists, songs, albums..."
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              className="pl-9 bg-muted/30 border-border/40 focus:border-primary/50 rounded-xl h-11"
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Loading */}
        {isLoading && (
          <div data-ocid="search.loading_state" className="space-y-3">
            {["a", "b", "c", "d", "e", "f"].map((k) => (
              <div
                key={k}
                className="glass-card rounded-2xl p-4 flex gap-3 items-center border border-border/20"
              >
                <div className="w-14 h-14 rounded-xl bg-muted/50 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted/50 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted/30 rounded animate-pulse w-1/2" />
                </div>
                <div className="w-20 h-8 bg-muted/30 rounded-xl animate-pulse flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && hasError && (
          <motion.div
            data-ocid="search.error_state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Couldn't reach iTunes
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Check your connection and try again
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => searchItunes(query)}
              className="rounded-xl"
            >
              Retry
            </Button>
          </motion.div>
        )}

        {/* Empty state after search */}
        {!isLoading && !hasError && hasSearched && results.length === 0 && (
          <motion.div
            data-ocid="search.empty_state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
              <Music2 className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No songs found</p>
              <p className="text-muted-foreground text-sm mt-1">
                Try a different search term
              </p>
            </div>
          </motion.div>
        )}

        {/* Recent Searches */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              data-ocid="search_history.section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Searches
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid="search_history.button"
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Clear all
                </button>
              </div>

              {/* History items */}
              <div className="space-y-2">
                {history.map((item, i) => (
                  <motion.div
                    key={item}
                    data-ocid={`search_history.item.${i + 1}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    className="glass-card rounded-2xl flex items-center gap-3 px-4 py-3 border border-border/20 hover:border-primary/25 transition-all duration-200 group"
                  >
                    <Clock
                      size={14}
                      className="text-muted-foreground/50 flex-shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleHistoryItem(item)}
                      className="flex-1 text-left text-sm text-foreground/80 hover:text-foreground transition-colors truncate"
                    >
                      {item}
                    </button>
                    <button
                      type="button"
                      data-ocid={`search_history.delete_button.${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item);
                      }}
                      aria-label={`Remove ${item} from history`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </div>

              {selectedMood && (
                <div className="mt-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm text-center">
                  Mood active — results set your vibe instantly
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle prompt — only shown when no history */}
        {showIdlePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary/60" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">
                Find your frequency
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Search any song, artist, or album above
              </p>
            </div>
            {selectedMood && (
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
                Mood active — results set your vibe instantly
              </div>
            )}
          </motion.div>
        )}

        {/* Results */}
        {!isLoading && !hasError && results.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {results.map((song, i) => {
                const isCurrent = currentSong?.trackId === song.trackId;
                const isThisPlaying = isCurrent && isPlaying;
                const isSetting =
                  isSettingMood && settingVibeId === song.trackId;
                return (
                  <motion.div
                    key={String(song.trackId)}
                    data-ocid={`search.item.${i + 1}`}
                    className="glass-card rounded-2xl p-4 flex gap-3 items-center border border-border/30 hover:border-primary/30 transition-all duration-200 group"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                  >
                    {/* Artwork */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted relative">
                      {song.artworkUrl ? (
                        <img
                          src={song.artworkUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate leading-tight">
                        {song.title}
                      </p>
                      <p className="text-muted-foreground text-xs truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {song.previewUrl && (
                        <button
                          type="button"
                          onClick={() => togglePlay(song, i)}
                          data-ocid={`search.toggle.${i + 1}`}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isThisPlaying
                              ? "bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.62_0.26_295/0.5)]"
                              : "bg-muted/50 text-foreground hover:bg-muted"
                          }`}
                          aria-label={
                            isThisPlaying ? "Pause preview" : "Play preview"
                          }
                        >
                          {isThisPlaying ? (
                            <Pause size={14} />
                          ) : (
                            <Play size={14} />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSetVibe(song)}
                        data-ocid={`search.secondary_button.${i + 1}`}
                        disabled={isSettingMood}
                        className="px-3 h-9 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50 border border-primary/20 hover:border-transparent"
                        aria-label="Set as vibe"
                      >
                        {isSetting ? (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            Setting
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Sparkles size={12} />
                            Set Vibe
                          </span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
