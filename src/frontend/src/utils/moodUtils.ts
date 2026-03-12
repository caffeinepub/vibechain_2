import { Mood } from "../backend";

export interface MoodConfig {
  mood: Mood;
  emoji: string;
  label: string;
  description: string;
  glowColor: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  searchTerm: string;
}

export const MOOD_CONFIGS: MoodConfig[] = [
  {
    mood: Mood.happy,
    emoji: "😄",
    label: "Happy",
    description: "Riding the sunshine wave",
    glowColor: "oklch(0.78 0.20 80 / 0.6)",
    bgGradient: "from-amber-950/40 to-yellow-900/20",
    borderColor: "border-yellow-500/40",
    textColor: "text-yellow-300",
    searchTerm: "happy upbeat",
  },
  {
    mood: Mood.sad,
    emoji: "😢",
    label: "Sad",
    description: "Let it flow, let it heal",
    glowColor: "oklch(0.60 0.20 245 / 0.6)",
    bgGradient: "from-blue-950/40 to-blue-900/20",
    borderColor: "border-blue-500/40",
    textColor: "text-blue-300",
    searchTerm: "sad emotional",
  },
  {
    mood: Mood.energetic,
    emoji: "⚡",
    label: "Energetic",
    description: "Unstoppable frequency",
    glowColor: "oklch(0.75 0.28 145 / 0.6)",
    bgGradient: "from-green-950/40 to-emerald-900/20",
    borderColor: "border-green-400/40",
    textColor: "text-green-300",
    searchTerm: "energetic workout",
  },
  {
    mood: Mood.calm,
    emoji: "🌊",
    label: "Calm",
    description: "Still waters run deep",
    glowColor: "oklch(0.70 0.22 200 / 0.6)",
    bgGradient: "from-teal-950/40 to-cyan-900/20",
    borderColor: "border-teal-400/40",
    textColor: "text-teal-300",
    searchTerm: "calm relaxing",
  },
  {
    mood: Mood.melancholic,
    emoji: "🌙",
    label: "Melancholic",
    description: "Beautiful and bittersweet",
    glowColor: "oklch(0.55 0.22 290 / 0.6)",
    bgGradient: "from-purple-950/40 to-violet-900/20",
    borderColor: "border-purple-500/40",
    textColor: "text-purple-300",
    searchTerm: "melancholic indie",
  },
  {
    mood: Mood.angry,
    emoji: "🔥",
    label: "Angry",
    description: "Burn through the noise",
    glowColor: "oklch(0.62 0.28 30 / 0.6)",
    bgGradient: "from-red-950/40 to-orange-900/20",
    borderColor: "border-red-500/40",
    textColor: "text-red-300",
    searchTerm: "angry rock",
  },
  {
    mood: Mood.romantic,
    emoji: "💜",
    label: "Romantic",
    description: "Hearts in harmony",
    glowColor: "oklch(0.70 0.26 345 / 0.6)",
    bgGradient: "from-pink-950/40 to-rose-900/20",
    borderColor: "border-pink-400/40",
    textColor: "text-pink-300",
    searchTerm: "romantic love",
  },
  {
    mood: Mood.anxious,
    emoji: "🌀",
    label: "Anxious",
    description: "Breathe. You're not alone.",
    glowColor: "oklch(0.65 0.08 280 / 0.6)",
    bgGradient: "from-slate-900/40 to-gray-800/20",
    borderColor: "border-slate-400/40",
    textColor: "text-slate-300",
    searchTerm: "ambient soothing",
  },
];

export function getMoodConfig(mood: Mood): MoodConfig {
  return MOOD_CONFIGS.find((m) => m.mood === mood) ?? MOOD_CONFIGS[3];
}

export function getMoodEmoji(mood: Mood): string {
  return getMoodConfig(mood).emoji;
}

export function getMoodLabel(mood: Mood): string {
  return getMoodConfig(mood).label;
}

export function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}
