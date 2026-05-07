"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Share2, Check, StickyNote,
  Search, Clock,
} from "lucide-react";
import { format } from "date-fns";

interface Note {
  _id: string;
  title: string;
  content: string;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

const AUTOSAVE_DELAY = 1200; // ms

// ─── Sidebar: list of notes ────────────────────────────────────────────────────

function NoteList({
  notes, activeId, onSelect, onNew, search, onSearch,
}: {
  notes: Note[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ borderRight: "1px solid #1e2d45" }}>
      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid #1e2d45" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Notes</h2>
          <button onClick={onNew}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium btn-gradient text-white">
            <Plus size={12} /> New
          </button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a5568" }} />
          <input
            value={search} onChange={(e) => onSearch(e.target.value)}
            placeholder="Search notes…"
            className="input-dark w-full rounded-lg pl-8 pr-3 py-2 text-xs"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <StickyNote size={28} className="mb-2" style={{ color: "#2d4060" }} />
            <p className="text-xs" style={{ color: "#4a5568" }}>
              {search ? "No matching notes" : "No notes yet — create one"}
            </p>
          </div>
        )}
        {notes.map((n) => (
          <button key={n._id} onClick={() => onSelect(n._id)}
            className="w-full text-left px-4 py-3 transition-colors border-b"
            style={{
              borderColor: "#1e2d45",
              background: activeId === n._id ? "rgba(99,102,241,0.1)" : "transparent",
            }}
          >
            <p className="text-sm font-medium truncate text-white leading-snug">
              {n.title || <span style={{ color: "#4a5568" }}>Untitled</span>}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: "#4a5568" }}>
              {n.content.slice(0, 60) || "Empty note"}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={9} style={{ color: "#334155" }} />
              <span className="text-xs" style={{ color: "#334155" }}>
                {format(new Date(n.updatedAt), "MMM d, h:mm a")}
              </span>
              {n.shareToken && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>
                  Shared
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Editor ────────────────────────────────────────────────────────────────────

function NoteEditor({
  note, onSave, onDelete,
}: {
  note: Note;
  onSave: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setSaving(false);
  }, [note._id]);  // Only reset on note ID change, not on every note update

  function scheduleAutosave(newTitle: string, newContent: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    saveTimerRef.current = setTimeout(() => {
      onSave(note._id, newTitle, newContent);
      setSaving(false);
    }, AUTOSAVE_DELAY);
  }

  async function handleShare() {
    setSharing(true);
    try {
      const res = await fetch(`/api/notes/${note._id}/share`, { method: "POST" });
      if (res.ok) {
        const { shareUrl } = (await res.json()) as { shareUrl: string };
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: "1px solid #1e2d45" }}>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs" style={{ color: "#4a5568" }}>Saving…</span>}
          {!saving && <span className="text-xs" style={{ color: "#2d4060" }}>Auto-saved</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} disabled={sharing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: copied ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.1)",
              color: copied ? "#10b981" : "#818cf8",
              border: `1px solid ${copied ? "#10b98130" : "#6366f120"}`,
            }}>
            {copied ? <Check size={12} /> : <Share2 size={12} />}
            {copied ? "Copied!" : sharing ? "…" : "Share Link"}
          </button>
          <button onClick={() => onDelete(note._id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid #ef444420" }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); scheduleAutosave(e.target.value, content); }}
        placeholder="Note title…"
        className="w-full px-6 py-4 text-2xl font-bold bg-transparent outline-none text-white placeholder:text-[#2d4060] border-b"
        style={{ borderColor: "#1e2d45" }}
      />

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); scheduleAutosave(title, e.target.value); }}
        placeholder="Start writing…"
        className="flex-1 w-full px-6 py-4 bg-transparent outline-none text-sm leading-relaxed resize-none"
        style={{ color: "#94a3b8" }}
      />

      {/* Footer */}
      <div className="px-6 py-2 text-xs" style={{ color: "#2d4060", borderTop: "1px solid #1e2d45" }}>
        Last edited {format(new Date(note.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
        {note.shareToken && (
          <span className="ml-3 px-2 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
            Public link active
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const activeNote = notes.find((n) => n._id === activeId) ?? null;
  const filtered = search
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()),
      )
    : notes;

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = (await res.json()) as Note[];
        setNotes(data);
        if (data.length && !activeId) setActiveId(data[0]._id);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => { fetchNotes(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleNew() {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", content: "" }),
      });
      if (res.ok) {
        const note = (await res.json()) as Note;
        setNotes((prev) => [note, ...prev]);
        setActiveId(note._id);
      }
    } catch { /* ignore */ }
  }

  async function handleSave(id: string, title: string, content: string) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const updated = (await res.json()) as Note;
        setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
      }
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n._id !== id));
    setActiveId((prev) => {
      if (prev !== id) return prev;
      const remaining = notes.filter((n) => n._id !== id);
      return remaining[0]?._id ?? null;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0A0E1A" }}>
        <div className="skeleton h-5 w-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#0A0E1A" }}>
      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col" style={{ backgroundColor: "#0a0e1a" }}>
        <NoteList
          notes={filtered}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={handleNew}
          search={search}
          onSearch={setSearch}
        />
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ backgroundColor: "#0d1117" }}>
        <AnimatePresence mode="wait">
          {activeNote ? (
            <motion.div key={activeNote._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full flex flex-col">
              <NoteEditor note={activeNote} onSave={handleSave} onDelete={handleDelete} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-4">
              <StickyNote size={40} style={{ color: "#2d4060" }} />
              <p style={{ color: "#4a5568" }} className="text-sm">
                {notes.length ? "Select a note" : "Create your first note"}
              </p>
              <button onClick={handleNew}
                className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold text-white">
                <Plus size={14} className="inline mr-1" /> New Note
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
