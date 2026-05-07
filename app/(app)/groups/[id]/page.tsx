"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Send, StickyNote, Users, X, UserPlus,
  Loader2, Crown, Mail, Search, ExternalLink, FileText,
} from "lucide-react";
import { format, isToday, isYesterday, differenceInMinutes } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GroupMember { userId?: string; email: string; name: string; joinedAt: string }
interface GroupInvite { email: string; invitedAt: string }
interface Group {
  _id: string; name: string; description?: string;
  ownerId: string; currentUserId: string;
  members: GroupMember[]; pendingInvites: GroupInvite[]; createdAt: string;
}
interface Message {
  _id: string; userId: string; userName: string;
  content: string; type: "text" | "note";
  noteId?: string; noteTitle?: string; shareToken?: string;
  createdAt: string;
}
interface Note { _id: string; title: string; content: string }

// ─── Helpers ───────────────────────────────────────────────────────────────────

function dateSeparatorLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
      style={{
        width: size, height: size,
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ─── Note Picker Modal ─────────────────────────────────────────────────────────

function NotePicker({ onSelect, onClose }: {
  onSelect: (note: Note) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Note[]) => setNotes(d))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()),
      )
    : notes;

  async function handleSelect(note: Note) {
    setSharing(note._id);
    onSelect(note);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="rounded-2xl w-full max-w-md overflow-hidden"
        style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45", maxHeight: "70vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e2d45" }}>
          <div className="flex items-center gap-2">
            <StickyNote size={16} style={{ color: "#818cf8" }} />
            <h3 className="text-sm font-semibold text-white">Share a Note</h3>
          </div>
          <button onClick={onClose} style={{ color: "#64748b" }}><X size={16} /></button>
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e2d45" }}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a5568" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="input-dark w-full rounded-lg pl-8 pr-3 py-2 text-xs"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 120px)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin" style={{ color: "#4a5568" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={28} className="mx-auto mb-2" style={{ color: "#2d4060" }} />
              <p className="text-xs" style={{ color: "#4a5568" }}>
                {search ? "No matching notes" : "No notes yet"}
              </p>
            </div>
          ) : (
            filtered.map((note) => (
              <button
                key={note._id}
                onClick={() => handleSelect(note)}
                disabled={sharing === note._id}
                className="w-full text-left px-5 py-3 transition-colors border-b flex items-start gap-3 disabled:opacity-60"
                style={{ borderColor: "#1e2d45" }}
              >
                <StickyNote size={14} className="mt-0.5 shrink-0" style={{ color: "#818cf8" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {note.title || <span style={{ color: "#4a5568" }}>Untitled</span>}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "#4a5568" }}>
                    {note.content.slice(0, 60) || "Empty note"}
                  </p>
                </div>
                {sharing === note._id && (
                  <Loader2 size={14} className="animate-spin shrink-0 mt-0.5" style={{ color: "#818cf8" }} />
                )}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Members Modal ─────────────────────────────────────────────────────────────

function MembersModal({ group, onClose, onUpdated }: {
  group: Group; onClose: () => void; onUpdated: (g: Group) => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isOwner = group.ownerId === group.currentUserId;

  async function handleInvite() {
    if (!email.trim() || loading) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await fetch(`/api/groups/${group._id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Failed");
      onUpdated((await res.json()) as Group);
      setSuccess(`Invite sent to ${email}`);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(memberEmail: string) {
    const res = await fetch(`/api/groups/${group._id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail }),
    });
    if (res.ok) onUpdated((await res.json()) as Group);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Members — {group.name}</h2>
          <button onClick={onClose} style={{ color: "#64748b" }}><X size={18} /></button>
        </div>

        {isOwner && (
          <>
            <div className="flex gap-2 mb-1">
              <input
                value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="Invite by email"
                className="input-dark flex-1 rounded-xl px-4 py-2.5 text-sm"
              />
              <button onClick={handleInvite} disabled={!email.trim() || loading}
                className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 shrink-0">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              </button>
            </div>
            {error && <p className="text-xs mb-3" style={{ color: "#fca5a5" }}>{error}</p>}
            {success && <p className="text-xs mb-3" style={{ color: "#6ee7b7" }}>{success}</p>}
          </>
        )}

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>
            Members ({group.members.length})
          </p>
          {group.members.map((m) => (
            <div key={m.email} className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{ background: "rgba(30,45,69,0.5)" }}>
              <Avatar name={m.name} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{m.name}</p>
                <p className="text-xs truncate" style={{ color: "#64748b" }}>{m.email}</p>
              </div>
              {group.members[0]?.email === m.email ? (
                <Crown size={14} style={{ color: "#f59e0b" }} />
              ) : isOwner ? (
                <button onClick={() => handleRemove(m.email)} style={{ color: "#64748b" }}
                  className="hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              ) : null}
            </div>
          ))}

          {group.pendingInvites.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider mt-4 mb-2" style={{ color: "#64748b" }}>
                Pending ({group.pendingInvites.length})
              </p>
              {group.pendingInvites.map((i) => (
                <div key={i.email} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px dashed #f59e0b30" }}>
                  <Mail size={14} style={{ color: "#f59e0b" }} className="shrink-0" />
                  <p className="text-sm flex-1 truncate" style={{ color: "#94a3b8" }}>{i.email}</p>
                  {isOwner && (
                    <button onClick={() => handleRemove(i.email)} style={{ color: "#64748b" }}
                      className="hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, isOwn, showHeader }: {
  message: Message; isOwn: boolean; showHeader: boolean;
}) {
  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — only shown on first of a group */}
      <div style={{ width: 32, flexShrink: 0 }}>
        {showHeader && !isOwn && <Avatar name={message.userName} size={32} />}
      </div>

      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {showHeader && (
          <span className="text-xs font-medium px-1" style={{ color: isOwn ? "#818cf8" : "#94a3b8" }}>
            {isOwn ? "You" : message.userName}
          </span>
        )}

        {message.type === "note" ? (
          /* Note share card */
          <div
            className="rounded-2xl px-4 py-3 text-sm"
            style={{
              backgroundColor: isOwn ? "rgba(99,102,241,0.15)" : "#1e2d3d",
              border: `1px solid ${isOwn ? "#6366f130" : "#1e2d45"}`,
              minWidth: 220,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={13} style={{ color: "#818cf8" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#818cf8" }}>
                Shared Note
              </span>
            </div>
            <p className="font-medium text-white mb-1">
              {message.noteTitle || "Untitled"}
            </p>
            {message.shareToken && (
              <Link
                href={`/shared/note/${message.shareToken}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs mt-1 transition-colors"
                style={{ color: "#6366f1" }}
                onClick={(e) => e.stopPropagation()}
              >
                Open Note <ExternalLink size={11} />
              </Link>
            )}
          </div>
        ) : (
          /* Text bubble */
          <div
            className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{
              backgroundColor: isOwn ? "rgba(99,102,241,0.2)" : "#1e2d3d",
              color: isOwn ? "#e0e7ff" : "#cbd5e1",
              border: `1px solid ${isOwn ? "#6366f130" : "#1e2d45"}`,
            }}
          >
            {message.content}
          </div>
        )}

        <span className="text-xs px-1" style={{ color: "#334155" }}>
          {format(new Date(message.createdAt), "h:mm a")}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GroupChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showNotePicker, setShowNotePicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const isAtBottomRef = useRef(true);

  // ── Fetch messages ─────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`/api/groups/${id}/messages`);
      if (!res.ok) return;
      const data = (await res.json()) as Message[];
      setMessages((prev) => {
        if (prev.length === data.length && prev[prev.length - 1]?._id === data[data.length - 1]?._id) {
          return prev; // no change
        }
        return data;
      });
    } catch { /* ignore */ } finally {
      if (!silent) setPageLoading(false);
    }
  }, [id]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const [gr] = await Promise.all([
          fetch(`/api/groups/${id}`).then((r) => (r.ok ? r.json() : null)),
          fetchMessages(),
        ]);
        if (!gr) { router.push("/groups"); return; }
        setGroup(gr as Group);
      } catch { router.push("/groups"); }
      finally { setPageLoading(false); }
    }
    void init();
  }, [id, router, fetchMessages]);

  // ── Polling every 3 s ─────────────────────────────────────────────────────
  useEffect(() => {
    pollRef.current = setInterval(() => void fetchMessages(true), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  // ── Auto-scroll to bottom when messages update ─────────────────────────────
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }

  // ── Send text message ──────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/groups/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, type: "text" }),
      });
      if (res.ok) {
        const msg = (await res.json()) as Message;
        setMessages((prev) => [...prev, msg]);
        isAtBottomRef.current = true;
      }
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  // ── Share note ─────────────────────────────────────────────────────────────
  async function handleNoteSelect(note: Note) {
    setShowNotePicker(false);
    try {
      const shareRes = await fetch(`/api/notes/${note._id}/share`, { method: "POST" });
      if (!shareRes.ok) return;
      const { shareUrl } = (await shareRes.json()) as { shareUrl: string };
      const token = shareUrl.split("/").pop() ?? "";

      const res = await fetch(`/api/groups/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: note.title,
          type: "note",
          noteId: note._id,
          noteTitle: note.title || "Untitled",
          shareToken: token,
        }),
      });
      if (res.ok) {
        const msg = (await res.json()) as Message;
        setMessages((prev) => [...prev, msg]);
        isAtBottomRef.current = true;
      }
    } catch { /* ignore */ }
  }

  // ── Key handler ────────────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 64px)" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#4a5568" }} />
      </div>
    );
  }

  if (!group) return null;

  // Build list with date separators and grouping metadata
  const enriched: Array<{ message: Message; showDateSep: boolean; showHeader: boolean }> = messages.map(
    (msg, i) => {
      const prev = messages[i - 1];
      const msgDate = new Date(msg.createdAt);
      const prevDate = prev ? new Date(prev.createdAt) : null;
      const showDateSep =
        !prevDate || msgDate.toDateString() !== prevDate.toDateString();
      const showHeader =
        showDateSep ||
        !prev ||
        prev.userId !== msg.userId ||
        differenceInMinutes(msgDate, new Date(prev.createdAt)) > 5;
      return { message: msg, showDateSep, showHeader };
    },
  );

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid #1e2d45", backgroundColor: "#0a0e1a" }}
      >
        <button
          onClick={() => router.push("/groups")}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 32, height: 32, color: "#64748b" }}
        >
          <ArrowLeft size={18} />
        </button>

        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 36, height: 36, background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          <Users size={16} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">{group.name}</h1>
          <p className="text-xs truncate" style={{ color: "#64748b" }}>
            {group.members.length} member{group.members.length !== 1 ? "s" : ""}
            {group.description ? ` · ${group.description}` : ""}
          </p>
        </div>

        <button
          onClick={() => setShowMembers(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0"
          style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid #6366f130" }}
        >
          <Users size={13} /> Members
        </button>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ backgroundColor: "#0d1117" }}
      >
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-3"
          >
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 56, height: 56, background: "rgba(99,102,241,0.1)", border: "1px solid #6366f130" }}
            >
              <Users size={24} style={{ color: "#818cf8" }} />
            </div>
            <p className="text-sm font-medium text-white">{group.name}</p>
            <p className="text-xs" style={{ color: "#4a5568" }}>
              Send the first message or share a note to get started.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-1.5 max-w-3xl mx-auto">
            {enriched.map(({ message, showDateSep, showHeader }) => (
              <div key={message._id}>
                {showDateSep && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px" style={{ background: "#1e2d45" }} />
                    <span className="text-xs px-3 py-1 rounded-full" style={{ color: "#4a5568", background: "#0a0e1a" }}>
                      {dateSeparatorLabel(new Date(message.createdAt))}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "#1e2d45" }} />
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isOwn={message.userId === group.currentUserId}
                  showHeader={showHeader}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 py-3"
        style={{ borderTop: "1px solid #1e2d45", backgroundColor: "#0a0e1a" }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-3 max-w-3xl mx-auto"
          style={{ backgroundColor: "#1a2236", border: "1px solid #1e2d45" }}
        >
          {/* Note share button */}
          <button
            onClick={() => setShowNotePicker(true)}
            title="Share a note"
            className="flex items-center justify-center rounded-xl transition-colors mb-0.5 shrink-0"
            style={{ width: 32, height: 32, color: "#64748b" }}
          >
            <StickyNote size={17} />
          </button>

          {/* Text input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the group… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm resize-none leading-relaxed"
            style={{ color: "#e2e8f0", maxHeight: 120, overflowY: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />

          {/* Send button */}
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || sending}
            className="flex items-center justify-center rounded-xl transition-all shrink-0 mb-0.5 disabled:opacity-40"
            style={{
              width: 32, height: 32,
              background: input.trim() ? "rgba(99,102,241,0.2)" : "transparent",
              color: input.trim() ? "#818cf8" : "#334155",
            }}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "#1e2d45" }}>
          Enter to send · Shift+Enter for newline · 📎 to share notes
        </p>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMembers && (
          <MembersModal
            group={group}
            onClose={() => setShowMembers(false)}
            onUpdated={(g) => setGroup((prev) => prev ? { ...g, currentUserId: prev.currentUserId } : prev)}
          />
        )}
        {showNotePicker && (
          <NotePicker onSelect={handleNoteSelect} onClose={() => setShowNotePicker(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
