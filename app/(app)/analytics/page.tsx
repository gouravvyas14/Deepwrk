"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { Lightbulb, TrendingUp, Target, Clock, Smile, Star } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = 7 | 30 | 90;

interface OverviewData {
  avgDailyHours: number;
  bestDay: { day: string; hours: number };
  avgMoodScore: number;
  totalSessions: number;
}

interface DailyDataPoint {
  date: string;
  hours: number;
  sessions: number;
  mood: number;
}

interface CategoryItem {
  name: string;
  value: number;
}

interface DistributionItem {
  range: string;
  count: number;
}

interface ChartsData {
  dailyData: DailyDataPoint[];
  categoryData: CategoryItem[];
  distributionData: DistributionItem[];
}

interface HeatmapCell {
  day: number;
  hour: number;
  value: number;
}

interface InsightsData {
  insights: string[];
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm shadow-xl"
      style={{
        background: "#0F1729",
        border: "1px solid #1E2D45",
        color: "#E2E8F0",
      }}
    >
      <p className="font-medium mb-1" style={{ color: "#ffffff" }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: "#94A3B8" }}>
          {p.name}: <span style={{ color: "#6366F1" }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getHeatColor(value: number): string {
  if (value === 0) return "#0F1729";
  if (value < 0.5) return "rgba(99,102,241,0.2)";
  if (value < 1.5) return "rgba(99,102,241,0.5)";
  return "#6366F1";
}

function HeatmapGrid({ data }: { data: HeatmapCell[] }) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  // Build lookup
  const lookup = new Map<string, number>();
  for (const c of data) {
    lookup.set(`${c.day}-${c.hour}`, c.value);
  }

  return (
    <div className="relative overflow-x-auto">
      {/* Hour labels */}
      <div className="flex mb-1 ml-10">
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            className="flex-1 text-center"
            style={{ fontSize: 9, color: "#64748b", minWidth: 14 }}
          >
            {h % 6 === 0 ? `${h}h` : ""}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {Array.from({ length: 7 }, (_, day) => (
        <div key={day} className="flex items-center mb-1">
          <div
            className="text-right pr-2 shrink-0"
            style={{ width: 36, fontSize: 10, color: "#64748b" }}
          >
            {DAY_LABELS[day]}
          </div>
          {Array.from({ length: 24 }, (_, hour) => {
            const val = lookup.get(`${day}-${hour}`) ?? 0;
            return (
              <div
                key={hour}
                className="flex-1 rounded-sm cursor-default transition-all"
                style={{
                  minWidth: 14,
                  height: 16,
                  background: getHeatColor(val),
                  margin: "0 1px",
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                    text: val > 0 ? `${val.toFixed(1)}h` : "No data",
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </div>
      ))}

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 rounded-lg text-xs font-medium"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateX(-50%) translateY(-100%)",
            background: "#0F1729",
            border: "1px solid #1E2D45",
            color: "#E2E8F0",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="skeleton rounded-xl"
      style={{ height }}
    />
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

const INSIGHT_ICONS = [Lightbulb, TrendingUp, Target];
const INSIGHT_COLORS = ["#F59E0B", "#10B981", "#6366F1"];

function InsightCard({
  text,
  index,
}: {
  text: string;
  index: number;
}) {
  const Icon = INSIGHT_ICONS[index % 3] ?? Lightbulb;
  const color = INSIGHT_COLORS[index % 3] ?? "#6366F1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="card-hover rounded-2xl p-5"
      style={{ background: "#1A2236" }}
    >
      <div
        className="flex items-center justify-center mb-4 w-10 h-10 rounded-xl"
        style={{ background: `${color}1A` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#E2E8F0" }}>
        {text}
      </p>
    </motion.div>
  );
}

const PIE_COLORS = ["#6366F1", "#8B5CF6", "#A78BFA", "#C4B5FD", "#10B981", "#F59E0B"];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>(30);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchAll() {
      try {
        const [overviewRes, chartsRes, heatmapRes, insightsRes] = await Promise.all([
          fetch(`/api/analytics/overview?days=${range}`),
          fetch(`/api/analytics/charts?days=${range}`),
          fetch(`/api/analytics/heatmap?days=${range}`),
          fetch(`/api/analytics/insights?days=${range}`),
        ]);

        if (cancelled) return;

        const [o, c, h, i] = await Promise.all([
          overviewRes.json() as Promise<OverviewData>,
          chartsRes.json() as Promise<ChartsData>,
          heatmapRes.json() as Promise<HeatmapCell[]>,
          insightsRes.json() as Promise<InsightsData>,
        ]);

        if (cancelled) return;
        setOverview(o);
        setCharts(c);
        setHeatmap(Array.isArray(h) ? h : []);
        setInsights(i.insights ?? []);
      } catch {
        // handle error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchAll();
    return () => {
      cancelled = true;
    };
  }, [range]);

  // Format daily chart labels for display
  const chartData =
    charts?.dailyData.map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    })) ?? [];

  // Sparse labels for 30/90 day views
  const tickInterval = range === 7 ? 0 : range === 30 ? 4 : 14;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
            Understand your deep work patterns
          </p>
        </div>

        {/* Range selector */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
        >
          {([7, 30, 90] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: range === r ? "#6366F1" : "transparent",
                color: range === r ? "#ffffff" : "#94A3B8",
              }}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={range}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── KPI Row ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Avg daily hours */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="card-hover rounded-2xl p-5"
              style={{ background: "#1A2236" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ background: "rgba(99,102,241,0.15)" }}>
                  <Clock size={16} style={{ color: "#6366F1" }} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#64748b" }}>
                  Avg Daily Hours
                </span>
              </div>
              {loading ? (
                <div className="skeleton h-9 w-24 mb-1" />
              ) : (
                <p className="text-4xl font-bold text-white animate-count-up">
                  {overview?.avgDailyHours ?? 0}
                  <span className="text-lg ml-1" style={{ color: "#64748b" }}>h</span>
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                over last {range} days
              </p>
            </motion.div>

            {/* Best focus day */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="card-hover rounded-2xl p-5"
              style={{ background: "#1A2236" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ background: "rgba(16,185,129,0.15)" }}>
                  <Star size={16} style={{ color: "#10B981" }} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#64748b" }}>
                  Best Focus Day
                </span>
              </div>
              {loading ? (
                <div className="skeleton h-9 w-24 mb-1" />
              ) : (
                <p className="text-4xl font-bold text-white">
                  {overview?.bestDay.day ?? "—"}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                {loading ? "" : `${overview?.bestDay.hours ?? 0}h total focus`}
              </p>
            </motion.div>

            {/* Avg mood */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-hover rounded-2xl p-5"
              style={{ background: "#1A2236" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ background: "rgba(245,158,11,0.15)" }}>
                  <Smile size={16} style={{ color: "#F59E0B" }} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#64748b" }}>
                  Avg Mood Score
                </span>
              </div>
              {loading ? (
                <div className="skeleton h-9 w-24 mb-1" />
              ) : (
                <p
                  className="text-4xl font-bold"
                  style={{
                    color:
                      (overview?.avgMoodScore ?? 0) >= 4
                        ? "#10B981"
                        : (overview?.avgMoodScore ?? 0) >= 3
                        ? "#F59E0B"
                        : "#EF4444",
                  }}
                >
                  {overview?.avgMoodScore ?? 0}
                  <span className="text-lg ml-1" style={{ color: "#64748b" }}>/5</span>
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                {loading ? "" : `${overview?.totalSessions ?? 0} sessions tracked`}
              </p>
            </motion.div>
          </div>

          {/* ── Charts Row ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily focus hours bar chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-5"
              style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
            >
              <h3 className="text-sm font-semibold mb-4 text-white">Daily Focus Hours</h3>
              {loading ? (
                <ChartSkeleton height={220} />
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px]" style={{ color: "#64748b" }}>
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={tickInterval}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar
                      dataKey="hours"
                      name="Hours"
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Mood over time line chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-5"
              style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
            >
              <h3 className="text-sm font-semibold mb-4 text-white">Mood Over Time</h3>
              {loading ? (
                <ChartSkeleton height={220} />
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px]" style={{ color: "#64748b" }}>
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={tickInterval}
                    />
                    <YAxis
                      domain={[0, 5]}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="mood"
                      name="Mood"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="url(#moodGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#8B5CF6" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          {/* ── Heatmap ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl p-6 mb-8"
            style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">Focus Heatmap</h3>
              <div className="flex items-center gap-3 text-xs" style={{ color: "#64748b" }}>
                <span>Less</span>
                {["#0F1729", "rgba(99,102,241,0.2)", "rgba(99,102,241,0.5)", "#6366F1"].map(
                  (c, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{ background: c, border: "1px solid #1E2D45" }}
                    />
                  ),
                )}
                <span>More</span>
              </div>
            </div>
            {loading ? (
              <ChartSkeleton height={140} />
            ) : (
              <HeatmapGrid data={heatmap} />
            )}
          </motion.div>

          {/* ── Bottom Charts ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Category donut */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-5"
              style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
            >
              <h3 className="text-sm font-semibold mb-4 text-white">Sessions by Category</h3>
              {loading ? (
                <ChartSkeleton height={200} />
              ) : !charts?.categoryData.length ? (
                <div className="flex items-center justify-center h-[200px]" style={{ color: "#64748b" }}>
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={charts.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {charts.categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                    <Legend
                      formatter={(value: string) => (
                        <span style={{ color: "#94A3B8", fontSize: 12 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Session length distribution */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl p-5"
              style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
            >
              <h3 className="text-sm font-semibold mb-4 text-white">Session Length Distribution</h3>
              {loading ? (
                <ChartSkeleton height={200} />
              ) : !charts?.distributionData.length ? (
                <div className="flex items-center justify-center h-[200px]" style={{ color: "#64748b" }}>
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={charts.distributionData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
                    <XAxis
                      dataKey="range"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Sessions"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          {/* ── AI Insights ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <h3 className="text-sm font-semibold text-white">AI Insights</h3>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "rgba(99,102,241,0.15)", color: "#6366F1" }}
              >
                Powered by Claude
              </span>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton rounded-2xl h-32" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.slice(0, 3).map((text, i) => (
                  <InsightCard key={i} text={text} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
