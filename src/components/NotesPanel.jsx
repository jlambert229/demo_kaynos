import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "./Toast";
import AppIcon from "./AppIcon";
import { formatVideoClock } from "../utils/formatVideoTime";

function NotesPanelInner({
  notes = [],
  currentTime = 0,
  onSeek,
  onDelete,
  onEdit,
  isInstructor,
  currentUserId,
}) {
  const activeRef = useRef(null);
  const editAreaRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editTimestampSeconds, setEditTimestampSeconds] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [noteFilter, setNoteFilter] = useState("all");
  const [noteSearch, setNoteSearch] = useState("");
  const toast = useToast();

  const sorted = useMemo(
    () => [...notes].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds),
    [notes]
  );

  const filtered = useMemo(() => {
    let list = sorted;
    if (noteFilter === "coach") list = list.filter((n) => n.author_role === "instructor" || n.author_role === "admin");
    if (noteFilter === "mine") list = list.filter((n) => n.author_id === currentUserId);
    if (noteSearch.trim()) {
      const q = noteSearch.toLowerCase();
      list = list.filter((n) => n.text.toLowerCase().includes(q));
    }
    return list;
  }, [sorted, noteFilter, currentUserId, noteSearch]);

  const activeId = useMemo(() => {
    let id = null;
    for (const n of sorted) {
      if (n.timestamp_seconds <= currentTime + 0.5) id = n.id;
    }
    return id;
  }, [sorted, currentTime]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeId]);

  useEffect(() => {
    if (editingId && editAreaRef.current) {
      const ta = editAreaRef.current.querySelector("textarea");
      ta?.focus();
      ta?.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, [editingId]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
    setEditTimestampSeconds(0);
  }, []);

  const handleStartEdit = useCallback((note) => {
    setEditingId(note.id);
    setEditText(note.text);
    setEditTimestampSeconds(Math.max(0, Math.floor(Number(note.timestamp_seconds) || 0)));
  }, []);

  const handleSaveEdit = useCallback(
    async (noteId) => {
      const text = editText.trim();
      if (!text) return;
      const ts = Math.max(0, Math.floor(Number(editTimestampSeconds) || 0));
      try {
        await onEdit?.(noteId, { text, timestampSeconds: ts });
        cancelEdit();
      } catch (err) {
        toast.error(err.message || "Could not update");
      }
    },
    [editText, editTimestampSeconds, onEdit, toast, cancelEdit]
  );

  const handleDelete = useCallback(
    async (noteId) => {
      try {
        await onDelete?.(noteId);
      } catch (err) {
        toast.error(err.message || "Could not delete");
      }
    },
    [onDelete, toast]
  );

  const saveHint =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
      ? "⌘+Enter save"
      : "Ctrl+Enter save";

  if (!sorted.length) {
    return (
      <div className="np-empty">
        <div className="np-empty-icon"><AppIcon name="memo" size={36} /></div>
        <p>No notes yet</p>
        <p className="np-empty-hint">
          Press <kbd>N</kbd> during playback to add a note
        </p>
      </div>
    );
  }

  return (
    <>
      {sorted.length > 1 && (
        <div className="np-filters" role="group" aria-label="Filter notes">
          <button type="button" className={`np-filter-chip ${noteFilter === "all" ? "active" : ""}`} onClick={() => setNoteFilter("all")}>
            All <span className="chip-count">{sorted.length}</span>
          </button>
          <button type="button" className={`np-filter-chip ${noteFilter === "coach" ? "active" : ""}`} onClick={() => setNoteFilter("coach")}>
            Coach <span className="chip-count">{sorted.filter((n) => n.author_role === "instructor" || n.author_role === "admin").length}</span>
          </button>
          <button type="button" className={`np-filter-chip ${noteFilter === "mine" ? "active" : ""}`} onClick={() => setNoteFilter("mine")}>
            Mine <span className="chip-count">{sorted.filter((n) => n.author_id === currentUserId).length}</span>
          </button>
        </div>
      )}
      {sorted.length > 3 && (
        <input
          type="text"
          className="np-search"
          placeholder="Search notes..."
          value={noteSearch}
          onChange={(e) => setNoteSearch(e.target.value)}
          aria-label="Search notes"
        />
      )}
      <div className="np-list" role="list" aria-label="Video notes">
        {filtered.map((note) => {
          const isActive = note.id === activeId;
          const isOwn = note.author_id === currentUserId;
          const canEdit = isInstructor || isOwn;
          const isEditing = editingId === note.id;

          return (
            <article
              key={note.id}
              ref={isActive ? activeRef : null}
              className={`np-note ${isActive ? "np-active" : ""} ${isEditing ? "np-note-editing" : ""}`}
              role="listitem"
            >
              <div className="np-note-header">
                <button
                  type="button"
                  className="np-timestamp"
                  onClick={() => onSeek?.(note.timestamp_seconds)}
                  title="Jump to this time in the video"
                  aria-label={`Jump to ${formatVideoClock(note.timestamp_seconds)}`}
                >
                  {formatVideoClock(note.timestamp_seconds)}
                </button>
                {note.author_name && <span className="np-author">{note.author_name}</span>}
                {canEdit && !isEditing && (
                  <div className="np-actions">
                    <button
                      type="button"
                      className="np-action-btn"
                      onClick={() => handleStartEdit(note)}
                      aria-label={`Edit note at ${formatVideoClock(note.timestamp_seconds)}`}
                    >
                      <AppIcon name="pencil" size={18} />
                    </button>
                    {confirmDeleteId === note.id ? (
                      <span className="np-confirm">
                        <button
                          type="button"
                          className="np-confirm-yes"
                          onClick={() => {
                            handleDelete(note.id);
                            setConfirmDeleteId(null);
                          }}
                        >
                          Delete
                        </button>
                        <button type="button" className="np-confirm-no" onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="np-action-btn np-delete"
                        onClick={() => setConfirmDeleteId(note.id)}
                        aria-label="Delete note"
                      >
                        <AppIcon name="cross-mark" size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="np-edit" ref={editAreaRef}>
                  <label className="np-edit-label" htmlFor={`np-edit-${note.id}`}>
                    Note text
                  </label>
                  <textarea
                    id={`np-edit-${note.id}`}
                    className="np-edit-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={5}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSaveEdit(note.id);
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        cancelEdit();
                      }
                    }}
                  />
                  <div className="np-time-row">
                    <label className="np-time-label" htmlFor={`np-ts-${note.id}`}>
                      Timestamp (seconds)
                    </label>
                    <div className="np-time-controls">
                      <input
                        id={`np-ts-${note.id}`}
                        type="number"
                        min={0}
                        step={1}
                        className="np-time-input"
                        value={editTimestampSeconds}
                        onChange={(e) => setEditTimestampSeconds(parseInt(e.target.value, 10) || 0)}
                        aria-describedby={`np-ts-hint-${note.id}`}
                      />
                      <span className="np-time-preview" id={`np-ts-hint-${note.id}`}>
                        {formatVideoClock(editTimestampSeconds)}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary np-btn-sync"
                        onClick={() => setEditTimestampSeconds(Math.max(0, Math.floor(currentTime)))}
                        title="Set time to current playback position"
                        aria-label="Set note time to current video position"
                      >
                        Use video time
                      </button>
                    </div>
                  </div>
                  <div className="np-edit-bar">
                    <span className="np-edit-hint">{saveHint} · Esc cancel</span>
                    <div className="np-edit-bar-actions">
                      <button type="button" className="btn-secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={!editText.trim()}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : canEdit ? (
                <button
                  type="button"
                  className="np-text np-text-editable"
                  onClick={() => handleStartEdit(note)}
                  aria-label={`Edit note: ${note.text.slice(0, 80)}${note.text.length > 80 ? "…" : ""}`}
                >
                  {note.text}
                </button>
              ) : (
                <p className="np-text">{note.text}</p>
              )}
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && sorted.length > 0 && (
        <p className="np-filter-empty">No notes match this filter.</p>
      )}
    </>
  );
}

const NotesPanel = memo(NotesPanelInner);
export default NotesPanel;
