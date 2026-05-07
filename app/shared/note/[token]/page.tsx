import { connectDB } from "@/lib/db";
import NoteModel from "@/models/Note";
import { format } from "date-fns";
import { StickyNote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SharedNotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  await connectDB();
  const note = await NoteModel.findOne({ shareToken: token }).lean() as {
    title?: string;
    content?: string;
    updatedAt?: Date;
  } | null;

  if (!note) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ backgroundColor: "#0A0E1A" }}
      >
        <StickyNote size={40} style={{ color: "#2d4060" }} />
        <p className="text-sm" style={{ color: "#4a5568" }}>
          This note is not available or the link has expired.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0E1A" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 28,
              height: 28,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            }}
          >
            <StickyNote size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#64748b" }}>
            Shared via Deepwrk
          </span>
        </div>

        {/* Note content */}
        <article>
          <h1
            className="text-3xl font-bold mb-6 leading-tight"
            style={{ color: "#f1f5f9" }}
          >
            {note.title || <span style={{ color: "#2d4060" }}>Untitled</span>}
          </h1>

          <div
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "#94a3b8" }}
          >
            {note.content || <span style={{ color: "#2d4060" }}>This note is empty.</span>}
          </div>
        </article>

        {/* Footer */}
        {note.updatedAt && (
          <p className="mt-10 text-xs" style={{ color: "#2d4060" }}>
            Last edited {format(new Date(note.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </div>
    </div>
  );
}
