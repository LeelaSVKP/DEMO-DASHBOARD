import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ProtectedRoute from "./components/ProtectedRoute";
import ViewImagesPage from "./pages/Reports";
import AnalyticsPage from "./pages/AnalyticsPage";
import LoginPage from "./pages/LoginPage";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Alerts from "./pages/Alerts"; 
import Projects from "./pages/Projects"; 
import AdminManagement from "./pages/AdminManagement"; 
import UserManagement from "./pages/UserManagement"; 


// ✅ NEW IMPORT
import SuperAdminDashboard from "./pages/SuperAdminDashboard"; 
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import PilotUpload from "./pages/PilotUpload";
import "./App.css";




export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);
  useEffect(() => {
  if (!user) return;

  const tabKey = "APP_ACTIVE_TAB";

  // check existing tab
  const existing = localStorage.getItem(tabKey);

  if (existing && existing !== window.name) {
    alert("Session already open in another tab");
    localStorage.clear();
    setUser(null);
    window.location.href = "/login";
    return;
  }

  // assign tab id
  const tabId = Date.now().toString();
  window.name = tabId;
  localStorage.setItem(tabKey, tabId);

  const handleStorage = (e) => {
    if (e.key === tabKey && e.newValue !== tabId) {
      alert("Logged in from another tab");
      localStorage.clear();
      setUser(null);
      window.location.href = "/login";
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    localStorage.removeItem(tabKey);
    window.removeEventListener("storage", handleStorage);
  };
}, [user]);

  if (loading) return null;

  // Landing page logic
  const getLandingPage = () => {
    if (!user) return "/login";
    if (user.role === "superadmin") return "/superadmin-dashboard";
    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "user" || user.role === "annotator") return "/user-dashboard";
    if (user.role === "pilot") return "/pilot-dashboard";
    return "/login";
  };

  return (
    <div className="app-root">
      {/* Sidebar renders if user is logged in */}
      {user && <Sidebar user={user} setUser={setUser} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
      
      <main className={user ? `main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}` : "auth-content"}>
        {user && <TopBar user={user} hideUpload={location.pathname === "/images"} title={location.pathname === "/images" ? "" : "Dashboard"} />}

        <Routes>
          {/* AUTH ROUTES */}
          <Route 
            path="/login" 
            element={user ? <Navigate to={getLandingPage()} replace /> : <LoginPage setUser={setUser} />} 
          />
          <Route 
            path="/super-login" 
            element={user ? <Navigate to={getLandingPage()} replace /> : <SuperAdminLogin setUser={setUser} />} 
          />

          {/* DASHBOARD ROUTES */}
          <Route
            path="/superadmin-dashboard"
            element={
              <ProtectedRoute user={user} requiredRoles={["superadmin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute user={user} requiredRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute user={user} requiredRoles={["user", "annotator"]}>
                <UserDashboard user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pilot-dashboard"
            element={
              <ProtectedRoute user={user} requiredRoles={["pilot"]}>
                <PilotUpload user={user} />
              </ProtectedRoute>
            }
          />
          <Route
  path="/project/:projectId"
  element={
    <ProtectedRoute user={user} requiredRoles={["superadmin", "admin"]}>
      <ViewImagesPage user={user} />
    </ProtectedRoute>
  }
/>

          {/* SHARED ROUTES (Everyone) */}
          <Route 
            path="/images" 
            element={
              <ProtectedRoute user={user} requiredRoles={["superadmin", "admin", "user", "annotator"]}>
                <ViewImagesPage user={user} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute user={user} requiredRoles={["superadmin", "admin", "user", "annotator"]}>
                <AnalyticsPage user={user} setUser={setUser} />
              </ProtectedRoute>
            } 
          />

          {/* ADMIN ONLY ROUTE */}
          {/* User Management hidden per request */}

          {/* SUPER ADMIN ONLY ROUTES */}
          <Route 
            path="/alerts" 
            element={
              <ProtectedRoute user={user} requiredRoles={["superadmin"]}>
                <Alerts />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/projects" 
            element={
              <ProtectedRoute user={user} requiredRoles={["superadmin"]}>
                <Projects />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin-management" 
            element={
              <ProtectedRoute user={user} requiredRoles={["superadmin"]}>
                <AdminManagement />
              </ProtectedRoute>
            } 
          />

          {/* ROOT & CATCH-ALL */}
          <Route path="/" element={<Navigate to={getLandingPage()} replace />} />
          <Route path="*" element={<Navigate to={getLandingPage()} replace />} />
        </Routes>
      </main>
    </div>
  );
}