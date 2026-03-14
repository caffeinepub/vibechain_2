import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChatMessage,
  Mood,
  PlaylistEntry,
  Song,
  UserProfile,
  VibeFeedEntry,
} from "../backend";
import { useActor } from "./useActor";

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useVibeFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<VibeFeedEntry[]>({
    queryKey: ["vibeFeed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVibeFeed();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useCreateProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      mood,
      song,
    }: { username: string; mood: Mood; song: Song | null }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createUserProfile(username, mood, song);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useSetMood() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mood, song }: { mood: Mood; song: Song | null }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setMood(mood, song);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
      qc.invalidateQueries({ queryKey: ["vibeFeed"] });
    },
  });
}

const YT_API_KEY = "AIzaSyC4wFZbYfToWIoptfiMXxoywAK-STRjeHo";

const MOOD_KEYWORDS: Record<string, string> = {
  happy: "happy",
  sad: "sad",
  energetic: "energetic",
  calm: "calm",
  melancholic: "melancholic",
  angry: "angry",
  romantic: "romantic",
  anxious: "anxious",
};

interface YouTubeItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
}

export function useGetMusicSuggestions() {
  return useMutation({
    mutationFn: async (mood: Mood) => {
      const moodKey = typeof mood === "string" ? mood : Object.keys(mood)[0];
      const keyword = MOOD_KEYWORDS[moodKey] ?? moodKey;
      const params = new URLSearchParams({
        part: "snippet",
        q: `${keyword} music`,
        type: "video",
        videoEmbeddable: "true",
        videoSyndicated: "true",
        maxResults: "20",
        key: YT_API_KEY,
      });
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`,
      );
      if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
      const parsed = (await res.json()) as {
        items?: YouTubeItem[];
        error?: { message?: string };
      };
      if (parsed.error) {
        throw new Error(parsed.error?.message ?? "YouTube API error");
      }
      const items = parsed.items ?? [];
      return items
        .filter((item) => item.id?.videoId)
        .map(
          (item, index): Song => ({
            trackId: BigInt(index + 1),
            title: item.snippet?.title ?? "Unknown Track",
            artist: item.snippet?.channelTitle ?? "Unknown Artist",
            artworkUrl:
              item.snippet?.thumbnails?.high?.url ??
              item.snippet?.thumbnails?.medium?.url ??
              "",
            previewUrl: item.id?.videoId ?? "",
          }),
        );
    },
  });
}

export function useMyPlaylist() {
  const { actor, isFetching } = useActor();
  return useQuery<PlaylistEntry[]>({
    queryKey: ["myPlaylist"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPlaylist();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveToPlaylist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mood, song }: { mood: Mood; song: Song }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveToPlaylist(mood, song);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myPlaylist"] }),
  });
}

export function useRemoveFromPlaylist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mood, trackId }: { mood: Mood; trackId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeFromPlaylist(mood, trackId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myPlaylist"] }),
  });
}

export function usePublicProfile(username: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["publicProfile", username],
    queryFn: async () => {
      if (!actor || !username) return null;
      return actor.getProfile(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

// --- Chat hooks ---

export function useMyConversations() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["myConversations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyConversations();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useGetConversation(withUsername: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ["conversation", withUsername],
    queryFn: async () => {
      if (!actor || !withUsername) return [];
      return actor.getConversation(withUsername);
    },
    enabled: !!actor && !isFetching && !!withUsername,
    refetchInterval: 5_000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      toUsername,
      text,
    }: { toUsername: string; text: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendMessage(toUsername, text);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["conversation", variables.toUsername],
      });
      qc.invalidateQueries({ queryKey: ["myConversations"] });
    },
  });
}

// --- Friends hooks ---

export function useGetFriends() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriends();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useAddFriend() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.addFriend(username);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useRemoveFriend() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeFriend(username);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}
