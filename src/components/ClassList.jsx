import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppIcon from "./AppIcon";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import { formatVideoClock } from "../utils/formatVideoTime";
import { TagList } from "./TagInput";
import { useClassesList, useDeleteClass } from "../hooks/useApiQuery";

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClassList() {
  const { isInstructor } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: result, isLoading: loading } = useClassesList();
  const classes = result?.classes ?? [];
  const availableTags = result?.tags ?? [];

  const deleteClass = useDeleteClass();
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteClass.mutateAsync(deleteTarget.id);
      toast.success("Class deleted");
    } catch {
      toast.error("Failed to delete class");
    } finally {
      setDeleteTarget(null);
    }
  }

  const searchFiltered = search
    ? classes.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
        c.tags?.some((t) => t.includes(search.toLowerCase()))
      )
    : classes;

  const filtered = tagFilter
    ? searchFiltered.filter((c) => c.tags?.includes(tagFilter))
    : searchFiltered;

  let list = filtered;
  if (!isInstructor) {
    if (filter === "unwatched") list = list.filter((c) => !c.viewed);
    if (filter === "notes") list = list.filter((c) => parseInt(c.note_count, 10) > 0);
  }

  const unwatchedCount = filtered.filter((c) => !c.viewed).length;
  const hasNotesCount = filtered.filter((c) => parseInt(c.note_count, 10) > 0).length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-toolbar">
          <div>
            <div className="page-title">Classes</div>
            <div className="page-subtitle">
              {list.length} recording{list.length !== 1 ? "s" : ""}
              {!isInstructor && classes.some((c) => !c.viewed) && (
                <span className="page-subtitle-hint"> · Unwatched highlighted</span>
              )}
            </div>
          </div>
          {isInstructor && (
            <div className="page-header-actions" style={{ display: "flex", gap: 8 }}>
              {classes.length > 0 && (
                <button type="button" className="btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={() => {
                  const header = "Title,Instructor,Date,Notes,Watched,Tags\n";
                  const rows = filtered.map((c) =>
                    `"${(c.title || "").replace(/"/g, '""')}","${(c.instructor_name || "").replace(/"/g, '""')}","${c.date}",${c.note_count || 0},${c.viewed ? "Yes" : "No"},"${(c.tags || []).join(", ")}"`
                  ).join("\n");
                  const blob = new Blob([header + rows], { type: "text/csv" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "classes.csv"; a.click();
                }}>
                  Export CSV
                </button>
              )}
              <button type="button" className="btn-primary" onClick={() => navigate("/classes/new")}>
                + New Class
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="page-body">
        <div className="filter-bar">
          <input className="search-box" placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {!isInstructor && (
            <div className="filter-chips" role="group" aria-label="Filter classes">
              <button type="button" className={`filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                All <span className="chip-count">{filtered.length}</span>
              </button>
              <button type="button" className={`filter-chip ${filter === "unwatched" ? "active" : ""}`} onClick={() => setFilter("unwatched")}>
                Unwatched <span className="chip-count">{unwatchedCount}</span>
              </button>
              <button type="button" className={`filter-chip ${filter === "notes" ? "active" : ""}`} onClick={() => setFilter("notes")}>
                Has notes <span className="chip-count">{hasNotesCount}</span>
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
            <div className="icon"><AppIcon name="clipboard" size={36} /></div>
            <p>
              {classes.length === 0
                ? isInstructor ? "No classes recorded yet." : "No classes available yet."
                : filter !== "all" ? "No classes match this filter." : "No classes match your search."}
            </p>
            {filter !== "all" && !isInstructor && (
              <button type="button" className="btn-secondary" style={{ marginTop: 12, height: 36, fontSize: 13 }} onClick={() => setFilter("all")}>Clear filter</button>
            )}
          </div>
        ) : (
          <div className="sessions-grid">
            {list.map((cls, i) => (
              <Link key={cls.id} to={`/classes/${cls.id}`} className={`session-card ${!isInstructor && !cls.viewed ? "session-card-unseen" : ""}`} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="session-info">
                  <div className="session-title-row">
                    <span className="session-title">{cls.title}</span>
                    {!isInstructor && !cls.viewed && <span className="new-badge">New</span>}
                  </div>
                  <div className="session-meta">
                    {formatDate(cls.date)}
                    {cls.description && ` · ${cls.description.length > 60 ? cls.description.slice(0, 60) + "..." : cls.description}`}
                    {(cls.note_count > 0) && ` · ${cls.note_count} note${cls.note_count != 1 ? "s" : ""}`}
                  </div>
                  {cls.tags?.length > 0 && (
                    <div className="tag-list" style={{ marginTop: 4 }}>
                      {cls.tags.map((t) => (
                        <span key={t} className="tag-chip" style={{ cursor: "default", fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                {isInstructor && (
                  <button
                    type="button"
                    className="session-card-delete"
                    aria-label="Delete class"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(cls); }}
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
          title="Delete class"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
