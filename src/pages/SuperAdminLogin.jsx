import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "./login.css";

const BASE_URL = "https://api-db-67gt.onrender.com";

export default function SuperAdminLogin({ setUser }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ================= LOGIN HANDLER ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Clear previous session data safely
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      // 2. API Call to Login
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          role: "super_admin"
        })
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();

      // 3. Verify tokens exist in response
      if (!data.access_token || !data.refresh_token) {
        throw new Error("Authentication tokens missing");
      }

      // 4. Store tokens for the api.js interceptor
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      // Single tab session control
window.name = Date.now().toString();
localStorage.setItem("APP_ACTIVE_TAB", window.name);

      // 5. Store user session info
      const userData = {
        email,
        role: "superadmin"
      };
      localStorage.setItem("user", JSON.stringify(userData));

      // 6. Update global state and navigate
      setUser?.(userData);
      navigate("/superadmin-dashboard");

    } catch (err) {
      console.error("Login Error:", err);
      setError("❌ Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div
        className="login-card"
        style={{ borderColor: "#4f46e5", borderWidth: "2px", borderStyle: "solid" }}
      >
        <div className="login-header">
          <div
            className="login-logo"
            style={{ background: "#4338ca", display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            🔑
          </div>
          <h1>System Control</h1>
          <p>Super Admin Access Only</p>
        </div>

        {error && (
          <div
            style={{
              color: "#b91c1c",
              background: "#fee2e2",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "15px",
              fontSize: "14px",
              textAlign: "center"
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="admin@system.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Security Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="eye-toggle" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            style={{ background: "#4338ca", cursor: loading ? "not-allowed" : "pointer" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}