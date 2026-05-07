"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Share2, Check, StickyNote, Zap } from "lucide-react";
import { format } from "date-fns";

interface SessionDetail {
  _id: string;
  taskTitle: string;
  taskCategory?: string;
  plannedDuration?: number;
  actualDuration?: number;
  moodBefore?: number;
  moodAfter?: number;
  notes?: string;
  status: "completed" | "abandoned" | "paused";
  startedAt: string;
  completedAt?: string;
}

const MOOD_MAP: Record<number, string> = { 1: "😫", 2: "😕", 3: "😐", 4: "🙂", 5: "🚀" };

function fmt(mins?: number) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SessionDetail | null) => setSession(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleShare() {
    setSharing(true);
    try {
      const res = await fetch(`/api/sessions/${id}/share`, { method: "POST" });
      if (res.ok) {
        const { shareUrl } = (await res.json()) as { shareUrl: string };
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0A0E1A" }}>
        <div className="skeleton h-6 w-32 rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ backgroundColor: "#0A0E1A" }}>
        <p style={{ color: "#94a3b8" }}>Session not found.</p>
        <button onClick={() => router.back()} style={{ color: "#6366f1" }} className="text-sm">← Go back</button>
      </div>
    );
  }

  const statusColor = session.status === "completed" ? "#10b981" : session.status === "abandoned" ? "#ef4444" : "#f59e0b";

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto" style={{ backgroundColor: "#0A0E1A" }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-6 text-sm transition-colors"
        style={{ color: "#64748b" }}
      >
        <ArrowLeft size={15} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Header card */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white mb-1 leading-snug">{session.taskTitle}</h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                style={{ background: `${statusColor}18`, color: statusColor }}
              >
                {session.status}
              </span>
              {session.taskCategory && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-2 capitalize"
                  style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
                  {session.taskCategory}
                </span>
              )}
            </div>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: copied ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.12)",
                color: copied ? "#10b981" : "#818cf8",
                border: `1px solid ${copied ? "#10b98140" : "#6366f140"}`,
              }}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? "Copied!" : sharing ? "…" : "Share"}
            </button>
          </div>

          <p className="text-xs mt-3" style={{ color: "#64748b" }}>
            {format(new Date(session.startedAt), "EEEE, MMMM d yyyy · h:mm a")}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Planned", value: fmt(session.plannedDuration), icon: <Clock size={14} /> },
            { label: "Actual", value: fmt(session.actualDuration), icon: <Zap size={14} /> },
            { label: "Mood Before", value: session.moodBefore ? MOOD_MAP[session.moodBefore] : "—", icon: null },
            { label: "Mood After", value: session.moodAfter ? MOOD_MAP[session.moodAfter] : "—", icon: null },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}>
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>{s.label}</p>
              <p className="text-lg font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}>
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={15} style={{ color: "#6366f1" }} />
            <h2 className="text-sm font-semibold text-white">Session Notes</h2>
          </div>
          {session.notes?.trim() ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>
              {session.notes}
            </p>
          ) : (
            <p className="text-sm italic" style={{ color: "#4a5568" }}>No notes recorded for this session.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
