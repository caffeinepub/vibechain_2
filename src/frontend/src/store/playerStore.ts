import { create } from "zustand";
import type { Song } from "../backend";

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: object) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
      ready: (cb: () => void) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

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
// YouTubePlayerManager singleton
// ---------------------------------------------------------------------------

type Callback = () => void;
type TimeCallback = (currentTime: number, duration: number) => void;

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const existing = document.getElementById("yt-iframe-api-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "yt-iframe-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };
  });
}

class YouTubePlayerManager {
  private player: YTPlayer | null = null;
  private _ready = false;
  private _pendingSong: Song | null = null;
  private _pollInterval: ReturnType<typeof setInterval> | null = null;
  private _onTimeUpdateCbs: TimeCallback[] = [];
  private _onEndedCbs: Callback[] = [];
  private _onDurationChangeCbs: Callback[] = [];

  private ensureContainer() {
    if (!document.getElementById("yt-player-container")) {
      const div = document.createElement("div");
      div.id = "yt-player-container";
      div.style.position = "fixed";
      div.style.width = "1px";
      div.style.height = "1px";
      div.style.opacity = "0";
      div.style.pointerEvents = "none";
      div.style.zIndex = "-1";
      document.body.appendChild(div);
    }
  }

  private startPolling() {
    if (this._pollInterval) return;
    this._pollInterval = setInterval(() => {
      if (!this.player) return;
      try {
        const currentTime = this.player.getCurrentTime();
        const duration = this.player.getDuration();
        for (const cb of this._onTimeUpdateCbs) cb(currentTime, duration || 0);
      } catch {
        // player not ready
      }
    }, 500);
  }

  private stopPolling() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  }

  private async initPlayer(videoId: string) {
    this.ensureContainer();
    await loadYouTubeAPI();

    if (this.player) {
      try {
        this.player.loadVideoById(videoId);
        this._ready = true;
        this.startPolling();
        return;
      } catch {
        // fall through to recreate
      }
    }

    this._ready = false;
    this.player = new window.YT.Player("yt-player-container", {
      videoId,
      playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
      events: {
        onReady: () => {
          this._ready = true;
          if (this._pendingSong) {
            this.player?.loadVideoById(this._pendingSong.previewUrl);
            this._pendingSong = null;
          }
          this.startPolling();
        },
        onStateChange: (event: { data: number }) => {
          if (window.YT?.PlayerState?.ENDED === event.data) {
            this.stopPolling();
            for (const cb of this._onEndedCbs) cb();
          }
        },
      },
    });
  }

  load(song: Song) {
    if (!song.previewUrl) return;
    this.initPlayer(song.previewUrl).catch(() => {});
  }

  play() {
    if (this.player && this._ready) {
      try {
        this.player.playVideo();
        this.startPolling();
      } catch {
        // ignore
      }
    }
  }

  pause() {
    if (this.player && this._ready) {
      try {
        this.player.pauseVideo();
      } catch {
        // ignore
      }
    }
    this.stopPolling();
  }

  seek(time: number) {
    if (this.player && this._ready) {
      try {
        this.player.seekTo(time, true);
      } catch {
        // ignore
      }
    }
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

export const audioManager = new YouTubePlayerManager();

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
