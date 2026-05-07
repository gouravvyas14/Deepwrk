"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/focus": "Focus",
  "/analytics": "Analytics",
  "/history": "History",
  "/report": "Weekly Report",
  "/settings": "Settings",
  "/groups": "Groups",
  "/notes": "Notes",
};

export default function DynamicTopBar({ streak }: { streak: number }) {
  const pathname = usePathname();
  // For nested routes like /groups/[id], match the prefix
  const title =
    TITLES[pathname] ??
    (Object.entries(TITLES).find(([k]) => pathname.startsWith(k + "/"))?.[1]) ??
    "Deepwrk";
  return <TopBar title={title} streak={streak} />;
}
