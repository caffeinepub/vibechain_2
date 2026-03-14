import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  Clock,
  ListMusic,
  Music2,
  Pause,
  Play,
  Share2,
  Shield,
  Trash2,
  Waves,
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
import { formatTimestamp, getMoodConfig } from "../utils/moodUtils";

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useCallerProfile();
  const { identity, clear, login, isLoggingIn } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  const { data: playlist, isLoading: playlistLoading } = useMyPlaylist();
  const { mutate: removeFromPlaylist } = useRemoveFromPlaylist();
  const { setQueue, isPlaying, queue, currentIndex } = usePlayerStore();
  const currentSong = queue[currentIndex];

  const [removingId, setRemovingId] = useState<string | null>(null);

  const currentMoodConfig = profile ? getMoodConfig(profile.currentMood) : null;

  // Group playlist by mood
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

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">My Profile</h1>
          {identity && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clear();
                navigate({ to: "/" });
              }}
              className="text-muted-foreground hover:text-destructive text-xs"
            >
              Sign Out
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Unauthenticated state */}
        {!identity && !isLoading && (
          <motion.div
            className="flex flex-col items-center justify-center py-24 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, oklch(0.55 0.26 295 / 0.4), oklch(0.15 0.05 285))",
                boxShadow: "0 0 40px oklch(0.55 0.26 295 / 0.25)",
              }}
            >
              <Waves size={32} className="text-primary" />
            </div>

            <div className="text-center">
              <h2 className="font-display text-2xl font-bold mb-1">
                Your Vibe, Your Story
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Sign in to see your profile, mood history, and current vibes.
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                data-ocid="profile.login_button"
                onClick={() => login()}
                disabled={isLoggingIn}
                className="flex items-center gap-3 px-6 py-3 rounded-full bg-white text-gray-900 font-semibold text-sm shadow-md hover:shadow-lg hover:bg-gray-50 active:scale-95 transition-all duration-150 border border-gray-200 disabled:opacity-60 disabled:cursor-not-allowed min-w-[240px] justify-center"
              >
                <Shield size={18} className="text-gray-600 flex-shrink-0" />
                <span>
                  {isLoggingIn ? "Connecting…" : "Continue with VIBECHAIN"}
                </span>
              </button>
              <p className="text-muted-foreground text-xs flex items-center gap-1">
                <span>🔒</span>
                Secure &amp; private — no password needed
              </p>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl shimmer" />
            <Skeleton className="h-24 w-full rounded-2xl shimmer" />
            <Skeleton className="h-64 w-full rounded-2xl shimmer" />
          </div>
        ) : !profile && identity ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No profile found</p>
            <Button onClick={() => navigate({ to: "/signup" })}>
              Create Profile
            </Button>
          </div>
        ) : profile ? (
          <>
            {/* Profile Card */}
            <motion.div
              className="glass-card rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4">
                {currentMoodConfig && (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${currentMoodConfig.glowColor.replace("0.6", "0.5")}, oklch(0.15 0.05 285))`,
                      boxShadow: `0 0 20px ${currentMoodConfig.glowColor.replace("0.6", "0.5")}`,
                    }}
                  >
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl font-bold truncate">
                    {profile.username}
                  </h2>
                  {principal && (
                    <p className="text-muted-foreground text-xs truncate mt-0.5">
                      {principal.slice(0, 20)}...
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Current Vibe */}
            <motion.div
              className="glass-card rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">
                  Current Vibe
                </h3>
                <Button
                  onClick={() => navigate({ to: "/mood" })}
                  data-ocid="profile.change_vibe_button"
                  size="sm"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
                  }}
                >
                  <Waves size={14} className="mr-1" />
                  Change Vibe
                </Button>
              </div>

              {currentMoodConfig && (
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentMoodConfig.emoji}</span>
                  <div>
                    <p
                      className={`font-semibold ${currentMoodConfig.textColor}`}
                    >
                      {currentMoodConfig.label}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {currentMoodConfig.description}
                    </p>
                  </div>
                </div>
              )}

              {profile.currentSong && (
                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                  {profile.currentSong.artworkUrl ? (
                    <img
                      src={profile.currentSong.artworkUrl}
                      alt={profile.currentSong.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Music2 size={16} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile.currentSong.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.currentSong.artist}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Mood History */}
            <motion.div
              className="glass-card rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold">
                  Vibe History
                </h3>
              </div>

              {profile.moodHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">
                  Your journey begins now 🌊
                </p>
              ) : (
                <div
                  className="space-y-3"
                  data-ocid="profile.mood_history_list"
                >
                  {profile.moodHistory
                    .slice()
                    .reverse()
                    .slice(0, 20)
                    .map((entry, i) => {
                      const mc = getMoodConfig(entry.mood);
                      const uniqueKey = `${String(entry.timestamp)}-${i}`;
                      return (
                        <div
                          key={uniqueKey}
                          className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0"
                        >
                          <span className="text-xl">{mc.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${mc.textColor}`}
                            >
                              {mc.label}
                            </p>
                            {entry.songTitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {entry.songTitle} — {entry.songArtist}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </motion.div>

            {/* My Playlist */}
            <motion.div
              className="glass-card rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ListMusic size={16} className="text-primary" />
                  <h3 className="font-display text-lg font-semibold">
                    My Playlist
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({playlist?.length ?? 0} songs)
                  </span>
                </div>
                {(playlist?.length ?? 0) > 0 && (
                  <button
                    type="button"
                    data-ocid="profile.playlist.share_button"
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
                  >
                    <Share2 size={12} />
                    Share
                  </button>
                )}
              </div>

              {playlistLoading && (
                <div
                  data-ocid="profile.playlist.loading_state"
                  className="space-y-3"
                >
                  {[1, 2, 3].map((k) => (
                    <div
                      key={k}
                      className="rounded-xl p-3 flex gap-3 items-center border border-border/20"
                    >
                      <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!playlistLoading && moodKeys.length === 0 && (
                <motion.div
                  data-ocid="profile.playlist.empty_state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 py-10 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Bookmark className="w-7 h-7 text-primary/50" />
                  </div>
                  <div>
                    <p className="font-display text-base font-bold">
                      No songs saved yet
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Bookmark songs from search or your mood picker
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate({ to: "/search" })}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    Find Songs
                  </Button>
                </motion.div>
              )}

              {!playlistLoading && moodKeys.length > 0 && (
                <Tabs defaultValue={moodKeys[0]} className="w-full">
                  <TabsList className="w-full flex gap-1 overflow-x-auto bg-transparent justify-start mb-4 h-auto p-0">
                    {moodKeys.map((mood) => {
                      const cfg = getMoodConfig(mood);
                      return (
                        <TabsTrigger
                          key={mood}
                          value={mood}
                          data-ocid="profile.playlist.tab"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/30 bg-muted/20 data-[state=active]:bg-primary/20 data-[state=active]:border-primary/40 data-[state=active]:text-primary transition-all whitespace-nowrap"
                        >
                          <span>{cfg.emoji}</span>
                          <span>{cfg.label}</span>
                          <span className="opacity-60">
                            ({grouped[mood].length})
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {moodKeys.map((mood) => (
                    <TabsContent key={mood} value={mood} className="mt-0">
                      <div className="grid grid-cols-1 gap-2">
                        <AnimatePresence>
                          {grouped[mood].map((entry, i) => {
                            const { song } = entry;
                            const isCurrent =
                              currentSong?.trackId === song.trackId;
                            const isThisPlaying = isCurrent && isPlaying;
                            const removeKey = `${mood}-${String(song.trackId)}`;
                            const isRemoving = removingId === removeKey;
                            return (
                              <motion.div
                                key={String(song.trackId)}
                                data-ocid={`profile.playlist.item.${i + 1}`}
                                className="rounded-xl p-3 flex gap-3 items-center border border-border/30 hover:border-primary/30 bg-muted/10 transition-all duration-200"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.04 }}
                              >
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                  {song.artworkUrl ? (
                                    <img
                                      src={song.artworkUrl}
                                      alt={song.title}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Music2 className="w-5 h-5 text-muted-foreground" />
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
                                      onClick={() =>
                                        togglePlay(grouped[mood], i)
                                      }
                                      data-ocid={`profile.playlist.toggle.${i + 1}`}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                        isThisPlaying
                                          ? "bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.62_0.26_295/0.5)]"
                                          : "bg-muted/50 text-foreground hover:bg-muted"
                                      }`}
                                      aria-label={
                                        isThisPlaying ? "Pause" : "Play"
                                      }
                                    >
                                      {isThisPlaying ? (
                                        <Pause size={12} />
                                      ) : (
                                        <Play size={12} />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemove(mood, song.trackId)
                                    }
                                    data-ocid={`profile.playlist.delete_button.${i + 1}`}
                                    disabled={isRemoving}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40"
                                    aria-label="Remove from playlist"
                                  >
                                    {isRemoving ? (
                                      <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    ) : (
                                      <Trash2 size={12} />
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
            </motion.div>
          </>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
