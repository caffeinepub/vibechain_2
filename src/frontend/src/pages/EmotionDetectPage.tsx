import { Progress } from "@/components/ui/progress";
import { useNavigate } from "@tanstack/react-router";
import { Camera, RefreshCw, Sparkles, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mood } from "../backend";
import { BottomNav } from "../components/BottomNav";
import { useGetMusicSuggestions } from "../hooks/useQueries";
import { useVibeStore } from "../store/vibeStore";
import { MOOD_CONFIGS } from "../utils/moodUtils";

// face-api.js loaded via CDN script tag
declare const faceapi: any;

const CDN_BASE = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";

type DetectionState = "idle" | "loading" | "scanning" | "result" | "error";

interface DetectedEmotion {
  mood: Mood;
  confidence: number;
  rawExpression: string;
}

function mapExpressionToMood(
  expressions: Record<string, number>,
): DetectedEmotion {
  const sorted = Object.entries(expressions).sort(([, a], [, b]) => b - a);
  const [topExpr, topConf] = sorted[0];
  const mapping: Record<string, Mood> = {
    happy: Mood.happy,
    sad: Mood.sad,
    angry: Mood.angry,
    surprised: Mood.energetic,
    fearful: Mood.anxious,
    disgusted: Mood.angry,
    neutral: Mood.calm,
  };
  const mood = mapping[topExpr] ?? Mood.calm;
  return { mood, confidence: topConf, rawExpression: topExpr };
}

function loadFaceApiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof faceapi !== "undefined") {
      resolve();
      return;
    }
    const existing = document.querySelector("script[data-faceapi]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
    script.setAttribute("data-faceapi", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load face-api.js"));
    document.head.appendChild(script);
  });
}

export function EmotionDetectPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stabilityRef = useRef<{ mood: Mood | null; count: number }>({
    mood: null,
    count: 0,
  });
  const modelsReadyRef = useRef(false);

  const [state, setState] = useState<DetectionState>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [detected, setDetected] = useState<DetectedEmotion | null>(null);
  const [scanningLabel, setScanningLabel] = useState("");

  const setMoodAndSongs = useVibeStore((s) => s.setMoodAndSongs);
  const { mutateAsync: getMusicSuggestions, isPending: isFetchingMusic } =
    useGetMusicSuggestions();

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  const startDetectionLoop = useCallback(() => {
    const expressions = ["😊", "🔍", "✨", "🎭", "💫"];
    let idx = 0;
    intervalRef.current = setInterval(async () => {
      setScanningLabel(expressions[idx % expressions.length]);
      idx++;
      if (!videoRef.current || !modelsReadyRef.current) return;
      try {
        const result = await (faceapi as any)
          .detectSingleFace(
            videoRef.current,
            new (faceapi as any).TinyFaceDetectorOptions(),
          )
          .withFaceExpressions();
        if (result?.expressions) {
          const emotion = mapExpressionToMood(result.expressions);
          const stab = stabilityRef.current;
          if (stab.mood === emotion.mood) {
            stab.count++;
            if (stab.count >= 3) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setDetected(emotion);
              setState("result");
            }
          } else {
            stab.mood = emotion.mood;
            stab.count = 1;
          }
        }
      } catch {
        // silently ignore detection frame errors
      }
    }, 500);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("scanning");
      startDetectionLoop();
    } catch {
      setState("error");
    }
  }, [startDetectionLoop]);

  const loadModels = useCallback(async () => {
    setState("loading");
    setLoadProgress(10);
    try {
      await loadFaceApiScript();
      setLoadProgress(40);
      await (faceapi as any).nets.tinyFaceDetector.loadFromUri(CDN_BASE);
      setLoadProgress(70);
      await (faceapi as any).nets.faceExpressionNet.loadFromUri(CDN_BASE);
      setLoadProgress(100);
      modelsReadyRef.current = true;
      await startCamera();
    } catch {
      setState("error");
      toast.error("Failed to load emotion models");
    }
  }, [startCamera]);

  const handleScanNow = async () => {
    if (!videoRef.current || !modelsReadyRef.current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      const result = await (faceapi as any)
        .detectSingleFace(
          videoRef.current,
          new (faceapi as any).TinyFaceDetectorOptions(),
        )
        .withFaceExpressions();
      if (result?.expressions) {
        const emotion = mapExpressionToMood(result.expressions);
        setDetected(emotion);
        setState("result");
      } else {
        toast.error("No face detected. Make sure your face is visible.");
        startDetectionLoop();
      }
    } catch {
      toast.error("Detection failed. Try again.");
      startDetectionLoop();
    }
  };

  const handleRetry = () => {
    setDetected(null);
    stabilityRef.current = { mood: null, count: 0 };
    setState("scanning");
    startDetectionLoop();
  };

  const handleUseVibe = async () => {
    if (!detected) return;
    stopCamera();
    try {
      const songs = await getMusicSuggestions(detected.mood);
      setMoodAndSongs(detected.mood, songs);
      navigate({ to: "/pick-song" });
    } catch {
      toast.error("Could not load music. Try again.");
    }
  };

  // Only cleanup on unmount — do NOT auto-call loadModels here
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const detectedConfig = detected
    ? MOOD_CONFIGS.find((c) => c.mood === detected.mood)
    : null;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              navigate({ to: "/mood" });
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-gradient">
              Detect My Vibe
            </h1>
            <p className="text-muted-foreground text-xs">
              Camera emotion detection
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Idle — prompt user to allow camera (must be triggered by user gesture) */}
        <AnimatePresence>
          {state === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card rounded-3xl p-10 text-center space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{
                  duration: 2.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: "oklch(0.35 0.15 290 / 0.4)",
                  boxShadow: "0 0 40px oklch(0.65 0.25 290 / 0.4)",
                  border: "2px solid oklch(0.65 0.25 290 / 0.5)",
                }}
              >
                <Camera className="w-9 h-9 text-violet-300" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Read Your Vibe
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  Point your camera at your face — VIBECHAIN will detect your
                  mood automatically and suggest matching music.
                </p>
              </div>

              <div className="space-y-3">
                <motion.button
                  data-ocid="detect.start_button"
                  type="button"
                  onClick={loadModels}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2.5 transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.55 0.25 290), oklch(0.5 0.22 310))",
                    boxShadow: "0 4px 24px oklch(0.55 0.25 290 / 0.4)",
                  }}
                >
                  <Camera className="w-5 h-5" />
                  Allow Camera &amp; Detect Vibe
                </motion.button>
                <p className="text-xs text-muted-foreground">
                  Your camera feed stays on-device. Nothing is uploaded.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        <AnimatePresence>
          {state === "loading" && (
            <motion.div
              data-ocid="detect.loading_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card rounded-3xl p-8 text-center space-y-6"
            >
              <div className="text-5xl animate-pulse">🧠</div>
              <div>
                <p className="font-display text-lg font-semibold text-foreground">
                  Loading emotion models
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  This takes a moment on first load...
                </p>
              </div>
              <Progress value={loadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{loadProgress}%</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {state === "error" && (
            <motion.div
              data-ocid="detect.error_state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-3xl p-8 text-center space-y-4 border border-red-500/30"
            >
              <div className="text-5xl">📷</div>
              <div>
                <p className="font-display text-lg font-semibold text-red-300">
                  Camera access needed
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Please allow camera access to detect your emotion. Make sure
                  no other app is using the camera.
                </p>
              </div>
              <button
                type="button"
                onClick={loadModels}
                className="px-6 py-2.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-sm hover:bg-red-500/30 transition-all"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera feed + scanning */}
        <AnimatePresence>
          {(state === "scanning" || state === "result") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Camera preview */}
              <div
                data-ocid="detect.canvas_target"
                className="relative rounded-3xl overflow-hidden aspect-[4/3]"
                style={{
                  boxShadow: detectedConfig
                    ? `0 0 40px ${detectedConfig.glowColor}, 0 0 80px ${detectedConfig.glowColor}40`
                    : "0 0 40px oklch(0.65 0.25 290 / 0.4)",
                  border: `2px solid ${
                    detectedConfig
                      ? detectedConfig.glowColor
                      : "oklch(0.65 0.25 290 / 0.5)"
                  }`,
                  transition: "box-shadow 0.6s ease, border-color 0.6s ease",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {state === "scanning" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 bg-gradient-to-t from-black/60 to-transparent">
                    <motion.div
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                      className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2"
                    >
                      <span className="text-lg">{scanningLabel}</span>
                      <span className="text-white text-sm font-medium">
                        Reading your vibe...
                      </span>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Manual scan button */}
              {state === "scanning" && (
                <motion.button
                  data-ocid="detect.scan_button"
                  onClick={handleScanNow}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600/30 to-purple-600/30 border border-violet-500/40 text-white font-semibold flex items-center justify-center gap-2 hover:from-violet-600/50 hover:to-purple-600/50 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Scan Now
                </motion.button>
              )}

              {/* Result card */}
              <AnimatePresence>
                {state === "result" && detected && detectedConfig && (
                  <motion.div
                    data-ocid="detect.result_card"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card rounded-3xl p-6 space-y-4"
                    style={{
                      border: `1px solid ${detectedConfig.glowColor}`,
                      boxShadow: `0 0 30px ${detectedConfig.glowColor}40`,
                    }}
                  >
                    <div className="text-center space-y-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: 0.1,
                        }}
                        className="text-6xl"
                      >
                        {detectedConfig.emoji}
                      </motion.div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">
                          Detected Vibe
                        </p>
                        <h2
                          className={`font-display text-3xl font-bold ${detectedConfig.textColor}`}
                        >
                          {detectedConfig.label}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {detectedConfig.description}
                        </p>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Confidence</span>
                        <span>{Math.round(detected.confidence * 100)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${detected.confidence * 100}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.2,
                          }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${detectedConfig.glowColor}, ${detectedConfig.glowColor}80)`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        data-ocid="detect.retry_button"
                        onClick={handleRetry}
                        className="py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                      </button>
                      <button
                        type="button"
                        data-ocid="detect.use_vibe_button"
                        onClick={handleUseVibe}
                        disabled={isFetchingMusic}
                        className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${detectedConfig.glowColor}80, ${detectedConfig.glowColor}40)`,
                          border: `1px solid ${detectedConfig.glowColor}`,
                          color: "white",
                        }}
                      >
                        {isFetchingMusic ? (
                          <>
                            <span className="animate-spin">⏳</span> Loading...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> Use This Vibe
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
