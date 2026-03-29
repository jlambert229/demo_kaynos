import { useParams, Link, useNavigate } from "react-router-dom";
import AppIcon from "./AppIcon";
import { useMembersList, useSessionsList, useClassesList } from "../hooks/useApiQuery";

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
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function StudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const { data: membersResult, isLoading: l1 } = useMembersList();
  const { data: sessionsResult, isLoading: l2 } = useSessionsList(studentId);
  const { data: classesResult, isLoading: l3 } = useClassesList();
  const loading = l1 || l2 || l3;
  const student = membersResult?.members?.find((m) => m.id === studentId) ?? null;
  const sessions = sessionsResult?.sessions ?? [];
  const classes = classesResult?.classes ?? [];

  if (loading) return (
    <>
      <div className="page-header">
        <div className="sk-line" style={{ width: 100, height: 12 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-tertiary)" }} />
          <div>
            <div className="sk-title sk-line" style={{ width: 180, height: 22 }} />
            <div className="sk-line" style={{ width: 140, height: 12 }} />
          </div>
        </div>
      </div>
      <div className="page-body">
        <div className="sp-stats" style={{ marginBottom: 32 }}>
          {[0,1,2,3,4].map(i => <div key={i} className="sp-stat"><div className="sk-line" style={{ width: "40%", height: 20, margin: "0 auto 6px" }} /><div className="sk-line sk-line-sm" style={{ width: "60%", margin: "0 auto" }} /></div>)}
        </div>
        <div className="skeleton-list">
          {[0,1,2].map(i => <div key={i} className="sk-card" style={{"--i": i}} />)}
        </div>
      </div>
    </>
  );
  if (!student) return <div className="page-body"><div className="empty-state"><div className="icon"><AppIcon name="bust-in-silhouette" size={36} /></div><p>Student not found</p></div></div>;

  const totalNotes = sessions.reduce((sum, s) => sum + (parseInt(s.note_count) || 0), 0);
  const lastSession = sessions.length > 0 ? sessions[0] : null;
  const viewedCount = sessions.filter((s) => s.viewed).length;
  const classesViewed = classes.filter((c) => c.viewed).length;
  const completionRate = sessions.length > 0 ? Math.round((viewedCount / sessions.length) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div className="sp-header">
          <Link to="/students" className="detail-back">← All Students</Link>
          <div className="page-header-toolbar">
            <div className="sp-header-identity">
              <div className="sp-avatar">{getInitials(student.name)}</div>
              <div>
                <div className="page-title">{student.name}</div>
                <div className="page-subtitle">{student.email}</div>
              </div>
            </div>
            <div className="page-header-actions">
              <button type="button" className="btn-primary" onClick={() => navigate(`/students/${studentId}/sessions/new`)}>
                + New Session
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="page-body">
        {/* Stats Row */}
        <div className="sp-stats">
          <div className="sp-stat">
            <div className="sp-stat-value">{sessions.length}</div>
            <div className="sp-stat-label">Sessions</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-value">{totalNotes}</div>
            <div className="sp-stat-label">Notes</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-value">{viewedCount}/{sessions.length}</div>
            <div className="sp-stat-label">Sessions Watched</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-value">{classesViewed}/{classes.length}</div>
            <div className="sp-stat-label">Classes Watched</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-value">{completionRate}%</div>
            <div className="sp-stat-label">Completion</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-value">{lastSession ? relativeDate(lastSession.date) : "—"}</div>
            <div className="sp-stat-label">Last Session</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-value">{relativeDate(student.created_at)}</div>
            <div className="sp-stat-label">Member Since</div>
          </div>
        </div>

        {/* Session History */}
        <div style={{ marginTop: 32 }}>
          <div className="sp-section-header">
            <h3>Session History</h3>
            <span className="sp-count">{sessions.length}</span>
          </div>

          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><AppIcon name="martial-arts-uniform" size={36} /></div>
              <p>No sessions recorded yet</p>
              <p className="empty-state-hint">Sessions you record will appear here with notes and video.</p>
              <button
                className="btn-primary"
                style={{ marginTop: 16, height: 36, fontSize: 13 }}
                onClick={() => navigate(`/students/${studentId}/sessions/new`)}
              >
                Record First Session
              </button>
            </div>
          ) : (
            <div className="sessions-grid">
              {sessions.map((session, i) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className={`session-card ${!session.viewed ? "session-card-unseen" : ""}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="session-info">
                    <div className="session-title-row">
                      <span className="session-title">{session.title}</span>
                      {!session.viewed && <span className="new-badge">New</span>}
                    </div>
                    <div className="session-meta">
                      {relativeDate(session.date)}
                      {session.instructor_name && ` · ${session.instructor_name}`}
                      {(session.note_count > 0) && ` · ${session.note_count} note${session.note_count != 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <span className="session-card-arrow">›</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
