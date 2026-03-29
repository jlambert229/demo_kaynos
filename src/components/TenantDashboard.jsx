import { useState, useEffect, useMemo } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import AppIcon from "./AppIcon";
import useFocusTrap from "../hooks/useFocusTrap";
import ConfirmModal from "./ConfirmModal";
import KaynosLogo from "./KaynosLogo";

export default function TenantDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const addSchoolRef = useFocusTrap(showAdd);
  const [addForm, setAddForm] = useState({ name: "", adminName: "", adminEmail: "" });
  const [adding, setAdding] = useState(false);

  const [expandedSchool, setExpandedSchool] = useState(null);
  const [schoolDetail, setSchoolDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editingSchool, setEditingSchool] = useState(null);
  const [editName, setEditName] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    Promise.all([api.tenant.schools(), api.tenant.stats()])
      .then(([schoolsData, statsData]) => {
        setSchools(schoolsData.schools);
        setStats(statsData.stats);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return schools;
    const q = search.toLowerCase();
    return schools.filter(
      (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  }, [schools, search]);

  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.adminName || !addForm.adminEmail) return;
    setAdding(true);
    try {
      const data = await api.tenant.createSchool(addForm);
      setSchools((prev) => [{ ...data.school, member_count: 1, student_count: 0, session_count: 0, class_count: 0, created_at: new Date().toISOString() }, ...prev]);
      setShowAdd(false);
      setAddForm({ name: "", adminName: "", adminEmail: "" });
      if (data.emailSent) {
        toast.success("School created. Welcome email sent to admin.");
      } else {
        toast.success("School created. Could not send welcome email - configure RESEND_API_KEY.");
      }
      if (stats) setStats((s) => ({ ...s, total_schools: Number(s.total_schools) + 1, total_users: Number(s.total_users) + 1 }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleExpandSchool = async (id) => {
    if (expandedSchool === id) {
      setExpandedSchool(null);
      setSchoolDetail(null);
      return;
    }
    setExpandedSchool(id);
    setDetailLoading(true);
    try {
      const data = await api.tenant.getSchool(id);
      setSchoolDetail(data);
    } catch (err) {
      toast.error(err.message);
      setExpandedSchool(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRenameSchool = async (id) => {
    if (!editName.trim()) return;
    try {
      const data = await api.tenant.updateSchool(id, { name: editName.trim() });
      setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, name: data.school.name } : s)));
      setEditingSchool(null);
      toast.success("School renamed");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteSchool = async (id) => {
    try {
      await api.tenant.deleteSchool(id);
      setSchools((prev) => prev.filter((s) => s.id !== id));
      setConfirmDelete(null);
      setExpandedSchool(null);
      toast.success("School deleted");
      if (stats) setStats((s) => ({ ...s, total_schools: Number(s.total_schools) - 1 }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="tenant-dashboard">
        <div className="tenant-loading">Loading platform data...</div>
      </div>
    );
  }

  return (
    <div className="tenant-dashboard">
      <header className="tenant-header">
        <div className="tenant-header-left">
          <KaynosLogo />
          <div>
            <h1>Platform Admin</h1>
            <p className="tenant-header-user">{user.name} ({user.email})</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={logout}>
          <AppIcon name="log-out" size={16} /> Sign out
        </button>
      </header>

      {stats && (
        <div className="tenant-stats">
          <div className="tenant-stat-card">
            <div className="tenant-stat-value">{stats.total_schools}</div>
            <div className="tenant-stat-label">Schools</div>
          </div>
          <div className="tenant-stat-card">
            <div className="tenant-stat-value">{stats.total_users}</div>
            <div className="tenant-stat-label">Users</div>
          </div>
          <div className="tenant-stat-card">
            <div className="tenant-stat-value">{stats.total_students}</div>
            <div className="tenant-stat-label">Students</div>
          </div>
          <div className="tenant-stat-card">
            <div className="tenant-stat-value">{stats.total_sessions}</div>
            <div className="tenant-stat-label">Sessions</div>
          </div>
          <div className="tenant-stat-card">
            <div className="tenant-stat-value">{stats.total_classes}</div>
            <div className="tenant-stat-label">Classes</div>
          </div>
        </div>
      )}

      <div className="tenant-toolbar">
        <input
          className="tenant-search"
          type="search"
          placeholder="Search schools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + New School
        </button>
      </div>

      {showAdd && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-school-title" onClick={() => setShowAdd(false)} onKeyDown={(e) => e.key === "Escape" && setShowAdd(false)}>
          <div className="modal" ref={addSchoolRef} onClick={(e) => e.stopPropagation()}>
            <h3 id="create-school-title">Create School</h3>
            <form onSubmit={handleAddSchool}>
              <div className="modal-field">
                <label>School Name</label>
                <input
                  placeholder="e.g. Gracie Barra Downtown"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label>Admin Name</label>
                <input
                  placeholder="School administrator name"
                  value={addForm.adminName}
                  onChange={(e) => setAddForm((f) => ({ ...f, adminName: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-field">
                <label>Admin Email</label>
                <input
                  type="email"
                  placeholder="admin@school.com"
                  value={addForm.adminEmail}
                  onChange={(e) => setAddForm((f) => ({ ...f, adminEmail: e.target.value }))}
                  required
                />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
                A temporary password will be generated and emailed to the school admin.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); setAddForm({ name: "", adminName: "", adminEmail: "" }); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={adding}>
                  {adding ? "Creating..." : "Create School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tenant-school-list">
        <div className="tenant-list-header">
          <span>School</span>
          <span>Members</span>
          <span>Sessions</span>
          <span>Classes</span>
          <span>Created</span>
          <span></span>
        </div>

        {filtered.length === 0 && (
          <div className="tenant-empty">
            {search ? "No schools match your search" : "No schools yet. Create the first one."}
          </div>
        )}

        {filtered.map((school) => (
          <div key={school.id} className="tenant-school-row-wrap">
            <div
              className={`tenant-school-row ${expandedSchool === school.id ? "expanded" : ""}`}
              onClick={() => handleExpandSchool(school.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleExpandSchool(school.id)}
            >
              {editingSchool === school.id ? (
                <span className="tenant-school-name" onClick={(e) => e.stopPropagation()}>
                  <input
                    className="admin-inline-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSchool(school.id);
                      if (e.key === "Escape") setEditingSchool(null);
                    }}
                    autoFocus
                  />
                  <button className="btn-small btn-primary" onClick={() => handleRenameSchool(school.id)}>Save</button>
                  <button className="btn-small btn-secondary" onClick={() => setEditingSchool(null)}>Cancel</button>
                </span>
              ) : (
                <span className="tenant-school-name">{school.name}</span>
              )}
              <span>{school.member_count}</span>
              <span>{school.session_count}</span>
              <span>{school.class_count}</span>
              <span>{new Date(school.created_at).toLocaleDateString()}</span>
              <span className="tenant-row-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn-small btn-secondary"
                  title="Rename"
                  onClick={() => {
                    setEditingSchool(school.id);
                    setEditName(school.name);
                  }}
                >
                  <AppIcon name="pencil" size={14} />
                </button>
                <button
                  className="btn-small btn-danger"
                  title="Delete"
                  onClick={() => setConfirmDelete(school)}
                >
                  <AppIcon name="cross-mark" size={14} />
                </button>
              </span>
            </div>

            {expandedSchool === school.id && (
              <div className="tenant-school-detail">
                {detailLoading ? (
                  <div className="tenant-loading">Loading school details...</div>
                ) : schoolDetail ? (
                  <div className="tenant-detail-content">
                    <div className="tenant-detail-stats">
                      <span>{schoolDetail.school.admin_count} admin{schoolDetail.school.admin_count !== 1 ? "s" : ""}</span>
                      <span>{schoolDetail.school.instructor_count} instructor{schoolDetail.school.instructor_count !== 1 ? "s" : ""}</span>
                      <span>{schoolDetail.school.student_count} student{schoolDetail.school.student_count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="tenant-member-table">
                      <div className="tenant-member-header">
                        <span>Name</span>
                        <span>Email</span>
                        <span>Role</span>
                        <span>Joined</span>
                      </div>
                      {schoolDetail.members.map((m) => (
                        <div key={m.id} className="tenant-member-row">
                          <span>{m.name}</span>
                          <span>{m.email}</span>
                          <span className={`role-badge role-${m.role}`}>{m.role}</span>
                          <span>{new Date(m.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete School"
          message={`Permanently delete "${confirmDelete.name}" and all its data (${confirmDelete.member_count} members, ${confirmDelete.session_count} sessions, ${confirmDelete.class_count} classes)? This cannot be undone.`}
          confirmLabel="Delete School"
          confirmVariant="danger"
          onConfirm={() => handleDeleteSchool(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
