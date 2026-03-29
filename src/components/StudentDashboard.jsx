import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import AppIcon from "./AppIcon";
import { formatVideoClock } from "../utils/formatVideoTime";
import { useSessionsList, useClassesList } from "../hooks/useApiQuery";

function sessionHasPlayableVideo(s) {
  return s.video_status === "ready" || Boolean(s.vimeo_id);
}

function relativeDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: sessionsResult, isLoading: l1 } = useSessionsList();
  const { data: classesResult, isLoading: l2 } = useClassesList();
  const loading = l1 || l2;
  const sessions = sessionsResult?.sessions ?? [];
  const classes = classesResult?.classes ?? [];

  const unwatchedSessions = sessions.filter((s) => !s.viewed);
  const resumeSessions = sessions.filter((s) => {
    const pos = parseInt(s.last_position_seconds, 10) || 0;
    return !s.viewed && pos >= 15 && sessionHasPlayableVideo(s);
  });
  const brandNewSessions = unwatchedSessions.filter((s) => {
    const pos = parseInt(s.last_position_seconds, 10) || 0;
    return pos < 15;
  });
  const recentSessions = sessions.slice(0, 5);
  const unwatchedClasses = classes.filter((c) => !c.viewed);
  const recentClasses = classes.slice(0, 3);
  const totalNotes = sessions.reduce((sum, s) => sum + (parseInt(s.note_count) || 0), 0);

  if (loading) return (
    <>
      <div className="page-header">
        <div className="sk-title sk-line" style={{ width: "60%", height: 24 }} />
        <div className="sk-line" style={{ width: "30%", height: 12 }} />
      </div>
      <div className="page-body">
        <div className="dash-stats">
          {[0,1,2,3].map(i => <div key={i} className="dash-stat"><div className="sk-line" style={{ width: "40%", height: 24, margin: "0 auto 6px" }} /><div className="sk-line sk-line-sm" style={{ width: "60%", margin: "0 auto" }} /></div>)}
        </div>
        <div className="skeleton-list">
          {[0,1,2].map(i => <div key={i} className="sk-card" style={{"--i": i}} />)}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="page-header">
        <div className="welcome-section">
          <div className="welcome-name">Welcome back, {user.name}</div>
          <div className="welcome-date">{formatToday()}</div>
          {user.schoolName && (
            <div className="page-subtitle" style={{ marginTop: 10 }}>
              {user.schoolName}
            </div>
          )}
        </div>
      </div>
      <div className="page-body">
        <nav className="quick-actions" aria-label="Quick actions">
          <Link to="/sessions" className="quick-action">
            <span className="icon" aria-hidden><AppIcon name="martial-arts-uniform" size={22} /></span>
            View Sessions
          </Link>
          <Link to="/classes" className="quick-action">
            <span className="icon" aria-hidden><AppIcon name="clipboard" size={22} /></span>
            View Classes
          </Link>
        </nav>

        {/* Quick Stats */}
        <div className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat-value">{sessions.length}</div>
            <div className="dash-stat-label">Sessions</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value">{totalNotes}</div>
            <div className="dash-stat-label">Notes</div>
          </div>
          <div className={`dash-stat ${unwatchedSessions.length > 0 ? "dash-stat--accent" : ""}`}>
            <div className="dash-stat-value">{unwatchedSessions.length}</div>
            <div className="dash-stat-label">Unwatched</div>
          </div>
          <div className={`dash-stat ${unwatchedClasses.length > 0 ? "dash-stat--accent" : ""}`}>
            <div className="dash-stat-value">{unwatchedClasses.length > 0 ? unwatchedClasses.length : classes.length}</div>
            <div className="dash-stat-label">{unwatchedClasses.length > 0 ? "New Classes" : "Classes"}</div>
          </div>
        </div>

        {/* Resume where you left off */}
        {resumeSessions.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-header">
              <h3>Resume watching</h3>
              <span className="dash-badge">{resumeSessions.length}</span>
            </div>
            <p className="dash-section-hint">Sessions you started; open to jump back near your last position.</p>
            <div className="sessions-grid">
              {resumeSessions.slice(0, 4).map((session, i) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="session-card session-card-unseen session-card-resume"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="session-info">
                    <div className="session-title-row">
                      <span className="session-title">{session.title}</span>
                      <span className="resume-badge">Resume</span>
                    </div>
                    <div className="session-meta">
                      Last at {formatVideoClock(session.last_position_seconds)}
                      {session.instructor_name && ` · Coach ${session.instructor_name}`}
                    </div>
                  </div>
                  <span className="session-card-arrow">›</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Brand-new unwatched sessions (little or no watch time yet) */}
        {brandNewSessions.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-header">
              <h3>New Sessions</h3>
              <span className="dash-badge">{brandNewSessions.length}</span>
            </div>
            <div className="sessions-grid">
              {brandNewSessions.slice(0, 3).map((session, i) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="session-card session-card-unseen"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="session-info">
                    <div className="session-title-row">
                      <span className="session-title">{session.title}</span>
                      <span className="new-badge">New</span>
                    </div>
                    <div className="session-meta">
                      {relativeDate(session.date)}
                      {session.instructor_name && ` · Coach ${session.instructor_name}`}
                      {parseInt(session.note_count) > 0 && ` · ${session.note_count} note${session.note_count != 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <span className="session-card-arrow">›</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Sessions */}
        <section className="dash-section">
          <div className="dash-section-header">
            <h3>Recent Sessions</h3>
            <Link to="/sessions" className="dash-view-all">View all →</Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><AppIcon name="martial-arts-uniform" size={36} /></div>
              <p>No sessions yet. Your journey begins with the first roll.</p>
            </div>
          ) : (
            <div className="sessions-grid">
              {recentSessions.map((session, i) => (
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
                      {session.instructor_name && ` · Coach ${session.instructor_name}`}
                      {parseInt(session.note_count) > 0 && ` · ${session.note_count} note${session.note_count != 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <span className="session-card-arrow">›</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Classes */}
        {classes.length === 0 && sessions.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-header">
              <h3>Classes</h3>
            </div>
            <div className="empty-state">
              <div className="icon"><AppIcon name="clipboard" size={36} /></div>
              <p>No school-wide classes recorded yet</p>
              <p className="empty-state-hint">Your coach will add class recordings here when available.</p>
            </div>
          </section>
        )}

        {recentClasses.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-header">
              <h3>Latest Classes</h3>
              <Link to="/classes" className="dash-view-all">View all →</Link>
            </div>
            <div className="sessions-grid">
              {recentClasses.map((cls, i) => (
                <Link key={cls.id} to={`/classes/${cls.id}`} className={`session-card ${!cls.viewed ? "session-card-unseen" : ""}`} style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="session-info">
                    <div className="session-title-row">
                      <span className="session-title">{cls.title}</span>
                      {!cls.viewed && <span className="new-badge">New</span>}
                    </div>
                    <div className="session-meta">
                      {relativeDate(cls.date)}
                      {cls.instructor_name && ` · ${cls.instructor_name}`}
                      {cls.description && ` · ${cls.description.length > 50 ? cls.description.slice(0, 50) + "…" : cls.description}`}
                    </div>
                  </div>
                  <span className="session-card-arrow">›</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
