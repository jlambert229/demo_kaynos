import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import AppIcon from "./AppIcon";

const CATEGORIES = [
  { value: "bug", label: "Bug Report", icon: "warning" },
  { value: "account", label: "Account Issue", icon: "bust-in-silhouette" },
  { value: "billing", label: "Billing Question", icon: "money-bag" },
  { value: "video", label: "Video / Upload Issue", icon: "clapper-board" },
  { value: "feature", label: "Feature Request", icon: "light-bulb" },
  { value: "other", label: "Other", icon: "speech-balloon" },
];

export default function SupportPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ category: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const canSubmit =
    form.category &&
    form.subject.trim().length >= 3 &&
    form.message.trim().length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const data = await api.support.submit(form);
      setSubmitted(data);
      toast.success("Support request submitted");
    } catch (err) {
      toast.error(err.message || "Failed to submit support request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({ category: "", subject: "", message: "" });
    setSubmitted(null);
  };

  if (submitted) {
    return (
      <>
        <div className="page-header">
          <div className="page-title">Support</div>
        </div>
        <div className="page-body page-body-narrow">
          <div className="support-success">
            <div className="support-success-icon">
              <AppIcon name="check-mark-button" size={48} />
            </div>
            <h2>Request Submitted</h2>
            <p>{submitted.message}</p>
            <div className="support-ref">
              Reference: <code>{submitted.reference}</code>
            </div>
            <p className="support-success-hint">
              Save this reference number. We'll respond to{" "}
              <strong>{user.email}</strong>.
            </p>
            <div className="support-success-actions">
              <button type="button" className="btn-primary" onClick={handleReset}>
                Submit another request
              </button>
              <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: "none" }}>
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">Support</div>
        <div className="page-subtitle">
          Describe your issue and we'll get back to you
        </div>
      </div>
      <div className="page-body page-body-narrow">
        <form className="support-form" onSubmit={handleSubmit}>
          <div className="support-section">
            <label className="support-label">What do you need help with?</label>
            <div className="support-category-grid">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`support-category-btn ${form.category === cat.value ? "active" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                >
                  <span className="support-category-icon" aria-hidden>
                    <AppIcon name={cat.icon} size={20} />
                  </span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="support-section">
            <label className="support-label" htmlFor="support-subject">
              Subject
            </label>
            <input
              id="support-subject"
              className="login-input"
              placeholder="Brief summary of your issue"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              maxLength={200}
            />
          </div>

          <div className="support-section">
            <label className="support-label" htmlFor="support-message">
              Description
            </label>
            <textarea
              id="support-message"
              className="support-textarea"
              placeholder="Please provide as much detail as possible. Include steps to reproduce if reporting a bug."
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={6}
              maxLength={5000}
            />
            <div className="support-char-count">
              {form.message.length} / 5000
            </div>
          </div>

          <div className="support-submit-row">
            <button
              type="submit"
              className="login-btn btn-submit-wide"
              disabled={submitting || !canSubmit}
            >
              {submitting ? "Submitting..." : "Submit support request"}
            </button>
          </div>

          <p className="support-footer-note">
            We'll respond to <strong>{user.email}</strong>. You can also email
            us directly at{" "}
            <a href="mailto:support@kaynos.app">support@kaynos.app</a>.
          </p>
        </form>
      </div>
    </>
  );
}
