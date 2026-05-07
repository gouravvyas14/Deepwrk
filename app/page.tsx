"use client";

import Link from "next/link";
import { motion, type Variants, type Transition } from "framer-motion";
import {
  Sparkles,
  BarChart3,
  Brain,
  Check,
  ArrowRight,
  Zap,
  Timer,
  TrendingUp,
  ChevronRight,
  Star,
} from "lucide-react";

/* ─── Framer Motion helpers ─────────────────────────────────────── */
const EASE = "easeOut" as const;

// For hero elements that need individual delays, use direct initial/animate objects
const HIDDEN = { opacity: 0, y: 20 } as const;
function makeFadeUp(delay = 0): { opacity: number; y: number; transition: Transition } {
  return { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE, delay } };
}

// For stagger children (whileInView sections)
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Navbar ─────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <header
      className="glass fixed inset-x-0 top-0 z-50"
      style={{ borderBottom: "1px solid #1E2D45" }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
          >
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Deepwrk</span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {["Features", "Pricing", "How it works"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: "#94A3B8" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = "#E2E8F0")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8")
              }
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="hidden text-sm font-medium transition-colors md:block"
            style={{ color: "#94A3B8" }}
          >
            Sign In
          </Link>
          <Link
            href="/auth"
            className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ─── Dashboard Mockup ───────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-16 w-full max-w-3xl"
    >
      {/* Glow halo */}
      <div
        className="absolute -inset-px rounded-2xl opacity-60 blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.25) 100%)",
        }}
      />

      {/* Card shell */}
      <div
        className="relative rounded-2xl p-px"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.3) 50%, rgba(30,45,69,0.6) 100%)",
        }}
      >
        <div
          className="rounded-2xl p-5"
          style={{ background: "#111827" }}
        >
          {/* Top bar */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ background: "#EF4444" }} />
            <div className="h-3 w-3 rounded-full" style={{ background: "#F59E0B" }} />
            <div className="h-3 w-3 rounded-full" style={{ background: "#10B981" }} />
            <span
              className="ml-3 text-xs font-medium"
              style={{ color: "#94A3B8" }}
            >
              deepwrk — focus session
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Timer */}
            <div
              className="col-span-1 flex flex-col items-center justify-center rounded-xl p-4"
              style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
            >
              <div
                className="mb-1 text-xs font-medium uppercase tracking-wider"
                style={{ color: "#6366F1" }}
              >
                Focus Timer
              </div>
              <div
                className="animate-breathing text-4xl font-bold tabular-nums"
                style={{ color: "#FFFFFF" }}
              >
                24:13
              </div>
              <div className="mt-2 text-xs" style={{ color: "#64748B" }}>
                Deep Work · Session 3
              </div>
              <div
                className="mt-3 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active
              </div>
            </div>

            {/* Right column */}
            <div className="col-span-2 flex flex-col gap-3">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Today", value: "4h 20m", icon: Timer, color: "#6366F1" },
                  { label: "Streak", value: "12 days", icon: TrendingUp, color: "#8B5CF6" },
                  { label: "Score", value: "94%", icon: Sparkles, color: "#F59E0B" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3"
                    style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
                  >
                    <Icon size={14} style={{ color }} />
                    <div
                      className="mt-1 text-lg font-bold"
                      style={{ color: "#FFFFFF" }}
                    >
                      {value}
                    </div>
                    <div className="text-xs" style={{ color: "#64748B" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI task list */}
              <div
                className="flex-1 rounded-xl p-3"
                style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
              >
                <div
                  className="mb-2 flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "#8B5CF6" }}
                >
                  <Brain size={12} />
                  AI-Planned Tasks
                </div>
                {[
                  { done: true, label: "Review auth flow" },
                  { done: true, label: "Write unit tests" },
                  { done: false, label: "Refactor dashboard API", active: true },
                  { done: false, label: "Deploy to staging" },
                ].map(({ done, label, active }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs"
                    style={{
                      background: active ? "rgba(99,102,241,0.08)" : "transparent",
                      color: done ? "#64748B" : active ? "#E2E8F0" : "#94A3B8",
                    }}
                  >
                    <div
                      className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border"
                      style={{
                        borderColor: done ? "#10B981" : active ? "#6366F1" : "#1E2D45",
                        background: done ? "rgba(16,185,129,0.15)" : "transparent",
                      }}
                    >
                      {done && <Check size={8} style={{ color: "#10B981" }} />}
                    </div>
                    <span className={done ? "line-through" : ""}>{label}</span>
                    {active && (
                      <span
                        className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          background: "rgba(99,102,241,0.15)",
                          color: "#6366F1",
                        }}
                      >
                        now
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section
      id="hero"
      className="bg-dots relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center"
      style={{ background: "#0A0E1A" }}
    >
      {/* Radial glow backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-4xl">
        {/* Badge */}
        <motion.div
          initial={HIDDEN}
          animate={makeFadeUp(0.05)}
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.25)",
            color: "#A5B4FC",
          }}
        >
          <Sparkles size={14} />
          AI-powered focus OS — now in beta
          <ChevronRight size={14} />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={HIDDEN}
          animate={makeFadeUp(0.1)}
          className="mb-4 text-6xl font-black leading-[1.05] tracking-tight md:text-7xl lg:text-8xl"
        >
          <span className="gradient-text-hero block">Stop Losing Hours.</span>
          <span className="gradient-text-hero block">Start Owning Them.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={HIDDEN}
          animate={makeFadeUp(0.2)}
          className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed md:text-2xl"
          style={{ color: "#94A3B8" }}
        >
          Deepwrk is your{" "}
          <span className="gradient-text font-semibold">AI focus operating system</span>{" "}
          — it plans your day, runs your Pomodoro sessions, tracks your energy patterns,
          and gives you a weekly AI coach that actually understands your work.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={HIDDEN}
          animate={makeFadeUp(0.28)}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/auth"
            className="btn-gradient flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg"
          >
            Start Free — No Card Required
            <ArrowRight size={18} />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-semibold transition-all hover:bg-white/5"
            style={{ borderColor: "#1E2D45", color: "#E2E8F0" }}
          >
            See How It Works
          </a>
        </motion.div>

        {/* Social proof micro */}
        <motion.p
          initial={HIDDEN}
          animate={makeFadeUp(0.35)}
          className="mt-6 text-sm"
          style={{ color: "#64748B" }}
        >
          Trusted by{" "}
          <span style={{ color: "#94A3B8" }}>2,400+ developers, students &amp; creators</span>
        </motion.p>

        {/* Dashboard mockup */}
        <DashboardMockup />
      </div>
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────────────── */
const features = [
  {
    icon: Sparkles,
    title: "AI Task Planning",
    description:
      "Paste your to-do list and Deepwrk's AI breaks it into optimally-sized focus blocks, ordered by energy demand and deadline pressure.",
    color: "#6366F1",
  },
  {
    icon: BarChart3,
    title: "Pattern Analytics",
    description:
      "See exactly when you do your best work. Heatmaps, streaks, and distraction scores surface insights no human coach would catch.",
    color: "#8B5CF6",
  },
  {
    icon: Brain,
    title: "Weekly AI Coach",
    description:
      "Every Sunday, get a personalised report with wins, bottlenecks, and a concrete plan — written by an AI that has read every session you ran.",
    color: "#6366F1",
  },
];

function Features() {
  return (
    <section
      id="features"
      className="relative px-6 py-28"
      style={{ background: "#0A0E1A" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-16 text-center"
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-sm font-semibold uppercase tracking-widest"
            style={{ color: "#6366F1" }}
          >
            Features
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-4xl font-black tracking-tight text-white md:text-5xl"
          >
            Everything you need to{" "}
            <span className="gradient-text">go deeper</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-xl text-lg"
            style={{ color: "#94A3B8" }}
          >
            Built for knowledge workers who are tired of being busy without being
            productive.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {features.map(({ icon: Icon, title, description, color }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="card-hover animate-fade-in-up rounded-2xl p-6"
              style={{ background: "#1A2236" }}
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
                  border: `1px solid ${color}33`,
                }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
              <p className="leading-relaxed" style={{ color: "#94A3B8" }}>
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How It Works ───────────────────────────────────────────────── */
const steps = [
  {
    number: "01",
    title: "Paste your tasks",
    description:
      "Drop your tasks in plain text or connect your project management tool. AI instantly analyses complexity, priority, and estimated time.",
  },
  {
    number: "02",
    title: "Run focus sessions",
    description:
      "Start a timed session. Deepwrk plays ambient sound, blocks distractions, and nudges you back when you wander — all automatically.",
  },
  {
    number: "03",
    title: "Get coached by AI",
    description:
      "After every session and every week, the AI reads your data and gives you specific, actionable coaching — not generic tips.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-grid relative px-6 py-28"
      style={{ background: "#111827" }}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-16 text-center"
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-sm font-semibold uppercase tracking-widest"
            style={{ color: "#8B5CF6" }}
          >
            How it works
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-4xl font-black tracking-tight text-white md:text-5xl"
          >
            Up and running in{" "}
            <span className="gradient-text">90 seconds</span>
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="relative grid gap-8 md:grid-cols-3"
        >
          {/* Connector line */}
          <div
            className="absolute left-0 right-0 top-10 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 5%, #1E2D45 30%, #1E2D45 70%, transparent 95%)",
            }}
          />

          {steps.map(({ number, title, description }) => (
            <motion.div
              key={number}
              variants={fadeUp}
              className="relative flex flex-col items-center text-center"
            >
              {/* Number circle */}
              <div
                className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black"
                style={{
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  boxShadow: "0 0 30px rgba(99,102,241,0.35)",
                  color: "#FFFFFF",
                }}
              >
                {number}
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
              <p className="leading-relaxed" style={{ color: "#94A3B8" }}>
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Social Proof strip ─────────────────────────────────────────── */
function SocialProof() {
  return (
    <section
      className="relative overflow-hidden px-6 py-14"
      style={{ background: "#0A0E1A" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <div className="mb-3 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={18}
              fill="#F59E0B"
              style={{ color: "#F59E0B" }}
            />
          ))}
        </div>
        <p className="mb-2 text-2xl font-bold text-white md:text-3xl">
          Join{" "}
          <span className="gradient-text">2,400+ developers, students</span>
          <br />
          and creators doing deep work
        </p>
        <p className="text-base" style={{ color: "#94A3B8" }}>
          From indie hackers shipping solo to engineering teams at funded startups.
        </p>
        <div
          className="mx-auto mt-6 flex max-w-sm flex-wrap justify-center gap-3 text-sm font-medium"
          style={{ color: "#64748B" }}
        >
          {["React devs", "Designers", "Students", "Writers", "Founders"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-3 py-1"
              style={{ borderColor: "#1E2D45" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────────────────────── */
const freePlan = {
  name: "Free",
  price: "₹0",
  period: "forever",
  description: "For individuals getting started with focused work.",
  features: [
    "5 focus sessions / day",
    "Basic Pomodoro timer",
    "7-day history",
    "1 AI daily plan / week",
    "Community support",
  ],
};

const proPlan = {
  name: "Pro",
  price: "₹399",
  period: "/ month",
  description: "For serious professionals who want to compound their output.",
  features: [
    "Unlimited focus sessions",
    "Full pattern analytics",
    "Unlimited history + export",
    "Daily AI task planning",
    "Weekly AI coach report",
    "Distraction blocking",
    "Priority support",
  ],
};

function Pricing() {
  return (
    <section
      id="pricing"
      className="px-6 py-28"
      style={{ background: "#111827" }}
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-16 text-center"
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-sm font-semibold uppercase tracking-widest"
            style={{ color: "#6366F1" }}
          >
            Pricing
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-4xl font-black tracking-tight text-white md:text-5xl"
          >
            Simple,{" "}
            <span className="gradient-text">honest pricing</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-md text-lg"
            style={{ color: "#94A3B8" }}
          >
            Start free. Upgrade when you&apos;re ready to go all-in.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-6 md:grid-cols-2 md:items-start"
        >
          {/* Free card */}
          <motion.div
            variants={fadeUp}
            className="card-hover rounded-2xl p-8"
            style={{ background: "#1A2236" }}
          >
            <div className="mb-6">
              <p className="mb-1 text-sm font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>
                {freePlan.name}
              </p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-white">{freePlan.price}</span>
                <span className="mb-1.5 text-base" style={{ color: "#64748B" }}>
                  {freePlan.period}
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: "#94A3B8" }}>
                {freePlan.description}
              </p>
            </div>
            <Link
              href="/auth"
              className="mb-8 block rounded-xl border py-3 text-center text-sm font-semibold transition-all hover:bg-white/5"
              style={{ borderColor: "#1E2D45", color: "#E2E8F0" }}
            >
              Get started free
            </Link>
            <ul className="space-y-3">
              {freePlan.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#94A3B8" }}>
                  <div
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(16,185,129,0.12)" }}
                  >
                    <Check size={11} style={{ color: "#10B981" }} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro card — with glow border */}
          <motion.div
            variants={fadeUp}
            className="relative rounded-2xl p-px"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.5) 100%)",
              boxShadow: "0 0 40px rgba(99,102,241,0.25)",
            }}
          >
            {/* Popular badge */}
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide text-white"
              style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
            >
              Most Popular
            </div>
            <div className="rounded-2xl p-8" style={{ background: "#1A2236" }}>
              <div className="mb-6">
                <p
                  className="mb-1 text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "#8B5CF6" }}
                >
                  {proPlan.name}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-white">{proPlan.price}</span>
                  <span className="mb-1.5 text-base" style={{ color: "#64748B" }}>
                    {proPlan.period}
                  </span>
                </div>
                <p className="mt-2 text-sm" style={{ color: "#94A3B8" }}>
                  {proPlan.description}
                </p>
              </div>
              <Link
                href="/auth"
                className="btn-gradient mb-8 block rounded-xl py-3 text-center text-sm font-bold text-white shadow-lg"
              >
                Start Pro — 14 days free
              </Link>
              <ul className="space-y-3">
                {proPlan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#E2E8F0" }}>
                    <div
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: "rgba(99,102,241,0.15)" }}
                    >
                      <Check size={11} style={{ color: "#6366F1" }} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer
      className="px-6 py-16"
      style={{ background: "#0A0E1A", borderTop: "1px solid #1E2D45" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
              >
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">Deepwrk</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed" style={{ color: "#64748B" }}>
              The AI focus OS for knowledge workers who refuse to waste their best hours on shallow noise.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="mb-4 text-sm font-semibold text-white">Product</p>
            <ul className="space-y-2.5 text-sm" style={{ color: "#64748B" }}>
              {["Features", "Pricing", "Changelog", "Roadmap"].map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-white">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 text-sm font-semibold text-white">Company</p>
            <ul className="space-y-2.5 text-sm" style={{ color: "#64748B" }}>
              {["About", "Blog", "Privacy", "Terms"].map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-white">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm md:flex-row"
          style={{ borderColor: "#1E2D45", color: "#64748B" }}
        >
          <p>© 2024 Deepwrk. All rights reserved.</p>
          <p>
            Built for people who believe attention is their most valuable asset.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <Footer />
    </main>
  );
}
