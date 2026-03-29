import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import KaynosLogo from "./KaynosLogo";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailNeedsAt = email.length > 0 && !email.includes("@");
  const submitEnabled = !loading && !emailNeedsAt && email.length > 0 && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitEnabled) return;
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card login-card-enter">
        <div className="login-logo">
          <KaynosLogo size="lg" />
          <h1>Kaynos</h1>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-input-group">
            <label className="login-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="login-input"
              type="email"
              placeholder="you@academy.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailNeedsAt && (
              <div className="field-hint field-hint-error">Enter a valid email address</div>
            )}
          </div>
          <div className="login-input-group">
            <label className="login-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="login-input"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="login-btn" type="submit" disabled={!submitEnabled} aria-busy={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-signup-link">
          New to Kaynos?{" "}
          <Link to="/signup">Create your school &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
