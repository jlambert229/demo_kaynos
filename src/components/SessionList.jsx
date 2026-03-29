import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AppIcon from "./AppIcon";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import { TagList } from "./TagInput";
import { useSessionsList, useMembersList, useDeleteSession } from "../hooks/useApiQuery";

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SessionList() {
  const { studentId } = useParams();
  const { isInstructor } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [coachFilter, setCoachFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: sessionsResult, isLoading: loading } = useSessionsList(studentId);
  const sessions = sessionsResult?.sessions ?? [];
  const availableTags = sessionsResult?.tags ?? [];

  const { data: membersResult } = useMembersList();
  const studentName = useMemo(() => {
    if (!studentId || !isInstructor) return "";
    const s = membersResult?.members?.find((m) => m.id === studentId);
    return s?.name ?? "";
  }, [studentId, isInstructor, membersResult]);

  const studentOptions = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      if (s.student_id && s.student_name && !map.has(s.student_id)) {
        map.set(s.student_id, s.student_name);
      }
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [sessions]);

  const searchFiltered = search
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.tags?.some((t) => t.includes(search.toLowerCase()))
      )
    : sessions;

  const afterTagFilter = tagFilter
    ? searchFiltered.filter((s) => s.tags?.includes(tagFilter))
    : searchFiltered;

  const afterStudentFilter = (isInstructor && !studentId && studentFilter !== "all")
    ? afterTagFilter.filter((s) => s.student_id === studentFilter)
    : afterTagFilter;

  const chipCountAll = afterStudentFilter.length;
  const chipCountUnwatched = afterStudentFilter.filter((s) => !s.viewed).length;
  const chipCountNewNotes = afterStudentFilter.filter(
    (s) => parseInt(s.note_count, 10) > 0 && !s.viewed
  ).length;

  const chipCoachNotes = afterStudentFilter.filter((s) => parseInt(s.note_count, 10) > 0).length;
  const chipCoachVideo = afterStudentFilter.filter((s) => s.video_status !== "ready").length;

  let list = afterStudentFilter;
  if (!isInstructor && filter === "unwatched") {
    list = list.filter((s) => !s.viewed);
  }
  if (!isInstructor && filter === "newnotes") {
    list = list.filter((s) => parseInt(s.note_count, 10) > 0 && !s.viewed);
  }
  if (isInstructor && coachFilter === "notes") {
    list = list.filter((s) => parseInt(s.note_count, 10) > 0);
  }
  if (isInstructor && coachFilter === "video") {
    list = list.filter((s) => s.video_status !== "ready");
  }

  const deleteSession = useDeleteSession();
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSession.mutateAsync(deleteTarget.id);
      toast.success("Session deleted");
    } catch {
      toast.error("Failed to delete session");
    } finally {
      setDeleteTarget(null);
    }
  }

  function emptySessionsMessage() {
    if (search) return "No sessions match your search";
    if (!isInstructor && filter === "unwatched") return "No unwatched sessions found";
    if (!isInstructor && filter === "newnotes") return "No sessions with new notes found";
    if (isInstructor && coachFilter === "notes") return "No sessions with coach notes match this filter";
    if (isInstructor && coachFilter === "video") return "No sessions with a pending or failed video upload";
    return "No sessions found";
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-toolbar">
          <div>
            {studentId && isInstructor && (
              <Link to="/students" className="detail-back" style={{ marginBottom: 8 }}>
                ← All Students
              </Link>
            )}
            <div className="page-title">
              {studentName || (isInstructor ? "All Sessions" : "My Sessions")}
            </div>
            <div className="page-subtitle">
              {list.length} session{list.length !== 1 ? "s" : ""}
              {studentFilter !== "all" && isInstructor && (
                <span> for {studentOptions.find(([id]) => id === studentFilter)?.[1] || "student"}</span>
              )}
              {!isInstructor && sessions.some((s) => !s.viewed) && (
                <span className="page-subtitle-hint"> · Unwatched highlighted</span>
              )}
            </div>
          </div>
          {isInstructor && (
            <div className="page-header-actions" style={{ display: "flex", gap: 8 }}>
              {sessions.length > 0 && (
                <button type="button" className="btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={() => {
                  const header = "Title,Student,Instructor,Date,Notes,Watched,Tags\n";
                  const rows = list.map((s) =>
                    `"${(s.title || "").replace(/"/g, '""')}","${(s.student_name || "").replace(/"/g, '""')}","${(s.instructor_name || "").replace(/"/g, '""')}","${s.date}",${s.note_count || 0},${s.viewed ? "Yes" : "No"},"${(s.tags || []).join(", ")}"`
                  ).join("\n");
                  const blob = new Blob([header + rows], { type: "text/csv" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sessions.csv"; a.click();
                }}>
                  Export CSV
                </button>
              )}
              {studentId && (
                <button type="button" className="btn-primary" onClick={() => navigate(`/students/${studentId}/sessions/new`)}>
                  + New Session
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="page-body">
        <div className="filter-bar">
          <input className="search-box" placeholder="Search sessions..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search sessions" />
          {isInstructor && !studentId && studentOptions.length > 1 && (
            <select
              className="student-filter-select"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              aria-label="Filter by student"
            >
              <option value="all">All students</option>
              {studentOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}
          {!isInstructor ? (
            <div className="filter-chips" role="group" aria-label="Filter sessions">
              <button type="button" className={`filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                All
                <span className="chip-count">{chipCountAll}</span>
              </button>
              <button type="button" className={`filter-chip ${filter === "unwatched" ? "active" : ""}`} onClick={() => setFilter("unwatched")}>
                Unwatched
                <span className="chip-count">{chipCountUnwatched}</span>
              </button>
              <button type="button" className={`filter-chip ${filter === "newnotes" ? "active" : ""}`} onClick={() => setFilter("newnotes")}>
                Has notes
                <span className="chip-count">{chipCountNewNotes}</span>
              </button>
            </div>
          ) : (
            <div className="filter-chips" role="group" aria-label="Filter sessions for coaches">
              <button type="button" className={`filter-chip ${coachFilter === "all" ? "active" : ""}`} onClick={() => setCoachFilter("all")}>
                All
                <span className="chip-count">{chipCountAll}</span>
              </button>
              <button type="button" className={`filter-chip ${coachFilter === "notes" ? "active" : ""}`} onClick={() => setCoachFilter("notes")}>
                Has notes
                <span className="chip-count">{chipCoachNotes}</span>
              </button>
              <button type="button" className={`filter-chip ${coachFilter === "video" ? "active" : ""}`} onClick={() => setCoachFilter("video")}>
                Video pending
                <span className="chip-count">{chipCoachVideo}</span>
              </button>
            </div>
          )}
        </div>

        {availableTags.length > 0 && (
          <div className="tag-filter-bar">
            <span className="tag-filter-label">Tags:</span>
            <button
              type="button"
              className={`tag-chip ${tagFilter === "" ? "active" : ""}`}
              onClick={() => setTagFilter("")}
            >
              All
            </button>
            {availableTags.map((t) => (
              <button
                key={t}
                type="button"
                className={`tag-chip ${tagFilter === t ? "active" : ""}`}
                onClick={() => setTagFilter(tagFilter === t ? "" : t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="skeleton-list">
            {[0,1,2,3].map(i => <div key={i} className="sk-card" style={{"--i": i}} />)}
          </div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><AppIcon name="martial-arts-uniform" size={36} /></div>
            <p>{emptySessionsMessage()}</p>
            {!search && !isInstructor && filter !== "all" && (
              <button type="button" className="btn-secondary" style={{ marginTop: 12, height: 36, fontSize: 13 }} onClick={() => setFilter("all")}>Clear filters</button>
            )}
            {!search && isInstructor && coachFilter !== "all" && (
              <button type="button" className="btn-secondary" style={{ marginTop: 12, height: 36, fontSize: 13 }} onClick={() => setCoachFilter("all")}>Clear filters</button>
            )}
          </div>
        ) : (
          <div className="sessions-grid">
            {list.map((session, i) => (
              <Link
                key={session.id}
                to={`/sessions/${session.id}`}
                className={`session-card ${!isInstructor && !session.viewed ? "session-card-unseen" : ""}`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="session-info">
                  <div className="session-title-row">
                    <span className="session-title">{session.title}</span>
                    {!isInstructor && !session.viewed && <span className="new-badge">New</span>}
                  </div>
                  <div className="session-meta">
                    {formatDate(session.date)}
                    {isInstructor && !studentId && session.student_name && ` · ${session.student_name}`}
                    {(session.note_count > 0) && ` · ${session.note_count} note${session.note_count != 1 ? "s" : ""}`}
                    {isInstructor && session.video_status && session.video_status !== "ready" && " · Video not ready"}
                  </div>
                  {session.tags?.length > 0 && (
                    <div className="tag-list" style={{ marginTop: 4 }}>
                      {session.tags.map((t) => (
                        <span key={t} className="tag-chip" style={{ cursor: "default", fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                {isInstructor && (
                  <button
                    type="button"
                    className="session-card-delete"
                    aria-label="Delete session"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(session); }}
                  >
                    <AppIcon name="cross-mark" size={16} />
                  </button>
                )}
                <span className="session-card-arrow">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete session"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
