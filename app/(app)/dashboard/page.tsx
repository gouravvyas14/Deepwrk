"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Play,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Clock,
  LayoutGrid,
  Zap,
  ChevronRight,
} from "lucide-react";
import type { IDailyPlan, IFocusBlock, IFocusSession } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StatsData {
  todayHours: number;
  dailyGoalHours: number;
  currentStreak: number;
  sessionsToday: number;
  weeklyHours: number;
  lastWeekHours: number;
}

interface RecentSession extends Pick<IFocusSession, "taskTitle" | "actualDuration" | "moodAfter" | "status"> {
  _id: string;
  startedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BLOCK_COLORS = ["#6366F1", "#8B5CF6", "#10B981"] as const;

function blockColor(index: number): string {
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}

function moodEmoji(score?: number): string {
  if (!score) return "😐";
  if (score >= 4) return "😄";
  if (score >= 3) return "🙂";
  if (score >= 2) return "😐";
  return "😔";
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function motivationalMessage(pct: number): string {
  if (pct >= 100) return "Goal achieved! 🚀";
  if (pct >= 76) return "Almost there! Push through!";
  if (pct >= 51) return "Over halfway there!";
  if (pct >= 26) return "Great momentum, keep it up!";
  return "Let's get started!";
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({
  value,
  decimals = 1,
}: {
  value: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    const from = 0;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function ProgressRing({
  value,
  max,
  size = 64,
  strokeWidth = 5,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1e2d45"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ring-gradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
      />
      <defs>
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
    >
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div
      className="rounded-2xl p-5 flex gap-4"
      style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
    >
      <div className="skeleton w-1 rounded-full" style={{ minHeight: 60 }} />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-1/3" />
      </div>
      <div className="skeleton h-8 w-24 rounded-xl" />
    </div>
  );
}

// ─── Top stats row ────────────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: StatsData | null }) {
  const weeklyDelta =
    stats && stats.lastWeekHours > 0
      ? ((stats.weeklyHours - stats.lastWeekHours) / stats.lastWeekHours) * 100
      : null;
  const weeklyUp = weeklyDelta !== null && weeklyDelta >= 0;
  const pct =
    stats && stats.dailyGoalHours > 0
      ? Math.round((stats.todayHours / stats.dailyGoalHours) * 100)
      : 0;

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Today's Focus",
      content: (
        <div className="flex items-center gap-3 mt-1">
          <ProgressRing value={stats.todayHours} max={stats.dailyGoalHours} />
          <div>
            <div
              className="text-2xl font-bold leading-none"
              style={{ color: "#ffffff" }}
            >
              <AnimatedNumber value={stats.todayHours} decimals={1} />
              <span className="text-sm font-normal ml-1" style={{ color: "#94a3b8" }}>
                / {stats.dailyGoalHours}h
              </span>
            </div>
            <div
              className="text-xs mt-1 font-medium"
              style={{ color: pct >= 100 ? "#10b981" : "#94a3b8" }}
            >
              {pct}% of goal
            </div>
          </div>
        </div>
      ),
      icon: <Clock size={16} style={{ color: "#6366f1" }} />,
    },
    {
      title: "Current Streak",
      content: (
        <div className="flex items-end gap-2 mt-2">
          <span className="text-2xl">🔥</span>
          <div>
            <span className="text-2xl font-bold" style={{ color: "#ffffff" }}>
              <AnimatedNumber value={stats.currentStreak} decimals={0} />
            </span>
            <span className="text-sm ml-1" style={{ color: "#94a3b8" }}>
              day streak
            </span>
          </div>
        </div>
      ),
      icon: <Flame size={16} style={{ color: "#f59e0b" }} />,
    },
    {
      title: "Sessions Today",
      content: (
        <div className="mt-2">
          <span className="text-2xl font-bold" style={{ color: "#ffffff" }}>
            <AnimatedNumber value={stats.sessionsToday} decimals={0} />
          </span>
          <span className="text-sm ml-1" style={{ color: "#94a3b8" }}>
            sessions
          </span>
        </div>
      ),
      icon: <LayoutGrid size={16} style={{ color: "#8b5cf6" }} />,
    },
    {
      title: "Weekly Hours",
      content: (
        <div className="mt-2">
          <div className="text-2xl font-bold" style={{ color: "#ffffff" }}>
            <AnimatedNumber value={stats.weeklyHours} decimals={1} />
            <span className="text-sm font-normal ml-1" style={{ color: "#94a3b8" }}>
              hrs
            </span>
          </div>
          {weeklyDelta !== null && (
            <div
              className="flex items-center gap-1 mt-1 text-xs font-medium"
              style={{ color: weeklyUp ? "#10b981" : "#ef4444" }}
            >
              {weeklyUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(Math.round(weeklyDelta))}% vs last week
            </div>
          )}
        </div>
      ),
      icon: weeklyUp ? (
        <TrendingUp size={16} style={{ color: "#10b981" }} />
      ) : (
        <TrendingDown size={16} style={{ color: "#ef4444" }} />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
          className="card-hover rounded-2xl p-5"
          style={{ backgroundColor: "#1A2236" }}
        >
          <div
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: "#64748b" }}
          >
            {card.icon}
            {card.title}
          </div>
          {card.content}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS = [
  { value: "easy",   label: "Easy",   color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { value: "medium", label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { value: "hard",   label: "Hard",   color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
] as const;

type Difficulty = "easy" | "medium" | "hard";

// ─── Focus block card ─────────────────────────────────────────────────────────

function FocusBlockCard({
  block,
  index,
  planId,
  onStart,
  onDifficultyChange,
}: {
  block: IFocusBlock;
  index: number;
  planId: string;
  onStart: (id: string) => void;
  onDifficultyChange: (blockId: string, difficulty: Difficulty) => void;
}) {
  const color = blockColor(index);
  const isCompleted = block.status === "completed";
  const isActive = block.status === "active";
  const [savingDiff, setSavingDiff] = useState(false);

  const handleDifficulty = async (d: Difficulty) => {
    if (savingDiff || block.difficulty === d) return;
    setSavingDiff(true);
    try {
      const res = await fetch(`/api/plans/${planId}/blocks/${block._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: d }),
      });
      if (res.ok) onDifficultyChange(block._id, d);
    } finally {
      setSavingDiff(false);
    }
  };

  const diffConfig = DIFFICULTY_OPTIONS.find((o) => o.value === block.difficulty);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="rounded-2xl p-5 group"
      style={{
        backgroundColor: "#1A2236",
        border: "1px solid #1E2D45",
        borderLeft: `3px solid ${color}`,
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      {/* Top row: status + title + start button */}
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          {isCompleted ? (
            <CheckCircle2 size={22} style={{ color: "#10b981" }} />
          ) : (
            <div
              className="rounded-full"
              style={{
                width: 22,
                height: 22,
                background: isActive ? `${color}33` : "rgba(30,45,69,0.8)",
                border: `2px solid ${isActive ? color : "#2d4060"}`,
              }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-base font-semibold truncate"
            style={{
              color: isCompleted ? "#64748b" : "#ffffff",
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {block.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${color}20`, color }}
            >
              {formatDuration(block.estimatedMinutes)}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
              style={{
                background:
                  block.status === "completed"
                    ? "rgba(16,185,129,0.12)"
                    : block.status === "active"
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(30,45,69,0.8)",
                color:
                  block.status === "completed"
                    ? "#10b981"
                    : block.status === "active"
                      ? "#818cf8"
                      : "#64748b",
              }}
            >
              {block.status}
            </span>
            {diffConfig && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                style={{ background: diffConfig.bg, color: diffConfig.color }}
              >
                {diffConfig.label}
              </span>
            )}
          </div>
        </div>

        {!isCompleted && (
          <button
            onClick={() => onStart(block._id)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: isActive
                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                : `${color}15`,
              color: isActive ? "#ffffff" : color,
              border: `1px solid ${isActive ? "transparent" : `${color}40`}`,
            }}
          >
            <Play size={13} fill={isActive ? "white" : color} />
            {isActive ? "Resume" : "Start"}
          </button>
        )}
      </div>

      {/* Difficulty selector row */}
      {!isCompleted && (
        <div className="flex items-center gap-2 mt-3 pl-[38px]">
          <span className="text-xs font-medium" style={{ color: "#64748b" }}>
            Difficulty:
          </span>
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isSelected = block.difficulty === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleDifficulty(opt.value)}
                disabled={savingDiff}
                className="text-xs px-2.5 py-0.5 rounded-full font-medium transition-all duration-150 disabled:opacity-50"
                style={{
                  background: isSelected ? opt.bg : "rgba(30,45,69,0.6)",
                  color: isSelected ? opt.color : "#64748b",
                  border: `1px solid ${isSelected ? opt.color + "50" : "#1e2d45"}`,
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Task input section ────────────────────────────────────────────────────────

interface TaskInputSectionProps {
  onPlanGenerated: (plan: IDailyPlan) => void;
  appendMode?: boolean;
}

function TaskInputSection({ onPlanGenerated, appendMode = false }: TaskInputSectionProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: input, append: appendMode }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to generate plan");
      }
      const plan = (await res.json()) as IDailyPlan;
      onPlanGenerated(plan);
      setInput("");
    } catch (err) {
      // AI call may have succeeded but connection dropped — check for saved plan
      try {
        const recovery = await fetch("/api/plans/today");
        if (recovery.ok) {
          const saved = (await recovery.json()) as IDailyPlan | null;
          if (saved?.blocks?.length) {
            onPlanGenerated(saved);
            setInput("");
            return;
          }
        }
      } catch { /* ignore recovery fetch errors */ }
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="rounded-2xl p-6"
      style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} style={{ color: "#6366f1" }} />
        <h2 className="text-base font-semibold" style={{ color: "#ffffff" }}>
          {appendMode ? "Add more tasks" : "What are you working on today?"}
        </h2>
        {appendMode && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
          >
            appended to today&apos;s plan
          </span>
        )}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
        }}
        placeholder={
          "e.g. Build the auth flow for my SaaS, write unit tests for the API, review PRs from the team, prep for tomorrow's demo..."
        }
        rows={4}
        className="input-dark w-full rounded-xl px-4 py-3 text-sm resize-none leading-relaxed"
      />

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs mt-2 px-1"
            style={{ color: "#fca5a5" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs" style={{ color: "#64748b" }}>
          ⌘ + Enter to generate
        </p>
        <button
          onClick={handleGenerate}
          disabled={!input.trim() || loading}
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Generate Focus Plan
            </>
          )}
        </button>
      </div>

      {/* Loading skeleton blocks */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-3"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Focus blocks display ──────────────────────────────────────────────────────

interface FocusBlocksDisplayProps {
  plan: IDailyPlan | null;
  loading: boolean;
  onRefresh: () => void;
  onPlanUpdate: (plan: IDailyPlan) => void;
}

function FocusBlocksDisplay({ plan, loading, onRefresh, onPlanUpdate }: FocusBlocksDisplayProps) {
  const router = useRouter();

  const handleStart = (blockId: string) => {
    router.push(`/focus?blockId=${blockId}`);
  };

  const handleDifficultyChange = (blockId: string, difficulty: Difficulty) => {
    if (!plan) return;
    onPlanUpdate({
      ...plan,
      blocks: plan.blocks.map((b) =>
        b._id === blockId ? { ...b, difficulty } : b,
      ),
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} />
        ))}
      </div>
    );
  }

  if (!plan || plan.blocks.length === 0) {
    return null;
  }

  const completedCount = plan.blocks.filter((b) => b.status === "completed").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={17} style={{ color: "#6366f1" }} />
          <h2 className="text-base font-semibold" style={{ color: "#ffffff" }}>
            Today&apos;s Focus Plan
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium ml-1"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
          >
            {completedCount}/{plan.blocks.length}
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
          style={{ color: "#94a3b8", border: "1px solid #1e2d45" }}
        >
          <RefreshCw size={12} />
          Regenerate
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {plan.blocks.map((block, i) => (
            <FocusBlockCard
              key={block._id}
              block={block}
              index={i}
              planId={plan._id}
              onStart={handleStart}
              onDifficultyChange={handleDifficultyChange}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Today's progress bar ──────────────────────────────────────────────────────

function TodayProgress({ stats }: { stats: StatsData | null }) {
  if (!stats) return null;

  const pct =
    stats.dailyGoalHours > 0
      ? Math.min((stats.todayHours / stats.dailyGoalHours) * 100, 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="rounded-2xl p-6"
      style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: "#ffffff" }}>
          Today&apos;s Progress
        </h2>
        <span className="text-sm font-medium" style={{ color: "#94a3b8" }}>
          {stats.todayHours}h / {stats.dailyGoalHours}h focused
        </span>
      </div>

      {/* Progress bar track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 10, backgroundColor: "#1e2d45" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
            borderRadius: "9999px",
            boxShadow: pct > 0 ? "0 0 12px rgba(99,102,241,0.5)" : "none",
          }}
        />
      </div>

      <p className="mt-3 text-sm font-medium" style={{ color: "#94a3b8" }}>
        {motivationalMessage(pct)}
      </p>
    </motion.div>
  );
}

// ─── Recent activity ───────────────────────────────────────────────────────────

function RecentActivity({ sessions }: { sessions: RecentSession[] }) {
  if (sessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid #1e2d45" }}
      >
        <h2 className="text-base font-semibold" style={{ color: "#ffffff" }}>
          Recent Activity
        </h2>
        <a
          href="/history"
          className="flex items-center gap-1 text-xs font-medium transition-colors duration-200"
          style={{ color: "#6366f1" }}
        >
          View all <ChevronRight size={13} />
        </a>
      </div>

      <div className="divide-y" style={{ borderColor: "#1e2d45" }}>
        {sessions.map((s, i) => (
          <motion.div
            key={s._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.06 }}
            className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-xl shrink-0">{moodEmoji(s.moodAfter)}</span>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "#e2e8f0" }}
              >
                {s.taskTitle}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                {relativeTime(s.startedAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span
                className="text-sm font-semibold"
                style={{ color: "#94a3b8" }}
              >
                {formatDuration(s.actualDuration)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main dashboard page ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [plan, setPlan] = useState<IDailyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions/stats");
      if (res.ok) {
        const data = (await res.json()) as StatsData;
        setStats(data);
      }
    } catch {
      // Non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchPlan = useCallback(async () => {
    setPlanLoading(true);
    try {
      const res = await fetch("/api/plans/today");
      if (res.ok) {
        const data = (await res.json()) as IDailyPlan | null;
        setPlan(data);
      }
    } catch {
      // Non-critical
    } finally {
      setPlanLoading(false);
    }
  }, []);

  const fetchRecentSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions?limit=5");
      if (res.ok) {
        const data = (await res.json()) as RecentSession[];
        setRecentSessions(Array.isArray(data) ? data.slice(0, 5) : []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchPlan();
    fetchRecentSessions();
  }, [fetchStats, fetchPlan, fetchRecentSessions]);

  const handlePlanGenerated = (newPlan: IDailyPlan) => {
    setPlan(newPlan);
    fetchStats();
  };

  const handlePlanUpdate = (updatedPlan: IDailyPlan) => {
    setPlan(updatedPlan);
  };

  const handleRegeneratePlan = () => {
    setPlan(null);
  };

  const hasPlan = plan && plan.blocks.length > 0;

  return (
    <div
      className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto"
      style={{ backgroundColor: "#0A0E1A" }}
    >
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-7"
      >
        <h1 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
          Good{" "}
          {new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 17
              ? "afternoon"
              : "evening"}{" "}
          👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="mb-6">
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <StatsRow stats={stats} />
        )}
      </div>

      {/* Progress bar */}
      {!statsLoading && stats && (
        <div className="mb-6">
          <TodayProgress stats={stats} />
        </div>
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: task input + blocks */}
        <div className="lg:col-span-3 space-y-5">
          {/* Show task input only if no plan yet */}
          {!hasPlan && (
            <TaskInputSection onPlanGenerated={handlePlanGenerated} />
          )}

          {/* Focus blocks */}
          <FocusBlocksDisplay
            plan={plan}
            loading={planLoading}
            onRefresh={handleRegeneratePlan}
            onPlanUpdate={handlePlanUpdate}
          />

          {/* Add more tasks — appended to existing plan */}
          {hasPlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <TaskInputSection onPlanGenerated={handlePlanGenerated} appendMode />
            </motion.div>
          )}
        </div>

        {/* Right: recent activity */}
        <div className="lg:col-span-2">
          <RecentActivity sessions={recentSessions} />

          {/* Quick tips card if no sessions */}
          {recentSessions.length === 0 && !statsLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl p-6"
              style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} style={{ color: "#6366f1" }} />
                <h3 className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
                  Getting Started
                </h3>
              </div>
              {[
                "Describe your tasks in natural language",
                "Deepwrk AI breaks them into focus blocks",
                "Start a session and track your progress",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 mt-2.5">
                  <div
                    className="rounded-full mt-0.5 shrink-0"
                    style={{
                      width: 6,
                      height: 6,
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    }}
                  />
                  <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                    {tip}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
