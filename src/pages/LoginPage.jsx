import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import apiFetch from "../utils/api"; // IMPORTANT
import "./login.css";

export default function LoginPage({ setUser }) {
  const [selectedRole, setSelectedRole] = useState("");
  const [view, setView] = useState("select");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // ✅ SINGLE STEP LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          role: selectedRole,
          required_role: selectedRole,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();

      // ✅ Store tokens
      const accessToken = data.access || data.access_token;
      const refreshToken = data.refresh || data.refresh_token;

      if (!accessToken) {
        throw new Error("No access token received");
      }

      localStorage.setItem("access_token", accessToken);

      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }

      // ✅ Save user
      const userData = {
        email,
        role: data.role || selectedRole,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // ✅ Redirect
      navigate(
        selectedRole === "admin"
          ? "/admin-dashboard"
          : selectedRole === "user" || selectedRole === "annotator"
          ? "/user-dashboard"
          : "/pilot-dashboard"
      );

    } catch (err) {
      setError("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setView("select");
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h1>DataDash Portal</h1>
          <p>
            {view === "select"
              ? "Choose your login type"
              : `Login as ${selectedRole}`}
          </p>
        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {view === "select" ? (
          <div className="portal-selector">
            <button
              className="portal-btn admin"
              onClick={() => {
                setSelectedRole("admin");
                setView("form");
              }}
            >
              🛡️ Login as Administrator
            </button>

            <button
              className="portal-btn user"
              onClick={() => {
                setSelectedRole("user");
                setView("form");
              }}
            >
              👤 Login as User
            </button>

            <button
              className="portal-btn pilot"
              onClick={() => {
                setSelectedRole("pilot");
                setView("form");
              }}
            >
              ✈️ Login as Pilot
            </button>

            <button
              className="portal-btn annotator"
              onClick={() => {
                setSelectedRole("annotator");
                setView("form");
              }}
            >
              ✍️ Login as Annotator
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="login-form">

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                />
                <span className="eye-toggle" onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              className="back-link"
              onClick={handleBack}
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}