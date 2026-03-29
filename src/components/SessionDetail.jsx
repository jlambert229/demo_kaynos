import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import VideoPlayer from "./VideoPlayer";
import NotesPanel from "./NotesPanel";
import AppIcon from "./AppIcon";
import ConfirmModal from "./ConfirmModal";
import { PageLoadingSkeleton } from "./PageLoading";
import { formatVideoClock } from "../utils/formatVideoTime";
import TagInput, { TagList } from "./TagInput";

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isInstructor } = useAuth();
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoSrc, setVideoSrc] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekRequest, setSeekRequest] = useState(null);
  const viewDebounce = useRef(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadSession = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    api.sessions
      .get(id)
      .then((d) => {
        if (cancelled) return;
        setSession(d.session);
        setLoading(false);

        if (d.session.video_key && d.session.video_status === "ready") {
          api.video
            .getPlaybackUrl("session", id)
            .then((r) => {
              if (!cancelled) setVideoSrc(r.url);
            })
            .catch(() => {
              if (!cancelled) toast.error("Could not load video. Try again later.");
            });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setSession(null);
          setLoadError(true);
          toast.error("Could not load session");
        }
      });
    return () => { cancelled = true; };
  }, [id, toast]);

  useEffect(() => {
    return loadSession();
  }, [loadSession]);

  const lastTrackedTime = useRef(0);

  const flushTrackView = useCallback(() => {
    if (viewDebounce.current) {
      clearTimeout(viewDebounce.current);
      viewDebounce.current = null;
    }
    if (lastTrackedTime.current > 0) {
      api.sessions
        .trackView({ sessionId: id, positionSeconds: Math.floor(lastTrackedTime.current) })
        .catch(() => {});
    }
  }, [id]);

  const trackView = useCallback(
    (time) => {
      lastTrackedTime.current = time;
      if (viewDebounce.current) clearTimeout(viewDebounce.current);
      viewDebounce.current = setTimeout(() => {
        api.sessions
          .trackView({
            sessionId: id,
            positionSeconds: Math.floor(time),
          })
          .catch(() => {});
      }, 15000);
    },
    [id]
  );

  const handleVideoEnded = useCallback(
    (time) => {
      if (viewDebounce.current) {
        clearTimeout(viewDebounce.current);
        viewDebounce.current = null;
      }
      api.sessions
        .trackView({ sessionId: id, positionSeconds: Math.floor(time), completed: true })
        .catch(() => {});
    },
    [id]
  );

  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === "hidden") flushTrackView();
    };
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      flushTrackView();
    };
  }, [flushTrackView]);

  const handleTimeUpdate = useCallback(
    (time) => {
      setCurrentTime(time);
      trackView(time);
    },
    [trackView]
  );

  const handleAddNote = async (note) => {
    const data = await api.notes.addToSession(id, note);
    setSession((prev) => ({ ...prev, notes: [...prev.notes, data.note] }));
  };

  const handleDeleteNote = async (noteId) => {
    await api.notes.delete(noteId);
    setSession((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }));
  };

  const handleEditNote = async (noteId, updates) => {
    const data = await api.notes.update(noteId, updates);
    setSession((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === noteId ? data.note : n)),
    }));
  };

  const handleSeek = (seconds) => {
    setCurrentTime(seconds);
    setSeekRequest((r) => ({ token: (r?.token ?? 0) + 1, seconds }));
    if (session?.vimeo_id && !videoSrc) {
      toast.info(`Jump to ${formatClock(seconds)} in the Vimeo player (notes use separate timestamps).`);
    }
  };

  if (loading) return <PageLoadingSkeleton />;
  if (!session) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="icon"><AppIcon name="martial-arts-uniform" size={36} /></div>
          <p>{loadError ? "Could not load session" : "Session not found"}</p>
          {loadError && (
            <button type="button" className="btn-primary" style={{ marginTop: 12 }} onClick={loadSession}>
              Try again
            </button>
          )}
          <Link to="/sessions" className="detail-back" style={{ marginTop: 8 }}>← Back to sessions</Link>
        </div>
      </div>
    );
  }

  const backUrl =
    isInstructor && session.student_id ? `/students/${session.student_id}/sessions` : "/sessions";

  const hasVideo = !!(videoSrc || session.vimeo_id);

  const noteCount = (session.notes || []).length;

  const copySessionLink = async () => {
    const url = `${window.location.origin}/sessions/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Session link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const copyNotesText = async () => {
    const notes = session.notes || [];
    if (notes.length === 0) return;
    const lines = notes.map((n) => {
      const who = n.author_name ? `${n.author_name}: ` : "";
      return `[${formatVideoClock(n.timestamp_seconds)}] ${who}${n.text}`;
    });
    const header = `${session.title} (${new Date(session.date).toLocaleDateString("en-US")})\n\n`;
    try {
      await navigator.clipboard.writeText(header + lines.join("\n"));
      toast.success("Notes copied as plain text");
    } catch {
      toast.error("Could not copy notes");
    }
  };

  const exportSession = () => {
    const notes = session.notes || [];
    const dateFormatted = new Date(session.date).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const lines = [
      `SESSION EXPORT`,
      `${"=".repeat(50)}`,
      ``,
      `Title:      ${session.title}`,
      `Date:       ${dateFormatted}`,
      `Student:    ${session.student_name || "N/A"}`,
      `Instructor: ${session.instructor_name || "N/A"}`,
    ];
    if (session.tags?.length > 0) {
      lines.push(`Tags:       ${session.tags.join(", ")}`);
    }
    lines.push(`Video:      ${session.video_status === "ready" ? "Yes (uploaded)" : session.vimeo_id ? `Vimeo (${session.vimeo_id})` : "None"}`);
    lines.push(`Created:    ${new Date(session.created_at).toLocaleString("en-US")}`);
    lines.push(``, `${"=".repeat(50)}`, `NOTES (${notes.length})`, `${"-".repeat(50)}`);

    if (notes.length === 0) {
      lines.push(`No notes for this session.`);
    } else {
      notes.forEach((n) => {
        const who = n.author_name ? ` (${n.author_name}${n.author_role ? ", " + n.author_role : ""})` : "";
        lines.push(`[${formatVideoClock(n.timestamp_seconds)}]${who}`);
        lines.push(`  ${n.text}`);
        lines.push(``);
      });
    }

    lines.push(`${"-".repeat(50)}`, `Exported from Kaynos on ${new Date().toLocaleString("en-US")}`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const slug = session.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `session-${slug}-${session.date}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Session exported");
  };

  const startEdit = () => {
    setEditTitle(session.title);
    setEditDate(session.date?.slice(0, 10) || "");
    setEditTags(session.tags || []);
    setEditing(true);
    setShowDeleteConfirm(false);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const data = await api.sessions.update(id, { title: editTitle, date: editDate, tags: editTags });
      setSession((prev) => ({ ...prev, ...data.session }));
      setEditing(false);
      toast.success("Session updated");
    } catch (err) {
      toast.error(err.message || "Failed to update session");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await api.sessions.delete(id);
      toast.success("Session deleted");
      navigate(backUrl);
    } catch (err) {
      toast.error(err.message || "Failed to delete session");
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await api.sessions.create({
        studentId: session.student_id,
        title: session.title,
        date: today,
      });
      toast.success("Session duplicated");
      navigate(`/sessions/${data.session.id}`);
    } catch (err) {
      toast.error(err.message || "Could not duplicate session");
    }
  };

  return (
    <div className={hasVideo ? "detail-yt-layout" : ""}>
      {hasVideo && (
        <div className="detail-yt-video">
          <VideoPlayer
            src={videoSrc}
            vimeoId={session.vimeo_id}
            notes={session.notes || []}
            onTimeUpdate={handleTimeUpdate}
            onAddNote={handleAddNote}
            onEnded={handleVideoEnded}
            seekRequest={seekRequest}
            title={session.title}
          />
        </div>
      )}

      <div className="detail-yt-content">
        <div className="detail-yt-header">
          <Link to={backUrl} className="detail-back">
            ← Back
          </Link>
          {editing ? (
            <div className="detail-edit-form">
              <input
                className="admin-inline-input detail-edit-title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Session title"
              />
              <input
                className="admin-inline-input detail-edit-date-input"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
              <div style={{ marginTop: 8 }}>
                <TagInput tags={editTags} onChange={setEditTags} placeholder="Add tags..." />
              </div>
              <div className="detail-edit-actions">
                <button type="button" className="btn-primary detail-action-btn" onClick={saveEdit} disabled={saving || !editTitle.trim()}>
                  {saving ? "Saving..." : "Save"}
                </button>
                <button type="button" className="btn-secondary detail-action-btn" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="detail-title-row">
                <div className="page-title">{session.title}</div>
                {isInstructor && (
                  <div className="detail-manage-actions">
                    <button type="button" className="detail-manage-btn" onClick={handleDuplicate} title="Duplicate session">
                      <AppIcon name="clipboard" size={15} />
                    </button>
                    <button type="button" className="detail-manage-btn" onClick={startEdit} title="Edit session">
                      <AppIcon name="pencil" size={15} />
                    </button>
                    <button type="button" className="detail-manage-btn detail-manage-btn-danger" onClick={() => { setShowDeleteConfirm(true); setEditing(false); }} title="Delete session">
                      <AppIcon name="cross-mark" size={15} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="detail-yt-meta">
            <span>
              {new Date(session.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {isInstructor && session.student_name && <span>{session.student_name}</span>}
            {!isInstructor && session.instructor_name && <span>Coach {session.instructor_name}</span>}
            {noteCount > 0 && <span>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>}
          </div>
          <div className="detail-share-row">
            <button type="button" className="btn-secondary detail-share-btn" onClick={copySessionLink}>
              <AppIcon name="clipboard" size={16} />
              Copy link
            </button>
            {noteCount > 0 && (
              <button type="button" className="btn-secondary detail-share-btn" onClick={copyNotesText}>
                <AppIcon name="memo" size={16} />
                Copy notes
              </button>
            )}
            <button type="button" className="btn-secondary detail-share-btn" onClick={exportSession}>
              <AppIcon name="open-file-folder" size={16} />
              Export
            </button>
          </div>
          {session.tags?.length > 0 && !editing && (
            <div style={{ marginTop: 8 }}>
              <TagList tags={session.tags} />
            </div>
          )}
        </div>

        {!hasVideo && (
          <div className="detail-yt-body">
            <VideoPlayer
              src={videoSrc}
              vimeoId={session.vimeo_id}
              notes={session.notes || []}
              onTimeUpdate={handleTimeUpdate}
              onAddNote={handleAddNote}
              onEnded={handleVideoEnded}
              seekRequest={seekRequest}
              title={session.title}
            />
          </div>
        )}

        <div className="detail-yt-notes">
          <div className="detail-yt-notes-header">
            <h4>Notes <span className="detail-yt-notes-count">{noteCount}</span></h4>
          </div>
          <NotesPanel
            notes={session.notes || []}
            currentTime={currentTime}
            onSeek={handleSeek}
            onDelete={handleDeleteNote}
            onEdit={handleEditNote}
            isInstructor={isInstructor}
            currentUserId={user.id}
          />
        </div>
      </div>
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Session"
          message={`Delete "${session.title}"? This removes the session, video, and all notes permanently.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

function formatClock(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
