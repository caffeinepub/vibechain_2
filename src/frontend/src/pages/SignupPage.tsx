import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mood } from "../backend";
import { MoodOrbs } from "../components/MoodOrbs";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function SignupPage() {
  const navigate = useNavigate();
  const {
    login,
    identity,
    isLoggingIn,
    isLoginError,
    loginError,
    isInitializing,
  } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [username, setUsername] = useState("");
  const [pendingCreate, setPendingCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (!pendingCreate) return;
    if (!identity || isFetching || !actor) return;

    setCreating(true);
    setPendingCreate(false);

    actor
      .createUserProfile(username.trim(), Mood.calm, null)
      .then(() => {
        toast.success("Welcome to VIBECHAIN! 🎵");
        navigate({ to: "/mood" });
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to create profile";
        toast.error(msg);
      })
      .finally(() => setCreating(false));
  }, [pendingCreate, identity, isFetching, actor, username, navigate]);

  useEffect(() => {
    if (isLoginError && loginError) {
      toast.error(loginError.message ?? "Login failed");
      setPendingCreate(false);
    }
  }, [isLoginError, loginError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameError("Username is required");
      return;
    }
    if (trimmed.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    setUsernameError("");
    setPendingCreate(true);
    if (!identity) {
      login();
    }
  };

  const isLoading = isInitializing || isLoggingIn || creating;

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
          <Link to="/" className="inline-block">
            <h1 className="font-display text-4xl font-black">
              <span className="text-gradient">VIBE</span>
              <span className="text-foreground">CHAIN</span>
            </h1>
          </Link>
          <p className="text-muted-foreground mt-2">
            Begin your soulful journey
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-display text-2xl font-bold mb-1">
            Create Account
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Choose your name, then connect your identity
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="your_vibe_name"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError("");
                }}
                disabled={isLoading}
                data-ocid="auth.username_input"
                className="bg-muted/30 border-border/50 focus:border-primary/70 h-12 text-base"
              />
              {usernameError && (
                <p
                  className="text-destructive text-xs"
                  data-ocid="auth.username_error"
                >
                  {usernameError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email{" "}
                <span className="text-muted-foreground/60 text-xs">
                  (display only)
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={isLoading}
                data-ocid="auth.email_input"
                className="bg-muted/30 border-border/50 focus:border-primary/70 h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password{" "}
                <span className="text-muted-foreground/60 text-xs">
                  (display only)
                </span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isLoading}
                data-ocid="auth.password_input"
                className="bg-muted/30 border-border/50 focus:border-primary/70 h-12 text-base"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              data-ocid="auth.signup_button"
              className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
              }}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {isLoggingIn
                ? "Connecting identity..."
                : creating
                  ? "Creating profile..."
                  : "Join VIBECHAIN"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already a soul?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
