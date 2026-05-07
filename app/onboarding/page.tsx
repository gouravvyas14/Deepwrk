"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Zap,
  Clock,
  Globe,
  Briefcase,
  Target,
  Loader2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_GOALS = [2, 4, 6, 8] as const;

const WORK_START_OPTIONS = [
  { label: "6:00 AM", value: 6 },
  { label: "7:00 AM", value: 7 },
  { label: "8:00 AM", value: 8 },
  { label: "9:00 AM", value: 9 },
  { label: "10:00 AM", value: 10 },
  { label: "11:00 AM", value: 11 },
  { label: "12:00 PM", value: 12 },
];

const WORK_END_OPTIONS = [
  { label: "12:00 PM", value: 12 },
  { label: "1:00 PM", value: 13 },
  { label: "2:00 PM", value: 14 },
  { label: "3:00 PM", value: 15 },
  { label: "4:00 PM", value: 16 },
  { label: "5:00 PM", value: 17 },
  { label: "6:00 PM", value: 18 },
  { label: "7:00 PM", value: 19 },
  { label: "8:00 PM", value: 20 },
  { label: "9:00 PM", value: 21 },
  { label: "10:00 PM", value: 22 },
  { label: "11:00 PM", value: 23 },
  { label: "12:00 AM", value: 0 },
];

const ROLES = [
  "Developer",
  "Student",
  "Designer",
  "Freelancer",
  "Founder",
  "Other",
] as const;

const PRIMARY_GOALS = [
  "Get a job",
  "Ship a project",
  "Pass exams",
  "Build a business",
  "Learn new skills",
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserAvatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={72}
        height={72}
        className="rounded-full object-cover"
        style={{ outline: "3px solid #6366f1", outlineOffset: "2px" }}
        priority
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full text-2xl font-bold text-white"
      style={{
        width: 72,
        height: 72,
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        boxShadow: "0 0 30px rgba(99,102,241,0.4)",
      }}
    >
      {initials}
    </div>
  );
}

interface PillButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function PillButton({ label, selected, onClick }: PillButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border"
      style={{
        background: selected
          ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
          : "transparent",
        borderColor: selected ? "transparent" : "#1e2d45",
        color: selected ? "#ffffff" : "#94a3b8",
        boxShadow: selected ? "0 0 20px rgba(99,102,241,0.35)" : "none",
        transform: selected ? "scale(1.04)" : "scale(1)",
      }}
    >
      {label}
    </button>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

interface StepWelcomeProps {
  name: string;
  image?: string | null;
}

function StepWelcome({ name, image }: StepWelcomeProps) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <UserAvatar name={name} image={image} />
      </motion.div>
      <div className="space-y-3">
        <h2 className="text-3xl font-bold" style={{ color: "#ffffff" }}>
          Welcome to{" "}
          <span className="gradient-text">Deepwrk</span>
          {name ? `, ${name.split(" ")[0]}!` : "!"}
        </h2>
        <p
          className="text-base max-w-sm mx-auto leading-relaxed"
          style={{ color: "#94a3b8" }}
        >
          Let&apos;s set up your focus profile in{" "}
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>60 seconds</span>{" "}
          so Deepwrk can plan your days perfectly.
        </p>
      </div>
      <div
        className="flex items-center gap-8 mt-2 px-8 py-4 rounded-2xl"
        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
      >
        {[
          { icon: "⚡", label: "AI Planning" },
          { icon: "🔥", label: "Streak Tracking" },
          { icon: "📊", label: "Weekly Insights" },
        ].map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StepFocusProfileProps {
  dailyGoalHours: number;
  workWindowStart: number;
  workWindowEnd: number;
  timezone: string;
  setDailyGoalHours: (v: number) => void;
  setWorkWindowStart: (v: number) => void;
  setWorkWindowEnd: (v: number) => void;
  setTimezone: (v: string) => void;
}

function StepFocusProfile({
  dailyGoalHours,
  workWindowStart,
  workWindowEnd,
  timezone,
  setDailyGoalHours,
  setWorkWindowStart,
  setWorkWindowEnd,
  setTimezone,
}: StepFocusProfileProps) {
  return (
    <div className="space-y-7">
      {/* Daily goal */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: "#6366f1" }} />
          <label className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
            Daily Focus Goal
          </label>
        </div>
        <div className="flex gap-3 flex-wrap">
          {DAILY_GOALS.map((hours) => (
            <PillButton
              key={hours}
              label={`${hours}h`}
              selected={dailyGoalHours === hours}
              onClick={() => setDailyGoalHours(hours)}
            />
          ))}
        </div>
      </div>

      {/* Work window */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: "#8b5cf6" }} />
          <label className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
            Work Window
          </label>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <span className="text-xs" style={{ color: "#94a3b8" }}>
              Start time
            </span>
            <select
              value={workWindowStart}
              onChange={(e) => setWorkWindowStart(Number(e.target.value))}
              className="input-dark rounded-xl px-3 py-2.5 text-sm appearance-none"
              style={{ cursor: "pointer" }}
            >
              {WORK_START_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <span className="mt-5 text-sm" style={{ color: "#64748b" }}>
            to
          </span>
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <span className="text-xs" style={{ color: "#94a3b8" }}>
              End time
            </span>
            <select
              value={workWindowEnd}
              onChange={(e) => setWorkWindowEnd(Number(e.target.value))}
              className="input-dark rounded-xl px-3 py-2.5 text-sm appearance-none"
              style={{ cursor: "pointer" }}
            >
              {WORK_END_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe size={16} style={{ color: "#10b981" }} />
          <label className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
            Your Timezone
          </label>
        </div>
        <input
          type="text"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="input-dark w-full rounded-xl px-4 py-2.5 text-sm"
          placeholder="e.g. Asia/Kolkata"
        />
        <p className="text-xs" style={{ color: "#64748b" }}>
          Auto-detected from your browser. Edit if incorrect.
        </p>
      </div>
    </div>
  );
}

interface StepYourRoleProps {
  role: string;
  primaryGoal: string;
  setRole: (v: string) => void;
  setPrimaryGoal: (v: string) => void;
}

function StepYourRole({ role, primaryGoal, setRole, setPrimaryGoal }: StepYourRoleProps) {
  return (
    <div className="space-y-7">
      {/* Role */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase size={16} style={{ color: "#6366f1" }} />
          <label className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
            I am a...
          </label>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {ROLES.map((r) => (
            <PillButton
              key={r}
              label={r}
              selected={role === r}
              onClick={() => setRole(r)}
            />
          ))}
        </div>
      </div>

      {/* Primary goal */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target size={16} style={{ color: "#8b5cf6" }} />
          <label className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
            My primary goal is to...
          </label>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {PRIMARY_GOALS.map((g) => (
            <PillButton
              key={g}
              label={g}
              selected={primaryGoal === g}
              onClick={() => setPrimaryGoal(g)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STEPS = ["Welcome", "Focus Profile", "Your Role"] as const;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [dailyGoalHours, setDailyGoalHours] = useState(4);
  const [workWindowStart, setWorkWindowStart] = useState(9);
  const [workWindowEnd, setWorkWindowEnd] = useState(18);
  const [timezone, setTimezone] = useState("UTC");
  const [role, setRole] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");

  // Auto-detect timezone on mount
  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTimezone("UTC");
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const canProceed = () => {
    if (currentStep === 0) return true;
    if (currentStep === 1) return timezone.trim().length > 0;
    if (currentStep === 2) return role !== "" && primaryGoal !== "";
    return false;
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleComplete = async () => {
    if (!canProceed()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyGoalHours,
          workWindowStart,
          workWindowEnd,
          timezone,
          role,
          primaryGoal,
          onboardingCompleted: true,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save profile");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0A0E1A" }}
      >
        <Loader2 className="animate-spin" size={32} style={{ color: "#6366f1" }} />
      </div>
    );
  }

  const userName = session?.user?.name ?? "there";
  const userImage = session?.user?.image ?? null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-dots"
      style={{ backgroundColor: "#0A0E1A" }}
    >
      {/* Ambient glows */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-20"
        style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo mark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            }}
          >
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold" style={{ color: "#ffffff" }}>
            Deepwrk
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="rounded-full transition-all duration-300 flex items-center justify-center"
                  style={{
                    width: i < currentStep ? 24 : i === currentStep ? 28 : 20,
                    height: i < currentStep ? 24 : i === currentStep ? 28 : 20,
                    background:
                      i < currentStep
                        ? "#10b981"
                        : i === currentStep
                          ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                          : "#1e2d45",
                    boxShadow: i === currentStep ? "0 0 16px rgba(99,102,241,0.5)" : "none",
                  }}
                >
                  {i < currentStep ? (
                    <CheckCircle2 size={14} className="text-white" />
                  ) : (
                    <span className="text-xs font-semibold text-white">{i + 1}</span>
                  )}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{
                    color: i === currentStep ? "#e2e8f0" : "#64748b",
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="h-px w-10 mb-5 transition-all duration-500"
                  style={{
                    background: i < currentStep ? "#10b981" : "#1e2d45",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "#1A2236",
            border: "1px solid #1E2D45",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.05)",
          }}
        >
          <div className="p-8 pb-4">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {currentStep === 0 && (
                  <StepWelcome name={userName} image={userImage} />
                )}
                {currentStep === 1 && (
                  <StepFocusProfile
                    dailyGoalHours={dailyGoalHours}
                    workWindowStart={workWindowStart}
                    workWindowEnd={workWindowEnd}
                    timezone={timezone}
                    setDailyGoalHours={setDailyGoalHours}
                    setWorkWindowStart={setWorkWindowStart}
                    setWorkWindowEnd={setWorkWindowEnd}
                    setTimezone={setTimezone}
                  />
                )}
                {currentStep === 2 && (
                  <StepYourRole
                    role={role}
                    primaryGoal={primaryGoal}
                    setRole={setRole}
                    setPrimaryGoal={setPrimaryGoal}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-8 mb-2 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#fca5a5",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer buttons */}
          <div className="flex items-center justify-between p-8 pt-5">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
              style={{ color: "#94a3b8", border: "1px solid #1e2d45" }}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold btn-gradient text-white disabled:opacity-40 disabled:pointer-events-none"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed() || submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold btn-gradient text-white disabled:opacity-40 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Zap size={15} fill="white" />
                    Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Step counter */}
        <p className="text-center mt-5 text-xs" style={{ color: "#64748b" }}>
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
