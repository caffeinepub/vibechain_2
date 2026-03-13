import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Waves } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoodOrbs } from "../components/MoodOrbs";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
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
  const [checking, setChecking] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(false);
  const [autoChecked, setAutoChecked] = useState(false);

  // Auto-redirect if already logged in (returning users only)
  useEffect(() => {
    if (isInitializing || isFetching || autoChecked) return;
    if (!identity || !actor) {
      if (!isInitializing && !isFetching) setAutoChecked(true);
      return;
    }

    setChecking(true);
    setAutoChecked(true);

    actor
      .getCallerUserProfile()
      .then((profile) => {
        if (profile) {
          navigate({ to: "/feed" });
        }
        // New users (no profile) stay on login page
      })
      .catch(() => {
        // ignore errors on auto-check
      })
      .finally(() => setChecking(false));
  }, [isInitializing, isFetching, identity, actor, autoChecked, navigate]);

  // After manual login, check profile and redirect accordingly
  useEffect(() => {
    if (!pendingLogin) return;
    if (!identity || isFetching || !actor) return;

    setChecking(true);
    setPendingLogin(false);

    actor
      .getCallerUserProfile()
      .then((profile) => {
        if (profile) {
          navigate({ to: "/feed" });
        } else {
          // New user — go to username setup
          navigate({ to: "/setup-username" });
        }
      })
      .catch(() => {
        // Likely no profile yet
        navigate({ to: "/setup-username" });
      })
      .finally(() => setChecking(false));
  }, [pendingLogin, identity, isFetching, actor, navigate]);

  useEffect(() => {
    if (isLoginError && loginError) {
      // Suppress "already authenticated" error — it's handled gracefully
      const msg = loginError.message ?? "";
      if (!msg.toLowerCase().includes("already authenticated")) {
        toast.error(msg || "Login failed");
      }
    }
  }, [isLoginError, loginError]);

  const handleLogin = () => {
    if (identity) {
      // Already authenticated (actor may still be loading) — wait via pendingLogin effect
      setPendingLogin(true);
    } else {
      setPendingLogin(true);
      login();
    }
  };

  const isLoading = isInitializing || isLoggingIn || checking;

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
          <p className="text-muted-foreground mt-2">Welcome back, soul</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-display text-2xl font-bold mb-1">Sign In</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Connect with Internet Identity to enter your vibe space
          </p>

          <div className="space-y-6">
            <div className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border/50 text-muted-foreground/60 text-sm">
              🔒 Secured via Internet Identity
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              data-ocid="auth.login_button"
              className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.26 295), oklch(0.62 0.28 330))",
              }}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Waves className="mr-2 h-5 w-5" />
              )}
              {isLoggingIn
                ? "Connecting..."
                : checking
                  ? "Checking profile..."
                  : "Enter the Vibe"}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              to="/signup"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Join VIBECHAIN
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
