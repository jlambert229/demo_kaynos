import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import AppIcon from "./AppIcon";
import { useMembersList, useSessionsList, queryKeys } from "../hooks/useApiQuery";

function getInitials(name) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function relativeDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function StudentList() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "student" });
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const { data: membersResult, isLoading: l1 } = useMembersList();
  const { data: sessionsResult, isLoading: l2 } = useSessionsList();
  const loading = l1 || l2;
  const allMembers = membersResult?.members ?? [];
  const allSessions = sessionsResult?.sessions ?? [];

  const sessionCounts = useMemo(() => {
    const counts = {};
    for (const s of allSessions) {
      counts[s.student_id] = (counts[s.student_id] || 0) + 1;
    }
    return counts;
  }, [allSessions]);

  const schoolSessionTotal = allSessions.length;
  const pendingVideoCount = useMemo(
    () => allSessions.filter((s) => s.video_status !== "ready").length,
    [allSessions],
  );

  const students = allMembers
    .filter((m) => m.role === "student")
    .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    setError("");
    try {
      const data = await api.members.add(form);
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      setTempPassword(data.emailSent ? "emailed" : "email-failed");
      setForm({ name: "", email: "", role: "student" });
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-toolbar">
          <div>
            <div className="page-title">Students</div>
            <div className="page-subtitle">
              {students.length} student{students.length !== 1 ? "s" : ""}
              {!loading && (
                <span className="page-subtitle-hint">
                  {" "}
                  · {schoolSessionTotal} school session{schoolSessionTotal !== 1 ? "s" : ""}
                  {pendingVideoCount > 0 && ` · ${pendingVideoCount} video upload${pendingVideoCount !== 1 ? "s" : ""} pending`}
                </span>
              )}
            </div>
          </div>
          <div className="page-header-actions">
            <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
              + Add Student
            </button>
          </div>
        </div>
      </div>
      <div className="page-body">
        {tempPassword && (
          <div className="temp-password-banner" style={{ marginBottom: 20 }}>
            {tempPassword === "emailed" ? (
              <p>Student added. Their temporary password has been emailed to them.</p>
            ) : (
              <p>Student added, but the email could not be sent. Please check your email settings.</p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn-secondary" style={{ height: 32, fontSize: 12 }} onClick={() => setTempPassword(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="filter-bar">
          <input
            className="search-box"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="student-grid">
            {[0,1,2,3].map(i => <div key={i} className="sk-card" style={{"--i": i, height: 80}} />)}
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><AppIcon name="busts-in-silhouette" size={36} /></div>
            <p>{search ? "No students match your search" : "No students yet"}</p>
            {!search && (
              <button className="btn-primary" style={{ marginTop: 16, height: 36, fontSize: 13 }} onClick={() => setShowModal(true)}>
                Add Your First Student
              </button>
            )}
          </div>
        ) : (
          <div className="student-grid">
            {students.map((st, i) => (
              <Link key={st.id} to={`/students/${st.id}`} className="student-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="student-avatar">{getInitials(st.name)}</div>
                <div className="student-details">
                  <div className="student-name">{st.name}</div>
                  <div className="student-stats">
                    {sessionCounts[st.id] || 0} session{(sessionCounts[st.id] || 0) !== 1 ? "s" : ""}
                    {st.created_at && ` · Joined ${relativeDate(st.created_at)}`}
                  </div>
                </div>
                <span className="session-card-arrow">›</span>
              </Link>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)} role="dialog" aria-modal="true" aria-label="Add student">
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Add Student</h3>
              {error && <div className="login-error">{error}</div>}
              <div className="modal-field">
                <label>Name</label>
                <input
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="modal-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="student@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
                A temporary password will be generated and emailed to the student.
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => { setShowModal(false); setError(""); }}>Cancel</button>
                <button className="btn-primary" onClick={handleAdd} disabled={saving || !form.name.trim()}>
                  {saving ? "Adding..." : "Add Student"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
