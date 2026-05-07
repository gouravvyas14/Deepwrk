"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  LayoutDashboard,
  Timer,
  BarChart3,
  Clock,
  FileText,
  Settings,
  LogOut,
  Zap,
  Users,
  StickyNote,
} from "lucide-react";

interface SidebarUser {
  name: string;
  email: string;
  image?: string;
}

interface SidebarProps {
  user: SidebarUser;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Focus", href: "/focus", icon: Timer },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "History", href: "/history", icon: Clock },
  { label: "Groups", href: "/groups", icon: Users },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Report", href: "/report", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

function UserAvatar({ user }: { user: SidebarUser }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name}
        width={32}
        height={32}
        className="rounded-full object-cover"
        style={{ width: 32, height: 32 }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full text-xs font-semibold text-white shrink-0"
      style={{
        width: 32,
        height: 32,
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      }}
    >
      {initials}
    </div>
  );
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40"
        style={{
          width: 240,
          backgroundColor: "#0a0e1a",
          borderRight: "1px solid #1e2d45",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-5"
          style={{ height: 64, borderBottom: "1px solid #1e2d45" }}
        >
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{
              width: 30,
              height: 30,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            }}
          >
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "#ffffff" }}
          >
            Deepwrk
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 pt-4 flex-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${isActive ? " active" : ""}`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div
          className="px-3 pb-4 pt-3"
          style={{ borderTop: "1px solid #1e2d45" }}
        >
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
            style={{ background: "rgba(26,34,54,0.6)" }}
          >
            <UserAvatar user={user} />
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="text-sm font-medium truncate leading-tight"
                style={{ color: "#e2e8f0" }}
              >
                {user.name}
              </span>
              <span
                className="text-xs truncate leading-tight mt-0.5"
                style={{ color: "#64748b" }}
              >
                {user.email}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="nav-item w-full"
            style={{ marginTop: 2 }}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
        style={{
          backgroundColor: "#0a0e1a",
          borderTop: "1px solid #1e2d45",
          height: 60,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {navItems.slice(0, 5).map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-all"
              style={{
                color: isActive ? "#6366f1" : "#64748b",
                minWidth: 48,
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.2 }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
