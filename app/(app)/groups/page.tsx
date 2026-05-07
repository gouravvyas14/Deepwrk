"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, UserPlus, Loader2, Crown, Clock, Mail, MessageSquare } from "lucide-react";

interface GroupMember { userId?: string; email: string; name: string; joinedAt: string }
interface GroupInvite { email: string; invitedAt: string }
interface Group {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: GroupMember[];
  pendingInvites: GroupInvite[];
  createdAt: string;
}

// ─── Create Group Modal ────────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Group) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
      onCreated((await res.json()) as Group);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
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
        className="rounded-2xl p-6 w-full max-w-md"
        style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Create Group</h2>
          <button onClick={onClose} style={{ color: "#64748b" }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Group name *</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Study Group, Dev Squad"
              className="input-dark w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>Description <span style={{ opacity: 0.5 }}>(optional)</span></label>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group for?"
              className="input-dark w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-xs mt-3" style={{ color: "#fca5a5" }}>{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#0f172a", color: "#94a3b8", border: "1px solid #1e2d45" }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim() || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white btn-gradient disabled:opacity-40">
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Create Group"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ group, onClose, onUpdated }: { group: Group; onClose: () => void; onUpdated: (g: Group) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleInvite() {
    if (!email.trim() || loading) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await fetch(`/api/groups/${group._id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
      const updated = (await res.json()) as Group;
      setSuccess(`Invite sent to ${email}`);
      setEmail("");
      onUpdated(updated);
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
          <h2 className="text-lg font-semibold text-white">Manage Members — {group.name}</h2>
          <button onClick={onClose} style={{ color: "#64748b" }}><X size={18} /></button>
        </div>

        {/* Invite input */}
        <div className="flex gap-2 mb-1">
          <input
            value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            placeholder="Enter email to invite"
            className="input-dark flex-1 rounded-xl px-4 py-2.5 text-sm"
          />
          <button onClick={handleInvite} disabled={!email.trim() || loading}
            className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 shrink-0">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          </button>
        </div>
        {error && <p className="text-xs mb-3" style={{ color: "#fca5a5" }}>{error}</p>}
        {success && <p className="text-xs mb-3" style={{ color: "#6ee7b7" }}>{success}</p>}

        {/* Members list */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>
            Members ({group.members.length})
          </p>
          {group.members.map((m) => (
            <div key={m.email} className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{ background: "rgba(30,45,69,0.5)" }}>
              <div className="flex items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {m.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{m.name}</p>
                <p className="text-xs truncate" style={{ color: "#64748b" }}>{m.email}</p>
              </div>
              {group.members[0]?.email === m.email ? (
                <Crown size={14} style={{ color: "#f59e0b" }} />
              ) : (
                <button onClick={() => handleRemove(m.email)} style={{ color: "#64748b" }}
                  className="hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          {/* Pending invites */}
          {group.pendingInvites.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider mt-4 mb-2" style={{ color: "#64748b" }}>
                Pending Invites ({group.pendingInvites.length})
              </p>
              {group.pendingInvites.map((i) => (
                <div key={i.email} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px dashed #f59e0b30" }}>
                  <Mail size={14} style={{ color: "#f59e0b" }} className="shrink-0" />
                  <p className="text-sm flex-1 truncate" style={{ color: "#94a3b8" }}>{i.email}</p>
                  <button onClick={() => handleRemove(i.email)} style={{ color: "#64748b" }}
                    className="hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Group Card ────────────────────────────────────────────────────────────────

function GroupCard({
  group, currentUserId, onInvite, onUpdated,
}: {
  group: Group; currentUserId: string; onInvite: (g: Group) => void; onUpdated: (g: Group) => void;
}) {
  const router = useRouter();
  const isOwner = group.ownerId === currentUserId;

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => router.push(`/groups/${group._id}`)}
      className="rounded-2xl p-5 cursor-pointer transition-all"
      style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 40, height: 40, background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{group.name}</h3>
            {group.description && (
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); onInvite(group); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid #6366f130" }}
            >
              <UserPlus size={12} /> Invite
            </button>
          )}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid #10b98120" }}>
            <MessageSquare size={12} /> Open
          </div>
        </div>
      </div>

      {/* Members avatars */}
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        {group.members.map((m) => (
          <div key={m.email} title={m.name}
            className="flex items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ width: 28, height: 28, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", flexShrink: 0 }}>
            {m.name[0]?.toUpperCase()}
          </div>
        ))}
        {group.pendingInvites.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
            +{group.pendingInvites.length} pending
          </span>
        )}
        <span className="text-xs ml-1" style={{ color: "#64748b" }}>
          {group.members.length} member{group.members.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center gap-1 mt-3" style={{ color: "#4a5568" }}>
        <Clock size={11} />
        <span className="text-xs">
          Created {new Date(group.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<Group | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const fetchGroups = useCallback(async () => {
    try {
      const [gr, pr] = await Promise.all([
        fetch("/api/groups").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/user/profile").then((r) => (r.ok ? r.json() : null)),
      ]);
      setGroups(Array.isArray(gr) ? gr : []);
      if (pr?._id) setCurrentUserId(pr._id as string);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  function handleCreated(g: Group) {
    setGroups((prev) => [g, ...prev]);
    setShowCreate(false);
  }

  function handleUpdated(updated: Group) {
    setGroups((prev) => prev.map((g) => (g._id === updated._id ? updated : g)));
    setInviteTarget(updated);
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto" style={{ backgroundColor: "#0A0E1A" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Groups</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>Focus together with your team</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
        >
          <Plus size={15} /> New Group
        </button>
      </motion.div>

      {/* Groups grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl p-5 h-28" style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}>
              <div className="skeleton h-5 w-40 mb-3" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: "#1A2236", border: "1px solid #1E2D45" }}
        >
          <Users size={36} className="mx-auto mb-4" style={{ color: "#4a5568" }} />
          <h3 className="text-lg font-semibold text-white mb-2">No groups yet</h3>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>
            Create a group and invite teammates by email to focus together.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold text-white">
            Create your first group
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {groups.map((g) => (
              <GroupCard
                key={g._id} group={g} currentUserId={currentUserId}
                onInvite={setInviteTarget}
                onUpdated={handleUpdated}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
        {inviteTarget && (
          <InviteModal
            group={inviteTarget}
            onClose={() => setInviteTarget(null)}
            onUpdated={handleUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
