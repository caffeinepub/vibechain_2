import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Music2, Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Song } from "../backend";
import { BottomNav } from "../components/BottomNav";
import { useSetMood } from "../hooks/useQueries";
import { useVibeStore } from "../store/vibeStore";
import { getMoodConfig } from "../utils/moodUtils";

export function SongPickerPage() {
  const navigate = useNavigate();
  const { selectedMood, suggestedSongs } = useVibeStore();
  const { mutateAsync: setMood, isPending } = useSetMood();
  const [playingId, setPlayingId] = useState<bigint | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedMood) {
      navigate({ to: "/mood" });
    }
  }, [selectedMood, navigate]);

  const togglePlay = (song: Song) => {
    if (!song.previewUrl) return;

    if (playingId === song.trackId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(song.previewUrl);
    audioRef.current = audio;
    audio.play().catch(() => toast.error("Preview not available"));
    audio.onended = () => setPlayingId(null);
    setPlayingId(song.trackId);
  };

  const handleChoose = async (song: Song) => {
    if (!selectedMood) return;
    setSelectedSong(song);
    audioRef.current?.pause();
    setPlayingId(null);
    try {
      await setMood({ mood: selectedMood, song });
      toast.success("Vibe set! Your soul speaks. 🎵");
      navigate({ to: "/feed" });
    } catch {
      toast.error("Failed to set vibe. Try again.");
      setSelectedSong(null);
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
                const isPlaying = playingId === song.trackId;
                const isChoosing =
                  isPending && selectedSong?.trackId === song.trackId;
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
                          onClick={() => togglePlay(song)}
                          data-ocid={`song.play_button.${i + 1}`}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isPlaying
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/50 text-foreground hover:bg-muted"
                          }`}
                          aria-label={
                            isPlaying ? "Pause preview" : "Play preview"
                          }
                        >
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleChoose(song)}
                        data-ocid={`song.select_button.${i + 1}`}
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
