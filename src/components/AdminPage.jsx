import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth";
import { api } from "../api";
import AppIcon from "./AppIcon";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "./Toast";
import useFocusTrap from "../hooks/useFocusTrap";

function getInitials(name) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const ROLE_LABELS = { admin: "School Admin", instructor: "Instructor", student: "Student" };
const ROLE_COLORS = { admin: "var(--orange)", instructor: "var(--accent)", student: "var(--green)" };

function StatCard({ label, value, icon }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">
        <AppIcon name={icon} size={28} />
      </div>
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span className="admin-role-badge" style={{ color: ROLE_COLORS[role], background: `${ROLE_COLORS[role]}18` }}>
      {ROLE_LABELS[role]}
    </span>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const addModalRef = useFocusTrap(showAddModal);
  const [addForm, setAddForm] = useState({ name: "", email: "", role: "student" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [tempPassword, setTempPassword] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(null);

  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentEmail, setEditStudentEmail] = useState("");
  const [savingStudent, setSavingStudent] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [schoolRes, statsRes, membersRes] = await Promise.all([
        api.school.get(),
        api.school.stats(),
        api.members.list(),
      ]);
      setSchool(schoolRes.school);
      setNameValue(schoolRes.school.name);
      setStats(statsRes.stats);
      setMembers(membersRes.members);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === school.name) {
      setEditingName(false);
      setNameValue(school.name);
      return;
    }
    setSavingName(true);
    try {
      const res = await api.school.update({ name: nameValue.trim() });
      setSchool(res.school);
      setEditingName(false);
    } catch (err) {
      console.error("Failed to update school:", err);
    } finally {
      setSavingName(false);
    }
  };

  const handleAddMember = async () => {
    if (!addForm.name.trim() || !addForm.email.trim()) return;
    setAddSaving(true);
    setAddError("");
    try {
      const data = await api.members.add(addForm);
      setMembers((prev) => [...prev, data.member]);
      setTempPassword(data.emailSent ? "emailed" : "email-failed");
      setAddForm({ name: "", email: "", role: "student" });
      setShowAddModal(false);
      const statsRes = await api.school.stats();
      setStats(statsRes.stats);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddSaving(false);
    }
  };

  const startEditStudent = (m) => {
    setConfirmDelete(null);
    setEditingStudentId(m.id);
    setEditStudentName(m.name);
    setEditStudentEmail(m.email);
  };

  const cancelEditStudent = () => {
    setEditingStudentId(null);
    setEditStudentName("");
    setEditStudentEmail("");
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const res = await api.members.update(memberId, { role: newRole });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? res.member : m)));
      if (editingStudentId === memberId) cancelEditStudent();
      const statsRes = await api.school.stats();
      setStats(statsRes.stats);
      toast.success("Role updated");
    } catch (err) {
      toast.error(err.message || "Could not update role");
    }
  };

  const handleSaveStudent = async () => {
    if (!editingStudentId) return;
    const name = editStudentName.trim();
    const email = editStudentEmail.trim();
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    setSavingStudent(true);
    try {
      const res = await api.members.update(editingStudentId, { name, email });
      setMembers((prev) => prev.map((m) => (m.id === editingStudentId ? res.member : m)));
      cancelEditStudent();
      toast.success("Student updated");
    } catch (err) {
      toast.error(err.message || "Could not save student");
    } finally {
      setSavingStudent(false);
    }
  };

  const handleRemove = async (memberId) => {
    try {
      await api.members.remove(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setConfirmDelete(null);
      if (editingStudentId === memberId) cancelEditStudent();
      const statsRes = await api.school.stats();
      setStats(statsRes.stats);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.message || "Could not remove member");
    }
  };

  const handleResetPassword = async (memberId) => {
    try {
      const data = await api.members.resetPassword(memberId);
      setConfirmReset(null);
      if (data.emailSent) {
        toast.success("Password reset. New password emailed to the member.");
      } else {
        toast.success("Password reset, but email could not be sent. Check email settings.");
      }
    } catch (err) {
      toast.error(err.message || "Could not reset password");
      setConfirmReset(null);
    }
  };

  const exportCSV = () => {
    const header = "Name,Email,Role\n";
    const rows = members.map((m) =>
      `"${m.name.replace(/"/g, '""')}","${m.email.replace(/"/g, '""')}",${m.role}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${school?.name || "school"}-roster.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="sk-title sk-line" style={{ width: "55%", height: 24 }} />
          <div className="sk-line" style={{ width: "85%", height: 12, marginTop: 10 }} />
        </div>
        <div className="page-body">
          <section className="admin-section" style={{ marginBottom: 24 }}>
            <div className="sk-line" style={{ width: 100, height: 14, marginBottom: 16 }} />
            <div className="admin-card" style={{ padding: 20 }}>
              <div className="sk-line" style={{ width: "100%", height: 44, marginBottom: 12 }} />
              <div className="sk-line" style={{ width: "70%", height: 14 }} />
            </div>
          </section>
          <div className="admin-stats-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="admin-stat-card" aria-hidden>
                <div className="sk-line" style={{ width: 32, height: 24, margin: "0 auto 10px" }} />
                <div className="sk-line" style={{ width: "45%", height: 22, margin: "0 auto 8px" }} />
                <div className="sk-line sk-line-sm" style={{ width: "70%", margin: "0 auto" }} />
              </div>
            ))}
          </div>
          <div className="skeleton-list" style={{ marginTop: 28 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="sk-card" style={{ "--i": i }} />
            ))}
          </div>
        </div>
      </>
    );
  }

  const admins = members.filter((m) => m.role === "admin");
  const instructors = members.filter((m) => m.role === "instructor");
  const students = members.filter((m) => m.role === "student");

  return (
    <>
      <div className="page-header">
        <div className="page-title">Administration</div>
        <div className="page-subtitle">Manage your school, members, and settings</div>
      </div>
      <div className="page-body">
        {tempPassword && (
          <div className="temp-password-banner" style={{ marginBottom: 24 }}>
            {tempPassword === "emailed" ? (
              <p>Member added. Their temporary password has been emailed to them.</p>
            ) : (
              <p>Member added, but the email could not be sent. Please check your RESEND_API_KEY and FROM_EMAIL settings.</p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn-secondary" style={{ height: 32, fontSize: 12 }} onClick={() => setTempPassword(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* School Settings */}
        <section className="admin-section">
          <div className="admin-section-header">
            <h3>School</h3>
          </div>
          <div className="admin-card">
            <div className="admin-field-row">
              <div className="admin-field-label">School Name</div>
              {editingName ? (
                <div className="admin-field-edit">
                  <input
                    className="admin-inline-input"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") { setEditingName(false); setNameValue(school.name); }
                    }}
                    autoFocus
                    disabled={savingName}
                  />
                  <button className="btn-primary" style={{ height: 36, fontSize: 13 }} onClick={handleSaveName} disabled={savingName}>
                    {savingName ? "Saving..." : "Save"}
                  </button>
                  <button className="btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={() => { setEditingName(false); setNameValue(school.name); }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="admin-field-value">
                  <span>{school.name}</span>
                  <button className="admin-edit-btn" onClick={() => setEditingName(true)}>Edit</button>
                </div>
              )}
            </div>
            <div className="admin-field-row">
              <div className="admin-field-label">Created</div>
              <div className="admin-field-value">
                <span>{new Date(school.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        {stats && (
          <section className="admin-section">
            <div className="admin-section-header">
              <h3>Overview</h3>
            </div>
            <div className="admin-stats-grid">
              <StatCard icon="busts-in-silhouette" value={stats.total_members} label="Total Members" />
              <StatCard icon="graduation-cap" value={stats.total_students} label="Students" />
              <StatCard icon="martial-arts-uniform" value={stats.total_instructors} label="Instructors" />
              <StatCard icon="clapper-board" value={stats.total_sessions} label="Sessions" />
              <StatCard icon="clipboard" value={stats.total_classes} label="Classes" />
              <StatCard icon="memo" value={Number(stats.total_session_notes) + Number(stats.total_class_notes)} label="Notes" />
            </div>
          </section>
        )}

        {/* Members */}
        <section className="admin-section">
          <div className="admin-section-header">
            <h3>Members</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={exportCSV}>
                Export CSV
              </button>
              <button className="btn-primary" style={{ height: 36, fontSize: 13 }} onClick={() => setShowAddModal(true)}>
                + Add Member
              </button>
            </div>
          </div>

          {[
            { label: "School Admins", list: admins },
            { label: "Instructors", list: instructors },
            { label: "Students", list: students },
          ].map(({ label, list }) => (
            list.length > 0 && (
              <div key={label} className="admin-member-group">
                <div className="admin-group-label">{label} ({list.length})</div>
                <div className="admin-member-list">
                  {list.map((m) => (
                    <div
                      key={m.id}
                      className={`admin-member-row${editingStudentId === m.id ? " admin-member-row--editing-student" : ""}`}
                    >
                      <div className="admin-member-avatar">{getInitials(editingStudentId === m.id ? editStudentName || m.name : m.name)}</div>
                      <div className="admin-member-info">
                        {m.role === "student" && editingStudentId === m.id ? (
                          <>
                            <input
                              className="admin-member-input"
                              value={editStudentName}
                              onChange={(e) => setEditStudentName(e.target.value)}
                              autoComplete="name"
                              aria-label="Student name"
                              disabled={savingStudent}
                            />
                            <input
                              className="admin-member-input admin-member-input-email"
                              type="email"
                              value={editStudentEmail}
                              onChange={(e) => setEditStudentEmail(e.target.value)}
                              autoComplete="email"
                              aria-label="Student email"
                              disabled={savingStudent}
                            />
                            <div className="admin-member-edit-actions">
                              <button
                                type="button"
                                className="btn-primary admin-member-save-btn"
                                onClick={handleSaveStudent}
                                disabled={savingStudent || !editStudentName.trim() || !editStudentEmail.trim()}
                              >
                                {savingStudent ? "Saving…" : "Save"}
                              </button>
                              <button type="button" className="btn-secondary admin-member-save-btn" onClick={cancelEditStudent} disabled={savingStudent}>
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="admin-member-name">
                              {m.name}
                              {m.id === user.id && <span className="admin-you-badge">You</span>}
                            </div>
                            <div className="admin-member-email">{m.email}</div>
                          </>
                        )}
                      </div>
                      <RoleBadge role={m.role} />
                      {m.role !== "admin" && m.id !== user.id && (
                        <div className="admin-member-actions">
                          {m.role === "student" && editingStudentId !== m.id && (
                            <button type="button" className="admin-edit-btn admin-edit-member-btn" onClick={() => startEditStudent(m)} title="Edit student">
                              <span className="admin-edit-member-inner">
                                <AppIcon name="pencil" size={14} />
                                Edit
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-edit-btn admin-edit-member-btn"
                            onClick={() => { setConfirmReset(m); setConfirmDelete(null); }}
                            title="Reset password"
                          >
                            <span className="admin-edit-member-inner">
                              <AppIcon name="lock" size={14} />
                              Reset password
                            </span>
                          </button>
                          <select
                            className="admin-role-select"
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            disabled={editingStudentId === m.id}
                            aria-label={`Role for ${m.name}`}
                          >
                            <option value="instructor">Instructor</option>
                            <option value="student">Student</option>
                          </select>
                          <button
                            type="button"
                            className="admin-remove-btn"
                            onClick={() => {
                              setConfirmDelete(m);
                              if (editingStudentId === m.id) cancelEditStudent();
                            }}
                            title="Remove member"
                          >
                            <AppIcon name="cross-mark" size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </section>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Remove Member"
          message={`Remove ${confirmDelete.name} from the school? This cannot be undone.`}
          confirmLabel="Remove"
          confirmVariant="danger"
          onConfirm={() => handleRemove(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmReset && (
        <ConfirmModal
          title="Reset Password"
          message={`Reset the password for ${confirmReset.name}? A new temporary password will be generated and emailed to them.`}
          confirmLabel="Reset"
          confirmVariant="danger"
          onConfirm={() => handleResetPassword(confirmReset.id)}
          onCancel={() => setConfirmReset(null)}
        />
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setAddError(""); }} role="dialog" aria-modal="true" aria-labelledby="add-member-title" onKeyDown={(e) => e.key === "Escape" && setShowAddModal(false)}>
          <div className="modal" ref={addModalRef} onClick={(e) => e.stopPropagation()}>
            <h3 id="add-member-title">Add Member</h3>
            {addError && <div className="login-error">{addError}</div>}
            <div className="modal-field">
              <label>Name</label>
              <input
                placeholder="Full name"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              />
            </div>
            <div className="modal-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="member@email.com"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              />
            </div>
            <div className="modal-field">
              <label>Role</label>
              <select value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
              A temporary password will be generated and emailed to the new member.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowAddModal(false); setAddError(""); }}>Cancel</button>
              <button className="btn-primary" onClick={handleAddMember} disabled={addSaving || !addForm.name.trim() || !addForm.email.trim()}>
                {addSaving ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
