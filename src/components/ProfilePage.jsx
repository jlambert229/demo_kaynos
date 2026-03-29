import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api";
import { useToast } from "./Toast";
import AppIcon from "./AppIcon";

function getInitials(name) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatMemberSince(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function avatarStyleForName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return {
    background: `linear-gradient(145deg, hsl(${hue}, 52%, 42%), hsl(${(hue + 48) % 360}, 45%, 28%))`,
    color: "rgba(255,255,255,0.95)",
    borderColor: `hsla(${hue}, 40%, 55%, 0.35)`,
  };
}

function ProfileSectionTitle({ icon, title, description }) {
  return (
    <div className="profile-section-title-block">
      <div className="profile-section-title-row">
        <span className="profile-section-icon-wrap" aria-hidden>
          <AppIcon name={icon} size={18} />
        </span>
        <div>
          <h3>{title}</h3>
          {description ? <p className="profile-section-desc">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [revealPw, setRevealPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications !== false);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    if (!editMode) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user.name, user.email, editMode]);

  const avatarStyle = useMemo(() => avatarStyleForName(user.name), [user.name]);

  const newPwOk = newPw.length >= 8;
  const passwordsMatch = newPw.length > 0 && newPw === confirmPw;
  const canSubmitPassword =
    Boolean(newPw && confirmPw) &&
    newPwOk &&
    passwordsMatch &&
    Boolean(currentPw);

  const handleSaveProfile = async () => {
    const updates = {};
    if (name.trim() !== user.name) updates.name = name.trim();
    if (email.trim() !== user.email) updates.email = email.trim();
    if (Object.keys(updates).length === 0) {
      setEditMode(false);
      return;
    }
    setSaving(true);
    try {
      const data = await api.auth.updateProfile(updates);
      updateUser(data.user);
      setEditMode(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!canSubmitPassword) {
      if (newPw !== confirmPw) toast.error("Passwords don't match");
      else if (!newPwOk) toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      await api.auth.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setShowPw(false);
      setRevealPw(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password changed");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  const roleLabel = { admin: "Admin", instructor: "Instructor", student: "Student" }[user.role] || user.role;
  const roleModifier =
    user.role === "student" ? "student" : user.role === "admin" ? "admin" : "instructor";

  const pwInputType = revealPw ? "text" : "password";

  return (
    <>
      <div className="page-header">
        <div className="page-title">Profile</div>
        <div className="page-subtitle">Manage your account and security</div>
      </div>
      <div className="page-body page-body-narrow">
        <div className="profile-hero">
          <div className="profile-avatar" style={avatarStyle}>
            {getInitials(user.name)}
          </div>
          <div className="profile-hero-info">
            <div className="profile-hero-name">{user.name}</div>
            <div className="profile-hero-email">{user.email}</div>
            <div className="profile-hero-meta">
              <span className={`profile-role-badge profile-role-badge--${roleModifier}`}>{roleLabel}</span>
              <span className="profile-meta-sep" aria-hidden>
                ·
              </span>
              <span>{user.schoolName}</span>
              {user.createdAt ? (
                <>
                  <span className="profile-meta-sep" aria-hidden>
                    ·
                  </span>
                  <span>Member since {formatMemberSince(user.createdAt)}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-header">
            <ProfileSectionTitle
              icon="bust-in-silhouette"
              title="Account details"
              description="Your name, email, role, and school"
            />
            {!editMode ? (
              <button type="button" className="profile-edit-btn" onClick={() => setEditMode(true)}>
                <span className="profile-edit-btn-inner">
                  <AppIcon name="pencil" size={14} />
                  Edit
                </span>
              </button>
            ) : null}
          </div>
          <div className={`profile-card${editMode ? " profile-card--stacked-form" : ""}`}>
            <div className="profile-field">
              <span className="profile-field-label">Name</span>
              {editMode ? (
                <input
                  className="profile-field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                />
              ) : (
                <span className="profile-field-value">{user.name}</span>
              )}
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Email</span>
              {editMode ? (
                <input
                  className="profile-field-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              ) : (
                <span className="profile-field-value">{user.email}</span>
              )}
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Role</span>
              <span className="profile-field-value">{roleLabel}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">School</span>
              <span className="profile-field-value">{user.schoolName}</span>
            </div>
            {editMode ? (
              <div className="profile-field-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditMode(false);
                    setName(user.name);
                    setEmail(user.email);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={saving || !name.trim() || !email.trim()}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-header">
            <ProfileSectionTitle
              icon="lock"
              title="Password"
              description="Change the password you use to sign in"
            />
            {!showPw ? (
              <button type="button" className="profile-edit-btn" onClick={() => setShowPw(true)}>
                Change
              </button>
            ) : null}
          </div>
          {showPw ? (
            <div className="profile-card profile-card--stacked-form">
              <div className="profile-field">
                <span className="profile-field-label" id="pw-current-label">
                  Current password
                </span>
                <input
                  className="profile-field-input"
                  type={pwInputType}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                  aria-labelledby="pw-current-label"
                />
              </div>
              <div className="profile-field">
                <span className="profile-field-label" id="pw-new-label">
                  New password
                </span>
                <input
                  className="profile-field-input"
                  type={pwInputType}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  aria-labelledby="pw-new-label"
                  minLength={8}
                  autoFocus
                />
              </div>
              <div className="profile-field">
                <span className="profile-field-label" id="pw-confirm-label">
                  Confirm password
                </span>
                <input
                  className="profile-field-input"
                  type={pwInputType}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                  aria-labelledby="pw-confirm-label"
                />
              </div>

              <div className="profile-pw-extras">
                <label className="profile-pw-reveal">
                  <input
                    type="checkbox"
                    checked={revealPw}
                    onChange={(e) => setRevealPw(e.target.checked)}
                  />
                  Show passwords
                </label>
                <div className="profile-pw-hints" aria-live="polite">
                  <span className={newPwOk ? "profile-hint profile-hint--ok" : "profile-hint"}>At least 8 characters</span>
                  {confirmPw.length > 0 ? (
                    <span
                      className={
                        passwordsMatch ? "profile-hint profile-hint--ok" : "profile-hint profile-hint--warn"
                      }
                    >
                      {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="profile-field-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowPw(false);
                    setRevealPw(false);
                    setCurrentPw("");
                    setNewPw("");
                    setConfirmPw("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleChangePassword}
                  disabled={savingPw || !canSubmitPassword}
                >
                  {savingPw ? "Changing..." : "Change password"}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-card">
              <div className="profile-field">
                <span className="profile-field-label">Password</span>
                <span className="profile-field-value profile-field-value-muted">
                  {user.hasPassword ? "••••••••" : "Not set"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <div className="profile-section-header">
            <ProfileSectionTitle
              icon="bell"
              title="Notifications"
              description="Control which emails you receive"
            />
          </div>
          <div className="profile-card">
            <div className="profile-field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span className="profile-field-label" style={{ display: "block" }}>Email notifications</span>
                <span className="profile-field-value profile-field-value-muted" style={{ fontSize: 13 }}>
                  New sessions, class recordings, and notes from instructors
                </span>
              </div>
              <label className="profile-toggle" aria-label="Toggle email notifications">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  disabled={savingNotif}
                  onChange={async (e) => {
                    const newVal = e.target.checked;
                    setEmailNotifications(newVal);
                    setSavingNotif(true);
                    try {
                      const data = await api.auth.updateProfile({ emailNotifications: newVal });
                      updateUser(data.user);
                      toast.success(newVal ? "Notifications enabled" : "Notifications disabled");
                    } catch (err) {
                      setEmailNotifications(!newVal);
                      toast.error(err.message);
                    } finally {
                      setSavingNotif(false);
                    }
                  }}
                />
                <span className="profile-toggle-track">
                  <span className="profile-toggle-thumb" />
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-header">
            <ProfileSectionTitle
              icon="speech-balloon"
              title="Help & Support"
              description="Having trouble? Let us know"
            />
          </div>
          <div className="profile-card">
            <div className="profile-field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span className="profile-field-label" style={{ display: "block" }}>Contact support</span>
                <span className="profile-field-value profile-field-value-muted" style={{ fontSize: 13 }}>
                  Report bugs, ask questions, or request features
                </span>
              </div>
              <Link to="/support" className="profile-edit-btn" style={{ textDecoration: "none" }}>
                Get help
              </Link>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-header">
            <ProfileSectionTitle icon="log-out" title="Session" description="Sign out on this browser or device" />
          </div>
          <div className="profile-card profile-signout-card">
            <p className="profile-signout-hint">You will need your credentials to sign in again.</p>
            <button type="button" className="profile-signout-btn" onClick={logout}>
              <AppIcon name="log-out" size={18} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
