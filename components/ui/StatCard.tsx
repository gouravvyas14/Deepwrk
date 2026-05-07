"use client";

import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: number;
  children?: React.ReactNode;
}

export function StatCard({ title, value, sub, icon, trend, children }: StatCardProps) {
  const [displayed, setDisplayed] = useState(0);
  const numericValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;

  useEffect(() => {
    const duration = 800;
    const steps = 40;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, numericValue);
      setDisplayed(Math.round(current * 10) / 10);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <div
      className="card-hover"
      style={{
        background: "#1a2236",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{title}</span>
        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(99,102,241,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6366f1",
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {children ? (
        children
      ) : (
        <div>
          <div
            className="animate-count-up"
            style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1, fontFamily: "inherit" }}
          >
            {typeof value === "string" ? value : displayed}
          </div>
          {sub && (
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{sub}</div>
          )}
        </div>
      )}

      {trend !== undefined && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            color: trend >= 0 ? "#10b981" : "#ef4444",
          }}
        >
          <span>{trend >= 0 ? "▲" : "▼"}</span>
          <span>{Math.abs(trend)}% vs last week</span>
        </div>
      )}
    </div>
  );
}
