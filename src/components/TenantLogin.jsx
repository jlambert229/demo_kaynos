import { useState } from "react";
import { useAuth } from "../auth";
import KaynosLogo from "./KaynosLogo";

export default function TenantLogin() {
  const { tenantLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitEnabled = !loading && email.length > 0 && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitEnabled) return;
    setError("");
    setLoading(true);
    try {
      await tenantLogin(email, password);
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
          <p>Administration</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-input-group">
            <label className="login-label" htmlFor="tenant-email">Email</label>
            <input
              id="tenant-email"
              className="login-input"
              type="email"
              placeholder="admin@kaynos.app"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-input-group">
            <label className="login-label" htmlFor="tenant-password">Password</label>
            <input
              id="tenant-password"
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
      </div>
    </div>
  );
}
