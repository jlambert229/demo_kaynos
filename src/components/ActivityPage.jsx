import { useState } from "react";
import { Link } from "react-router-dom";
import AppIcon from "./AppIcon";
import { useSchoolActivity } from "../hooks/useApiQuery";

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityPage() {
  const [period, setPeriod] = useState(7);
  const { data: result, isLoading: loading } = useSchoolActivity(period);
  const data = result?.activity ?? null;

  return (
    <>
      <div className="page-header">
        <div className="page-header-toolbar">
          <div>
            <div className="page-title">Student Activity</div>
            <div className="page-subtitle">Who's watching and completing content</div>
          </div>
          <div className="page-header-actions">
            <select
              className="student-filter-select"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              aria-label="Time period"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </div>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="skeleton-list">
            {[0,1,2].map(i => <div key={i} className="sk-card" style={{"--i": i}} />)}
          </div>
        ) : !data ? (
          <div className="empty-state">
            <p>Could not load activity data</p>
          </div>
        ) : (
          <>
            <section className="activity-section">
              <h3 className="activity-section-title">
                <AppIcon name="clipboard" size={18} />
                Class Completion
              </h3>
              {data.recentClasses.length === 0 ? (
                <p className="activity-empty">No classes in this period</p>
              ) : (
                <div className="activity-table-wrap">
                  <table className="activity-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Date</th>
                        <th>Views</th>
                        <th>Completed</th>
                        <th>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentClasses.map((c) => {
                        const total = parseInt(c.total_students, 10) || 1;
                        const completed = parseInt(c.completed_count, 10);
                        const views = parseInt(c.view_count, 10);
                        const rate = Math.round((completed / total) * 100);
                        return (
                          <tr key={c.id}>
                            <td><Link to={`/classes/${c.id}`} className="activity-link">{c.title}</Link></td>
                            <td className="activity-meta">{formatDate(c.date)}</td>
                            <td className="activity-num">{views}</td>
                            <td className="activity-num">{completed}/{total}</td>
                            <td>
                              <div className="activity-bar-wrap">
                                <div className="activity-bar" style={{ width: `${rate}%` }} />
                                <span className="activity-bar-label">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="activity-section">
              <h3 className="activity-section-title">
                <AppIcon name="martial-arts-uniform" size={18} />
                Session Progress
              </h3>
              {data.recentSessions.length === 0 ? (
                <p className="activity-empty">No sessions in this period</p>
              ) : (
                <div className="activity-table-wrap">
                  <table className="activity-table">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Student</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentSessions.map((s) => {
                        const done = parseInt(s.completed_count, 10) > 0;
                        return (
                          <tr key={s.id}>
                            <td><Link to={`/sessions/${s.id}`} className="activity-link">{s.title}</Link></td>
                            <td className="activity-meta">{s.student_name}</td>
                            <td className="activity-meta">{formatDate(s.date)}</td>
                            <td>
                              <span className={`activity-badge ${done ? "activity-badge--done" : "activity-badge--pending"}`}>
                                {done ? "Watched" : "Not watched"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="activity-section">
              <h3 className="activity-section-title">
                <AppIcon name="play-button" size={18} />
                Recent Views
              </h3>
              {data.sessionViews.length === 0 && data.classViews.length === 0 ? (
                <p className="activity-empty">No recent views</p>
              ) : (
                <div className="activity-feed">
                  {[
                    ...data.sessionViews.map((v) => ({ ...v, type: "session", title: v.session_title })),
                    ...data.classViews.map((v) => ({ ...v, type: "class", title: v.class_title })),
                  ]
                    .sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at))
                    .slice(0, 30)
                    .map((v, i) => (
                      <div key={`${v.type}-${v.user_id}-${v.session_id || v.class_id}-${i}`} className="activity-feed-item">
                        <span className="activity-feed-name">{v.student_name}</span>
                        <span className="activity-feed-action">
                          {v.completed ? "completed" : "viewed"}
                        </span>
                        <Link
                          to={v.type === "session" ? `/sessions/${v.session_id}` : `/classes/${v.class_id}`}
                          className="activity-link"
                        >
                          {v.title}
                        </Link>
                        <span className="activity-feed-time">{timeAgo(v.viewed_at)}</span>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
