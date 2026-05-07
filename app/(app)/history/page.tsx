"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FocusSession {
  _id: string;
  taskTitle: string;
  taskCategory: string;
  plannedDuration?: number;
  actualDuration?: number;
  moodBefore?: number;
  moodAfter?: number;
  notes?: string;
  status: "completed" | "abandoned" | "paused";
  startedAt: string;
  completedAt?: string;
}

interface SessionsResponse {
  sessions: FocusSession[];
  total: number;
  page: number;
  totalPages: number;
}

interface Filters {
  from: string;
  to: string;
  mood: string;
  search: string;
  minDuration: string;
}

const MOOD_EMOJIS: Record<number, string> = {
  1: "😫",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "🚀",
};

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: FocusSession }) {
  const [expanded, setExpanded] = useState(false);

  const started = new Date(session.startedAt);
  const actual = session.actualDuration ?? 0;
  const planned = session.plannedDuration ?? 0;
  const overTime = actual > planned + 5;
  const durationColor = overTime ? "#F59E0B" : "#10B981";

  function formatDuration(mins: number) {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Summary row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Mood emoji */}
        <div className="text-2xl shrink-0 w-8 text-center">
          {session.moodAfter ? (MOOD_EMOJIS[session.moodAfter] ?? "—") : "—"}
        </div>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "#E2E8F0" }}
          >
            {session.taskTitle}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
            {format(started, "MMM d, yyyy")} at {format(started, "h:mm a")}
            {" · "}
            <span className="capitalize">{session.taskCategory}</span>
          </p>
        </div>

        {/* Duration */}
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold" style={{ color: durationColor }}>
            {formatDuration(actual)}
          </p>
          <p className="text-xs" style={{ color: "#64748b" }}>
            of {formatDuration(planned)} planned
          </p>
        </div>

        {/* Status badge */}
        <div
          className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
          style={{
            background:
              session.status === "completed"
                ? "rgba(16,185,129,0.15)"
                : session.status === "abandoned"
                ? "rgba(239,68,68,0.15)"
                : "rgba(245,158,11,0.15)",
            color:
              session.status === "completed"
                ? "#10B981"
                : session.status === "abandoned"
                ? "#EF4444"
                : "#F59E0B",
          }}
        >
          {session.status}
        </div>

        {/* Expand icon */}
        <div style={{ color: "#64748b" }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: "1px solid #1E2D45" }}
          >
            <div className="px-5 py-4 space-y-3">
              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: "#64748b" }}>Started</p>
                  <p className="text-sm" style={{ color: "#E2E8F0" }}>
                    {format(started, "MMM d, yyyy 'at' h:mm:ss a")}
                  </p>
                </div>
                {session.completedAt && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#64748b" }}>Completed</p>
                    <p className="text-sm" style={{ color: "#E2E8F0" }}>
                      {format(new Date(session.completedAt), "MMM d, yyyy 'at' h:mm:ss a")}
                    </p>
                  </div>
                )}
              </div>

              {/* Mood row */}
              {(session.moodBefore ?? session.moodAfter) && (
                <div className="flex gap-6">
                  {session.moodBefore && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Mood Before</p>
                      <p className="text-lg">{MOOD_EMOJIS[session.moodBefore] ?? "—"}</p>
                    </div>
                  )}
                  {session.moodAfter && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Mood After</p>
                      <p className="text-lg">{MOOD_EMOJIS[session.moodAfter] ?? "—"}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div>
                  <p className="text-xs mb-1" style={{ color: "#64748b" }}>Notes</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                    {session.notes}
                  </p>
                </div>
              )}

              {/* Link to full detail + share */}
              <div className="flex justify-end pt-1">
                <a
                  href={`/session/${session._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}
                >
                  View & Share →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      className="rounded-2xl px-5 py-4 flex items-center gap-4"
      style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
    >
      <div className="skeleton w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/3" />
      </div>
      <div className="skeleton h-5 w-16" />
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(sessions: FocusSession[]) {
  const headers = [
    "Task",
    "Category",
    "Date",
    "Started",
    "Completed",
    "Planned (min)",
    "Actual (min)",
    "Mood Before",
    "Mood After",
    "Status",
    "Notes",
  ];

  const rows = sessions.map((s) => [
    `"${s.taskTitle.replace(/"/g, '""')}"`,
    s.taskCategory,
    format(new Date(s.startedAt), "yyyy-MM-dd"),
    format(new Date(s.startedAt), "HH:mm:ss"),
    s.completedAt ? format(new Date(s.completedAt), "HH:mm:ss") : "",
    s.plannedDuration ?? "",
    s.actualDuration ?? "",
    s.moodBefore ?? "",
    s.moodAfter ?? "",
    s.status,
    `"${(s.notes ?? "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `deepwrk-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    from: "",
    to: "",
    mood: "",
    search: "",
    minDuration: "",
  });

  // All sessions for CSV export (no pagination)
  const [allSessions, setAllSessions] = useState<FocusSession[]>([]);

  const fetchSessions = useCallback(
    async (p: number, f: Filters) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), limit: "20" });
        if (f.from) params.set("from", f.from);
        if (f.to) params.set("to", f.to);
        if (f.mood) params.set("mood", f.mood);
        if (f.search) params.set("search", f.search);

        const res = await fetch(`/api/sessions?${params.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as SessionsResponse;
          setSessions(data.sessions);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchSessions(page, filters);
  }, [page, filters, fetchSessions]);

  async function handleExportCSV() {
    try {
      const params = new URLSearchParams({ page: "1", limit: "1000" });
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.mood) params.set("mood", filters.mood);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/sessions?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as SessionsResponse;
        exportCSV(data.sessions);
      }
    } catch {
      // handle error
    }
  }

  function updateFilter(key: keyof Filters, value: string) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Session History</h1>
          <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
            {total} session{total !== 1 ? "s" : ""} logged
          </p>
        </div>
        <button
          onClick={() => void handleExportCSV()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "#1A2236",
            border: "1px solid #1E2D45",
            color: "#E2E8F0",
          }}
        >
          <Download size={15} />
          Export as CSV
        </button>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 mb-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative col-span-2 md:col-span-2 lg:col-span-2">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#64748b" }}
            />
            <input
              type="text"
              className="input-dark w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>

          {/* From date */}
          <div>
            <input
              type="date"
              className="input-dark w-full rounded-xl px-3 py-2.5 text-sm"
              value={filters.from}
              onChange={(e) => updateFilter("from", e.target.value)}
            />
          </div>

          {/* To date */}
          <div>
            <input
              type="date"
              className="input-dark w-full rounded-xl px-3 py-2.5 text-sm"
              value={filters.to}
              onChange={(e) => updateFilter("to", e.target.value)}
            />
          </div>

          {/* Mood filter */}
          <div>
            <select
              className="input-dark w-full rounded-xl px-3 py-2.5 text-sm"
              value={filters.mood}
              onChange={(e) => updateFilter("mood", e.target.value)}
            >
              <option value="">All moods</option>
              <option value="1">😫 Exhausted</option>
              <option value="2">😕 Rough</option>
              <option value="3">😐 OK</option>
              <option value="4">🙂 Good</option>
              <option value="5">🚀 Amazing</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {(filters.from || filters.to || filters.mood || filters.search) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.search && (
              <FilterChip label={`Search: "${filters.search}"`} onRemove={() => updateFilter("search", "")} />
            )}
            {filters.from && (
              <FilterChip label={`From: ${filters.from}`} onRemove={() => updateFilter("from", "")} />
            )}
            {filters.to && (
              <FilterChip label={`To: ${filters.to}`} onRemove={() => updateFilter("to", "")} />
            )}
            {filters.mood && (
              <FilterChip
                label={`Mood: ${MOOD_EMOJIS[parseInt(filters.mood)] ?? filters.mood}`}
                onRemove={() => updateFilter("mood", "")}
              />
            )}
            <button
              onClick={() => {
                setPage(1);
                setFilters({ from: "", to: "", mood: "", search: "", minDuration: "" });
              }}
              className="text-xs px-2 py-1"
              style={{ color: "#EF4444" }}
            >
              Clear all
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Session list ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[0, 1, 2].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </motion.div>
        ) : sessions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg font-semibold text-white mb-2">No sessions found</p>
            <p style={{ color: "#94A3B8" }} className="text-sm">
              {filters.search || filters.from || filters.to || filters.mood
                ? "Try adjusting your filters"
                : "Complete your first focus session to see history"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {sessions.map((s, i) => (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <SessionRow session={s} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pagination ────────────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mt-8"
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{
              background: "#1A2236",
              border: "1px solid #1E2D45",
              color: "#E2E8F0",
            }}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: pageNum === page ? "#6366F1" : "#1A2236",
                    color: pageNum === page ? "#fff" : "#94A3B8",
                    border: `1px solid ${pageNum === page ? "#6366F1" : "#1E2D45"}`,
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{
              background: "#1A2236",
              border: "1px solid #1E2D45",
              color: "#E2E8F0",
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </motion.div>
      )}

      {/* Page info */}
      {!loading && total > 0 && (
        <p className="text-center text-xs mt-4" style={{ color: "#64748b" }}>
          Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} sessions
        </p>
      )}
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ background: "rgba(99,102,241,0.15)", color: "#A78BFA", border: "1px solid rgba(99,102,241,0.3)" }}
    >
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors">
        ×
      </button>
    </div>
  );
}
