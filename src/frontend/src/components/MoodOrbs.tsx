import { motion } from "motion/react";

const orbs = [
  {
    id: "orb-a",
    size: 500,
    x: "-10%",
    y: "-15%",
    color: "oklch(0.35 0.20 290 / 0.25)",
    duration: 14,
  },
  {
    id: "orb-b",
    size: 350,
    x: "70%",
    y: "-5%",
    color: "oklch(0.40 0.22 330 / 0.20)",
    duration: 18,
  },
  {
    id: "orb-c",
    size: 280,
    x: "40%",
    y: "60%",
    color: "oklch(0.35 0.18 245 / 0.18)",
    duration: 12,
  },
  {
    id: "orb-d",
    size: 200,
    x: "80%",
    y: "70%",
    color: "oklch(0.45 0.22 200 / 0.15)",
    duration: 20,
  },
  {
    id: "orb-e",
    size: 150,
    x: "20%",
    y: "80%",
    color: "oklch(0.50 0.18 310 / 0.18)",
    duration: 15,
  },
];

export function MoodOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
          }}
          animate={{
            x: [
              0,
              30 * (i % 2 === 0 ? 1 : -1),
              -20 * (i % 3 === 0 ? 1 : -1),
              0,
            ],
            y: [0, -40 * (i % 2 === 0 ? 1 : -1), 25, 0],
            scale: [1, 1.08, 0.95, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
