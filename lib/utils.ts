import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getMoodEmoji(mood: number): string {
  const emojis = ["", "😫", "😕", "😐", "🙂", "🚀"];
  return emojis[mood] ?? "😐";
}

export function getMoodLabel(mood: number): string {
  const labels = ["", "Exhausted", "Struggling", "Neutral", "Good", "On Fire"];
  return labels[mood] ?? "Neutral";
}

export function getMoodColor(mood: number): string {
  const colors = ["", "#ef4444", "#f59e0b", "#94a3b8", "#10b981", "#6366f1"];
  return colors[mood] ?? "#94a3b8";
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function formatDateLabel(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatFullDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getDayName(dayIndex: number): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex] ?? "";
}

export function getHourLabel(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function todayDateString(): string {
  return new Date().toISOString().split("T")[0]!;
}

export function blockColors(index: number): string {
  const colors = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#3b82f6", "#ec4899"];
  return colors[index % colors.length] ?? "#6366f1";
}
