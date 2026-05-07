"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeeklyReport {
  _id: string;
  weekStart: string;
  weekEnd: string;
  totalFocusHours: number;
  totalSessions: number;
  avgMoodScore: number;
  bestDay?: string;
  worstDay?: string;
  peakHour?: number;
  reportText: string;
  score: number;
  actionItems: string[];
  generatedAt: string;
}

// ─── Score Display ────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = circumference * (1 - progress);

  const color =
    score < 40 ? "#EF4444" : score < 70 ? "#F59E0B" : "#10B981";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#1E2D45"
          strokeWidth="8"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs" style={{ color: "#64748b" }}>
          / 100
        </span>
      </div>
    </div>
  );
}

// ─── Animated Dots ────────────────────────────────────────────────────────────

function AnimatedDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className="text-lg"
          style={{ color: "#6366F1" }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

// ─── Accordion Report Item ────────────────────────────────────────────────────

function PreviousReportItem({ report }: { report: WeeklyReport }) {
  const [open, setOpen] = useState(false);
  const scoreColor =
    report.score < 40 ? "#EF4444" : report.score < 70 ? "#F59E0B" : "#10B981";

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-5 py-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={15} style={{ color: "#64748b" }} />
            <span className="text-sm font-medium" style={{ color: "#E2E8F0" }}>
              {format(new Date(report.weekStart), "MMM d")} –{" "}
              {format(new Date(report.weekEnd), "MMM d, yyyy")}
            </span>
          </div>
          <div
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: `${scoreColor}1A`, color: scoreColor }}
          >
            {report.score}/100
          </div>
        </div>
        <div style={{ color: "#64748b" }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: "1px solid #1E2D45" }}
          >
            <div className="px-5 py-5">
              <div className="prose prose-sm max-w-none" style={{ color: "#E2E8F0" }}>
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-base font-semibold mt-4 mb-2 first:mt-0" style={{ color: "#ffffff" }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mt-3 mb-1" style={{ color: "#E2E8F0" }}>
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm mb-2 leading-relaxed" style={{ color: "#94A3B8" }}>
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-1 mb-3 pl-4">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm" style={{ color: "#94A3B8" }}>
                        {children}
                      </li>
                    ),
                  }}
                >
                  {report.reportText}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const [latestReport, setLatestReport] = useState<WeeklyReport | null>(null);
  const [allReports, setAllReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Fetch latest report and all reports on mount
  useEffect(() => {
    async function fetchReports() {
      try {
        const [latestRes, allRes] = await Promise.all([
          fetch("/api/reports/latest"),
          fetch("/api/reports"),
        ]);

        const [latest, all] = await Promise.all([
          latestRes.json() as Promise<WeeklyReport | null>,
          allRes.json() as Promise<WeeklyReport[]>,
        ]);

        setLatestReport(latest ?? null);
        setAllReports(Array.isArray(all) ? all : []);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }

    void fetchReports();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", { method: "POST" });
      if (res.ok) {
        const report = (await res.json()) as WeeklyReport;
        setLatestReport(report);
        setAllReports((prev) => {
          const filtered = prev.filter((r) => r._id !== report._id);
          return [report, ...filtered];
        });
      }
    } catch {
      // handle error
    } finally {
      setGenerating(false);
    }
  }

  const previousReports = allReports.filter((r) => r._id !== latestReport?._id);

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Report</h1>
          <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
            AI-powered analysis of your focus patterns
          </p>
        </div>

        <button
          onClick={() => void handleGenerate()}
          disabled={generating}
          className="btn-gradient flex items-center gap-2.5 px-5 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-70"
        >
          {generating ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>
                Claude is analyzing your week
                <AnimatedDots />
              </span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Generate Report Now
            </>
          )}
        </button>
      </div>

      {/* ── Latest Report ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="skeleton rounded-2xl h-64" />
            <div className="skeleton rounded-2xl h-48" />
          </motion.div>
        ) : latestReport ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Report header card */}
            <div
              className="rounded-2xl p-6 mb-6"
              style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Score circle */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <ScoreCircle score={latestReport.score} />
                  <span className="text-xs font-medium" style={{ color: "#64748b" }}>
                    Weekly Score
                  </span>
                </div>

                {/* Report meta */}
                <div className="flex-1">
                  {/* Week range */}
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} style={{ color: "#6366F1" }} />
                    <span className="text-sm font-medium" style={{ color: "#E2E8F0" }}>
                      {format(new Date(latestReport.weekStart), "MMMM d")} –{" "}
                      {format(new Date(latestReport.weekEnd), "MMMM d, yyyy")}
                    </span>
                  </div>

                  {/* AI badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(99,102,241,0.15)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        color: "#A78BFA",
                      }}
                    >
                      <Sparkles size={11} />
                      Generated by Claude AI
                    </div>
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      {format(new Date(latestReport.generatedAt), "MMM d 'at' h:mm a")}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: "#6366F1" }}>
                        {latestReport.totalFocusHours}h
                      </p>
                      <p className="text-xs" style={{ color: "#64748b" }}>Focus time</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {latestReport.totalSessions}
                      </p>
                      <p className="text-xs" style={{ color: "#64748b" }}>Sessions</p>
                    </div>
                    <div>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          color:
                            latestReport.avgMoodScore >= 4
                              ? "#10B981"
                              : latestReport.avgMoodScore >= 3
                              ? "#F59E0B"
                              : "#EF4444",
                        }}
                      >
                        {latestReport.avgMoodScore}/5
                      </p>
                      <p className="text-xs" style={{ color: "#64748b" }}>Avg mood</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report body */}
            <div
              className="rounded-2xl p-6 mb-6"
              style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
            >
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2
                        className="text-lg font-bold mt-6 mb-3 first:mt-0 pb-2"
                        style={{
                          color: "#ffffff",
                          borderBottom: "1px solid #1E2D45",
                        }}
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: "#E2E8F0" }}>
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed mb-3" style={{ color: "#94A3B8" }}>
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-2 mb-4 pl-0 list-none">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li
                        className="flex items-start gap-2 text-sm"
                        style={{ color: "#94A3B8" }}
                      >
                        <span style={{ color: "#6366F1", marginTop: 2 }}>•</span>
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ color: "#E2E8F0", fontWeight: 600 }}>{children}</strong>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote
                        className="px-4 py-3 rounded-xl my-4 italic"
                        style={{
                          background: "rgba(99,102,241,0.08)",
                          borderLeft: "3px solid #6366F1",
                          color: "#94A3B8",
                        }}
                      >
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {latestReport.reportText}
                </ReactMarkdown>
              </div>
            </div>

            {/* Action items */}
            {latestReport.actionItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-8"
              >
                <h3 className="text-base font-semibold text-white mb-4">Action Items</h3>
                <div className="space-y-3">
                  {latestReport.actionItems.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-4 rounded-xl p-4"
                      style={{
                        background: "#1A2236",
                        border: "1px solid #1E2D45",
                        borderLeft: "3px solid #6366F1",
                      }}
                    >
                      <div
                        className="flex items-center justify-center rounded-lg text-sm font-bold shrink-0"
                        style={{
                          width: 28,
                          height: 28,
                          background: "rgba(99,102,241,0.15)",
                          color: "#6366F1",
                        }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "#E2E8F0" }}>
                        {item}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : !generating ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="text-6xl mb-5">📊</div>
            <p className="text-xl font-bold text-white mb-3">No report yet</p>
            <p style={{ color: "#94A3B8" }} className="text-sm max-w-sm mb-8">
              Generate your first weekly report to get AI-powered insights about your focus habits.
            </p>
            <button
              onClick={() => void handleGenerate()}
              className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
            >
              <Sparkles size={16} />
              Generate First Report
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Previous Reports ─────────────────────────────────────────────────── */}
      {previousReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-base font-semibold text-white mb-4">Previous Reports</h3>
          <div className="space-y-3">
            {previousReports.map((report) => (
              <PreviousReportItem key={report._id} report={report} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
