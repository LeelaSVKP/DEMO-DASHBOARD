import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Search, CheckCircle, Clock, Upload, Users,
  ArrowLeft, MapPin, BarChart3, Loader2, FileDown, Briefcase
} from "lucide-react";
import CountUp from "react-countup";

import { apiFetch } from "../utils/api";
import projectData from "../data/projects.json";
import UploadPage from "./UploadPage";
import "./SuperAdminDashboard.css";

const DEFAULT_PROJECT_IMG = "https://via.placeholder.com/400x250?text=No+Image";
const DEFAULT_CLIENT_LOGO = "https://via.placeholder.com/80?text=Logo";
const BASE_URL = "https://api-db-67gt.onrender.com";

const UserDashboard = ({ user }) => {
  const navigate = useNavigate();
  const notifRef = useRef(null);
  

  /* ===== DATA STATES ===== */
  const [reportIndustries, setReportIndustries] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);

  /* ===== UI STATES ===== */
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    const loadDashboard = async () => {
      await fetchDashboardData();
      await fetchNotifications();
      await fetchReports();
    };
    loadDashboard();

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await apiFetch("/reports/");
      const data = await res.json();
      setReportIndustries(data.industries || []);
    } catch (err) {
      console.error("Reports fetch error:", err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const dashRes = await apiFetch("/dashboard/");
      if (!dashRes || !dashRes.ok) return;
      const dashData = await dashRes.json();
      setRecentProjects(dashData.recent_projects || []);
    } catch (err) {
      console.error("Dashboard loading error:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch("/dashboard/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Notification API error:", err);
    }
  };

  const markAsRead = async (id) => {
    const targetNotif = notifications.find(n => n.id === id || n._id === id);
    if (!targetNotif || targetNotif.is_read) return;
    setNotifications(prev =>
      prev.map(n => (n.id === id || n._id === id) ? { ...n, is_read: true } : n)
    );
    try {
      await apiFetch(`/dashboard/notifications/${id}/read`, { method: "POST" });
    } catch {
      setNotifications(prev =>
        prev.map(n => (n.id === id || n._id === id) ? { ...n, is_read: false } : n)
      );
    }
  };

  const handleDeliverableClick = async (del) => {
    setLoadingReport(true);

    try {
      const params = new URLSearchParams({
        industry_id: selectedIndustry.mongoId,
        project_id: selectedProject.id,
        deliverable_id: del.id,
        version: 1
      }).toString();

      const res = await apiFetch(`/reports/analytics?${params}`);
      const data = await res.json();

      // ✅ If report does not exist
      if (!data || !data.report) {
        setSelectedDeliverable({ empty: true });

        setSelectedProject(prev => ({
          ...prev,
          report_url: null,
          json_content: null,
          version: null
        }));

        return;
      }

      // ✅ If report exists
      setSelectedDeliverable(data.report);

      setSelectedProject(prev => ({
        ...prev,
        report_url: data.report.report_url,
        json_content: data.report.json_content,
        version: data.report.version
      }));

    } catch (err) {
      console.error("Report fetch error:", err);

      // fallback safe state
      setSelectedDeliverable({ empty: true });

      setSelectedProject(prev => ({
        ...prev,
        report_url: null,
        json_content: null,
        version: null
      }));
    } finally {
      setLoadingReport(false);
    }
  };

  /* ================= RENDER: DELIVERABLES VIEW ================= */
  const renderDeliverablesView = () => (
    <div className="deliverables-wrapper">
      <button
        className="back-btn"
        onClick={() => {
          setDeliverables([]);
          setSelectedProject(null);
          setSelectedIndustry(null);
          setSelectedDeliverable(null);
          // If came from client, selectedClient still set → client industries shows
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="section-title">
  Deliverables — {selectedProject?.project_name || selectedProject?.name}
</h2>
      <div className="industry-grid">
        {deliverables.length === 0 && (
    <div className="empty-text">
      No Deliverables in this project
    </div>
  )}
        
        {deliverables.map((d, i) => (
          <div
            key={d._id || d.id || i}
            className="industry-card"
            onClick={() => handleDeliverableClick(d)}
          >
            <img
              src={formatDeliverableImg(d.deliverable_img_path)}
              alt={d.deliverable_name}
              className="industry-image"
              onError={(e) => {
                if (!e.target.dataset.triedAlt) {
                  e.target.dataset.triedAlt = "true";
                  e.target.src = altDeliverableImg(d.deliverable_img_path);
                } else {
                  e.target.src = DEFAULT_PROJECT_IMG;
                }
              }}
            />
            <div className="industry-overlay">
              <div className="industry-name">{d.deliverable_name}</div>
              <small>Version {d.version || 1}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ================= RENDER: REPORT VIEW ================= */
  const renderReportView = () => {
    if (!selectedProject) return null;
    if (!selectedProject?.json_content) {
  return (
    <div className="deliverables-wrapper">
      <button
        className="back-btn"
        onClick={() => setSelectedDeliverable(null)}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="empty-text">
        No Reports available for this deliverable
      </div>
    </div>
  );
}
    const metrics = selectedProject.json_content?.metrics || {};
    const summary = selectedProject.json_content?.summary || "Analysis successfully generated.";
    const imageUrl = getProjectImage(selectedProject);

    return (
      <div className="analysis-view-wrapper printable-area">
        <div className="analysis-top-nav no-print" style={{ marginBottom: '20px' }}>
          <button className="back-btn-minimal" onClick={() => setSelectedDeliverable(null)}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        <div className="analysis-split-container" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          <div className="analysis-left-pane" style={{ flex: '1' }}>
            <img
              src={imageUrl}
              alt="Project"
              className="main-analysis-img"
              style={{ width: '100%', borderRadius: '20px', border: '1px solid #333', objectFit: 'cover' }}
            />
          </div>

          <div className="analysis-right-pane" style={{ flex: '1' }}>
            <div className="pane-content">
              <span style={{ color: '#888', fontSize: '0.8rem' }}>V{selectedProject.version || 1} Analysis</span>
              <h1 style={{ fontSize: '2.5rem', margin: '10px 0', color: 'white' }}>{selectedProject.project_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ccc', marginBottom: '20px' }}>
                <MapPin size={16} /> <span>{selectedProject.location_name || "N/A"}</span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: 'white', marginBottom: '10px' }}>Summary</h3>
                <p style={{ color: '#ccc', lineHeight: '1.6' }}>{summary}</p>
              </div>

              {Object.keys(metrics).length > 0 && (
                <div>
                  <h3 style={{ color: 'white', marginBottom: '10px' }}>Key Metrics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    {Object.entries(metrics).map(([key, value]) => (
                      <div key={key} style={{ background: '#222', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ color: '#888', fontSize: '0.8rem' }}>{key}</div>
                        <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {typeof value === 'number' ? <CountUp end={value} /> : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                <button
                  className="primary-btn"
                  onClick={goToAnalytics}
                  style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  <BarChart3 size={16} style={{ marginRight: '5px' }} />
                  View Analytics
                </button>
                <button
                  style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => window.print()}
                >
                  <FileDown size={16} style={{ marginRight: '5px' }} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const goToAnalytics = () => {
    if (!selectedIndustry || !selectedProject || !selectedDeliverable) return;
    const params = new URLSearchParams({
      industry: selectedIndustry.mongoId,
      project: selectedProject.id || selectedProject._id,
      deliverable: selectedDeliverable._id || selectedDeliverable.id,
      version: selectedDeliverable.version || 1,
      report_id: selectedDeliverable._id || selectedDeliverable.id
    }).toString();
    navigate(`/analytics?${params}`);
  };
  const handleRecentProjectClick = async (p) => {
    setLoadingReport(true);
    try {
      const clickedName = (p.project_name || p.name || "").toLowerCase().trim();
      const clickedId = p._id || p.id;
      const targetIndId = p.industryId || p.industry_id;

      let industryMatch = reportIndustries.find(ind => ind.id === targetIndId);
      if (!industryMatch) {
        industryMatch = reportIndustries.find(ind =>
          (ind.name || "").toLowerCase() === clickedName.split(' ').slice(0, 2).join(' ')
        );
      }
      if (!industryMatch) throw new Error("Industry not found. Please refresh and try again.");

      const res = await apiFetch(`/reports/?industry_id=${industryMatch.id}`);
      if (!res.ok) throw new Error("Failed to fetch projects from API");
      const apiData = await res.json();
      const apiProjects = apiData.projects || [];

      const officialProject = apiProjects.find(proj => {
        const projName = (proj.project_name || proj.name || "").toLowerCase().trim();
        const projId = proj._id || proj.id;
        return (
          projId === clickedId ||
          projName === clickedName ||
          projName.includes(clickedName) ||
          clickedName.includes(projName)
        );
      });

      if (!officialProject) throw new Error("Could not find this project. Please try again.");

      setSelectedIndustry({ name: industryMatch.name, mongoId: industryMatch.id, id: industryMatch.id });
      setSelectedProject({ ...officialProject, id: officialProject._id || officialProject.id });

      const projectIdentifier = officialProject.project_code || officialProject.code || (officialProject._id || officialProject.id);
      const delRes = await apiFetch(
        `/reports/?industry_id=${industryMatch.id}&project_id=${officialProject._id || officialProject.id}`
      );
      if (!delRes.ok) throw new Error("Failed to fetch deliverables");

      const delData = await delRes.json();

      let projectInfo = {};
      try {
        const projResp = await apiFetch(`/projects/${projectIdentifier}`);
        if (projResp.ok) projectInfo = await projResp.json();
      } catch (e) {
        console.warn("Could not load project info:", e);
      }

      const reportDeliverables = delData.deliverables || [];
      const localEntry = projectData.projects?.find(lp =>
        lp.id === (officialProject._id || officialProject.id) ||
        lp.project_code === projectIdentifier ||
        lp.name === officialProject.project_name ||
        lp.name === officialProject.name
      ) || {};

      const projectDeliverables =
        projectInfo.deliverables || officialProject.deliverables || localEntry.deliverables || [];

      setDeliverables(enrichDeliverables(reportDeliverables, projectDeliverables, getProjectImage(p)));
    } catch (err) {
      console.error("Recent Project Flow Error:", err.message);
      alert("Error: " + err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  /* ===== SEARCH FILTERS ===== */
  const normalize = (text = "") => text.toLowerCase().trim();

  const filteredRecentProjects = !searchTerm.trim()
    ? recentProjects
    : recentProjects.filter(p =>
        normalize(p.project_name || p.name).includes(normalize(searchTerm))
      );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  /* ================= IMAGE HELPERS ================= */
  const formatDeliverableImg = (path) => {
    if (!path || path === "undefined") return DEFAULT_PROJECT_IMG;
    if (path.startsWith("http")) return path;
    return `${BASE_URL}/${path.replace(/^\/+/, "")}`;
  };

  const altDeliverableImg = (path) => {
    if (!path || path === "undefined") return DEFAULT_PROJECT_IMG;
    if (path.startsWith("http")) return path;
    let clean = path.replace(/^\/+/, "");
    if (clean.startsWith("projects/")) {
      return `${BASE_URL}/${clean.replace(/^projects\//, "")}`;
    }
    return `${BASE_URL}/projects/${clean}`;
  };

  const getProjectImage = (p) => {
    if (!p) return DEFAULT_PROJECT_IMG;
    if (p.report_url?.startsWith("http")) return p.report_url;
    if (p.display_url?.startsWith("http")) return p.display_url;
    const imageName = p.project_image_path || p.image_url || p.img;
    if (!imageName) return DEFAULT_PROJECT_IMG;
    if (imageName.startsWith("http")) return imageName;
    return `${BASE_URL}/projects/${imageName}`;
  };



  const enrichDeliverables = (
    reportDeliverables = [],
    projectDeliverables = [],
    projectImage = DEFAULT_PROJECT_IMG
  ) => {
    return reportDeliverables.map(rd => {
      const reportCode = rd.deliverable_code || rd.code || rd.name;
      const pd = projectDeliverables.find(p =>
        p.deliverable_code === reportCode ||
        p.code === reportCode ||
        p.name === reportCode
      );
      const resolveName = (obj) => obj?.deliverable_name || obj?.name || obj?.title || "";
      return {
        ...rd,
        version: rd.version || pd?.version || 1,
        deliverable_name: resolveName(pd) || resolveName(rd) || "Untitled",
        deliverable_img_path: projectImage,
      };
    });
  };

  /* ================= MAIN RENDER ================= */
  return (
    <div className="dashboard-wrapper">
      {loadingReport && (
        <div className="loading-spinner-overlay">
          <div className="status-loader">
            <Loader2 className="spinner" size={30} />
            <span>Fetching Report...</span>
          </div>
        </div>
      )}

      {/* Top bar — hidden when project is selected */}
      {!selectedProject && (
        <div className="top-utility-bar no-print">
          <div className="search-pill-container">
            <div className="search-inner-wrapper">
              <Search size={18} className="search-icon-inside" />
              <input
                type="text"
                className="search-input-clean"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right-tools">
            {user?.role?.toLowerCase() === "pilot" && (
              <button className="upload-dashboard-btn" onClick={() => setOpenUpload(true)}>
                <Upload size={16} style={{ marginRight: 6 }} /> Upload
              </button>
            )}
            <div className="notif-anchor" ref={notifRef}>
              <div className="notif-trigger-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={24} color="white" />
                {unreadCount > 0 && <span className="notif-dot-alert" />}
              </div>

              {showNotifications && (
                <div className="notif-floating-card">
                  <div className="notif-card-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && <span className="unread-count-tag">{unreadCount} New</span>}
                  </div>
                  <div className="notif-card-body">
                    {notifications.length > 0 ? (
                      notifications.map((n) => {
                        const notificationId = n.id || n._id;
                        const isUnread = !n.is_read;
                        return (
                          <div
                            key={notificationId}
                            className={`notif-item ${isUnread ? 'unread' : ''}`}
                            onClick={() => markAsRead(notificationId)}
                          >
                            <div className="notif-content">
                              <div className="notif-title">{n.title || "Notification"}</div>
                              <div className="notif-message">{n.message || n.content || ""}</div>
                              <div className="notif-timestamp">
                                {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                              </div>
                            </div>
                            {isUnread && <div className="unread-indicator" />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-notifications">No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conditional Rendering */}
      {selectedDeliverable ? renderReportView() : selectedProject ? renderDeliverablesView() : (
        <>
          {/* Recent Projects */}
          <div className="project-management-wrapper">
            <h2 className="section-title">Recent Projects</h2>
            <div className="industry-grid-page">
              {filteredRecentProjects.map((p) => (
                <div
                  key={p.id || p._id}
                  className="industry-card"
                  onClick={() => handleRecentProjectClick(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={getProjectImage(p)} alt={p.project_name || p.name} className="industry-image" />
                  <div className="industry-overlay">
                    <div className="industry-name">{p.project_name || p.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {openUpload && <UploadPage onClose={() => setOpenUpload(false)} />}
    </div>
  );
};

export default UserDashboard;
