import { create } from "zustand";
import type { Song } from "../backend";

interface PlayerState {
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
}

interface PlayerActions {
  setQueue: (songs: Song[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setProgress: (
    progress: number,
    currentTime: number,
    duration: number,
  ) => void;
  clearPlayer: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  progress: 0,
  duration: 0,
  currentTime: 0,

  setQueue: (songs, startIndex = 0) => {
    set({
      queue: songs,
      currentIndex: startIndex,
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
    });
    const song = songs[startIndex];
    if (song) {
      audioManager.load(song);
      set({ isPlaying: true });
    }
  },

  play: () => {
    audioManager.play();
    set({ isPlaying: true });
  },

  pause: () => {
    audioManager.pause();
    set({ isPlaying: false });
  },

  toggle: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  next: () => {
    const { queue, currentIndex } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) return;
    const song = queue[nextIndex];
    set({ currentIndex: nextIndex, progress: 0, currentTime: 0, duration: 0 });
    audioManager.load(song);
    set({ isPlaying: true });
  },

  prev: () => {
    const { queue, currentIndex } = get();
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) return;
    const song = queue[prevIndex];
    set({ currentIndex: prevIndex, progress: 0, currentTime: 0, duration: 0 });
    audioManager.load(song);
    set({ isPlaying: true });
  },

  seek: (time: number) => {
    audioManager.seek(time);
  },

  setProgress: (progress, currentTime, duration) => {
    set({ progress, currentTime, duration });
  },

  clearPlayer: () => {
    audioManager.pause();
    set({
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
    });
  },
}));

// ---------------------------------------------------------------------------
// AudioManager singleton
// ---------------------------------------------------------------------------

type Callback = () => void;
type TimeCallback = (currentTime: number, duration: number) => void;

class AudioManager {
  audio: HTMLAudioElement;
  private _onTimeUpdateCbs: TimeCallback[] = [];
  private _onEndedCbs: Callback[] = [];
  private _onDurationChangeCbs: Callback[] = [];

  constructor() {
    this.audio = new Audio();
    this.audio.addEventListener("timeupdate", () => {
      const { currentTime, duration } = this.audio;
      for (const cb of this._onTimeUpdateCbs) cb(currentTime, duration || 0);
    });
    this.audio.addEventListener("ended", () => {
      for (const cb of this._onEndedCbs) cb();
    });
    this.audio.addEventListener("durationchange", () => {
      for (const cb of this._onDurationChangeCbs) cb();
    });
  }

  load(song: Song) {
    this.audio.pause();
    this.audio.src = song.previewUrl;
    this.audio.currentTime = 0;
    this.audio.play().catch(() => {});
  }

  play() {
    this.audio.play().catch(() => {});
  }

  pause() {
    this.audio.pause();
  }

  seek(time: number) {
    this.audio.currentTime = time;
  }

  onTimeUpdate(cb: TimeCallback) {
    this._onTimeUpdateCbs.push(cb);
  }

  onEnded(cb: Callback) {
    this._onEndedCbs.push(cb);
  }

  onDurationChange(cb: Callback) {
    this._onDurationChangeCbs.push(cb);
  }
}

export const audioManager = new AudioManager();

// Wire audioManager events → store updates
audioManager.onTimeUpdate((currentTime, duration) => {
  const progress = duration > 0 ? currentTime / duration : 0;
  usePlayerStore.getState().setProgress(progress, currentTime, duration);
});

audioManager.onEnded(() => {
  const { queue, currentIndex } = usePlayerStore.getState();
  const nextIndex = currentIndex + 1;
  if (nextIndex < queue.length) {
    usePlayerStore.getState().next();
  } else {
    usePlayerStore.setState({ isPlaying: false, progress: 0, currentTime: 0 });
  }
});
