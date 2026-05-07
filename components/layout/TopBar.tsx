"use client";

import { Bell, Flame } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  title: string;
  streak: number;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function TopBar({ title, streak }: TopBarProps) {
  const [hasNotifications] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between"
      style={{
        height: 64,
        paddingLeft: 24,
        paddingRight: 24,
        backgroundColor: "#111827",
        borderBottom: "1px solid #1e2d45",
      }}
    >
      {/* Left — page title */}
      <h1
        className="text-base font-semibold tracking-tight"
        style={{ color: "#ffffff" }}
      >
        {title}
      </h1>

      {/* Center — current date */}
      <span
        className="absolute left-1/2 -translate-x-1/2 text-sm font-medium hidden sm:block"
        style={{ color: "#94a3b8" }}
      >
        {formatDate()}
      </span>

      {/* Right — streak + bell */}
      <div className="flex items-center gap-3">
        {/* Streak counter */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            color: "#f59e0b",
          }}
        >
          <Flame size={14} className="shrink-0" style={{ color: "#f59e0b" }} />
          <span>{streak}</span>
        </div>

        {/* Bell icon */}
        <button
          className="relative flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: 36,
            height: 36,
            color: "#94a3b8",
            background: "transparent",
            border: "1px solid #1e2d45",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(99,102,241,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
          }}
          aria-label="Notifications"
        >
          <Bell size={16} />
          {hasNotifications && (
            <span
              className="absolute top-1.5 right-1.5 rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "#6366f1",
                boxShadow: "0 0 6px rgba(99,102,241,0.8)",
              }}
            />
          )}
        </button>
      </div>
    </header>
  );
}
