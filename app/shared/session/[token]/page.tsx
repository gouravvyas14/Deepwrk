import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import FocusSessionModel from "@/models/FocusSession";
import UserModel from "@/models/User";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ token: string }> }

const MOOD_MAP: Record<number, string> = { 1: "😫", 2: "😕", 3: "😐", 4: "🙂", 5: "🚀" };

function fmt(mins?: number) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default async function SharedSessionPage({ params }: Props) {
  const { token } = await params;
  await connectDB();

  const session = await FocusSessionModel.findOne({ shareToken: token }).lean() as {
    _id: unknown; userId: unknown; taskTitle: string; taskCategory?: string;
    plannedDuration?: number; actualDuration?: number;
    moodBefore?: number; moodAfter?: number; notes?: string;
    status: string; startedAt: Date; completedAt?: Date;
  } | null;

  if (!session) notFound();

  const owner = await UserModel.findById(session.userId).lean() as { name?: string } | null;
  const ownerName = owner?.name ?? "Someone";

  const statusColor = session.status === "completed" ? "#10b981" : session.status === "abandoned" ? "#ef4444" : "#f59e0b";

  return (
    <div className="min-h-screen px-4 py-12 max-w-xl mx-auto" style={{ backgroundColor: "#0A0E1A" }}>
      {/* Brand badge */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex items-center justify-center rounded-lg"
          style={{ width: 28, height: 28, background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <span className="text-white text-xs font-bold">D</span>
        </div>
        <span className="text-sm font-semibold" style={{ color: "#64748b" }}>
          Shared via <span style={{ color: "#818cf8" }}>Deepwrk</span>
        </span>
      </div>

      {/* Header */}
      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}>
        <p className="text-xs mb-2" style={{ color: "#64748b" }}>
          Shared by <span style={{ color: "#94a3b8" }}>{ownerName}</span>
        </p>
        <h1 className="text-2xl font-bold text-white mb-2 leading-snug">{session.taskTitle}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
            style={{ background: `${statusColor}18`, color: statusColor }}>
            {session.status}
          </span>
          {session.taskCategory && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
              style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
              {session.taskCategory}
            </span>
          )}
          <span className="text-xs" style={{ color: "#4a5568" }}>
            {format(new Date(session.startedAt), "MMMM d, yyyy · h:mm a")}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Planned", value: fmt(session.plannedDuration) },
          { label: "Actual", value: fmt(session.actualDuration) },
          { label: "Mood Before", value: session.moodBefore ? MOOD_MAP[session.moodBefore] : "—" },
          { label: "Mood After", value: session.moodAfter ? MOOD_MAP[session.moodAfter] : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}>
            <p className="text-xs mb-1" style={{ color: "#64748b" }}>{s.label}</p>
            <p className="text-lg font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}>
        <h2 className="text-sm font-semibold text-white mb-3">📝 Session Notes</h2>
        {session.notes?.trim() ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>
            {session.notes}
          </p>
        ) : (
          <p className="text-sm italic" style={{ color: "#4a5568" }}>No notes for this session.</p>
        )}
      </div>

      <p className="text-center text-xs mt-8" style={{ color: "#4a5568" }}>
        Track your deep work at{" "}
        <span style={{ color: "#6366f1" }}>deepwrk.app</span>
      </p>
    </div>
  );
}
