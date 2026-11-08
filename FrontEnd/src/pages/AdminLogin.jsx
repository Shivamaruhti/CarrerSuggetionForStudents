
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!adminId.trim() || !password) {
      setError("Enter both Admin ID and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "/api"}/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminId: adminId.trim(),
            password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Invalid admin credentials.");
      }

      if (!data.token) {
        throw new Error(
          "The server did not return an authentication token."
        );
      }

      sessionStorage.setItem("adminToken", data.token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <header className="admin-brand">
        <div className="brand-mark">CS</div>
        <div>
          <h1>Career Suggestion</h1>
          <p>FOR STUDENTS</p>
        </div>
      </header>

      <section className="login-layout">
        <div className="login-welcome">
          <span className="eyebrow">ADMINISTRATION PORTAL</span>
          <h2>Help students discover their future.</h2>
          <p>
            Manage users, education pathways, courses and job
            opportunities from one central workspace.
          </p>
          <div className="welcome-art" aria-hidden="true">
            <span className="art-book">📚</span>
            <span className="art-cap">🎓</span>
          </div>
        </div>

        <div className="login-card">
          <div className="login-icon">♙</div>
          <span className="eyebrow">SECURE ACCESS</span>
          <h2>Admin Login</h2>
          <p className="login-subtitle">
            Sign in with your administrator credentials.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="admin-field">
              <label htmlFor="adminId">Admin ID</label>
              <input
                id="adminId"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                autoComplete="username"
                placeholder="Enter Admin ID"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="adminPassword">Password</label>
              <div className="password-wrap">
                <input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="primary-button login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="login-subtitle">
            Authorized administrators only.
          </p>
        </div>
      </section>

      <footer className="login-footer">
        © {new Date().getFullYear()} Career Suggestion for Students
      </footer>
    </main>
  );
}
