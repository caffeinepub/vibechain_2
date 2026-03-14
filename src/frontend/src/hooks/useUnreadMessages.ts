import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ChatMessage } from "../backend";
import { useMyConversations } from "./useQueries";

const KEY = (me: string, other: string) => `vc_lastread_${me}_${other}`;

export function markConversationRead(me: string, other: string) {
  localStorage.setItem(KEY(me, other), String(Date.now()));
}

export function getLastRead(me: string, other: string): number {
  return Number(localStorage.getItem(KEY(me, other)) ?? 0);
}

export function countUnread(
  me: string,
  other: string,
  messages: ChatMessage[],
): number {
  const lastRead = getLastRead(me, other);
  return messages.filter(
    (m) => m.fromUsername !== me && Number(m.timestamp) / 1_000_000 > lastRead,
  ).length;
}

export function useTotalUnread(myUsername: string | undefined): number {
  const qc = useQueryClient();
  const { data: conversations } = useMyConversations();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  if (!conversations || !myUsername) return 0;

  return conversations.reduce((sum, other) => {
    const msgs = qc.getQueryData<ChatMessage[]>(["conversation", other]) ?? [];
    return sum + countUnread(myUsername, other, msgs);
  }, 0);
}
