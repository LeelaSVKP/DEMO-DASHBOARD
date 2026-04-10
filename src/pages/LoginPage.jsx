import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import apiFetch from "../utils/api";
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

      const accessToken = data.access || data.access_token;
      const refreshToken = data.refresh || data.refresh_token;

      if (!accessToken) {
        throw new Error("No access token received");
      }

      localStorage.setItem("access_token", accessToken);

      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }

      const userData = {
        email,
        role: data.role || selectedRole,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      navigate(
        selectedRole === "admin"
          ? "/admin-dashboard"
          : selectedRole === "user" || selectedRole === "annotator"
          ? "/user-dashboard"
          : "/pilot-dashboard"
      );

    } catch (err) {
      setError(err.message);
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
        {view === "select" ? (
          <>
            <div className="login-header">
              <div style={{fontSize: '24px', fontWeight: '700', marginBottom: '8px'}}>
                <span style={{color: '#f97316'}}>AKIN</span>{' '}
                <span style={{color: '#3b82f6'}}>ANALYTICS</span>
              </div>
              <p>Select your account type to continue</p>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="portal-selector">
              <button
                className="portal-btn"
                onClick={() => {
                  setSelectedRole("admin");
                  setView("form");
                }}
              >
                <span className="portal-icon">🛡️</span>
                <span>Login as Administrator</span>
              </button>

              <button
                className="portal-btn"
                onClick={() => {
                  setSelectedRole("user");
                  setView("form");
                }}
              >
                <span className="portal-icon">👤</span>
                <span>Login as User</span>
              </button>

              <button
                className="portal-btn"
                onClick={() => {
                  setSelectedRole("pilot");
                  setView("form");
                }}
              >
                <span className="portal-icon">✈️</span>
                <span>Login as Pilot</span>
              </button>

              <button
                className="portal-btn"
                onClick={() => {
                  setSelectedRole("annotator");
                  setView("form");
                }}
              >
                <span className="portal-icon">✍️</span>
                <span>Login as Annotator</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1>Welcome Back</h1>
              <p>Sign in to your account to continue</p>
            </div>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
              <div>
                <label>Email</label>
                <div className="input-wrapper">
                  <div className="input-icon-left">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@akinanalytics.com"
                  />
                </div>
              </div>

              <div>
                <label>Password</label>
                <div className="input-wrapper password-input-container">
                  <div className="input-icon-left">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Login
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <button type="button" className="back-link" onClick={handleBack}>
              ← Back to roles
            </button>
          </>
        )}
      </div>
    </div>
  );
}