"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bell, Palette, Trash2, Check, Shield } from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  email: string;
  image?: string;
  role?: string;
  primaryGoal?: string;
  dailyGoalHours: number;
  workWindowStart: number;
  workWindowEnd: number;
  defaultSessionMinutes: number;
  breakMinutes: number;
  accentColor: string;
  notifications?: {
    dailyReminder?: boolean;
    streakReminder?: boolean;
    weeklyReport?: boolean;
  };
  compactMode?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = ["Developer", "Designer", "Writer", "Product Manager", "Student", "Researcher", "Other"];
const GOALS = ["Deep work habit", "Project completion", "Learning", "Creative work", "Research", "Other"];

const ACCENT_COLORS = [
  { key: "indigo", label: "Indigo", hex: "#6366F1" },
  { key: "purple", label: "Purple", hex: "#8B5CF6" },
  { key: "emerald", label: "Emerald", hex: "#10B981" },
  { key: "amber", label: "Amber", hex: "#F59E0B" },
];

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i < 12 ? "AM" : "PM";
  const hour = i % 12 === 0 ? 12 : i % 12;
  return { value: i, label: `${hour}:00 ${ampm}` };
});

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{ background: "#1A2236", border: "1px solid #1E2D45" }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl" style={{ background: "rgba(99,102,241,0.12)" }}>
          <Icon size={16} style={{ color: "#6366F1" }} />
        </div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium" style={{ color: "#E2E8F0" }}>{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative shrink-0 transition-all duration-200"
        style={{ width: 44, height: 24 }}
        role="switch"
        aria-checked={checked}
      >
        <div
          className="absolute inset-0 rounded-full transition-colors duration-200"
          style={{ background: checked ? "#6366F1" : "#1E2D45" }}
        />
        <div
          className="absolute top-1 transition-transform duration-200 rounded-full shadow"
          style={{
            width: 16,
            height: 16,
            background: "#ffffff",
            left: checked ? 24 : 4,
          }}
        />
      </button>
    </div>
  );
}

// ─── Pill selector ────────────────────────────────────────────────────────────

function PillGroup<T extends string | number>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt)}
          onClick={() => onChange(opt)}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: value === opt ? "#6366F1" : "#0F1729",
            color: value === opt ? "#ffffff" : "#94A3B8",
            border: `1px solid ${value === opt ? "#6366F1" : "#1E2D45"}`,
          }}
        >
          {renderLabel ? renderLabel(opt) : String(opt)}
        </button>
      ))}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function SavedToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl"
          style={{
            background: "#1A2236",
            border: "1px solid #10B981",
          }}
        >
          <Check size={14} style={{ color: "#10B981" }} />
          <span className="text-sm font-medium" style={{ color: "#10B981" }}>
            Saved
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="glass rounded-2xl p-8 max-w-sm w-full mx-4"
        style={{ border: "1px solid rgba(239,68,68,0.3)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="p-2 rounded-xl"
            style={{ background: "rgba(239,68,68,0.15)" }}
          >
            <Trash2 size={16} style={{ color: "#EF4444" }} />
          </div>
          <h3 className="text-lg font-semibold text-white">Delete Account</h3>
        </div>

        <p className="text-sm mb-2" style={{ color: "#94A3B8" }}>
          This action is irreversible. All your sessions, reports, and data will be permanently
          deleted.
        </p>
        <p className="text-sm mb-5" style={{ color: "#E2E8F0" }}>
          Type <span className="font-mono font-bold" style={{ color: "#EF4444" }}>DELETE</span> to confirm.
        </p>

        <input
          type="text"
          className="input-dark w-full rounded-xl px-4 py-3 text-sm mb-5 font-mono"
          placeholder="Type DELETE here"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "#0F1729",
              color: "#E2E8F0",
              border: "1px solid #1E2D45",
            }}
          >
            Cancel
          </button>
          <button
            disabled={input !== "DELETE"}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#EF4444", color: "#fff" }}
          >
            Delete Forever
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    image: undefined,
    role: "",
    primaryGoal: "",
    dailyGoalHours: 4,
    workWindowStart: 9,
    workWindowEnd: 18,
    defaultSessionMinutes: 45,
    breakMinutes: 5,
    accentColor: "indigo",
    notifications: {
      dailyReminder: true,
      streakReminder: true,
      weeklyReport: true,
    },
    compactMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = (await res.json()) as Partial<UserProfile>;
          setProfile((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    }
    void fetchProfile();
  }, []);

  // Auto-save with debounce
  const saveProfile = useCallback(async (data: UserProfile) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowSaved(true);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
      }
    } catch {
      // handle error
    }
  }, []);

  function updateProfile(updates: Partial<UserProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      // Debounce save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => void saveProfile(next), 800);
      return next;
    });
  }

  function updateNotification(key: keyof NonNullable<UserProfile["notifications"]>, value: boolean) {
    setProfile((prev) => {
      const next = {
        ...prev,
        notifications: { ...prev.notifications, [key]: value },
      };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => void saveProfile(next), 800);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto space-y-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton rounded-2xl h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
          Customize Deepwrk to match your workflow
        </p>
      </div>

      <div className="space-y-5">

        {/* ── 1. Profile ────────────────────────────────────────────────────── */}
        <Section title="Profile" icon={User}>
          <div className="flex items-center gap-5 mb-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name}
                  width={64}
                  height={64}
                  className="rounded-2xl object-cover"
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-2xl text-xl font-bold text-white"
                  style={{
                    width: 64,
                    height: 64,
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  }}
                >
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U"}
                </div>
              )}
            </div>

            {/* Name & email */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>
                  Display Name
                </label>
                <input
                  type="text"
                  className="input-dark w-full rounded-xl px-4 py-2.5 text-sm"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>
                  Email
                </label>
                <input
                  type="email"
                  className="input-dark w-full rounded-xl px-4 py-2.5 text-sm opacity-60 cursor-not-allowed"
                  value={profile.email}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>
                Role
              </label>
              <select
                className="input-dark w-full rounded-xl px-4 py-2.5 text-sm"
                value={profile.role ?? ""}
                onChange={(e) => updateProfile({ role: e.target.value })}
              >
                <option value="">Select role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>
                Primary Goal
              </label>
              <select
                className="input-dark w-full rounded-xl px-4 py-2.5 text-sm"
                value={profile.primaryGoal ?? ""}
                onChange={(e) => updateProfile({ primaryGoal: e.target.value })}
              >
                <option value="">Select goal</option>
                {GOALS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* ── 2. Focus Preferences ─────────────────────────────────────────── */}
        <Section title="Focus Preferences" icon={Shield}>
          {/* Daily goal */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-3" style={{ color: "#94A3B8" }}>
              Daily Goal
            </label>
            <PillGroup
              options={[2, 4, 6, 8] as number[]}
              value={profile.dailyGoalHours}
              onChange={(v) => updateProfile({ dailyGoalHours: v as number })}
              renderLabel={(v) => `${String(v)}h`}
            />
          </div>

          {/* Work window */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-3" style={{ color: "#94A3B8" }}>
              Work Window
            </label>
            <div className="flex items-center gap-3">
              <select
                className="input-dark flex-1 rounded-xl px-4 py-2.5 text-sm"
                value={profile.workWindowStart}
                onChange={(e) => updateProfile({ workWindowStart: parseInt(e.target.value) })}
              >
                {HOUR_LABELS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
              <span style={{ color: "#64748b" }} className="text-sm shrink-0">to</span>
              <select
                className="input-dark flex-1 rounded-xl px-4 py-2.5 text-sm"
                value={profile.workWindowEnd}
                onChange={(e) => updateProfile({ workWindowEnd: parseInt(e.target.value) })}
              >
                {HOUR_LABELS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Default session length */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-3" style={{ color: "#94A3B8" }}>
              Default Session Length
            </label>
            <PillGroup
              options={[25, 45, 60, 90] as number[]}
              value={profile.defaultSessionMinutes}
              onChange={(v) => updateProfile({ defaultSessionMinutes: v as number })}
              renderLabel={(v) => `${String(v)} min`}
            />
          </div>

          {/* Break duration */}
          <div>
            <label className="block text-xs font-medium mb-3" style={{ color: "#94A3B8" }}>
              Break Duration
            </label>
            <PillGroup
              options={[5, 10, 15] as number[]}
              value={profile.breakMinutes}
              onChange={(v) => updateProfile({ breakMinutes: v as number })}
              renderLabel={(v) => `${String(v)} min`}
            />
          </div>
        </Section>

        {/* ── 3. Notifications ─────────────────────────────────────────────── */}
        <Section title="Notifications" icon={Bell}>
          <div className="divide-y" style={{ borderColor: "#1E2D45" }}>
            <Toggle
              checked={profile.notifications?.dailyReminder ?? true}
              onChange={(v) => updateNotification("dailyReminder", v)}
              label="Daily reminder"
              description="Get notified when your work window starts"
            />
            <Toggle
              checked={profile.notifications?.streakReminder ?? true}
              onChange={(v) => updateNotification("streakReminder", v)}
              label="Streak reminder"
              description="Alert when you're about to break your streak"
            />
            <Toggle
              checked={profile.notifications?.weeklyReport ?? true}
              onChange={(v) => updateNotification("weeklyReport", v)}
              label="Weekly report"
              description="Receive your AI-generated weekly report"
            />
          </div>
        </Section>

        {/* ── 4. Appearance ────────────────────────────────────────────────── */}
        <Section title="Appearance" icon={Palette}>
          {/* Accent color */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-3" style={{ color: "#94A3B8" }}>
              Accent Color
            </label>
            <div className="flex gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.key}
                  onClick={() => updateProfile({ accentColor: color.key })}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="rounded-xl transition-all"
                    style={{
                      width: 40,
                      height: 40,
                      background: color.hex,
                      border: profile.accentColor === color.key
                        ? `3px solid #ffffff`
                        : "3px solid transparent",
                      boxShadow: profile.accentColor === color.key
                        ? `0 0 0 2px ${color.hex}`
                        : "none",
                    }}
                  />
                  <span className="text-xs" style={{ color: "#64748b" }}>{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compact mode */}
          <div style={{ borderTop: "1px solid #1E2D45", paddingTop: 16 }}>
            <Toggle
              checked={profile.compactMode ?? false}
              onChange={(v) => updateProfile({ compactMode: v })}
              label="Compact mode"
              description="Reduce spacing and padding across the app"
            />
          </div>
        </Section>

        {/* ── 5. Account / Danger zone ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{
            background: "#1A2236",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl" style={{ background: "rgba(239,68,68,0.1)" }}>
              <Trash2 size={16} style={{ color: "#EF4444" }} />
            </div>
            <h2 className="text-base font-semibold text-white">Danger Zone</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#E2E8F0" }}>
                Delete Account
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#EF4444",
              }}
            >
              Delete Account
            </button>
          </div>
        </motion.div>

      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
        )}
      </AnimatePresence>

      {/* Saved toast */}
      <SavedToast visible={showSaved} />
    </div>
  );
}
