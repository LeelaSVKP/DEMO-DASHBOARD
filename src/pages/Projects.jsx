import React, { useState, useEffect } from "react";
// Import the custom apiFetch (using the default export we added)
import apiFetch from "../utils/api";
import {
  Search,
  MoreHorizontal,
  MapPin,
  Calendar,
  FileText,
  Edit,
  Trash2,
  X,
  Zap,
  Clipboard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import "./projects.css";

const PROJECTS_ENDPOINT = "/projects/";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");

  const [openMenuId, setOpenMenuId] = useState(null);
  const [openCalendarId, setOpenCalendarId] = useState(null);
  const [projectDates, setProjectDates] = useState({});

  const [imageModal, setImageModal] = useState({
    open: false,
    images: [],
  });

  const formatDateForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(PROJECTS_ENDPOINT);

        if (response.ok) {
          const data = await response.json();
          setProjects(data || []);
          setProjectDates(
            Object.fromEntries(
              (data || []).map((project) => [
                project.project_code,
                formatDateForInput(project.created_at),
              ])
            )
          );
        } else {
          console.error("Server error:", response.status);
          setProjects([]);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  useEffect(() => {
    const closeMenu = () => {
      setOpenMenuId(null);
      setOpenCalendarId(null);
    };
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const openImages = (image) => {
    if (image) {
      setImageModal({
        open: true,
        images: [image],
      });
    }
  };

  const closeImages = () => {
    setImageModal({ open: false, images: [] });
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || "";

    const statusIconMap = {
      inprogress: { icon: Zap, color: "#fbbf24", label: "In Progress" },
      planning: { icon: Clipboard, color: "#60a5fa", label: "Planning" },
      completed: { icon: CheckCircle, color: "#34d399", label: "Completed" },
    };

    return (
      statusIconMap[statusLower] || {
        icon: AlertCircle,
        color: "#f87171",
        label: status,
      }
    );
  };

  const StatusBadge = ({ status }) => {
    const statusInfo = getStatusIcon(status);
    const IconComponent = statusInfo.icon;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <IconComponent size={16} color={statusInfo.color} />
        <span>{status}</span>
      </div>
    );
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    const matchesIndustry =
      industryFilter === "all" || project.industry_name === industryFilter;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#ffffff" }}>
        Loading Projects...
      </div>
    );

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1 className="page-title">Project Management</h1>
      </div>

      <div className="filters-card">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            className="search-input"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Inprogress">Inprogress</option>
          <option value="Planning">Planning</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          className="filter-select"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
        >
          <option value="all">All Industries</option>
          {[...new Set(projects.map((p) => p.industry_name))]
            .filter(Boolean)
            .map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
        </select>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3 className="table-header-title">
            Projects List ({filteredProjects.length})
          </h3>
        </div>

        <div className="projects-table-wrapper">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Project Name</th>
                <th>Industry</th>
                <th>Location</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <tr
                    key={project.project_code}
                    className="clickable-row"
                    onClick={() => openImages(project.project_image_path)}
                  >
                    <td>{project.project_code}</td>

                    <td>
                      <div>{project.project_name}</div>
                      <div className="project-meta project-start-date">
                        <button
                          type="button"
                          className="calendar-trigger-btn"
                          title="Open calendar"
                          aria-label={`Open calendar for ${project.project_name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCalendarId(
                              openCalendarId === project.project_code
                                ? null
                                : project.project_code
                            );
                          }}
                        >
                          <Calendar size={12} />
                        </button>

                        <span>
                          Started {formatDateForDisplay(projectDates[project.project_code] || project.created_at)}
                        </span>

                        {openCalendarId === project.project_code && (
                          <div
                            className="calendar-popover"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="date"
                              className="calendar-input"
                              value={projectDates[project.project_code] || ""}
                              onChange={(e) => {
                                const nextDate = e.target.value;
                                setProjectDates((prev) => ({
                                  ...prev,
                                  [project.project_code]: nextDate,
                                }));
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    <td>{project.industry_name}</td>

                    <td>
                      <div className="project-meta">
                        <button
                          className="location-pin-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(project.location_name)}`;
                            window.open(mapsUrl, "_blank");
                          }}
                          title="Open location in map"
                        >
                          <MapPin size={13} color="#0099ff" />
                        </button>
                        {project.location_name}
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={project.status} />
                    </td>

                    <td className="action-cell">
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(project.project_code);
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenuId === project.project_code && (
                        <div
                          className="menu-dropdown"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="menu-item">
                            <Edit size={14} /> Edit Project
                          </button>
                          <button className="menu-item">
                            <FileText size={14} /> Generate Report
                          </button>
                          <button className="menu-item danger">
                            <Trash2 size={14} /> Delete Project
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: 40, textAlign: "center" }}>
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {imageModal.open && (
        <div className="image-modal-overlay" onClick={closeImages}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="close-btn" onClick={closeImages}>
                <X size={24} />
              </button>
            </div>
            <div className="image-grid">
              {imageModal.images?.length > 0 ? (
                imageModal.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="gallery-img" />
                ))
              ) : (
                <p>No images available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
