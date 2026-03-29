import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import KaynosLogo from "./KaynosLogo";
import AppIcon from "./AppIcon";

const TRIAL_DAYS = 14;
const PLAN_PRICE = "$49";

const STEPS = ["Details", "Confirm"];

function StepIndicator({ current }) {
  return (
    <div className="signup-steps">
      {STEPS.map((label, i) => (
        <div
          key={label}
          className={`signup-step ${i < current ? "done" : i === current ? "active" : ""}`}
        >
          <div className="signup-step-dot">
            {i < current ? <AppIcon name="check" size={12} /> : <span>{i + 1}</span>}
          </div>
          <span className="signup-step-label">{label}</span>
          {i < STEPS.length - 1 && <div className="signup-step-line" />}
        </div>
      ))}
    </div>
  );
}

export default function SchoolSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    schoolName: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateDetails() {
    const errs = {};
    if (form.schoolName.trim().length < 2) errs.schoolName = "School name is too short";
    if (form.adminName.trim().length < 2) errs.adminName = "Name is too short";
    if (!form.adminEmail.includes("@")) errs.adminEmail = "Enter a valid email";
    if (form.adminPassword.length < 8) errs.adminPassword = "Password must be at least 8 characters";
    if (form.adminPassword !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateDetails()) setStep(1);
  }

  async function handleSubmit() {
    setLoading(true);
    setErrors({});
    try {
      const data = await api.signup.createSchool({
        schoolName: form.schoolName.trim(),
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPassword: form.adminPassword,
        plan: "pro",
      });
      setResult(data);
      setStep(2);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }

  if (step === 2 && result) {
    return (
      <div className="signup-wrap">
        <div className="signup-success">
          <div className="signup-success-icon">
            <AppIcon name="check-circle" size={48} />
          </div>
          <h2>You're all set!</h2>
          <p>
            <strong>{result.school.name}</strong> is ready.
            Your {TRIAL_DAYS}-day free trial has started.
          </p>
          <p className="signup-success-sub">
            No payment needed until your trial ends on day {TRIAL_DAYS}.
          </p>
          {result.emailSent && (
            <p className="signup-success-email">
              A confirmation was sent to <strong>{form.adminEmail}</strong>.
            </p>
          )}
          <button className="login-btn signup-success-btn" onClick={() => navigate("/")}>
            Sign in to your school
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-wrap">
      <div className="signup-shell">
        <div className="signup-header">
          <Link to="/" className="signup-logo-link">
            <KaynosLogo size="sm" />
            <span>Kaynos</span>
          </Link>
          <p className="signup-tagline">
            {TRIAL_DAYS}-day free trial &mdash; no credit card required.
            Then {PLAN_PRICE}/month.
          </p>
        </div>

        <StepIndicator current={step} />

        {step === 0 && (
          <section className="signup-section signup-section-narrow">
            <h2 className="signup-section-title">Create your school</h2>
            <p className="signup-section-sub">Get started in under a minute.</p>

            <div className="signup-form">
              <div className="login-input-group">
                <label className="login-label" htmlFor="su-school-name">School name</label>
                <input
                  id="su-school-name"
                  className={`login-input ${errors.schoolName ? "input-error" : ""}`}
                  placeholder="e.g. Gracie Barra Downtown"
                  autoComplete="organization"
                  value={form.schoolName}
                  onChange={(e) => setField("schoolName", e.target.value)}
                  autoFocus
                />
                {errors.schoolName && <div className="field-hint field-hint-error">{errors.schoolName}</div>}
              </div>

              <div className="login-input-group">
                <label className="login-label" htmlFor="su-name">Your name</label>
                <input
                  id="su-name"
                  className={`login-input ${errors.adminName ? "input-error" : ""}`}
                  placeholder="Head instructor / owner"
                  autoComplete="name"
                  value={form.adminName}
                  onChange={(e) => setField("adminName", e.target.value)}
                />
                {errors.adminName && <div className="field-hint field-hint-error">{errors.adminName}</div>}
              </div>

              <div className="login-input-group">
                <label className="login-label" htmlFor="su-email">Email</label>
                <input
                  id="su-email"
                  className={`login-input ${errors.adminEmail ? "input-error" : ""}`}
                  type="email"
                  placeholder="you@yourschool.com"
                  autoComplete="email"
                  value={form.adminEmail}
                  onChange={(e) => setField("adminEmail", e.target.value)}
                />
                {errors.adminEmail && <div className="field-hint field-hint-error">{errors.adminEmail}</div>}
              </div>

              <div className="login-input-group">
                <label className="login-label" htmlFor="su-password">Password</label>
                <input
                  id="su-password"
                  className={`login-input ${errors.adminPassword ? "input-error" : ""}`}
                  type="password"
                  placeholder="8+ characters"
                  autoComplete="new-password"
                  value={form.adminPassword}
                  onChange={(e) => setField("adminPassword", e.target.value)}
                />
                {errors.adminPassword && <div className="field-hint field-hint-error">{errors.adminPassword}</div>}
              </div>

              <div className="login-input-group">
                <label className="login-label" htmlFor="su-confirm">Confirm password</label>
                <input
                  id="su-confirm"
                  className={`login-input ${errors.confirmPassword ? "input-error" : ""}`}
                  type="password"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                />
                {errors.confirmPassword && <div className="field-hint field-hint-error">{errors.confirmPassword}</div>}
              </div>
            </div>

            <button type="button" className="login-btn signup-next-btn" onClick={handleNext}>
              Continue <AppIcon name="arrow-right" size={16} />
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="signup-section signup-section-narrow">
            <h2 className="signup-section-title">Review &amp; start trial</h2>

            {errors.submit && <div className="login-error" style={{ marginBottom: 16 }}>{errors.submit}</div>}

            <div className="signup-review-card">
              <div className="signup-review-row">
                <span>School</span>
                <strong>{form.schoolName}</strong>
              </div>
              <div className="signup-review-row">
                <span>Admin</span>
                <strong>{form.adminName} ({form.adminEmail})</strong>
              </div>
              <div className="signup-review-row">
                <span>Plan</span>
                <strong>{PLAN_PRICE}/month &mdash; billed monthly</strong>
              </div>
              <div className="signup-review-row signup-review-row-total">
                <span>Due today</span>
                <strong>$0.00</strong>
              </div>
              <p className="signup-review-note">
                Free for {TRIAL_DAYS} days. No card needed until your trial ends. Cancel anytime.
              </p>
            </div>

            <div className="signup-trial-notice">
              <AppIcon name="shield-check" size={16} />
              <span>No credit card required to start your trial.</span>
            </div>

            <div className="signup-nav">
              <button type="button" className="btn-secondary signup-back-btn" onClick={() => setStep(0)}>
                <AppIcon name="arrow-left" size={16} /> Back
              </button>
              <button
                type="button"
                className="login-btn signup-next-btn"
                onClick={handleSubmit}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "Creating your school..." : "Start free trial"}
              </button>
            </div>
          </section>
        )}

        <p className="signup-footer-link">
          Already have an account?{" "}
          <Link to="/">Sign in</Link>
        </p>
        <p className="signup-footer-link" style={{ marginTop: 8 }}>
          By signing up you agree to our{" "}
          <Link to="/terms">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
