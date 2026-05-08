"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Plus, Square, SkipForward, Coffee,
  StickyNote, Timer, Bell, BellOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanBlock {
  _id: string;
  title: string;
  estimatedMinutes: number;
  category: string;
  status: "pending" | "active" | "completed" | "skipped";
}

interface DailyPlan {
  _id: string;
  blocks: PlanBlock[];
}

type SessionState = "idle" | "active" | "complete" | "break";
type ActiveTab = "timer" | "notes";

const MOOD_OPTIONS = [
  { value: 1, emoji: "😫", label: "Exhausted" },
  { value: 2, emoji: "😕", label: "Rough" },
  { value: 3, emoji: "😐", label: "OK" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🚀", label: "Amazing" },
];

// ─── Notifications hook ───────────────────────────────────────────────────────

function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const initializedRef = useRef(false);

  const initFCM = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      const { getFirebaseMessaging, getToken, onMessage } = await import("@/lib/firebase");
      const messaging = getFirebaseMessaging();
      if (!messaging) { initializedRef.current = false; return; }

      // Unregister any old SW registered with query params (legacy)
      const existingRegs = await navigator.serviceWorker.getRegistrations();
      for (const reg of existingRegs) {
        const url = reg.active?.scriptURL ?? reg.installing?.scriptURL ?? "";
        if (url.includes("firebase-messaging-sw") && url.includes("apiKey=")) {
          await reg.unregister();
        }
      }

      const swReg = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/", updateViaCache: "none" },
      );
      await navigator.serviceWorker.ready;

      // Clear any stale push subscription — mismatched VAPID keys cause AbortError
      const existingSub = await swReg.pushManager.getSubscription();
      if (existingSub) await existingSub.unsubscribe();

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (token) {
        await fetch("/api/user/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } else {
        console.error("[FCM] getToken returned null — check VAPID key and Firebase Messaging is enabled");
      }

      // Foreground message handler (tab is visible)
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? "Deepwrk";
        const body = payload.notification?.body ?? "";
        try { new Notification(title, { body, icon: "/favicon.svg" }); } catch { /* ignore */ }
      });
    } catch (err) {
      console.error("[FCM] init error:", err);
      initializedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
      if (Notification.permission === "granted") void initFCM();
    }
  }, [initFCM]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") await initFCM();
    return perm;
  }, [initFCM]);

  // FCM push (background-capable) with native Notification fallback (foreground)
  const notify = useCallback((title: string, body: string, tag?: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    void fetch("/api/notifications/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, tag }),
    })
      .then(async (res) => {
        const data = await res.json() as { sent?: number };
        // Fall back if no FCM tokens are registered yet
        if (!data.sent) throw new Error("no-tokens");
      })
      .catch(() => {
        try { new Notification(title, { body, icon: "/favicon.svg", tag }); } catch { /* ignore */ }
      });
  }, []);

  return { permission, requestPermission, notify };
}

// ─── Circular SVG Timer ────────────────────────────────────────────────────────

function CircularTimer({
  totalSeconds,
  remainingSeconds,
  isRunning,
  isWarning,
}: {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isWarning: boolean;
}) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);
  const strokeColor = isWarning ? "#f59e0b" : "#6366F1";

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      {isRunning && (
        <div className="absolute inset-0 rounded-full animate-pulse-glow" style={{ borderRadius: "50%" }} />
      )}
      <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#1E2D45" strokeWidth="6" />
        <circle
          cx="90" cy="90" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-4xl font-bold tabular-nums"
          style={{ color: isWarning ? "#f59e0b" : "#ffffff", letterSpacing: "-0.02em" }}
        >
          {display}
        </span>
        <span className="text-xs mt-1" style={{ color: "#64748b" }}>
          {isRunning ? (isWarning ? "finishing up…" : "focusing") : "paused"}
        </span>
      </div>
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function useConfetti() {
  return useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#6366F1", "#8B5CF6", "#A78BFA", "#ffffff"] });
  }, []);
}

// ─── End Session Modal ─────────────────────────────────────────────────────────

function EndSessionModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="glass rounded-2xl p-8 max-w-sm w-full mx-4"
        style={{ border: "1px solid #1E2D45" }}
      >
        <h3 className="text-xl font-semibold text-white mb-2">End session early?</h3>
        <p style={{ color: "#94A3B8" }} className="text-sm mb-6">
          Your progress and notes will still be saved.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#1A2236", color: "#E2E8F0", border: "1px solid #1E2D45" }}>
            Keep Going
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#EF4444", color: "#fff" }}>
            End Session
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Break Timer ──────────────────────────────────────────────────────────────

function BreakTimer({ breakMinutes, onDone }: { breakMinutes: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(breakMinutes * 60);
  const [breakDone, setBreakDone] = useState(false);

  useEffect(() => {
    if (remaining <= 0) { setBreakDone(true); return; }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Coffee size={24} style={{ color: "#10B981" }} />
        <span className="text-2xl font-semibold text-white">Break Time</span>
      </div>
      {breakDone ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-lg text-white mb-6">Break over — ready? 🎯</p>
          <button onClick={onDone} className="btn-gradient px-8 py-3 rounded-xl text-white font-semibold text-base">
            Start Next Session
          </button>
        </motion.div>
      ) : (
        <>
          <div className="font-mono text-6xl font-bold tabular-nums" style={{ color: "#10B981" }}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
          <p style={{ color: "#94A3B8" }} className="text-sm">Relax, stretch, breathe...</p>
        </>
      )}
    </div>
  );
}

// ─── Duration Picker (preset chips + custom input) ────────────────────────────

function DurationPicker({
  presets,
  value,
  onChange,
}: {
  presets: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const [customInput, setCustomInput] = useState("");
  const isCustom = !presets.includes(value);

  function applyCustom(raw: string) {
    const v = parseInt(raw);
    if (v >= 1 && v <= 480) onChange(v);
  }

  return (
    <div>
      <p className="text-xs font-medium mb-2" style={{ color: "#64748b" }}>Duration</p>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((m) => (
          <button
            key={m}
            onClick={() => { onChange(m); setCustomInput(""); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: value === m && !isCustom ? "#6366F1" : "#1A2236",
              color: value === m && !isCustom ? "#fff" : "#94A3B8",
              border: `1px solid ${value === m && !isCustom ? "#6366F1" : "#1E2D45"}`,
            }}
          >
            {m}m
          </button>
        ))}
        {/* Custom input */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1} max={480}
            placeholder="Custom"
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              applyCustom(e.target.value);
            }}
            className="w-20 px-2 py-1.5 rounded-lg text-xs text-center font-medium transition-all"
            style={{
              background: isCustom ? "#6366F1" : "#1A2236",
              color: isCustom ? "#fff" : "#94A3B8",
              border: `1px solid ${isCustom ? "#6366F1" : "#1E2D45"}`,
              outline: "none",
            }}
          />
          <span className="text-xs" style={{ color: "#4a5568" }}>min</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FocusPage() {
  const [state, setState] = useState<SessionState>("idle");

  // Idle
  const [todayPlan, setTodayPlan] = useState<DailyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [manualTask, setManualTask] = useState("");
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard" | null>(null);

  // Active session
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [plannedDuration, setPlannedDuration] = useState(45);
  const [totalSeconds, setTotalSeconds] = useState(45 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [showEndModal, setShowEndModal] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("timer");

  // Complete state
  const [actualDuration, setActualDuration] = useState(0);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkinRef = useRef<NodeJS.Timeout | null>(null);
  const fiveminNotifiedRef = useRef(false);
  const oneminNotifiedRef = useRef(false);
  const fireConfetti = useConfetti();
  const { permission, requestPermission, notify } = useNotifications();

  // Derived
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 0;
  const pendingBlock = todayPlan?.blocks.find((b) => b.status === "pending");

  // Fetch today's plan
  useEffect(() => {
    fetch("/api/plans/today")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DailyPlan | null) => setTodayPlan(d))
      .catch(() => null)
      .finally(() => setPlanLoading(false));
  }, []);

  // ── Timer tick ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== "active") return;
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          // End-of-timer warnings
          if (prev === 300 && !fiveminNotifiedRef.current) {
            fiveminNotifiedRef.current = true;
            notify("⏰ 5 minutes left!", `Wrapping up: ${taskTitle}`, "timer-warning");
          }
          if (prev === 60 && !oneminNotifiedRef.current) {
            oneminNotifiedRef.current = true;
            notify("⚡ 1 minute left!", taskTitle, "timer-final");
          }
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            void handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, state]);

  // ── Check-in notification every 20 minutes ───────────────────────────────────
  useEffect(() => {
    if (state !== "active" || !isRunning) {
      if (checkinRef.current) clearInterval(checkinRef.current);
      return;
    }
    checkinRef.current = setInterval(() => {
      notify("Still focusing? 💪", `Keep it up on: ${taskTitle}`, "checkin");
    }, 20 * 60 * 1000);
    return () => { if (checkinRef.current) clearInterval(checkinRef.current); };
  }, [state, isRunning, taskTitle, notify]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== "active") return;
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") { e.preventDefault(); setIsRunning((r) => !r); }
      if (e.key === "Escape") setShowEndModal(true);
      if (e.key === "n" || e.key === "N") setActiveTab((t) => t === "timer" ? "notes" : "timer");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state]);

  // ── Session persistence (survive page refresh) ───────────────────────────────
  const remainingSecondsRef = useRef(remainingSeconds);
  useEffect(() => { remainingSecondsRef.current = remainingSeconds; }, [remainingSeconds]);
  const sessionNotesRef = useRef(sessionNotes);
  useEffect(() => { sessionNotesRef.current = sessionNotes; }, [sessionNotes]);

  // Restore on mount
  useEffect(() => {
    const raw = localStorage.getItem("dwrk_session");
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as {
        sessionId: string; taskTitle: string; plannedDuration: number;
        totalSeconds: number; remainingSeconds: number; isRunning: boolean;
        startTime: string | null; sessionNotes: string; savedAt: string;
      };
      let remaining = s.remainingSeconds;
      if (s.isRunning && s.savedAt) {
        const elapsed = Math.floor((Date.now() - new Date(s.savedAt).getTime()) / 1000);
        remaining = Math.max(0, remaining - elapsed);
      }
      if (remaining <= 0) { localStorage.removeItem("dwrk_session"); return; }
      setSessionId(s.sessionId);
      setTaskTitle(s.taskTitle);
      setPlannedDuration(s.plannedDuration);
      setTotalSeconds(s.totalSeconds);
      setRemainingSeconds(remaining);
      setIsRunning(false); // always restore paused — user explicitly resumes
      if (s.startTime) setStartTime(new Date(s.startTime));
      setSessionNotes(s.sessionNotes ?? "");
      setState("active");
    } catch { localStorage.removeItem("dwrk_session"); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save every 15 s (heartbeat keeps savedAt accurate for elapsed-time calc on restore)
  useEffect(() => {
    if (state !== "active") { localStorage.removeItem("dwrk_session"); return; }
    const doSave = () => localStorage.setItem("dwrk_session", JSON.stringify({
      sessionId, taskTitle, plannedDuration, totalSeconds,
      remainingSeconds: remainingSecondsRef.current,
      isRunning,
      startTime: startTime?.toISOString() ?? null,
      sessionNotes: sessionNotesRef.current,
      savedAt: new Date().toISOString(),
    }));
    doSave();
    const id = setInterval(doSave, 15_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, sessionId, taskTitle, plannedDuration, totalSeconds, isRunning, startTime]);

  // ── Start session ─────────────────────────────────────────────────────────────
  async function handleStartSession() {
    const title = pendingBlock?.title ?? manualTask.trim();
    if (!title) return;
    const duration = customDuration ?? pendingBlock?.estimatedMinutes ?? plannedDuration;

    // Request notification permission on first start
    if (permission === "default") await requestPermission();

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: title,
          taskCategory: pendingBlock?.category ?? "other",
          plannedDuration: duration,
          blockId: pendingBlock?._id,
          moodBefore: moodBefore ?? undefined,
          difficulty: selectedDifficulty ?? undefined,
        }),
      });
      if (res.ok) {
        const session = (await res.json()) as { _id: string };
        setSessionId(session._id);
        setTaskTitle(title);
        setPlannedDuration(duration);
        setTotalSeconds(duration * 60);
        setRemainingSeconds(duration * 60);
        setStartTime(new Date());
        setIsRunning(true);
        setActiveTab("timer");
        fiveminNotifiedRef.current = false;
        oneminNotifiedRef.current = false;
        setState("active");
        notify("🎯 Session started!", `Working on: ${title}`, "session-start");
      }
    } catch { /* ignore */ }
  }

  // ── Complete session ──────────────────────────────────────────────────────────
  async function handleSessionComplete() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (checkinRef.current) clearInterval(checkinRef.current);
    setIsRunning(false);

    const elapsed = startTime ? Math.round((Date.now() - startTime.getTime()) / 60000) : plannedDuration;
    setActualDuration(elapsed);

    if (sessionId) {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", actualDuration: elapsed, notes: sessionNotes }),
      }).catch(() => null);
    }

    notify("✅ Session complete!", `Great work on: ${taskTitle}`, "session-done");
    setState("complete");
    void fireConfetti();
  }

  async function handleEndEarly() {
    setShowEndModal(false);
    await handleSessionComplete();
  }

  async function handleSaveCompletion() {
    if (!sessionId) return;
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodAfter: moodAfter ?? undefined, notes: completionNotes || sessionNotes }),
    }).catch(() => null);
    await fetch("/api/user/streak", { method: "PUT" }).catch(() => null);
  }

  function handleTakeBreak() { void handleSaveCompletion(); setState("break"); }

  function handleStartNext() {
    void handleSaveCompletion();
    setSessionId(null); setTaskTitle(""); setSessionNotes(""); setCompletionNotes("");
    setMoodAfter(null); setMoodBefore(null); setCustomDuration(null); setSelectedDifficulty(null);
    setRemainingSeconds(plannedDuration * 60); setIsRunning(false);
    setState("idle");
    setPlanLoading(true);
    fetch("/api/plans/today")
      .then((r) => r.json())
      .then((d: DailyPlan | null) => setTodayPlan(d))
      .catch(() => null)
      .finally(() => setPlanLoading(false));
  }

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#0A0E1A" }}>
      <AnimatePresence mode="wait">

        {/* ── IDLE ─────────────────────────────────────────────────────────── */}
        {state === "idle" && (
          <motion.div key="idle"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center min-h-screen px-4 py-12"
          >
            <div className="w-full max-w-lg">
              <div className="text-center mb-10">
                <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="text-4xl font-bold mb-3" style={{ color: "#ffffff" }}>
                  Ready to <span className="gradient-text">Focus?</span>
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                  style={{ color: "#94A3B8" }} className="text-base">
                  Enter deep work mode and get things done.
                </motion.p>
              </div>

              {/* Task / block */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass rounded-2xl p-6 mb-6">
                {planLoading ? (
                  <div className="space-y-3">
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-8 w-full" />
                  </div>
                ) : pendingBlock ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#6366F1" }} />
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6366F1" }}>
                        Next from your plan
                      </span>
                    </div>
                    <p className="text-xl font-semibold text-white mb-1">{pendingBlock.title}</p>
                    <p className="text-sm mb-4" style={{ color: "#94A3B8" }}>{pendingBlock.category}</p>

                    <DurationPicker
                      presets={[pendingBlock.estimatedMinutes, 25, 45, 60, 90].filter((v, i, a) => a.indexOf(v) === i)}
                      value={customDuration ?? pendingBlock.estimatedMinutes}
                      onChange={setCustomDuration}
                    />

                    <div className="mt-4">
                      <p className="text-xs font-medium mb-2" style={{ color: "#64748b" }}>
                        Difficulty <span style={{ opacity: 0.5 }}>(optional)</span>
                      </p>
                      <div className="flex gap-2">
                        {([
                          { value: "easy", label: "Easy", color: "#10b981" },
                          { value: "medium", label: "Medium", color: "#f59e0b" },
                          { value: "hard", label: "Hard", color: "#ef4444" },
                        ] as const).map((opt) => (
                          <button key={opt.value}
                            onClick={() => setSelectedDifficulty(selectedDifficulty === opt.value ? null : opt.value)}
                            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                            style={{
                              background: selectedDifficulty === opt.value ? `${opt.color}22` : "rgba(30,45,69,0.6)",
                              color: selectedDifficulty === opt.value ? opt.color : "#64748b",
                              border: `1px solid ${selectedDifficulty === opt.value ? opt.color + "60" : "#1e2d45"}`,
                            }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#E2E8F0" }}>
                      What will you work on?
                    </label>
                    <textarea
                      className="input-dark w-full rounded-xl px-4 py-3 text-sm resize-none"
                      rows={3}
                      placeholder="Describe your task or goal for this session..."
                      value={manualTask}
                      onChange={(e) => setManualTask(e.target.value)}
                    />
                    <div className="mt-4">
                      <DurationPicker
                        presets={[25, 45, 60, 90]}
                        value={customDuration ?? plannedDuration}
                        onChange={(v) => { setCustomDuration(v); setPlannedDuration(v); }}
                      />
                    </div>
                  </>
                )}
              </motion.div>

              {/* Mood before */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-5 mb-6">
                <p className="text-sm font-medium mb-3" style={{ color: "#E2E8F0" }}>
                  How are you feeling right now?
                </p>
                <div className="flex justify-between">
                  {MOOD_OPTIONS.map((m) => (
                    <button key={m.value} onClick={() => setMoodBefore(m.value)}
                      className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl transition-all"
                      style={{
                        background: moodBefore === m.value ? "rgba(99,102,241,0.2)" : "transparent",
                        border: `1px solid ${moodBefore === m.value ? "#6366F1" : "transparent"}`,
                      }}>
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-xs" style={{ color: "#64748b" }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Notification permission hint */}
              {permission === "default" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
                  className="flex items-center gap-2 justify-center mb-4">
                  <Bell size={13} style={{ color: "#64748b" }} />
                  <p className="text-xs" style={{ color: "#4a5568" }}>
                    Browser notifications will be requested on start
                  </p>
                </motion.div>
              )}
              {permission === "denied" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
                  className="flex items-center gap-2 justify-center mb-4">
                  <BellOff size={13} style={{ color: "#ef4444" }} />
                  <p className="text-xs" style={{ color: "#ef444480" }}>
                    Notifications blocked — enable in browser settings to get check-in alerts
                  </p>
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                onClick={() => void handleStartSession()}
                disabled={!pendingBlock && !manualTask.trim()}
                className="btn-gradient w-full max-w-[400px] mx-auto block py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                Start Deep Work Mode
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── ACTIVE ───────────────────────────────────────────────────────── */}
        {state === "active" && (
          <motion.div key="active"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: "#0A0E1A" }}
          >
            {/* Ambient bg */}
            <div className="absolute inset-0 animate-breathing pointer-events-none" style={{
              background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${isWarning ? "rgba(245,158,11,0.07)" : "rgba(99,102,241,0.08)"} 0%, transparent 70%)`,
              filter: "blur(40px)", transition: "background 1s ease",
            }} />

            <div className="relative flex flex-col min-h-screen">
              {/* Header row: task title + tab switcher */}
              <div className="flex flex-col items-center pt-10 pb-4 px-6">
                <p className="text-sm font-medium uppercase tracking-widest mb-2"
                  style={{ color: isWarning ? "#f59e0b" : "#6366F1" }}>
                  Deep Work Session
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white text-center leading-tight mb-5"
                  style={{ maxWidth: 560 }}>
                  {taskTitle}
                </h2>

                {/* Tab switcher */}
                <div className="flex items-center gap-1 p-1 rounded-xl"
                  style={{ background: "#1A2236", border: "1px solid #1e2d45" }}>
                  {([
                    { id: "timer", icon: <Timer size={14} />, label: "Timer" },
                    { id: "notes", icon: <StickyNote size={14} />, label: "Notes" },
                  ] as const).map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: activeTab === tab.id ? "rgba(99,102,241,0.2)" : "transparent",
                        color: activeTab === tab.id ? "#818cf8" : "#64748b",
                      }}>
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
                <AnimatePresence mode="wait">

                  {/* Timer tab */}
                  {activeTab === "timer" && (
                    <motion.div key="timer-tab"
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center gap-8 w-full max-w-sm"
                    >
                      <CircularTimer
                        totalSeconds={totalSeconds}
                        remainingSeconds={remainingSeconds}
                        isRunning={isRunning}
                        isWarning={isWarning}
                      />

                      <div className="flex items-center gap-3 flex-wrap justify-center">
                        <button onClick={() => setIsRunning((r) => !r)}
                          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl font-medium text-sm transition-all"
                          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", color: "#E2E8F0" }}>
                          {isRunning ? <Pause size={16} /> : <Play size={16} />}
                          {isRunning ? "Pause" : "Resume"}
                          <span className="text-xs opacity-50">[Space]</span>
                        </button>
                        <button onClick={() => { setRemainingSeconds((s) => s + 300); setTotalSeconds((s) => s + 300); }}
                          className="flex items-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm transition-all"
                          style={{ background: "#1A2236", border: "1px solid #1E2D45", color: "#94A3B8" }}>
                          <Plus size={14} /> 5 min
                        </button>
                        <button onClick={() => setShowEndModal(true)}
                          className="flex items-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm transition-all"
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                          <Square size={14} /> End
                          <span className="text-xs opacity-50">[Esc]</span>
                        </button>
                      </div>

                      <p className="text-xs" style={{ color: "#4a5568" }}>
                        Space to pause · N for notes · Esc to end
                      </p>
                    </motion.div>
                  )}

                  {/* Notes tab */}
                  {activeTab === "notes" && (
                    <motion.div key="notes-tab"
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.2 }}
                      className="w-full max-w-lg flex flex-col gap-4"
                    >
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "#94a3b8" }}>
                          Session Notes
                        </p>
                        <p className="text-xs mb-3" style={{ color: "#4a5568" }}>
                          Saved automatically when the session ends. Shareable from History.
                        </p>
                        <textarea
                          className="input-dark w-full rounded-2xl px-5 py-4 text-sm resize-none leading-relaxed"
                          rows={12}
                          placeholder="Jot down thoughts, progress, blockers, ideas…"
                          value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                          style={{ backgroundColor: "rgba(15,23,41,0.7)", minHeight: 260 }}
                          autoFocus
                        />
                      </div>

                      {/* Quick controls while on notes tab */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button onClick={() => setIsRunning((r) => !r)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                            style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid #6366f130" }}>
                            {isRunning ? <Pause size={12} /> : <Play size={12} />}
                            {isRunning ? "Pause" : "Resume"}
                          </button>
                          <button onClick={() => setActiveTab("timer")}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                            style={{ background: "#1A2236", color: "#64748b", border: "1px solid #1e2d45" }}>
                            <Timer size={12} /> Back to Timer
                          </button>
                        </div>
                        <div className="font-mono text-sm font-bold"
                          style={{ color: isWarning ? "#f59e0b" : "#6366f1" }}>
                          {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
                          {String(remainingSeconds % 60).padStart(2, "0")}
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {showEndModal && (
                <EndSessionModal onConfirm={() => void handleEndEarly()} onCancel={() => setShowEndModal(false)} />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── COMPLETE ─────────────────────────────────────────────────────── */}
        {state === "complete" && (
          <motion.div key="complete"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center justify-center min-h-screen px-4 py-12"
          >
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }} className="text-6xl mb-4">
                  🎉
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
                <p style={{ color: "#94A3B8" }} className="text-sm">Great work! You stayed focused and got it done.</p>
              </div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass rounded-2xl p-5 mb-5 grid grid-cols-2 gap-4">
                <div className="text-center py-2">
                  <p className="text-3xl font-bold font-mono" style={{ color: "#6366F1" }}>{actualDuration}m</p>
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>Actual time</p>
                </div>
                <div className="text-center py-2">
                  <p className="text-3xl font-bold font-mono"
                    style={{ color: actualDuration <= plannedDuration ? "#10B981" : "#F59E0B" }}>
                    {plannedDuration}m
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>Planned time</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-5 mb-5">
                <p className="text-sm font-medium mb-3" style={{ color: "#E2E8F0" }}>
                  How do you feel after the session?
                </p>
                <div className="flex justify-between">
                  {MOOD_OPTIONS.map((m) => (
                    <button key={m.value} onClick={() => setMoodAfter(m.value)}
                      className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl transition-all"
                      style={{
                        background: moodAfter === m.value ? "rgba(99,102,241,0.2)" : "transparent",
                        border: `1px solid ${moodAfter === m.value ? "#6366F1" : "transparent"}`,
                        transform: moodAfter === m.value ? "scale(1.1)" : "scale(1)",
                      }}>
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-xs" style={{ color: "#64748b" }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Notes area on completion */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="mb-5">
                <p className="text-xs mb-1.5" style={{ color: "#64748b" }}>
                  {sessionNotes ? "Session notes (recorded during focus)" : "Add final notes (optional)"}
                </p>
                {sessionNotes && (
                  <div className="rounded-xl px-4 py-3 mb-2 text-sm whitespace-pre-wrap leading-relaxed"
                    style={{ background: "rgba(99,102,241,0.05)", border: "1px solid #6366f120", color: "#94a3b8" }}>
                    {sessionNotes}
                  </div>
                )}
                <textarea
                  className="input-dark w-full rounded-2xl px-5 py-3.5 text-sm resize-none"
                  rows={3}
                  placeholder="What did you accomplish? Any blockers or insights?"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-4">
                <button onClick={handleTakeBreak}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all"
                  style={{ background: "#1A2236", border: "1px solid #1E2D45", color: "#E2E8F0" }}>
                  <Coffee size={16} /> Take a Break (5 min)
                </button>
                <button onClick={handleStartNext}
                  className="btn-gradient flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm">
                  <SkipForward size={16} /> Start Next Session
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ── BREAK ────────────────────────────────────────────────────────── */}
        {state === "break" && (
          <motion.div key="break"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center min-h-screen px-4"
            style={{ backgroundColor: "#0A0E1A" }}
          >
            <div className="glass rounded-2xl p-8 w-full max-w-sm">
              <BreakTimer breakMinutes={5} onDone={handleStartNext} />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
