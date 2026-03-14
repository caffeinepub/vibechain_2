import { toast } from "sonner";
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
  cueVideoById(videoId: string): void;
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
      audioManager.load(song, true);
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
    audioManager.load(song, true);
  },

  prev: () => {
    const { queue, currentIndex } = get();
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) return;
    const song = queue[prevIndex];
    set({ currentIndex: prevIndex, progress: 0, currentTime: 0, duration: 0 });
    audioManager.load(song, true);
  },

  seek: (time: number) => {
    audioManager.seek(time);
  },

  setProgress: (progress, currentTime, duration) => {
    set({ progress, currentTime, duration });
  },

  clearPlayer: () => {
    audioManager.pause();
    wakeLockManager.release();
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
// Screen Wake Lock — prevents OS from suspending the player on mobile
// ---------------------------------------------------------------------------

class WakeLockManager {
  private lock: WakeLockSentinel | null = null;

  async acquire() {
    if (!("wakeLock" in navigator)) return;
    try {
      this.lock = await (navigator as any).wakeLock.request("screen");
      this.lock!.addEventListener("release", () => {
        this.lock = null;
      });
    } catch {
      /* ignore — denied or not supported */
    }
  }

  async release() {
    try {
      await this.lock?.release();
    } catch {
      /* ignore */
    }
    this.lock = null;
  }
}

export const wakeLockManager = new WakeLockManager();

// Re-acquire wake lock when the user returns to the tab while music is playing
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const { isPlaying } = usePlayerStore.getState();
    if (isPlaying) {
      wakeLockManager.acquire();
      // Resume YouTube player in case mobile browser paused it
      audioManager.play();
    }
  } else {
    // Page hidden — OS will reclaim the lock anyway
    wakeLockManager.release();
  }
});

// ---------------------------------------------------------------------------
// Media Session API — lock screen / notification controls
// ---------------------------------------------------------------------------

function updateMediaSession(song: Song | undefined, isPlaying: boolean) {
  if (!("mediaSession" in navigator)) return;
  if (!song) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    artwork: song.artworkUrl
      ? [{ src: song.artworkUrl, sizes: "512x512", type: "image/jpeg" }]
      : [],
  });

  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

  navigator.mediaSession.setActionHandler("play", () => {
    usePlayerStore.getState().play();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    usePlayerStore.getState().pause();
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    usePlayerStore.getState().prev();
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => {
    usePlayerStore.getState().next();
  });
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime != null) {
      audioManager.seek(details.seekTime);
    }
  });
}

// ---------------------------------------------------------------------------
// iOS background audio keep-alive
// A silent <audio> loop tricks iOS Safari into keeping the audio context alive
// so the YouTube embed isn't suspended when the screen locks.
// ---------------------------------------------------------------------------

class IOSBackgroundKeepAlive {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private started = false;

  start() {
    if (this.started) return;
    this.started = true;
    try {
      // Use Web Audio API with a nearly-silent looping buffer.
      // This keeps the audio session alive on iOS so the YouTube
      // iframe is not suspended when the screen locks.
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      const buf = this.ctx.createBuffer(
        1,
        this.ctx.sampleRate,
        this.ctx.sampleRate,
      );
      this.source = this.ctx.createBufferSource();
      this.source.buffer = buf;
      this.source.loop = true;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.001;
      this.source.connect(gain);
      gain.connect(this.ctx.destination);
      this.source.start(0);
    } catch {
      // ignore
    }
  }

  stop() {
    try {
      this.source?.stop();
    } catch {
      /* ignore */
    }
    this.source = null;
    try {
      this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.started = false;
  }
}

export const iosKeepAlive = new IOSBackgroundKeepAlive();

// ---------------------------------------------------------------------------
// YouTubePlayerManager singleton
// ---------------------------------------------------------------------------

type Callback = () => void;
type TimeCallback = (currentTime: number, duration: number) => void;

// Stable singleton promise so concurrent callers all wait for the same load
let _ytApiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (_ytApiPromise) return _ytApiPromise;
  _ytApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api-script")) {
      const script = document.createElement("script");
      script.id = "yt-iframe-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
  return _ytApiPromise;
}

class YouTubePlayerManager {
  private player: YTPlayer | null = null;
  private _ready = false;
  private _autoplayOnReady = false;
  private _pendingVideoId: string | null = null;
  private _pollInterval: ReturnType<typeof setInterval> | null = null;
  private _onTimeUpdateCbs: TimeCallback[] = [];
  private _onEndedCbs: Callback[] = [];
  private _onErrorCbs: Callback[] = [];

  private ensureContainer(): string {
    const id = "yt-player-container";
    if (!document.getElementById(id)) {
      const div = document.createElement("div");
      div.id = id;
      div.style.cssText =
        "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;";
      document.body.appendChild(div);
    }
    return id;
  }

  private startPolling() {
    if (this._pollInterval) return;
    this._pollInterval = setInterval(() => {
      if (!this.player || !this._ready) return;
      try {
        const currentTime = this.player.getCurrentTime();
        const duration = this.player.getDuration();
        for (const cb of this._onTimeUpdateCbs) cb(currentTime, duration || 0);
        // Keep Media Session position state in sync
        if ("mediaSession" in navigator && duration > 0) {
          try {
            navigator.mediaSession.setPositionState({
              duration,
              playbackRate: 1,
              position: currentTime,
            });
          } catch {
            /* ignore */
          }
        }
      } catch {
        // player not ready yet
      }
    }, 500);
  }

  private stopPolling() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  }

  private async createPlayer(videoId: string, autoplay: boolean) {
    const containerId = this.ensureContainer();
    await loadYouTubeAPI();

    // Re-check: if player was created while we were awaiting, just load the video
    if (this.player && this._ready) {
      this.player.loadVideoById(videoId);
      if (autoplay) {
        try {
          this.player.playVideo();
        } catch {
          /* ignore */
        }
        this.startPolling();
        wakeLockManager.acquire();
        usePlayerStore.setState({ isPlaying: true });
      }
      return;
    }

    this._ready = false;
    this._autoplayOnReady = autoplay;
    this._pendingVideoId = null;

    this.player = new window.YT.Player(containerId, {
      videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      host: "https://www.youtube-nocookie.com",
      events: {
        onReady: () => {
          this._ready = true;
          if (this._pendingVideoId) {
            this.player?.loadVideoById(this._pendingVideoId);
            this._pendingVideoId = null;
          }
          if (this._autoplayOnReady) {
            try {
              this.player?.playVideo();
            } catch {
              /* ignore */
            }
            this.startPolling();
            wakeLockManager.acquire();
            usePlayerStore.setState({ isPlaying: true });
          }
        },
        onStateChange: (event: { data: number }) => {
          const YTState = window.YT?.PlayerState;
          if (YTState?.ENDED === event.data) {
            this.stopPolling();
            wakeLockManager.release();
            for (const cb of this._onEndedCbs) cb();
          } else if (YTState?.PLAYING === event.data) {
            this.startPolling();
            wakeLockManager.acquire();
            iosKeepAlive.start();
            usePlayerStore.setState({ isPlaying: true });
            const { queue, currentIndex } = usePlayerStore.getState();
            updateMediaSession(queue[currentIndex], true);
          } else if (YTState?.PAUSED === event.data) {
            this.stopPolling();
            wakeLockManager.release();
            usePlayerStore.setState({ isPlaying: false });
            const { queue, currentIndex } = usePlayerStore.getState();
            updateMediaSession(queue[currentIndex], false);
          }
        },
        onError: (event: { data: number }) => {
          this.stopPolling();
          wakeLockManager.release();
          usePlayerStore.setState({ isPlaying: false });
          const msg =
            event.data === 2
              ? "Invalid video ID"
              : event.data === 5
                ? "HTML5 player error"
                : event.data === 100
                  ? "Video not found or private"
                  : event.data === 101 || event.data === 150
                    ? "Video cannot be played here"
                    : "Could not play this song";
          toast.error(`${msg}. Try another.`);
          for (const cb of this._onErrorCbs) cb();
        },
      },
    });
  }

  load(song: Song, autoplay = false) {
    if (!song.previewUrl) return;
    const videoId = song.previewUrl;

    if (autoplay) {
      iosKeepAlive.start();
      updateMediaSession(song, true);
    }

    if (this.player && this._ready) {
      this.player.loadVideoById(videoId);
      if (autoplay) {
        try {
          this.player.playVideo();
        } catch {
          /* ignore */
        }
        this.startPolling();
        wakeLockManager.acquire();
        usePlayerStore.setState({ isPlaying: true });
      }
    } else if (this.player && !this._ready) {
      this._pendingVideoId = videoId;
      this._autoplayOnReady = autoplay;
    } else {
      this.createPlayer(videoId, autoplay).catch(() => {});
    }
  }

  play() {
    if (this.player && this._ready) {
      try {
        this.player.playVideo();
        this.startPolling();
        wakeLockManager.acquire();
        iosKeepAlive.start();
        const { queue, currentIndex } = usePlayerStore.getState();
        updateMediaSession(queue[currentIndex], true);
      } catch {
        // ignore
      }
    }
  }

  pause() {
    this.stopPolling();
    wakeLockManager.release();
    if (this.player && this._ready) {
      try {
        this.player.pauseVideo();
        const { queue, currentIndex } = usePlayerStore.getState();
        updateMediaSession(queue[currentIndex], false);
      } catch {
        // ignore
      }
    }
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

  onError(cb: Callback) {
    this._onErrorCbs.push(cb);
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
    iosKeepAlive.stop();
    wakeLockManager.release();
  }
});

audioManager.onError(() => {
  usePlayerStore.setState({ isPlaying: false });
});
