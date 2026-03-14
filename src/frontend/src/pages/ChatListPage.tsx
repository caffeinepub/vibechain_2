import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle, MessageSquareDashed, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useGetConversation,
  useMyConversations,
} from "../hooks/useQueries";
import { countUnread } from "../hooks/useUnreadMessages";

function ConversationRow({
  username,
  myUsername,
  index,
}: {
  username: string;
  myUsername: string;
  index: number;
}) {
  const { data: messages } = useGetConversation(username);
  const unread = countUnread(myUsername, username, messages ?? []);

  return (
    <motion.div
      key={username}
      data-ocid={`chat_list.item.${index + 1}`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        to="/chat/$username"
        params={{ username }}
        className="flex items-center gap-3 p-3 rounded-2xl glass-card border border-border/20 hover:border-primary/30 transition-all duration-200 group"
      >
        <Avatar className="w-12 h-12 ring-2 ring-border/30 group-hover:ring-primary/30 transition-all">
          <AvatarFallback className="bg-primary/20 text-primary font-display font-bold text-lg">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{username}</p>
          <p className="text-muted-foreground text-xs">
            {unread > 0 ? (
              <span className="text-primary/80 font-medium">
                {unread} new message{unread > 1 ? "s" : ""}
              </span>
            ) : (
              "Tap to open chat"
            )}
          </p>
        </div>
        {unread > 0 ? (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[oklch(0.62_0.28_15)] text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_oklch(0.62_0.28_15/0.6)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : (
          <MessageCircle
            size={16}
            className="text-muted-foreground group-hover:text-primary transition-colors"
          />
        )}
      </Link>
    </motion.div>
  );
}

export function ChatListPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: conversations, isLoading } = useMyConversations();
  const { data: myProfile } = useCallerProfile();
  const myUsername = myProfile?.username ?? "";

  const handleStartChat = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    navigate({ to: "/chat/$username", params: { username: trimmed } });
  };

  if (!identity) {
    return (
      <div
        data-ocid="chat_list.page"
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      >
        <MessageCircle className="w-12 h-12 text-primary opacity-60" />
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Messages</h2>
          <p className="text-muted-foreground text-sm">
            Sign in to chat with your friends
          </p>
        </div>
        <Button asChild className="rounded-full px-8">
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div data-ocid="chat_list.page" className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl font-bold">Messages</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search / start new chat */}
        <div className="flex gap-2">
          <Input
            data-ocid="chat_list.search_input"
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStartChat()}
            className="rounded-full bg-muted/30 border-border/40 focus:border-primary/60"
          />
          <Button
            data-ocid="chat_list.start_button"
            onClick={handleStartChat}
            disabled={!search.trim()}
            className="rounded-full px-5 shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>

        {/* Conversation list */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="flex items-center gap-3 p-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!conversations || conversations.length === 0) && (
          <motion.div
            data-ocid="chat_list.empty_state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
              <MessageSquareDashed className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                No conversations yet
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Search a username above to start a chat
              </p>
            </div>
          </motion.div>
        )}

        {!isLoading && conversations && conversations.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence>
              {conversations.map((username, i) => (
                <ConversationRow
                  key={username}
                  username={username}
                  myUsername={myUsername}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
