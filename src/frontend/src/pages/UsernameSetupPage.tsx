import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Mood } from "../backend";
import { MoodOrbs } from "../components/MoodOrbs";
import { useActor } from "../hooks/useActor";

function validateUsername(value: string): string | null {
  if (value.length < 3) return "Too short — at least 3 characters";
  if (value.length > 20) return "Too long — max 20 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(value))
    return "Only letters, numbers, and underscores allowed";
  return null;
}

export function UsernameSetupPage() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    if (error) setError(validateUsername(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!actor) return;

    setSubmitting(true);
    setError(null);
    try {
      await actor.createUserProfile(username, Mood.calm, null);
      navigate({ to: "/feed" });
    } catch (err: any) {
      setError(
        err?.message ?? "Something went wrong. Try a different username.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <MoodOrbs />

      <motion.div
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-black">
            <span className="text-gradient">VIBE</span>
            <span className="text-foreground">CHAIN</span>
          </h1>
          <p className="text-muted-foreground mt-2">You're almost in</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold">
              Choose your vibe name
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-8 pl-[52px]">
            This is how others will know you on VIBECHAIN
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm select-none">
                  @
                </span>
                <Input
                  data-ocid="username_setup.input"
                  type="text"
                  placeholder="your_vibe_name"
                  value={username}
                  onChange={handleChange}
                  disabled={submitting}
                  maxLength={20}
                  autoFocus
                  className="pl-8 py-6 text-lg bg-muted/20 border-border/50 focus:border-primary/60 rounded-xl placeholder:text-muted-foreground/40"
                />
              </div>
              {error && (
                <p
                  data-ocid="username_setup.error_state"
                  className="text-destructive text-sm px-1"
                >
                  {error}
                </p>
              )}
              <p className="text-muted-foreground/50 text-xs px-1">
                3–20 characters · letters, numbers, underscores
              </p>
            </div>

            <Button
              type="submit"
              data-ocid="username_setup.submit_button"
              disabled={submitting || !username}
              className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
              }}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {submitting ? "Setting your vibe..." : "Set My Vibe"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
