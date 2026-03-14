import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ListMusic, MessageCircle, UserMinus, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BottomNav } from "../components/BottomNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddFriend,
  useGetFriends,
  useRemoveFriend,
} from "../hooks/useQueries";

function FriendRow({
  username,
  index,
  onRemove,
  isRemoving,
}: {
  username: string;
  index: number;
  onRemove: (u: string) => void;
  isRemoving: boolean;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleRemoveClick = () => {
    if (confirmRemove) {
      onRemove(username);
      setConfirmRemove(false);
    } else {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 3000);
    }
  };

  return (
    <motion.div
      data-ocid={`friends.item.${index + 1}`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-2xl glass-card border border-border/20 hover:border-primary/20 transition-all duration-200"
    >
      {/* Avatar */}
      <Avatar className="w-11 h-11 ring-2 ring-border/30 shrink-0">
        <AvatarFallback className="bg-primary/20 text-primary font-display font-bold text-base">
          {username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Username */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{username}</p>
        <p className="text-muted-foreground text-xs">Tap to see their vibes</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          data-ocid={`friends.message_button.${index + 1}`}
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-full hover:bg-primary/15 hover:text-primary transition-all"
          asChild
        >
          <Link to="/chat/$username" params={{ username }}>
            <MessageCircle size={15} />
          </Link>
        </Button>

        <Button
          data-ocid={`friends.playlist_button.${index + 1}`}
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-full hover:bg-primary/15 hover:text-primary transition-all"
          asChild
        >
          <Link to="/playlist/$username" params={{ username }}>
            <ListMusic size={15} />
          </Link>
        </Button>

        <Button
          data-ocid={`friends.remove_button.${index + 1}`}
          size="icon"
          variant="ghost"
          disabled={isRemoving}
          onClick={handleRemoveClick}
          className={`w-8 h-8 rounded-full transition-all ${
            confirmRemove
              ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
              : "hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
          }`}
          title={confirmRemove ? "Tap again to confirm" : "Remove friend"}
        >
          <UserMinus size={15} />
        </Button>
      </div>
    </motion.div>
  );
}

export function FriendsPage() {
  const { identity } = useInternetIdentity();
  const [search, setSearch] = useState("");
  const { data: friends, isLoading } = useGetFriends();
  const addFriend = useAddFriend();
  const removeFriend = useRemoveFriend();

  const handleAddFriend = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    try {
      await addFriend.mutateAsync(trimmed);
      toast.success(`${trimmed} added as friend! 🎶`);
      setSearch("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not add friend";
      toast.error(msg);
    }
  };

  const handleRemove = async (username: string) => {
    try {
      await removeFriend.mutateAsync(username);
      toast.success(`${username} removed from friends`);
    } catch {
      toast.error("Could not remove friend");
    }
  };

  if (!identity) {
    return (
      <div
        data-ocid="friends.page"
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Users className="w-8 h-8 text-primary opacity-70" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Friends</h2>
          <p className="text-muted-foreground text-sm">
            Sign in to add friends and see their playlists
          </p>
        </div>
        <Button
          data-ocid="friends.primary_button"
          asChild
          className="rounded-full px-8"
        >
          <Link to="/login">Sign In</Link>
        </Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div data-ocid="friends.page" className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Users className="w-5 h-5 text-primary opacity-70" />
          <h1 className="font-display text-2xl font-bold">Friends</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Add Friend */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
            Add a friend
          </p>
          <div className="flex gap-2">
            <Input
              data-ocid="friends.add_input"
              placeholder="Search by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
              className="rounded-full bg-muted/30 border-border/40 focus:border-primary/60"
            />
            <Button
              data-ocid="friends.add_button"
              onClick={handleAddFriend}
              disabled={!search.trim() || addFriend.isPending}
              className="rounded-full px-5 shrink-0"
            >
              {addFriend.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Adding...
                </span>
              ) : (
                "Add Friend"
              )}
            </Button>
          </div>
        </div>

        {/* Friends List */}
        <div className="space-y-2">
          {friends && friends.length > 0 && (
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
              Your friends ({friends.length})
            </p>
          )}

          {isLoading && (
            <div data-ocid="friends.loading_state" className="space-y-3">
              {[1, 2, 3].map((k) => (
                <div key={k} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-11 h-11 rounded-full" />
                  <Skeleton className="h-4 w-36" />
                  <div className="ml-auto flex gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!friends || friends.length === 0) && (
            <motion.div
              data-ocid="friends.empty_state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground opacity-40" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No friends yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Add friends by username to see their vibes
                </p>
              </div>
            </motion.div>
          )}

          {!isLoading && friends && friends.length > 0 && (
            <div data-ocid="friends.list" className="space-y-2">
              <AnimatePresence>
                {friends.map((username, i) => (
                  <FriendRow
                    key={username}
                    username={username}
                    index={i}
                    onRemove={handleRemove}
                    isRemoving={removeFriend.isPending}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
