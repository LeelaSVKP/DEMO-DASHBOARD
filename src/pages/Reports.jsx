import React, { useState, useEffect } from "react";
import { ChevronDown, Inbox, Loader2, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api"; 
import "./Reports.css";

export default function ViewImagesPage() {
  const navigate = useNavigate();
  
  const [filterOptions, setFilterOptions] = useState({
    industries: [],
    projects: [],
    deliverables: [],
    versions: [] 
  });

  const [selections, setSelections] = useState({
    industry: "",
    project: "",
    deliverable: "",
    version: ""
  });

  const [images, setImages] = useState([]);   
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [versionLoading, setVersionLoading] = useState(false);

  /* ================= 1. INITIAL LOAD: Industries ================= */
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const res = await apiFetch("/reports/");
        if (res.ok) {
          const data = await res.json();
          setFilterOptions(prev => ({ ...prev, industries: data.industries || [] }));
        }
      } catch (err) {
        console.error("Failed to load industries:", err);
      }
    };
    fetchIndustries();
  }, []);

  /* ================= 2. FETCH PROJECTS ================= */
  useEffect(() => {
    if (!selections.industry) {
      setFilterOptions(prev => ({ ...prev, projects: [], deliverables: [], versions: [] }));
      return;
    }
    const fetchProjects = async () => {
      try {
        const res = await apiFetch(`/reports/?industry_id=${selections.industry}`);
        if (res.ok) {
          const data = await res.json();
          setFilterOptions(prev => ({ ...prev, projects: data.projects || [], deliverables: [], versions: [] }));
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    fetchProjects();
  }, [selections.industry]);

  /* ================= 3. FETCH DELIVERABLES ================= */
  useEffect(() => {
    if (!selections.project) {
      setFilterOptions(prev => ({ ...prev, deliverables: [], versions: [] }));
      return;
    }
    const fetchDeliverables = async () => {
      try {
        const res = await apiFetch(`/reports/?industry_id=${selections.industry}&project_id=${selections.project}`);
        if (res.ok) {
          const data = await res.json();
          setFilterOptions(prev => ({ ...prev, deliverables: data.deliverables || [], versions: [] }));
        }
      } catch (err) {
        console.error("Failed to fetch deliverables:", err);
      }
    };
    fetchDeliverables();
  }, [selections.project, selections.industry]);

 /* ================= 4. FETCH VERSIONS (Optimized Discovery) ================= */
useEffect(() => {
  if (!selections.deliverable) {
    setFilterOptions(prev => ({ ...prev, versions: [] }));
    return;
  }

  const fetchVersions = async () => {
    try {
      setVersionLoading(true);
      
      // Use the discovery route that worked for projects/deliverables
      const query = `industry_id=${selections.industry}&project_id=${selections.project}&deliverable_id=${selections.deliverable}`;
      const res = await apiFetch(`/reports/?${query}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Full Discovery Data:", data);

        let versionList = [];

        // Scenario A: Backend returns a direct 'versions' array
        if (data.versions && Array.isArray(data.versions)) {
          versionList = data.versions;
        } 
        // Scenario B: Backend returns 'reports' and we extract versions from them
        else if (data.reports && Array.isArray(data.reports)) {
          versionList = data.reports.map(r => r.version);
        }
        // Scenario C: Data itself is the list
        else if (Array.isArray(data)) {
          versionList = data.map(r => r.version);
        }

        // Clean up: Remove duplicates, nulls, and sort
        const finalVersions = [...new Set(versionList)]
          .filter(v => v != null)
          .sort((a, b) => a - b);

        console.log("Extracted Version List:", finalVersions);
        
        // Only update if we actually found something, otherwise keep fallback possibility
        setFilterOptions(prev => ({ 
          ...prev, 
          versions: finalVersions.length > 0 ? finalVersions : [1, 2, 3] 
        }));
      }
    } catch (err) {
      console.error("Version Fetch Error:", err);
      setFilterOptions(prev => ({ ...prev, versions: [1, 2, 3] }));
    } finally {
      setVersionLoading(false);
    }
  };
  fetchVersions();
}, [selections.deliverable, selections.industry, selections.project]);
  /* ================= 5. FINAL ANALYTICS FETCH ================= */
  useEffect(() => {
    const { industry, project, deliverable, version } = selections;
    if (industry && project && deliverable && version) {
      const fetchAnalytics = async () => {
        try {
          setLoading(true);
          setError("");
          const params = new URLSearchParams({
            industry_id: industry,
            project_id: project,
            deliverable_id: deliverable,
            version: version
          }).toString();

          let res = await apiFetch(`/reports/analytics?${params}`);
          if (!res.ok) {
            res = await apiFetch(`/analytics?${params}`);
          }

          if (res.ok) {
            const data = await res.json();
            const normalizedData = Array.isArray(data) ? data : (data.reports || [data]);
            setImages(normalizedData);
          } else {
            setImages([]);
            setError("No results found for these specific filters.");
          }
        } catch (err) {
          setError("Server connection error.");
        } finally {
          setLoading(false);
        }
      };
      fetchAnalytics();
    }
  }, [selections]);

  const handleGetAnalytics = (report) => {
    const params = new URLSearchParams({
      industry: selections.industry,
      project: selections.project,
      deliverable: selections.deliverable,
      version: report.version || selections.version,
      report_id: report._id || report.id
    }).toString();
    navigate(`/analytics?${params}`);
  };

  return (
    <div className="view-page-wrapper">
      <div className="filter-row-container">
        {/* Industry */}
        <div className="filter-box">
          <select 
            value={selections.industry} 
            onChange={(e) => setSelections({ industry: e.target.value, project: "", deliverable: "", version: "" })}
          >
            <option value="">Industry</option>
            {filterOptions.industries.map((ind) => (
              <option key={ind.id || ind._id} value={ind.id || ind._id}>{ind.name}</option>
            ))}
          </select>
          <ChevronDown className="dropdown-icon" size={16} />
        </div>

        {/* Project */}
        <div className="filter-box">
          <select 
            disabled={!selections.industry}
            value={selections.project} 
            onChange={(e) => setSelections({ ...selections, project: e.target.value, deliverable: "", version: "" })}
          >
            <option value="">Project</option>
            {filterOptions.projects.map((proj) => (
              <option key={proj.id || proj._id} value={proj.id || proj._id}>{proj.project_name || proj.name}</option>
            ))}
          </select>
          <ChevronDown className="dropdown-icon" size={16} />
        </div>

        {/* Deliverable */}
        <div className="filter-box">
          <select 
            disabled={!selections.project}
            value={selections.deliverable} 
            onChange={(e) => setSelections({ ...selections, deliverable: e.target.value, version: "" })}
          >
            <option value="">Deliverable</option>
            {filterOptions.deliverables.map((del) => (
              <option key={del.id || del._id} value={del.id || del._id}>{del.deliverable_name || del.name}</option>
            ))}
          </select>
          <ChevronDown className="dropdown-icon" size={16} />
        </div>

        {/* Version */}
        <div className="filter-box">
          <select 
            disabled={!selections.deliverable}
            value={selections.version} 
            onChange={(e) => setSelections({...selections, version: e.target.value})}
          >
            <option value="">
              {versionLoading ? "Loading..." : "Version"}
            </option>
            {filterOptions.versions.map(v => (
              <option key={v} value={v}>V{v}</option>
            ))}
          </select>
          <ChevronDown className="dropdown-icon" size={16} />
        </div>
      </div>

      {loading && (
        <div className="status-loader">
          <Loader2 className="spinner" size={24} />
          <span>Fetching Analytics...</span>
        </div>
      )}

      <div className="results-list">
        {images.map((item, idx) => {
          const report = item.report || item;
          if (!report) return null;
          return (
            <div className="result-card" key={report._id || idx}>
              <div className="card-main-content">
                <div className="image-container-left">
                  <img src={report.report_url} alt="Visualization" />
                </div>
                <div className="analytics-container-right">
                  <div className="analytics-header">
                    <span className="version-tag">V{report.version} Analysis</span>
                    <h2 className="report-title">{report.json_content?.summary || "Project Summary"}</h2>
                  </div>
                  <div className="metrics-body">
                    {report.json_content?.metrics && Object.entries(report.json_content.metrics).map(([key, val]) => (
                      <div className="metric-row" key={key}>
                        <span className="m-label">{key.replace(/_/g, ' ')}</span>
                        <span className="m-value">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="action-footer">
                    <button className="btn-accept">Accept</button>
                    <button className="btn-reject">Reject</button>
                    <button className="btn-get-analytics" onClick={() => handleGetAnalytics(report)}>
                      <BarChart3 size={16} style={{marginRight: '8px'}} /> Get Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !error && images.length === 0 && (
        <div className="empty-notice">
          <p>Please select all filters to generate the summary report.</p>
        </div>
      )}
    </div>
  );
}