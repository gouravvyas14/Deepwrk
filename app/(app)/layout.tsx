import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import Sidebar from "@/components/layout/Sidebar";
import DynamicTopBar from "@/components/layout/DynamicTopBar";

interface PageTitleProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: PageTitleProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth");
  }

  // Read streak directly from DB — server-side fetch can't forward cookies.
  let streak = 0;
  try {
    await connectDB();
    const userDoc = await UserModel.findOne({ email: session.user.email }).lean() as { currentStreak?: number } | null;
    streak = userDoc?.currentStreak ?? 0;
  } catch {
    // Non-critical; fall back to 0
  }

  const user = {
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    image: session.user.image ?? undefined,
  };

  return (
    /*
     * Layout topology (desktop):
     *   [ Sidebar 240px fixed ] [ TopBar + content — offset by 240px ]
     *
     * Layout topology (mobile):
     *   [ full-width TopBar + content ] [ Bottom nav fixed at bottom ]
     */
    <div className="flex min-h-screen" style={{ backgroundColor: "#0a0e1a" }}>
      {/* Sidebar is fixed-positioned internally; it takes no flow space */}
      <Sidebar user={user} />

      {/*
       * Content wrapper.
       * md:ml-[240px] shifts the main area right of the fixed sidebar on desktop.
       * On mobile (< 768px) the sidebar is hidden and replaced by a bottom nav,
       * so no left margin is needed. Bottom padding compensates for the bottom nav.
       */}
      <div className="flex flex-col flex-1 min-w-0 md:ml-[240px]">
        {/* TopBar — sticky within the scrolling content column */}
        <DynamicTopBar streak={streak} />

        {/* Scrollable page content */}
        <main
          className="flex-1 overflow-y-auto pb-[60px] md:pb-0"
          style={{ backgroundColor: "#0a0e1a" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
