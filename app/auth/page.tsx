"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Zap,
  Sparkles,
  BarChart3,
  Brain,
  Check,
  ArrowRight,
  Shield,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────── */
type Mode = "signin" | "signup";

/* ─── Google Icon SVG ────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.6 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.3-11.4-8H6.1C9.4 37.3 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2c-.4.4 6.8-5 6.8-14.8 0-1.3-.1-2.7-.4-3.9z"
      />
    </svg>
  );
}

/* ─── Left panel feature bullets ────────────────────────────────── */
const leftFeatures = [
  { icon: Sparkles, label: "AI plans your day in seconds" },
  { icon: BarChart3, label: "Uncover your peak productivity hours" },
  { icon: Brain, label: "Weekly coaching from your personal AI" },
  { icon: Shield, label: "Your data stays private — always" },
];

function LeftPanel() {
  return (
    <div
      className="bg-grid relative hidden flex-col justify-between overflow-hidden px-14 py-16 lg:flex"
      style={{
        background: "#111827",
        borderRight: "1px solid #1E2D45",
        width: "60%",
        minHeight: "100vh",
      }}
    >
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% 40%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
        >
          <Zap size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold text-white">Deepwrk</span>
      </div>

      {/* Centre content */}
      <div className="relative z-10">
        {/* Fake mini dashboard card */}
        <div
          className="glass mb-10 max-w-sm rounded-2xl p-5"
          style={{
            boxShadow: "0 0 50px rgba(99,102,241,0.15)",
          }}
        >
          <div
            className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider"
            style={{ color: "#6366F1" }}
          >
            <Sparkles size={12} />
            Today&apos;s Focus Plan — AI Generated
          </div>
          {[
            { task: "Design system audit", time: "90 min", done: true },
            { task: "Write release notes", time: "45 min", done: true },
            { task: "Auth flow review", time: "60 min", done: false, active: true },
            { task: "Deploy to staging", time: "30 min", done: false },
          ].map(({ task, time, done, active }) => (
            <div
              key={task}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm"
              style={{
                background: active ? "rgba(99,102,241,0.08)" : "transparent",
                color: done ? "#64748B" : "#E2E8F0",
              }}
            >
              <div
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: done ? "#10B981" : active ? "#6366F1" : "#1E2D45",
                  background: done ? "rgba(16,185,129,0.12)" : "transparent",
                }}
              >
                {done && <Check size={9} style={{ color: "#10B981" }} />}
              </div>
              <span className={done ? "line-through" : ""}>{task}</span>
              <span className="ml-auto text-xs" style={{ color: "#64748B" }}>
                {time}
              </span>
            </div>
          ))}
          <div
            className="mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
          >
            <span style={{ color: "#94A3B8" }}>Session in progress</span>
            <span className="font-bold tabular-nums" style={{ color: "#10B981" }}>
              38:22
            </span>
          </div>
        </div>

        <h2 className="mb-2 text-3xl font-black leading-snug text-white">
          Your best work is
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            one session away.
          </span>
        </h2>
        <p className="mb-8 text-base" style={{ color: "#64748B" }}>
          Join thousands of developers, students, and creators who do their best work with Deepwrk.
        </p>

        {/* Feature list */}
        <ul className="space-y-3">
          {leftFeatures.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <div
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <Icon size={13} style={{ color: "#8B5CF6" }} />
              </div>
              <span className="text-sm" style={{ color: "#94A3B8" }}>
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Testimonial */}
      <div className="relative z-10">
        <div
          className="glass-light max-w-sm rounded-xl p-5"
        >
          <div className="mb-2 flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="#F59E0B"
                aria-hidden="true"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <p className="mb-3 text-sm leading-relaxed" style={{ color: "#E2E8F0" }}>
            &ldquo;I went from 2 hours of real focus a day to 5. Deepwrk showed me I was most productive at 6 AM — I never would have figured that out on my own.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
            >
              AK
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Arjun K.</p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Senior Engineer, Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Input component ────────────────────────────────────────────── */
function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  suffix,
  disabled,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  suffix?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: "#E2E8F0" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className="input-dark w-full rounded-xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          style={{ paddingRight: suffix ? "2.75rem" : undefined }}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Auth form ──────────────────────────────────────────────────── */
function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [isPending, startTransition] = useTransition();

  /* Sign In state */
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPw, setSiShowPw] = useState(false);
  const [siRemember, setSiRemember] = useState(false);

  /* Sign Up state */
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suShowPw, setSuShowPw] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);

  /* Shared */
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  /* ── Google OAuth ── */
  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  /* ── Credentials sign-in ── */
  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: siEmail,
        password: siPassword,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password. Please check and try again.");
      } else {
        router.push("/dashboard");
      }
    });
  }

  /* ── Register ── */
  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (suPassword !== suConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (suPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: suName, email: suEmail, password: suPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
      } else {
        /* Auto sign-in then redirect to onboarding */
        const signInResult = await signIn("credentials", {
          email: suEmail,
          password: suPassword,
          redirect: false,
        });
        if (signInResult?.error) {
          setError("Account created! Please sign in.");
          setMode("signin");
          setSiEmail(suEmail);
        } else {
          router.push("/onboarding");
        }
      }
    });
  }

  /* ── Switch mode ── */
  function switchMode(next: Mode) {
    setError(null);
    setMode(next);
  }

  const loading = isPending;

  return (
    <div className="flex w-full flex-col">
      {/* Logo (mobile only) */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
        >
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold text-white">Deepwrk</span>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "#94A3B8" }}>
          {mode === "signin"
            ? "Sign in to continue your deep work journey."
            : "Start doing your best work in under 2 minutes."}
        </p>
      </div>

      {/* Mode toggle pills */}
      <div
        className="mb-8 flex rounded-xl p-1"
        style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
      >
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
            style={
              mode === m
                ? {
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    color: "#FFFFFF",
                  }
                : { color: "#94A3B8" }
            }
          >
            {m === "signin" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* Google button */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border py-3 text-sm font-semibold transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ borderColor: "#2D4060", color: "#E2E8F0", background: "rgba(255,255,255,0.03)" }}
      >
        {googleLoading ? (
          <Loader2 size={18} className="animate-spin" style={{ color: "#6366F1" }} />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "#1E2D45" }} />
        <span className="text-xs" style={{ color: "#64748B" }}>
          or continue with email
        </span>
        <div className="h-px flex-1" style={{ background: "#1E2D45" }} />
      </div>

      {/* ── Sign In form ── */}
      {mode === "signin" && (
        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            value={siEmail}
            onChange={setSiEmail}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={loading}
          />
          <Input
            label="Password"
            type={siShowPw ? "text" : "password"}
            value={siPassword}
            onChange={setSiPassword}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={loading}
            suffix={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setSiShowPw((v) => !v)}
                style={{ color: "#64748B" }}
              >
                {siShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {/* Remember + forgot */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "#94A3B8" }}>
              <div
                className="relative flex h-4 w-4 items-center justify-center rounded"
                style={{
                  background: siRemember ? "#6366F1" : "transparent",
                  border: `1px solid ${siRemember ? "#6366F1" : "#1E2D45"}`,
                  cursor: "pointer",
                }}
                onClick={() => setSiRemember((v) => !v)}
              >
                {siRemember && <Check size={10} className="text-white" />}
              </div>
              Remember me
            </label>
            <button
              type="button"
              className="text-sm transition-colors hover:text-white"
              style={{ color: "#6366F1" }}
            >
              Forgot password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* ── Sign Up form ── */}
      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <Input
            label="Full name"
            type="text"
            value={suName}
            onChange={setSuName}
            placeholder="Alex Johnson"
            required
            autoComplete="name"
            disabled={loading}
          />
          <Input
            label="Email address"
            type="email"
            value={suEmail}
            onChange={setSuEmail}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={loading}
          />
          <Input
            label="Password"
            type={suShowPw ? "text" : "password"}
            value={suPassword}
            onChange={setSuPassword}
            placeholder="Minimum 8 characters"
            required
            autoComplete="new-password"
            disabled={loading}
            suffix={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setSuShowPw((v) => !v)}
                style={{ color: "#64748B" }}
              >
                {suShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Input
            label="Confirm password"
            type={suShowConfirm ? "text" : "password"}
            value={suConfirm}
            onChange={setSuConfirm}
            placeholder="Repeat password"
            required
            autoComplete="new-password"
            disabled={loading}
            suffix={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setSuShowConfirm((v) => !v)}
                style={{ color: "#64748B" }}
              >
                {suShowConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {/* Password strength hint */}
          {suPassword.length > 0 && (
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((level) => {
                const strength =
                  suPassword.length >= 12 && /[A-Z]/.test(suPassword) && /[0-9]/.test(suPassword)
                    ? 4
                    : suPassword.length >= 10
                    ? 3
                    : suPassword.length >= 8
                    ? 2
                    : 1;
                return (
                  <div
                    key={level}
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{
                      background:
                        level <= strength
                          ? strength === 4
                            ? "#10B981"
                            : strength === 3
                            ? "#F59E0B"
                            : "#EF4444"
                          : "#1E2D45",
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Create account — it&apos;s free
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Terms */}
      <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: "#64748B" }}>
        By continuing, you agree to our{" "}
        <a href="/terms" className="underline underline-offset-2 hover:text-white transition-colors">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-white transition-colors">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function AuthPage() {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#0A0E1A" }}
    >
      {/* Left panel */}
      <LeftPanel />

      {/* Right panel */}
      <div
        className="flex flex-1 items-center justify-center px-6 py-16 lg:px-16"
        style={{ background: "#0A0E1A" }}
      >
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0 lg:left-[60%]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-md">
          {/* Glass card */}
          <div
            className="glass rounded-2xl p-8 shadow-2xl"
            style={{
              boxShadow:
                "0 0 0 1px rgba(30,45,69,0.8), 0 24px 64px rgba(0,0,0,0.4), 0 0 80px rgba(99,102,241,0.06)",
            }}
          >
            <AuthForm />
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs" style={{ color: "#64748B" }}>
            🔒 256-bit encryption · GDPR compliant · No spam, ever.
          </p>
        </div>
      </div>
    </div>
  );
}
