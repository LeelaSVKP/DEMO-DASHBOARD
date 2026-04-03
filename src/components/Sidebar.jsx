import React, { useRef } from "react";
import logo from "../assets/akin_analytics_transparent.png";
import { NavLink, useNavigate } from "react-router-dom";
import "./sidebar.css";

// --- ICONS ---
const IconDashboard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;

const IconImages = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M15 2v5h5"/><path d="M8 17v-5"/><path d="M12 17v-2"/><path d="M16 17v-7"/></svg>;
const IconAnalytics = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>;
const IconProjects = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const IconAlerts = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconUpload = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 20h16"/></svg>;
const IconAdmin = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

export default function Sidebar({ user, setUser, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const userRole = user?.role?.toLowerCase() || "";
  const dragState = useRef({ active: false, startX: 0 });

  const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handlePointerDown = (e) => {
    dragState.current.active = true;
    dragState.current.startX = e.clientX;
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.active) return;
    const deltaX = e.clientX - dragState.current.startX;
    if (sidebarOpen && deltaX < -40) {
      setSidebarOpen(false);
      dragState.current.active = false;
    } else if (!sidebarOpen && deltaX > 40) {
      setSidebarOpen(true);
      dragState.current.active = false;
    }
  };

  const handlePointerUp = () => {
    dragState.current.active = false;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
      <div className="sidebar-top">
        <div className="brand">
          <div className="brand-icon-box">
            <img src={logo} alt="Akin Analytics" className="brand-logo" />
          </div>
          <div className="brand-meta">
            <span className="brand-name">Akin Analytics</span>
            <span className="brand-subtitle">Enterprise Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          
          {/* Dashboard */}
{userRole === "superadmin" && (
  <NavLink to="/superadmin-dashboard" className="nav-link">
    <IconDashboard /><span>Dashboard</span>
  </NavLink>
)}

{userRole === "admin" && (
  <NavLink to="/admin-dashboard" className="nav-link">
    <IconDashboard /><span>Dashboard</span>
  </NavLink>
)}

{(userRole === "user" || userRole === "annotator") && (
  <NavLink to="/user-dashboard" className="nav-link">
    <IconDashboard /><span>Dashboard</span>
  </NavLink>
)}


         
          
          {/* 2. Reports + Analytics: visible for all roles */}
          {userRole !== "pilot" && (
            <>
              <NavLink to="/images" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <IconImages /><span>Reports</span>
              </NavLink>

              <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <IconAnalytics /><span>Analytics</span>
              </NavLink>
            </>
          )}

          {userRole === "pilot" && (
            <NavLink to="/pilot-dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <IconUpload /><span>Pilot Upload</span>
            </NavLink>
          )}
          

          {/* 4. SUPER ADMIN SECTIONS */}
          {userRole === "superadmin" && (
            <>
              <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <IconProjects /><span>Projects</span>
              </NavLink>

              <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <IconAlerts /><span>Alerts</span>
              </NavLink>

              <NavLink to="/admin-management" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <IconAdmin /><span>Admins</span>
              </NavLink>
            </>
          )}

          {/* 5. ADMIN SECTIONS */}
          {/* User Management hidden per request */}

          {/* 6. COMPANY LOGO (superadmin only in nav) */}
          {userRole === "superadmin" && (
            <div className="company-logo-box">
              <img src={logo} alt="Akin Analytics" className="company-logo" />
            </div>
          )}
        </nav>
      </div>

      <div
        className="sidebar-drag-zone"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleToggleSidebar}
      >
        <span className="sidebar-drag-icon">{sidebarOpen ? "‹" : "›"}</span>
      </div>

      <div className="sidebar-footer">
        {/* Logo for admin, user, annotator, and pilot roles */}
        {(userRole === "admin" || userRole === "user" || userRole === "annotator" || userRole === "pilot") && (
          <div className="company-logo-box">
            <img src={logo} alt="Akin Analytics" className="company-logo" />
          </div>
        )}
        <div className="user-profile">
          <div className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
          <div className="user-info">
            <h4 className="profile-name">{user.name || "User"}</h4>
            <p className="profile-role" style={{textTransform:'capitalize'}}>{user.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">Sign Out</button>
      </div>
    </aside>
  );
}