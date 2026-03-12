import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Music2, Shield, Waves } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "../components/BottomNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile } from "../hooks/useQueries";
import { formatTimestamp, getMoodConfig } from "../utils/moodUtils";

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useCallerProfile();
  const { identity, clear, login, isLoggingIn } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  const currentMoodConfig = profile ? getMoodConfig(profile.currentMood) : null;

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
          </>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
