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
  X
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

  const [imageModal, setImageModal] = useState({
    open: false,
    images: [],
  });

  /* ================= FETCH PROJECTS (FIXED) ================= */
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // 1. Call apiFetch instead of api.get
        const response = await apiFetch(PROJECTS_ENDPOINT);
        
        if (response.ok) {
          // 2. Must parse JSON with native fetch
          const data = await response.json();
          setProjects(data || []);
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

  /* ================= MENU HANDLING ================= */
  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  useEffect(() => {
    const closeMenu = () => {
      setOpenMenuId(null);
    };
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  /* ================= IMAGE MODAL ================= */
  const openImages = (image) => {
    setImageModal({
      open: true,
      images: image ? [image] : [],
    });
  };

  const closeImages = () => {
    setImageModal({ open: false, images: [] });
  };

  /* ================= FILTER LOGIC ================= */
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
                    onClick={() =>
                      openImages(project.project_image_path)
                    }
                  >
                    <td>{project.project_code}</td>

                    <td>
                      <div>{project.project_name}</div>
                      <div className="project-meta">
                        <Calendar size={12} />
                        Started{" "}
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString()
                          : "-"}
                      </div>
                    </td>

                    <td>{project.industry_name}</td>

                    <td>
                      <div className="project-meta">
                        <MapPin size={13} />
                        {project.location_name}
                      </div>
                    </td>

                    <td>{project.status}</td>

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