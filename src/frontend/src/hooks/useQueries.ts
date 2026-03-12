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

export function useGetMusicSuggestions() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (mood: Mood) => {
      if (!actor) throw new Error("Not connected");
      const json = await actor.getMusicSuggestions(mood);
      const parsed = JSON.parse(json) as { results?: ItunesTrack[] };
      const results = parsed.results ?? [];
      return results
        .filter((r) => r.previewUrl)
        .map(
          (r): Song => ({
            trackId: BigInt(r.trackId ?? 0),
            title: r.trackName ?? "Unknown Track",
            artist: r.artistName ?? "Unknown Artist",
            artworkUrl: r.artworkUrl100 ?? "",
            previewUrl: r.previewUrl ?? "",
          }),
        );
    },
  });
}

interface ItunesTrack {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
}
