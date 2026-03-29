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

function formatClock(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isInstructor } = useAuth();
  const toast = useToast();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoSrc, setVideoSrc] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekRequest, setSeekRequest] = useState(null);
  const viewDebounce = useRef(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadClass = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    api.classes
      .get(id)
      .then((d) => {
        if (cancelled) return;
        setCls(d.class);
        setLoading(false);

        if (d.class.video_key && d.class.video_status === "ready") {
          api.video
            .getPlaybackUrl("class", id)
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
          setCls(null);
          setLoadError(true);
          toast.error("Could not load class");
        }
      });
    return () => { cancelled = true; };
  }, [id, toast]);

  useEffect(() => {
    return loadClass();
  }, [loadClass]);

  const trackView = useCallback(
    (time) => {
      if (viewDebounce.current) clearTimeout(viewDebounce.current);
      viewDebounce.current = setTimeout(() => {
        api.classes
          .trackView({ classId: id, positionSeconds: Math.floor(time) })
          .catch(() => {});
      }, 15000);
    },
    [id]
  );

  useEffect(() => {
    return () => {
      if (viewDebounce.current) clearTimeout(viewDebounce.current);
    };
  }, []);

  const handleTimeUpdate = useCallback(
    (time) => {
      setCurrentTime(time);
      trackView(time);
    },
    [trackView]
  );

  const handleEnded = useCallback(() => {
    api.classes
      .trackView({ classId: id, positionSeconds: 0, completed: true })
      .catch(() => {});
  }, [id]);

  const handleAddNote = async (note) => {
    const data = await api.notes.addToClass(id, note);
    setCls((prev) => ({ ...prev, notes: [...prev.notes, data.note] }));
  };

  const handleDeleteNote = async (noteId) => {
    await api.notes.delete(noteId);
    setCls((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }));
  };

  const handleEditNote = async (noteId, updates) => {
    const data = await api.notes.update(noteId, updates);
    setCls((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === noteId ? data.note : n)),
    }));
  };

  const handleSeek = (seconds) => {
    setCurrentTime(seconds);
    setSeekRequest((r) => ({ token: (r?.token ?? 0) + 1, seconds }));
    if (cls?.vimeo_id && !videoSrc) {
      toast.info(`Jump to ${formatClock(seconds)} in the Vimeo player (notes use separate timestamps).`);
    }
  };

  if (loading) return <PageLoadingSkeleton />;
  if (!cls) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="icon"><AppIcon name="martial-arts-uniform" size={36} /></div>
          <p>{loadError ? "Could not load class" : "Class not found"}</p>
          {loadError && (
            <button type="button" className="btn-primary" style={{ marginTop: 12 }} onClick={loadClass}>
              Try again
            </button>
          )}
          <Link to="/classes" className="detail-back" style={{ marginTop: 8 }}>← Back to classes</Link>
        </div>
      </div>
    );
  }

  const hasVideo = !!(videoSrc || cls.vimeo_id);
  const noteCount = (cls.notes || []).length;

  const copyClassLink = async () => {
    const url = `${window.location.origin}/classes/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Class link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const copyClassNotes = async () => {
    const notes = cls.notes || [];
    if (notes.length === 0) return;
    const lines = notes.map((n) => {
      const who = n.author_name ? `${n.author_name}: ` : "";
      return `[${formatVideoClock(n.timestamp_seconds)}] ${who}${n.text}`;
    });
    const header = `${cls.title} (${new Date(cls.date).toLocaleDateString("en-US")})\n\n`;
    try {
      await navigator.clipboard.writeText(header + lines.join("\n"));
      toast.success("Notes copied as plain text");
    } catch {
      toast.error("Could not copy notes");
    }
  };

  const exportClass = () => {
    const notes = cls.notes || [];
    const dateFormatted = new Date(cls.date).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const lines = [
      `CLASS EXPORT`,
      `${"=".repeat(50)}`,
      ``,
      `Title:       ${cls.title}`,
      `Date:        ${dateFormatted}`,
      `Instructor:  ${cls.instructor_name || "N/A"}`,
    ];
    if (cls.description) {
      lines.push(`Description: ${cls.description}`);
    }
    if (cls.tags?.length > 0) {
      lines.push(`Tags:        ${cls.tags.join(", ")}`);
    }
    lines.push(`Video:       ${cls.video_status === "ready" ? "Yes (uploaded)" : cls.vimeo_id ? `Vimeo (${cls.vimeo_id})` : "None"}`);
    lines.push(`Created:     ${new Date(cls.created_at).toLocaleString("en-US")}`);
    lines.push(``, `${"=".repeat(50)}`, `NOTES (${notes.length})`, `${"-".repeat(50)}`);

    if (notes.length === 0) {
      lines.push(`No notes for this class.`);
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
    const slug = cls.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `class-${slug}-${cls.date}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Class exported");
  };

  const startEdit = () => {
    setEditTitle(cls.title);
    setEditDate(cls.date?.slice(0, 10) || "");
    setEditDescription(cls.description || "");
    setEditTags(cls.tags || []);
    setEditing(true);
    setShowDeleteConfirm(false);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const data = await api.classes.update(id, { title: editTitle, date: editDate, description: editDescription, tags: editTags });
      setCls((prev) => ({ ...prev, ...data.class }));
      setEditing(false);
      toast.success("Class updated");
    } catch (err) {
      toast.error(err.message || "Failed to update class");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await api.classes.delete(id);
      toast.success("Class deleted");
      navigate("/classes");
    } catch (err) {
      toast.error(err.message || "Failed to delete class");
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await api.classes.create({
        title: cls.title,
        date: today,
        description: cls.description || "",
      });
      toast.success("Class duplicated");
      navigate(`/classes/${data.class.id}`);
    } catch (err) {
      toast.error(err.message || "Could not duplicate class");
    }
  };

  return (
    <div className={hasVideo ? "detail-yt-layout" : ""}>
      {hasVideo && (
        <div className="detail-yt-video">
          <VideoPlayer
            src={videoSrc}
            vimeoId={cls.vimeo_id}
            notes={cls.notes || []}
            onTimeUpdate={handleTimeUpdate}
            onAddNote={handleAddNote}
            onEnded={handleEnded}
            seekRequest={seekRequest}
            title={cls.title}
          />
        </div>
      )}

      <div className="detail-yt-content">
        <div className="detail-yt-header">
          <Link to="/classes" className="detail-back">← Back</Link>
          {editing ? (
            <div className="detail-edit-form">
              <input
                className="admin-inline-input detail-edit-title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Class title"
              />
              <input
                className="admin-inline-input detail-edit-date-input"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
              <textarea
                className="admin-inline-input detail-edit-description-input"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
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
                <div className="page-title">{cls.title}</div>
                {isInstructor && (
                  <div className="detail-manage-actions">
                    <button type="button" className="detail-manage-btn" onClick={handleDuplicate} title="Duplicate class">
                      <AppIcon name="clipboard" size={15} />
                    </button>
                    <button type="button" className="detail-manage-btn" onClick={startEdit} title="Edit class">
                      <AppIcon name="pencil" size={15} />
                    </button>
                    <button type="button" className="detail-manage-btn detail-manage-btn-danger" onClick={() => { setShowDeleteConfirm(true); setEditing(false); }} title="Delete class">
                      <AppIcon name="cross-mark" size={15} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="detail-yt-meta">
            <span>
              {new Date(cls.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {cls.instructor_name && <span>{cls.instructor_name}</span>}
            {noteCount > 0 && <span>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>}
          </div>
          <div className="detail-share-row">
            <button type="button" className="btn-secondary detail-share-btn" onClick={copyClassLink}>
              <AppIcon name="clipboard" size={16} />
              Copy link
            </button>
            {noteCount > 0 && (
              <button type="button" className="btn-secondary detail-share-btn" onClick={copyClassNotes}>
                <AppIcon name="memo" size={16} />
                Copy notes
              </button>
            )}
            <button type="button" className="btn-secondary detail-share-btn" onClick={exportClass}>
              <AppIcon name="open-file-folder" size={16} />
              Export
            </button>
          </div>
          {!editing && cls.description && (
            <p className="detail-yt-description">{cls.description}</p>
          )}
          {cls.tags?.length > 0 && !editing && (
            <div style={{ marginTop: 8 }}>
              <TagList tags={cls.tags} />
            </div>
          )}
        </div>

        {!hasVideo && (
          <div className="detail-yt-body">
            <VideoPlayer
              src={videoSrc}
              vimeoId={cls.vimeo_id}
              notes={cls.notes || []}
              onTimeUpdate={handleTimeUpdate}
              onAddNote={handleAddNote}
              onEnded={handleEnded}
              seekRequest={seekRequest}
              title={cls.title}
            />
          </div>
        )}

        <div className="detail-yt-notes">
          <div className="detail-yt-notes-header">
            <h4>Notes <span className="detail-yt-notes-count">{noteCount}</span></h4>
          </div>
          <NotesPanel
            notes={cls.notes || []}
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
          title="Delete Class"
          message={`Delete "${cls.title}"? This removes the class, video, and all notes permanently.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
