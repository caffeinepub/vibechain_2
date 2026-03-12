import { create } from "zustand";
import type { Mood, Song } from "../backend";

interface VibeState {
  selectedMood: Mood | null;
  suggestedSongs: Song[];
  setMoodAndSongs: (mood: Mood, songs: Song[]) => void;
  clearSelection: () => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  selectedMood: null,
  suggestedSongs: [],
  setMoodAndSongs: (mood, songs) =>
    set({ selectedMood: mood, suggestedSongs: songs }),
  clearSelection: () => set({ selectedMood: null, suggestedSongs: [] }),
}));
