import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  ListMusic,
  Music2,
  Pause,
  Play,
  Share2,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Mood, PlaylistEntry } from "../backend";
import { BottomNav } from "../components/BottomNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useMyPlaylist,
  useRemoveFromPlaylist,
} from "../hooks/useQueries";
import { usePlayerStore } from "../store/playerStore";
import { getMoodConfig } from "../utils/moodUtils";

export function PlaylistPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: playlist, isLoading } = useMyPlaylist();
  const { mutate: removeFromPlaylist } = useRemoveFromPlaylist();
  const { setQueue, isPlaying, queue, currentIndex } = usePlayerStore();
  const currentSong = queue[currentIndex];

  const [removingId, setRemovingId] = useState<string | null>(null);

  // Group by mood
  const grouped = (playlist ?? []).reduce(
    (acc, entry) => {
      const key = entry.mood as string;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {} as Record<string, PlaylistEntry[]>,
  );

  const moodKeys = Object.keys(grouped) as Mood[];

  const handleShare = () => {
    if (!profile?.username) return;
    const url = `${window.location.origin}/playlist/${profile.username}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Playlist link copied! 🔗");
    });
  };

  const handleRemove = (mood: Mood, trackId: bigint) => {
    const key = `${mood}-${String(trackId)}`;
    setRemovingId(key);
    removeFromPlaylist(
      { mood, trackId },
      {
        onSettled: () => setRemovingId(null),
        onError: () => toast.error("Failed to remove song"),
      },
    );
  };

  const togglePlay = (entries: PlaylistEntry[], index: number) => {
    const song = entries[index].song;
    const isCurrent = currentSong?.trackId === song.trackId;
    if (isCurrent && isPlaying) {
      usePlayerStore.getState().pause();
    } else if (isCurrent && !isPlaying) {
      usePlayerStore.getState().play();
    } else {
      setQueue(
        entries.map((e) => e.song),
        index,
      );
    }
  };

  if (!identity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ListMusic className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold">Your Playlist</h2>
          <p className="text-muted-foreground text-sm">
            Sign in to save songs and build your mood playlists
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: "/login" })}
          className="rounded-full px-8"
        >
          Sign In
        </Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <ListMusic size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold leading-none">
                My Playlist
              </h1>
              <p className="text-muted-foreground text-xs mt-0.5">
                {playlist?.length ?? 0} songs saved
              </p>
            </div>
          </div>
          {(playlist?.length ?? 0) > 0 && (
            <button
              type="button"
              data-ocid="playlist.share_button"
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
            >
              <Share2 size={14} />
              Share
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading && (
          <div data-ocid="playlist.loading_state" className="space-y-3">
            {[1, 2, 3, 4].map((k) => (
              <div
                key={k}
                className="glass-card rounded-2xl p-4 flex gap-3 items-center border border-border/20"
              >
                <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && moodKeys.length === 0 && (
          <motion.div
            data-ocid="playlist.empty_state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Bookmark className="w-10 h-10 text-primary/50" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">
                No songs saved yet
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Bookmark songs from search or your mood picker
              </p>
            </div>
            <Button
              onClick={() => navigate({ to: "/search" })}
              variant="outline"
              className="rounded-full"
            >
              Find Songs
            </Button>
          </motion.div>
        )}

        {!isLoading && moodKeys.length > 0 && (
          <Tabs defaultValue={moodKeys[0]} className="w-full">
            <TabsList className="w-full flex gap-1 overflow-x-auto bg-transparent justify-start mb-4 h-auto p-0">
              {moodKeys.map((mood) => {
                const cfg = getMoodConfig(mood);
                return (
                  <TabsTrigger
                    key={mood}
                    value={mood}
                    data-ocid="playlist.tab"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border/30 bg-muted/20 data-[state=active]:bg-primary/20 data-[state=active]:border-primary/40 data-[state=active]:text-primary transition-all whitespace-nowrap"
                  >
                    <span>{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                    <span className="text-xs opacity-60">
                      ({grouped[mood].length})
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {moodKeys.map((mood) => (
              <TabsContent key={mood} value={mood} className="mt-0">
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence>
                    {grouped[mood].map((entry, i) => {
                      const { song } = entry;
                      const isCurrent = currentSong?.trackId === song.trackId;
                      const isThisPlaying = isCurrent && isPlaying;
                      const removeKey = `${mood}-${String(song.trackId)}`;
                      const isRemoving = removingId === removeKey;
                      return (
                        <motion.div
                          key={String(song.trackId)}
                          data-ocid={`playlist.item.${i + 1}`}
                          className="glass-card rounded-2xl p-4 flex gap-3 items-center border border-border/30 hover:border-primary/30 transition-all duration-200"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.04 }}
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
                            <p className="text-muted-foreground text-xs truncate mt-0.5">
                              {song.artist}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {song.previewUrl && (
                              <button
                                type="button"
                                onClick={() => togglePlay(grouped[mood], i)}
                                data-ocid={`playlist.toggle.${i + 1}`}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isThisPlaying ? "bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.62_0.26_295/0.5)]" : "bg-muted/50 text-foreground hover:bg-muted"}`}
                                aria-label={isThisPlaying ? "Pause" : "Play"}
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
                              onClick={() => handleRemove(mood, song.trackId)}
                              data-ocid={`playlist.delete_button.${i + 1}`}
                              disabled={isRemoving}
                              className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40"
                              aria-label="Remove from playlist"
                            >
                              {isRemoving ? (
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
