import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Music2, Pause, Play, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Mood, PlaylistEntry } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { usePublicProfile } from "../hooks/useQueries";
import { usePlayerStore } from "../store/playerStore";
import { getMoodConfig } from "../utils/moodUtils";

export function SharedPlaylistPage() {
  const { username } = useParams({ strict: false }) as { username: string };
  const { data: profile, isLoading, isError } = usePublicProfile(username);
  const { identity } = useInternetIdentity();
  const { setQueue, isPlaying, queue, currentIndex } = usePlayerStore();
  const currentSong = queue[currentIndex];

  const playlist = profile?.playlist ?? [];

  const grouped = playlist.reduce(
    (acc, entry) => {
      const key = entry.mood as string;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {} as Record<string, PlaylistEntry[]>,
  );

  const moodKeys = Object.keys(grouped) as Mood[];

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

  return (
    <div data-ocid="shared_playlist.page" className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            to="/"
            className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
          >
            VIBECHAIN
          </Link>
          <span className="text-border/60">/</span>
          {isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <span className="text-foreground font-semibold text-sm">
              {username}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {isLoading && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((k) => (
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
          </div>
        )}

        {!isLoading && (isError || !profile) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
              <Music2 className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">User not found</p>
              <p className="text-muted-foreground text-sm mt-1">
                No one here by that name yet
              </p>
            </div>
          </motion.div>
        )}

        {!isLoading && profile && (
          <>
            {/* Profile header */}
            <motion.div
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Avatar className="w-16 h-16 ring-2 ring-primary/30">
                <AvatarFallback className="bg-primary/20 text-primary font-display text-2xl font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-display text-2xl font-bold">
                  {profile.username}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {playlist.length} songs in playlist
                </p>
              </div>
            </motion.div>

            {playlist.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 py-16 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                  <Music2 className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <p className="font-semibold text-foreground">
                  No songs saved yet
                </p>
                <p className="text-muted-foreground text-sm">
                  This user hasn't added any songs to their playlist
                </p>
              </motion.div>
            ) : (
              <Tabs defaultValue={moodKeys[0]} className="w-full">
                <TabsList className="w-full flex gap-1 overflow-x-auto bg-transparent justify-start mb-4 h-auto p-0">
                  {moodKeys.map((mood) => {
                    const cfg = getMoodConfig(mood);
                    return (
                      <TabsTrigger
                        key={mood}
                        value={mood}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border/30 bg-muted/20 data-[state=active]:bg-primary/20 data-[state=active]:border-primary/40 data-[state=active]:text-primary transition-all whitespace-nowrap"
                      >
                        <span>{cfg.emoji}</span>
                        <span>{cfg.label}</span>
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
                          const isCurrent =
                            currentSong?.trackId === song.trackId;
                          const isThisPlaying = isCurrent && isPlaying;
                          return (
                            <motion.div
                              key={String(song.trackId)}
                              data-ocid={`shared_playlist.item.${i + 1}`}
                              className="glass-card rounded-2xl p-4 flex gap-3 items-center border border-border/30 hover:border-primary/30 transition-all duration-200"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
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
                              {song.previewUrl && (
                                <button
                                  type="button"
                                  onClick={() => togglePlay(grouped[mood], i)}
                                  data-ocid={`shared_playlist.toggle.${i + 1}`}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isThisPlaying ? "bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.62_0.26_295/0.5)]" : "bg-muted/50 text-foreground hover:bg-muted"}`}
                                  aria-label={isThisPlaying ? "Pause" : "Play"}
                                >
                                  {isThisPlaying ? (
                                    <Pause size={14} />
                                  ) : (
                                    <Play size={14} />
                                  )}
                                </button>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {/* Join CTA for non-logged-in users */}
            {!identity && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 p-6 rounded-2xl border border-primary/20 bg-primary/5 text-center"
              >
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold mb-1">
                  Join VIBECHAIN
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Build your own mood playlists and share your vibe with the
                  world
                </p>
                <Button
                  asChild
                  className="rounded-full px-8"
                  data-ocid="shared_playlist.join_button"
                >
                  <Link to="/login">Join Free</Link>
                </Button>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
