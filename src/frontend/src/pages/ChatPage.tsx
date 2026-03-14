import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Loader2, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BottomNav } from "../components/BottomNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useGetConversation,
  useSendMessage,
} from "../hooks/useQueries";
import { markConversationRead } from "../hooks/useUnreadMessages";

export function ChatPage() {
  const { username: withUsername } = useParams({ strict: false }) as {
    username: string;
  };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: myProfile } = useCallerProfile();
  const myUsername = myProfile?.username ?? "";

  const { data: messages, isLoading } = useGetConversation(withUsername);
  const { mutateAsync: sendMessage, isPending } = useSendMessage();

  const [inputText, setInputText] = useState("");
  const [optimisticMsgs, setOptimisticMsgs] = useState<
    Array<{
      text: string;
      fromUsername: string;
      toUsername: string;
      timestamp: bigint;
    }>
  >([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark conversation as read when opened and whenever new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers re-read to clear badge
  useEffect(() => {
    if (myUsername && withUsername) {
      markConversationRead(myUsername, withUsername);
    }
  }, [myUsername, withUsername, messages]);

  const allMessages = [...(messages ?? []), ...optimisticMsgs].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollRef is stable
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, optimisticMsgs]);

  if (!identity) {
    return (
      <div
        data-ocid="chat.page"
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      >
        <p className="text-muted-foreground">Please sign in to chat</p>
        <Button asChild className="rounded-full px-8">
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !withUsername) return;

    const optimistic = {
      text,
      fromUsername: myUsername,
      toUsername: withUsername,
      timestamp: BigInt(Date.now()),
    };
    setOptimisticMsgs((prev) => [...prev, optimistic]);
    setInputText("");

    try {
      await sendMessage({ toUsername: withUsername, text });
      setOptimisticMsgs([]);
    } catch {
      toast.error("Failed to send message");
      setOptimisticMsgs((prev) => prev.filter((m) => m !== optimistic));
    }
  };

  return (
    <div data-ocid="chat.page" className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            data-ocid="chat.back_button"
            onClick={() => navigate({ to: "/chat" })}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold truncate">{withUsername}</p>
          </div>
          <Link
            to="/playlist/$username"
            params={{ username: withUsername }}
            data-ocid="chat.view_playlist_link"
            className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors border border-primary/30 hover:border-primary/60 rounded-full px-3 py-1.5"
          >
            <ExternalLink size={12} />
            View Playlist
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-4 py-4 max-w-2xl mx-auto"
          style={{ maxHeight: "calc(100vh - 180px)" }}
        >
          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
            </div>
          )}

          {!isLoading && allMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-20 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                <Send className="w-6 h-6 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground text-sm">
                Start the conversation with{" "}
                <span className="text-foreground font-semibold">
                  {withUsername}
                </span>
              </p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {allMessages.map((msg, i) => {
              const isMe = msg.fromUsername === myUsername;
              return (
                <motion.div
                  key={`${String(msg.timestamp)}-${i}`}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.2 }}
                  className={`flex mb-3 ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary/20 border border-primary/30 text-foreground rounded-br-sm"
                        : "bg-muted/30 border border-border/30 text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 glass border-t border-border/30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            data-ocid="chat.input"
            placeholder={`Message ${withUsername}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="rounded-full bg-muted/30 border-border/40 focus:border-primary/60"
            disabled={isPending}
          />
          <Button
            data-ocid="chat.send_button"
            onClick={handleSend}
            disabled={!inputText.trim() || isPending}
            className="rounded-full w-10 h-10 p-0 shrink-0"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
