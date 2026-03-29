import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import AppIcon from "./AppIcon";
import { useSessionsList, useMembersList, useSchoolStats } from "../hooks/useApiQuery";
import UsageBanner from "./UsageBanner";

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

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { data: sessionsResult, isLoading: l1 } = useSessionsList();
  const { data: membersResult, isLoading: l2 } = useMembersList();
  const { data: statsResult, isLoading: l3 } = useSchoolStats();
  const loading = l1 || l2 || l3;
  const sessions = sessionsResult?.sessions ?? [];
  const members = membersResult?.members ?? [];
  const stats = statsResult?.stats ?? null;

  const recentSessions = sessions.slice(0, 5);
  const pendingSessions = sessions.filter((s) => s.video_status && s.video_status !== "ready").slice(0, 3);

  const studentMap = new Map(members.filter((m) => m.role === "student").map((m) => [m.id, m]));
  const recentStudentIds = [...new Set(sessions.map((s) => s.student_id))].slice(0, 4);
  const recentStudents = recentStudentIds.map((id) => studentMap.get(id)).filter(Boolean);

  const sessionCountByStudent = new Map();
  sessions.forEach((s) => {
    sessionCountByStudent.set(s.student_id, (sessionCountByStudent.get(s.student_id) || 0) + 1);
  });

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

  const totalNotes = (stats?.total_session_notes || 0) + (stats?.total_class_notes || 0);

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
          <Link to="/students" className="quick-action">
            <span className="icon" aria-hidden><AppIcon name="martial-arts-uniform" size={22} /></span>
            + New Session
          </Link>
          <Link to="/classes/new" className="quick-action">
            <span className="icon" aria-hidden><AppIcon name="clipboard" size={22} /></span>
            + New Class
          </Link>
          <Link to="/students" className="quick-action">
            <span className="icon" aria-hidden><AppIcon name="busts-in-silhouette" size={22} /></span>
            View Students
          </Link>
          <Link to="/sessions" className="quick-action">
            <span className="icon" aria-hidden><AppIcon name="clapper-board" size={22} /></span>
            All Sessions
          </Link>
        </nav>

        {stats && parseInt(stats.total_students) === 0 && parseInt(stats.total_sessions) === 0 && (
          <section className="onboarding-checklist">
            <h3 className="onboarding-title">Getting started</h3>
            <p className="onboarding-hint">Follow these steps to set up your school</p>
            <div className="onboarding-steps">
              <Link to="/admin" className="onboarding-step">
                <span className="onboarding-step-num">1</span>
                <div>
                  <div className="onboarding-step-title">Add your first student</div>
                  <div className="onboarding-step-desc">Go to Admin and invite a student by email</div>
                </div>
              </Link>
              <div className="onboarding-step onboarding-step--locked">
                <span className="onboarding-step-num">2</span>
                <div>
                  <div className="onboarding-step-title">Record a session</div>
                  <div className="onboarding-step-desc">Create a private session with video and notes</div>
                </div>
              </div>
              <div className="onboarding-step onboarding-step--locked">
                <span className="onboarding-step-num">3</span>
                <div>
                  <div className="onboarding-step-title">Upload a class recording</div>
                  <div className="onboarding-step-desc">Share technique videos with your whole school</div>
                </div>
              </div>
            </div>
          </section>
        )}

        <UsageBanner compact />

        <div className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat-value">{stats?.total_students ?? 0}</div>
            <div className="dash-stat-label">Students</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value">{stats?.total_sessions ?? 0}</div>
            <div className="dash-stat-label">Sessions</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value">{stats?.total_classes ?? 0}</div>
            <div className="dash-stat-label">Classes</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value">{totalNotes}</div>
            <div className="dash-stat-label">Notes</div>
          </div>
        </div>

        {pendingSessions.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-header">
              <h3>Needs Attention</h3>
              <span className="dash-badge">{pendingSessions.length}</span>
            </div>
            <p className="dash-section-hint">Sessions with pending video uploads.</p>
            <div className="sessions-grid">
              {pendingSessions.map((session, i) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="session-card session-card-unseen"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="session-info">
                    <div className="session-title-row">
                      <span className="session-title">{session.title}</span>
                      <span className="new-badge" style={{ background: "rgba(255,159,10,0.12)", color: "var(--orange)" }}>Pending</span>
                    </div>
                    <div className="session-meta">
                      {session.student_name && <>{session.student_name} &middot; </>}
                      {relativeDate(session.date)}
                    </div>
                  </div>
                  <span className="session-card-arrow">&rsaquo;</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="dash-section">
          <div className="dash-section-header">
            <h3>Recent Sessions</h3>
            <Link to="/sessions" className="dash-view-all">View all &rarr;</Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><AppIcon name="clapper-board" size={36} /></div>
              <p>No sessions yet</p>
              <p className="empty-state-hint">Start by adding a student, then record your first session.</p>
              <Link to="/students" className="btn-primary" style={{ marginTop: 12, height: 36, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                View Students
              </Link>
            </div>
          ) : (
            <div className="sessions-grid">
              {recentSessions.map((session, i) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="session-card"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="session-info">
                    <div className="session-title-row">
                      <span className="session-title">{session.title}</span>
                    </div>
                    <div className="session-meta">
                      {session.student_name && <>{session.student_name} &middot; </>}
                      {relativeDate(session.date)}
                      {parseInt(session.note_count) > 0 && <> &middot; {session.note_count} note{session.note_count != 1 ? "s" : ""}</>}
                    </div>
                  </div>
                  <span className="session-card-arrow">&rsaquo;</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {recentStudents.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-header">
              <h3>Recent Students</h3>
              <Link to="/students" className="dash-view-all">View all &rarr;</Link>
            </div>
            <div className="student-grid">
              {recentStudents.map((student, i) => (
                <Link
                  key={student.id}
                  to={`/students/${student.id}`}
                  className="student-card"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="student-avatar">{student.name?.[0] ?? "?"}</div>
                  <div className="student-details">
                    <div className="student-name">{student.name}</div>
                    <div className="student-stats">
                      {sessionCountByStudent.get(student.id) || 0} session{(sessionCountByStudent.get(student.id) || 0) !== 1 ? "s" : ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
