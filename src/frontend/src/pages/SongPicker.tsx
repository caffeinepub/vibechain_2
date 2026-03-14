import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Loader2,
  Music2,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Song } from "../backend";
import { BottomNav } from "../components/BottomNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useMyPlaylist,
  useSaveToPlaylist,
  useSetMood,
} from "../hooks/useQueries";
import { usePlayerStore } from "../store/playerStore";
import { useVibeStore } from "../store/vibeStore";
import { getMoodConfig } from "../utils/moodUtils";

export function SongPickerPage() {
  const navigate = useNavigate();
  const { selectedMood, suggestedSongs } = useVibeStore();
  const { mutateAsync: setMood, isPending } = useSetMood();
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { setQueue, isPlaying, queue, currentIndex } = usePlayerStore();
  const { mutateAsync: saveToPlaylist } = useSaveToPlaylist();
  const { data: myPlaylist } = useMyPlaylist();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [savingId, setSavingId] = useState<bigint | null>(null);

  const currentSong = queue[currentIndex];

  useEffect(() => {
    if (!selectedMood) {
      navigate({ to: "/mood" });
    }
  }, [selectedMood, navigate]);

  const isSaved = (song: Song) =>
    selectedMood
      ? (myPlaylist ?? []).some(
          (e) =>
            (e.mood as string) === (selectedMood as string) &&
            e.song.trackId === song.trackId,
        )
      : false;

  const togglePlay = (song: Song, index: number) => {
    if (!song.previewUrl) return;
    const isCurrent = currentSong?.trackId === song.trackId;
    if (isCurrent && isPlaying) {
      usePlayerStore.getState().pause();
    } else if (isCurrent && !isPlaying) {
      usePlayerStore.getState().play();
    } else {
      setQueue(suggestedSongs, index);
    }
  };

  const handleChoose = async (song: Song) => {
    if (!selectedMood) return;
    setSelectedSong(song);
    usePlayerStore.getState().pause();
    try {
      await setMood({ mood: selectedMood, song });
      toast.success("Vibe set! Your soul speaks. 🎵");
      navigate({ to: "/feed" });
    } catch {
      toast.error("Failed to set vibe. Try again.");
      setSelectedSong(null);
    }
  };

  const handleSave = async (song: Song) => {
    if (!selectedMood) {
      toast.error("Pick a mood first 🎭");
      return;
    }
    setSavingId(song.trackId);
    try {
      await saveToPlaylist({ mood: selectedMood, song });
      toast.success("Saved to playlist! 🔖");
    } catch {
      toast.error("Failed to save. Try again.");
    } finally {
      setSavingId(null);
    }
  };

  const moodConfig = selectedMood ? getMoodConfig(selectedMood) : null;

  if (!selectedMood) return null;

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            {moodConfig && <span className="text-2xl">{moodConfig.emoji}</span>}
            <div>
              <h1 className="font-display text-2xl font-bold">
                {moodConfig?.label} Vibes
              </h1>
              <p className="text-muted-foreground text-sm">
                Pick your soundtrack
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Sign-in nudge banner for guests */}
        {!identity && (
          <motion.div
            className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={15} className="text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground truncate">
                Save your vibe and connect with others
              </p>
            </div>
            <button
              type="button"
              data-ocid="songpicker.login_button"
              onClick={() => login()}
              disabled={isLoggingIn}
              className="flex-shrink-0 px-4 py-1.5 rounded-full bg-white text-gray-900 text-xs font-semibold border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoggingIn ? "Connecting…" : "Sign in free"}
            </button>
          </motion.div>
        )}

        {suggestedSongs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Music2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No songs found. Go back and pick a mood.</p>
            <Button
              onClick={() => navigate({ to: "/mood" })}
              className="mt-4"
              variant="outline"
            >
              Back to Moods
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {suggestedSongs.map((song, i) => {
                const isCurrent = currentSong?.trackId === song.trackId;
                const isThisPlaying = isCurrent && isPlaying;
                const isChoosing =
                  isPending && selectedSong?.trackId === song.trackId;
                const isSaving = savingId === song.trackId;
                const saved = isSaved(song);
                return (
                  <motion.div
                    key={String(song.trackId)}
                    data-ocid={`song.item.${i + 1}`}
                    className="glass-card rounded-2xl p-4 flex gap-3 items-center border border-border/30 hover:border-primary/30 transition-all duration-200"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
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

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {song.title}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {song.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {song.previewUrl && (
                        <button
                          type="button"
                          onClick={() => togglePlay(song, i)}
                          data-ocid={`song.toggle.${i + 1}`}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isThisPlaying
                              ? "bg-primary text-primary-foreground"
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
                        onClick={() => handleSave(song)}
                        data-ocid={`song.save_button.${i + 1}`}
                        disabled={isSaving || saved}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          saved
                            ? "bg-primary/20 text-primary"
                            : "bg-muted/50 text-muted-foreground hover:bg-primary/20 hover:text-primary"
                        } disabled:opacity-50`}
                        aria-label={
                          saved ? "Already saved" : "Save to playlist"
                        }
                      >
                        {isSaving ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : saved ? (
                          <BookmarkCheck size={14} />
                        ) : (
                          <Bookmark size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChoose(song)}
                        data-ocid={`song.secondary_button.${i + 1}`}
                        disabled={isPending}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-accent/20 text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                        aria-label="Choose this vibe"
                      >
                        {isChoosing ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
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
