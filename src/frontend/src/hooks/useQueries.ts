import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Mood, Song, UserProfile, VibeFeedEntry } from "../backend";
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

const YT_API_KEY = "AIzaSyCkFgMR_4K2G5UHVqVPnNcDJLerUnZxE78";

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
        videoCategoryId: "10",
        maxResults: "20",
        key: YT_API_KEY,
      });
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`,
      );
      if (!res.ok) throw new Error("YouTube API request failed");
      const parsed = (await res.json()) as { items?: YouTubeItem[] };
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
