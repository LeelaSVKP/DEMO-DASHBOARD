import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Clock, ArrowLeft, MapPin, BarChart3, Loader2, FileDown, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "../utils/api";
import projectData from "../data/projects.json";
import "./SuperAdminDashboard.css";

const DEFAULT_PROJECT_IMG = "https://via.placeholder.com/400x250?text=No+Image";
const BASE_URL = "https://api-db-67gt.onrender.com";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const [industryPage, setIndustryPage] = useState(0);
  const [industries, setIndustries] = useState([]);
  const [reportIndustries, setReportIndustries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [addNewMenuOpen, setAddNewMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRegistrationRole, setSelectedRegistrationRole] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const capitalizeFirst = (value) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};
  const [registrationData, setRegistrationData] = useState({
    clientName: "",
    userName: "",
    pilotName: "",
    email: "",
    password: "",
    contactNumber: "",
    droneCategory: "",
    smallLicenseId: "",
    mediumLicenseId: "",
    licenseNumber: ""
  });

  const normalize = (text = "") => text.toLowerCase().trim();
  const filteredIndustries = !searchTerm.trim() ? industries : industries.filter(i => normalize(i.name).includes(normalize(searchTerm)));
  const filteredRecentProjects = !searchTerm.trim() ? recentProjects : recentProjects.filter(p => normalize(p.project_name || p.name).includes(normalize(searchTerm)));
  const filteredProjects = !searchTerm.trim() ? projects : projects.filter(p => normalize(p.project_name).includes(normalize(searchTerm)) || normalize(p.location_name).includes(normalize(searchTerm)));
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatDeliverableImg = (path) => {
    if (!path || path === "undefined") return DEFAULT_PROJECT_IMG;
    if (path.startsWith("http")) return path;
    return `${BASE_URL}/${path.replace(/^\/+/, "")}`;
  };

  const altDeliverableImg = (path) => {
    if (!path || path === "undefined") return DEFAULT_PROJECT_IMG;
    if (path.startsWith("http")) return path;
    let clean = path.replace(/^\/+/, "");
    if (clean.startsWith("projects/")) return `${BASE_URL}/${clean.replace(/^projects\//, "")}`;
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

  const enrichDeliverables = (reportDeliverables = [], projectDeliverables = [], projectImage = DEFAULT_PROJECT_IMG) => {
    return reportDeliverables.map(rd => {
      const reportCode = rd.deliverable_code || rd.code || rd.name;
      const pd = projectDeliverables.find(p => p.deliverable_code === reportCode || p.code === reportCode || p.name === reportCode);
      const resolveName = (obj) => obj?.deliverable_name || obj?.name || obj?.title || "";
      return { ...rd, version: rd.version || pd?.version || 1, deliverable_name: resolveName(pd) || resolveName(rd) || "Untitled", deliverable_img_path: projectImage };
    });
  };

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    fetchReports();
    const handleClickOutside = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await apiFetch("/reports/");
      const data = await res.json();
      setReportIndustries(data.industries || []);
    } catch (err) { console.error("Reports fetch error:", err); }
  };

  const fetchDashboardData = async () => {
    try {
      const dashRes = await apiFetch("/dashboard/");
      if (!dashRes || !dashRes.ok) return;
      const dashData = await dashRes.json();
      setIndustries(dashData.industries || []);
      setRecentProjects(dashData.recent_projects || []);
    } catch (err) { console.error("Dashboard loading error:", err); }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch("/dashboard/notifications");
      if (response.ok) { const data = await response.json(); setNotifications(data || []); }
    } catch (err) { console.error("Notification API error:", err); }
  };

  const markAsRead = async (id) => {
    const targetNotif = notifications.find(n => n.id === id || n._id === id);
    if (!targetNotif || targetNotif.is_read) return;
    setNotifications(prev => prev.map(n => (n.id === id || n._id === id) ? { ...n, is_read: true } : n));
    try { await apiFetch(`/dashboard/notifications/${id}/read`, { method: "POST" }); }
    catch (err) { setNotifications(prev => prev.map(n => (n.id === id || n._id === id) ? { ...n, is_read: false } : n)); }
  };

  const loadProjectsForIndustry = async (industry, matched) => {
    let displayProjects = [];
    try {
      const response = await apiFetch(`/projects/`);
      if (response.ok) {
        const allProjects = await response.json();
        const projectList = Array.isArray(allProjects) ? allProjects : allProjects.projects || [];
        displayProjects = projectList.filter(p => p.industry_name && p.industry_name.toLowerCase() === industry.name.toLowerCase());
      }
    } catch (e) { console.warn("Failed to fetch from /projects/:", e); }
    const res = await apiFetch(`/reports/?industry_id=${matched.id}`);
    const data = await res.json();
    const apiProjects = data.projects || [];
    const mergedProjects = displayProjects.map(displayProj => {
      const apiProj = apiProjects.find(ap => (ap.project_name || ap.name || "").toLowerCase() === (displayProj.project_name || "").toLowerCase() || ap.project_code === displayProj.project_code);
      return { ...displayProj, ...apiProj, deliverables: displayProj.deliverables || [], id: apiProj?.id || apiProj?._id, _id: apiProj?._id || apiProj?.id };
    });
    return mergedProjects.length > 0 ? mergedProjects : displayProjects;
  };

  const handleIndustryClick = async (industry) => {
    setSearchTerm("");
    setLoadingReport(true);
    try {
      const matched = reportIndustries.find(r => r.name.toLowerCase().trim() === industry.name.toLowerCase().trim());
      if (!matched) { alert("Industry mapping not found in reports"); return; }
      const mergedProjects = await loadProjectsForIndustry(industry, matched);
      setSelectedIndustry({ ...industry, mongoId: matched.id });
      setProjects(mergedProjects);
    } catch (err) { console.error("Error loading industry projects:", err); }
    finally { setLoadingReport(false); }
  };

  const handleProjectClick = async (project) => {
    setSelectedProject(project);
    setLoadingReport(true);
    try {
      const projectId = project._id || project.id;
      if (!projectId) { alert("Project ID not found"); return; }
      const res = await apiFetch(`/reports/?industry_id=${selectedIndustry.mongoId}&project_id=${projectId}`);
      const data = await res.json();
      let fullProject = {};
      try {
        const identifier = project.project_code || project.code || projectId;
        const projectRes = await apiFetch(`/projects/${identifier}`);
        if (projectRes.ok) fullProject = await projectRes.json();
      } catch (e) { console.warn("Project detail request failed:", e); }
      const reportDeliverables = data.deliverables || [];
      const localEntry = projectData.projects?.find(p => p.id === projectId || p.project_code === project.project_code || p.name === project.project_name || p.name === project.name) || {};
      const projectDeliverables = fullProject.deliverables || project.deliverables || localEntry.deliverables || [];
      setDeliverables(enrichDeliverables(reportDeliverables, projectDeliverables, getProjectImage(project)));
    } catch (err) { console.error("Error fetching deliverables:", err); }
    finally { setLoadingReport(false); }
  };
  

  const handleDeliverableClick = async (del) => {
    setLoadingReport(true);
    try {
      const params = new URLSearchParams({
        industry_id: selectedIndustry.mongoId,
        project_id: selectedProject._id || selectedProject.id,
        deliverable_id: del._id || del.id,
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

  const handleRegistrationRoleSelect = (role) => {
    setSelectedRegistrationRole(role);
    setShowRegistrationForm(true);
    setAddNewMenuOpen(false);
    setRegistrationData({
      clientName: "",
      userName: "",
      pilotName: "",
      email: "",
      password: "",
      contactNumber: "",
      droneCategory: "",
      smallLicenseId: "",
      mediumLicenseId: "",
      licenseNumber: ""
    });
  };

  const handleRegistrationClose = () => {
    setShowRegistrationForm(false);
    setSelectedRegistrationRole(null);
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    console.log("Registration submit called for role:", selectedRegistrationRole);
    
    const requiredFields = ["clientName", "email", "password"];
    if (selectedRegistrationRole === "User") requiredFields.push("userName", "contactNumber");
    if (selectedRegistrationRole === "Pilot") requiredFields.push("pilotName", "contactNumber", "licenseNumber");

    const missing = requiredFields.filter((field) => !registrationData[field]?.trim());
    if (missing.length > 0) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      let endpoint = "";
      let payload = {};
      let successMessage = "";
      
      // Handle Admin registration via API
      if (selectedRegistrationRole === "Admin") {
        endpoint = `${BASE_URL}/admins/register`;
        payload = {
          name: registrationData.clientName,
          email: registrationData.email,
          password: registrationData.password,
          contact_number: registrationData.contactNumber,
          role: "admin"
        };
        successMessage = "Admin successfully registered.";
      }
      // Handle User registration via API
      else if (selectedRegistrationRole === "User") {
        endpoint = `${BASE_URL}/users/admin/register-user`;
        payload = {
          client_name: registrationData.clientName,
          user_name: registrationData.userName,
          email: registrationData.email,
          password: registrationData.password,
          contact_number: registrationData.contactNumber,
          role: "user"
        };
        successMessage = "User successfully registered.";
      }
      // Handle Pilot registration via API
      else if (selectedRegistrationRole === "Pilot") {
        endpoint = `${BASE_URL}/register-pilot`;
        payload = {
          client_name: registrationData.clientName,
          pilot_name: registrationData.pilotName,
          email_id: registrationData.email,
          password: registrationData.password,
          contact_number: registrationData.contactNumber,
          drone_category: registrationData.droneCategory,
          license_number: registrationData.licenseNumber,
        };
        
        // Add license IDs based on drone category
        if (registrationData.droneCategory === "Small") {
          payload.small_license_id = registrationData.smallLicenseId;
        } else if (registrationData.droneCategory === "Medium") {
          payload.medium_license_id = registrationData.mediumLicenseId;
        } else if (registrationData.droneCategory === "Hybrid") {
          payload.small_license_id = registrationData.smallLicenseId;
          payload.medium_license_id = registrationData.mediumLicenseId;
        }
        successMessage = "Pilot successfully registered.";
      }
      
      if (endpoint) {
        console.log("Sending registration to:", endpoint, "Payload:", payload);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        console.log("Response status:", response.status, "OK:", response.ok);
        
        if (response.ok) {
          console.log("Registration successful");
          alert(successMessage);
          setShowRegistrationForm(false);
          setSelectedRegistrationRole(null);
          // Reset form data
          setRegistrationData({
            clientName: "",
            userName: "",
            pilotName: "",
            email: "",
            password: "",
            contactNumber: "",
            droneCategory: "",
            smallLicenseId: "",
            mediumLicenseId: "",
            licenseNumber: ""
          });
        } else {
          try {
            const errorData = await response.json();
            console.error(`${selectedRegistrationRole} registration error:`, errorData);
            alert(errorData.message || `Failed to register ${selectedRegistrationRole}. Please try again.`);
          } catch (parseErr) {
            console.error("Error parsing response:", parseErr);
            alert(`Failed to register ${selectedRegistrationRole}. Please try again.`);
          }
        }
      }
    } catch (err) {
      console.error(`Registration error:`, err);
      alert(`Error registering ${selectedRegistrationRole}. Please try again.`);
    }
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
    setSearchTerm("");
    setLoadingReport(true);
    try {
      const clickedName = (p.project_name || p.name || "").toLowerCase().trim();
      const clickedId = p._id || p.id;
      const targetIndId = p.industryId || p.industry_id;
      let industryMatch = reportIndustries.find(ind => ind.id === targetIndId);
      if (!industryMatch) {
        // Try exact match first
        industryMatch = reportIndustries.find(ind =>
          normalize(ind.name) === normalize(clickedName.split(' ')[0])
        );
      }
      if (!industryMatch && reportIndustries.length > 0) {
        // Fall back to first industry if all else fails
        industryMatch = reportIndustries[0];
      }
      if (!industryMatch) throw new Error("No industries available. Please refresh and try again.");
      const res = await apiFetch(`/reports/?industry_id=${industryMatch.id}`);
      if (!res.ok) throw new Error("Failed to fetch projects from API");
      const apiData = await res.json();
      const apiProjects = apiData.projects || []; 
      
      let officialProject = null;
      // Try exact ID match first
      officialProject = apiProjects.find(proj => {
        const projId = proj._id || proj.id;
        return projId === clickedId;
      });
      // Try name matching
      if (!officialProject) {
        officialProject = apiProjects.find(proj => {
          const projName = (proj.project_name || proj.name || "").toLowerCase().trim();
          return projName === clickedName || projName.includes(clickedName) || clickedName.includes(projName);
        });
      }
      if (!officialProject && apiProjects.length > 0) {
        // If still no match, use first project as fallback
        officialProject = apiProjects[0];
      }
      if (!officialProject) throw new Error("No projects found in this industry.");
      setSelectedIndustry({ name: industryMatch.name, mongoId: industryMatch.id, id: industryMatch.id });
      setSelectedProject({ ...officialProject, id: officialProject._id || officialProject.id });
      const projectIdentifier = officialProject.project_code || officialProject.code || (officialProject._id || officialProject.id);
      const delRes = await apiFetch(`/reports/?industry_id=${industryMatch.id}&project_id=${officialProject._id || officialProject.id}`);
      if (!delRes.ok) throw new Error("Failed to fetch deliverables");
      const delData = await delRes.json();
      let projectInfo = {};
      try { const projResp = await apiFetch(`/projects/${projectIdentifier}`); if (projResp.ok) projectInfo = await projResp.json(); } catch (e) {}
      const reportDeliverables = delData.deliverables || [];
      const localEntry = projectData.projects?.find(lp => lp.id === (officialProject._id || officialProject.id) || lp.project_code === projectIdentifier || lp.name === officialProject.project_name || lp.name === officialProject.name) || {};
      const projectDeliverables = projectInfo.deliverables || officialProject.deliverables || localEntry.deliverables || [];
      setDeliverables(enrichDeliverables(reportDeliverables, projectDeliverables, getProjectImage(p)));
    } catch (err) { console.error("Recent Project Flow Error:", err.message); alert("Error: " + err.message); }
    finally { setLoadingReport(false); }
  };

  const renderDeliverablesView = () => (
    <div className="deliverables-wrapper">
      <button className="back-btn" onClick={() => { setDeliverables([]); setSelectedProject(null); setSelectedIndustry(null); setSelectedDeliverable(null); }}>
        <ArrowLeft size={16} /> Back
      </button>
      <h2 className="section-title">Deliverables — {selectedProject?.project_name || selectedProject?.name}</h2>
      <div className="industry-grid">
        {deliverables.length === 0 && <div className="empty-text">No Deliverables in this project</div>}
        {deliverables.map((d, i) => (
          <div key={d._id || d.id || i} className="industry-card" onClick={() => handleDeliverableClick(d)}>
            <img src={formatDeliverableImg(d.deliverable_img_path)} alt={d.deliverable_name} className="industry-image"
              onError={(e) => { if (!e.target.dataset.triedAlt) { e.target.dataset.triedAlt = "true"; e.target.src = altDeliverableImg(d.deliverable_img_path); } else { e.target.src = DEFAULT_PROJECT_IMG; } }} />
            <div className="industry-overlay">
              <div className="industry-name">{d.deliverable_name}</div>
              <small>Version {d.version || 1}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReportView = () => {
    if (!selectedProject) return null;
    if (!selectedProject?.json_content) {
      return (
        <div className="deliverables-wrapper">
          <button className="back-btn" onClick={() => setSelectedDeliverable(null)}><ArrowLeft size={16} /> Back</button>
          <div className="empty-text">No Reports available for this deliverable</div>
        </div>
      );
    }
    const metrics = selectedProject.json_content?.metrics || {};
    const summary = selectedProject.json_content?.summary || "Analysis successfully generated.";
    const imageUrl = getProjectImage(selectedProject);
    return (
      <div className="analysis-view-wrapper printable-area">
        <div className="no-print" style={{ marginBottom: '20px' }}>
          <button className="back-btn-minimal" onClick={() => setSelectedDeliverable(null)}><ArrowLeft size={18} /> Back</button>
        </div>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          <div style={{ flex: '1' }}>
            <img src={imageUrl} alt="Project" style={{ width: '100%', borderRadius: '20px', border: '1px solid #333', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: '1' }}>
            <span style={{ color: '#888', fontSize: '0.8rem' }}>V{selectedProject.version || 1} Analysis</span>
            <h1 style={{ fontSize: '2.5rem', margin: '10px 0', color: 'white' }}>{selectedProject.project_name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ccc', marginBottom: '20px' }}>
              <MapPin size={16} /> <span>{selectedProject.location_name || "N/A"}</span>
            </div>
            <div style={{ marginBottom: '30px' }}>
              {Object.entries(metrics).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #333' }}>
                  <span style={{ color: '#aaa', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ color: '#888', fontWeight: 'bold', fontSize: '0.9rem' }}>AI SUMMARY</label>
              <p style={{ color: '#eee', lineHeight: '1.6', marginTop: '10px' }}>{summary}</p>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '15px' }}>
              <button style={{ backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '8px', border: 'none', cursor: 'pointer' }} onClick={() => window.print()}>
                <FileDown size={18} /> Download PDF
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#111', color: 'white', cursor: 'pointer' }} onClick={goToAnalytics}>
                <BarChart3 size={16} /> Get Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIndustryProjectsView = () => (
    <div className="project-management-wrapper no-print">
      <div className="projects-header">
        <button className="back-btn" onClick={() => { setSelectedIndustry(null); setProjects([]); }}><ArrowLeft size={16} /> Back</button>
        <h2 className="section-title">Projects — {selectedIndustry?.name}</h2>
      </div>
      <div className="project-grid-row">
        {filteredProjects.length > 0 ? filteredProjects.map(proj => (
          <div key={proj.project_code || proj.id || proj._id} className="project-card-item" onClick={() => handleProjectClick(proj)}
            style={{ cursor: 'pointer', position: 'relative', height: '250px', borderRadius: '12px', overflow: 'hidden' }}>
            <img src={proj.image_url || getProjectImage(proj)} alt={proj.project_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="industry-overlay" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', position: 'absolute', bottom: 0, width: '100%', padding: '15px' }}>
              <div className="industry-name">{proj.project_name}</div>
              <div className="loc"><MapPin size={14} /> {proj.location_name}</div>
            </div>
          </div>
        )) : <div className="empty-text">No Projects in this industry</div>}
      </div>
    </div>
  );

  const renderMainDashboard = () => (
    <div className="no-print">
      <div className="dashboard-page-header">
        <h1 className="main-title">Admin Dashboard</h1>
        <div className="add-new-actions">
          <button type="button" className="add-new-button" onClick={() => setAddNewMenuOpen((prev) => !prev)}>
            + Add New
          </button>
          {addNewMenuOpen && (
            <div className="registration-select-card">
              <button type="button" className="select-option" onClick={() => handleRegistrationRoleSelect("User")}>User</button>
              <button type="button" className="select-option" onClick={() => handleRegistrationRoleSelect("Pilot")}>Pilot</button>
            </div>
          )}
        </div>
      </div>
      {(!searchTerm || filteredIndustries.length > 0) && (
      <div className="project-management-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Industries</h2>
          {filteredIndustries.length > 6 && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="slider-arrow" style={{ position: 'static', transform: 'none' }} onClick={() => setIndustryPage(p => Math.max(0, p - 1))} disabled={industryPage === 0}>‹</button>
              <button className="slider-arrow" style={{ position: 'static', transform: 'none' }} onClick={() => setIndustryPage(p => Math.min(Math.ceil(filteredIndustries.length / 6) - 1, p + 1))} disabled={industryPage >= Math.ceil(filteredIndustries.length / 6) - 1}>›</button>
            </div>
          )}
        </div>
        <div className="slider-viewport">
          <div className="industry-grid-page">
            {filteredIndustries.length > 0 && filteredIndustries.slice(industryPage * 6, industryPage * 6 + 6).map((ind) => (
              <div key={ind.id} className="industry-card" onClick={() => handleIndustryClick(ind)}>
                <img src={ind.img || ind.image_url || DEFAULT_PROJECT_IMG} alt={ind.name} className="industry-image" />
                <div className="industry-overlay"><div className="industry-name">{ind.name}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
      {(!searchTerm || filteredRecentProjects.length > 0) && (
      <div className="project-management-wrapper">
        <h2 className="section-title">Recent Projects</h2>
        <div className="industry-grid-page">
          {filteredRecentProjects.length > 0 && filteredRecentProjects.map((p) => (
            <div key={p.id || p._id} className="industry-card" onClick={() => handleRecentProjectClick(p)} style={{ cursor: 'pointer' }}>
              <img src={getProjectImage(p)} alt={p.project_name || p.name} className="industry-image" />
              <div className="industry-overlay"><div className="industry-name">{p.project_name || p.name}</div></div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-wrapper">
      {loadingReport && (
        <div className="loading-spinner-overlay">
          <div className="ad-status-loader">
            <Loader2 className="ad-spinner" size={30} />
            <span>Fetching Report...</span>
          </div>
        </div>
      )}
      {!selectedProject && (
        <div className="top-utility-bar no-print">
          <div className="search-pill-container">
            <div className="search-inner-wrapper">
              <Search size={18} className="search-icon-inside" />
              <input type="text" className="search-input-clean" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="header-right-tools">
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
                    {notifications.length > 0 ? notifications.map((n) => {
                      const notificationId = n.id || n._id;
                      const isUnread = !n.is_read;
                      return (
                        <div key={notificationId} className={`notif-card-item ${isUnread ? 'unread-state' : 'read-state'}`} onClick={(e) => { e.stopPropagation(); markAsRead(notificationId); }}>
                          <div className="notif-icon-round"><Clock size={14} /></div>
                          <div className="notif-details">
                            <p className="notif-msg">{n.message}</p>
                            <span className="notif-time">{n.timestamp || 'Just now'}</span>
                          </div>
                          {isUnread && <div className="blue-dot-active" />}
                        </div>
                      );
                    }) : <div className="notif-empty-state">No new notifications</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {selectedDeliverable ? renderReportView() : selectedProject ? renderDeliverablesView() : selectedIndustry ? renderIndustryProjectsView() : renderMainDashboard()}
      {showRegistrationForm && (
        <div className="registration-modal-overlay" onClick={handleRegistrationClose}>
          <div className="registration-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="registration-close-btn" onClick={handleRegistrationClose}>×</button>
            <h2>{selectedRegistrationRole === "User" ? "Register New User" : "Register New Pilot"}</h2>
            <form className="registration-form" onSubmit={handleRegistrationSubmit}>
              <div className="form-row">
  <label>Client Name <span className="required">*</span></label>
  <input
    type="text"
    value={registrationData.clientName}
    onChange={(e) =>
      setRegistrationData({
        ...registrationData,
        clientName: capitalizeFirst(e.target.value)
      })
    }
    placeholder="Enter client name"
    required
  />
</div>
              {selectedRegistrationRole === "User" && (
                <>
                <div className="form-row">
  <label>User Name <span className="required">*</span></label>
  <input
    type="text"
    value={registrationData.userName}
    onChange={(e) =>
      setRegistrationData({
        ...registrationData,
        userName: capitalizeFirst(e.target.value)
      })
    }
    placeholder="Enter user name"
    required
  />
</div>
                <div className="form-row">
  <label>Contact Number <span className="required">*</span></label>
  <input
    type="text"
    value={registrationData.contactNumber}
    onChange={(e) =>
      setRegistrationData({
        ...registrationData,
        contactNumber: e.target.value
      })
    }
    placeholder="Enter contact number"
    required
  />
</div>
                </>
              )}
              {selectedRegistrationRole === "Pilot" && (
                <div className="form-row">
  <label>Pilot Name <span className="required">*</span></label>
  <input
    type="text"
    value={registrationData.pilotName}
    onChange={(e) =>
      setRegistrationData({
        ...registrationData,
        pilotName: capitalizeFirst(e.target.value)
      })
    }
    placeholder="Enter pilot name"
    required
  />
</div>
              )}
              {selectedRegistrationRole === "Pilot" && (
                <>
              <div className="form-row">
  <label>Drone Category <span className="required">*</span></label>
  <select
    value={registrationData.droneCategory}
    onChange={(e) =>
      setRegistrationData({
        ...registrationData,
        droneCategory: e.target.value,
        smallLicenseId: "",
        mediumLicenseId: ""
      })
    }
    required
  >
    <option value="">Select Drone Category</option>
    <option value="Small">Small</option>
    <option value="Medium">Medium</option>
    <option value="Hybrid">Hybrid</option>
  </select>
</div>

{registrationData.droneCategory === "Small" && (
  <div className="form-row">
    <label>Enter Small License ID <span className="required">*</span></label>
    <input
      type="text"
      value={registrationData.smallLicenseId}
      onChange={(e) =>
        setRegistrationData({
          ...registrationData,
          smallLicenseId: e.target.value
        })
      }
      placeholder="Enter small license ID"
      required
    />
  </div>
)}

{registrationData.droneCategory === "Medium" && (
  <div className="form-row">
    <label>Enter Medium License ID <span className="required">*</span></label>
    <input
      type="text"
      value={registrationData.mediumLicenseId}
      onChange={(e) =>
        setRegistrationData({
          ...registrationData,
          mediumLicenseId: e.target.value
        })
      }
      placeholder="Enter medium license ID"
      required
    />
  </div>
)}

{registrationData.droneCategory === "Hybrid" && (
  <>
    <div className="form-row">
      <label>Enter Small License ID <span className="required">*</span></label>
      <input
        type="text"
        value={registrationData.smallLicenseId}
        onChange={(e) =>
          setRegistrationData({
            ...registrationData,
            smallLicenseId: e.target.value
          })
        }
        placeholder="Enter small license ID"
        required
      />
    </div>
    <div className="form-row">
      <label>Enter Medium License ID <span className="required">*</span></label>
      <input
        type="text"
        value={registrationData.mediumLicenseId}
        onChange={(e) =>
          setRegistrationData({
            ...registrationData,
            mediumLicenseId: e.target.value
          })
        }
        placeholder="Enter medium license ID"
        required
      />
    </div>
  </>
)}

                  <div className="form-row">
  <label>License Number <span className="required">*</span></label>
  <input
    type="text"
    value={registrationData.licenseNumber}
    onChange={(e) =>
      setRegistrationData({
        ...registrationData,
        licenseNumber: e.target.value
      })
    }
    placeholder="Enter license number"
    required
  />
</div>
                  <div className="form-row">
  <label>Contact Number <span className="required">*</span></label>
  <input
    type="text"
    value={registrationData.contactNumber}
    onChange={(e) =>
      setRegistrationData({
        ...registrationData,
        contactNumber: e.target.value
      })
    }
    placeholder="Enter contact number"
    required
  />
</div>
                </>
              )}
              <div className="form-row">
  <label>Email <span className="required">*</span></label>
  <input
    type="email"
    value={registrationData.email}
    onChange={(e) =>
      setRegistrationData({
        ...registrationData,
        email: e.target.value
      })
    }
    placeholder="email@example.com"
    required
  />
</div>
              <div className="form-row">
  <label>Password <span className="required">*</span></label>

  <div className="password-input-container">
    <input
      type={showPassword ? "text" : "password"}
      value={registrationData.password}
      onChange={(e) =>
        setRegistrationData({
          ...registrationData,
          password: e.target.value
        })
      }
      placeholder="Enter password"
      required
    />

    <span
      className="eye-toggle"
      onClick={() => setShowPassword((prev) => !prev)}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </span>
  </div>
</div>
              <button type="submit" className="submit-registration-btn">Submit</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
