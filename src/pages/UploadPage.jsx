import React, { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import SearchableDropdown from "./SearchableDropdown";
import "./upload.css";

const BASE_URL = "https://api-db-67gt.onrender.com";

const allowOnlyLetters = (value) => value.replace(/[^a-zA-Z ]/g, "");
const capitalizeFirst = (value) => value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

export default function UploadPage({ onClose }) {

  const fetchWithAuth = async (url, options = {}) => {
    let access = localStorage.getItem("access_token");
    let refresh = localStorage.getItem("refresh_token");

    let res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${access}` },
    });

    if (res.status === 401 && refresh) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem("access_token", data.access_token);
        res = await fetch(url, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${data.access_token}` },
        });
      } else {
        localStorage.clear();
        window.location.href = "/";
      }
    }
    return res;
  };

  const [filterOptions, setFilterOptions] = useState({
    clients: [],
    industries: [],
    projects: [],
    deliverables: [],
    locations: [],
  });

  const [values, setValues] = useState({
    client: "",
    industryname: "",
    project: "",
    deliverable: "",
    location: "",
    locationurl: "",
  });

  const [errors, setErrors] = useState({});
  const [showClientCard, setShowClientCard] = useState(false);
  const [newClientData, setNewClientData] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [customIndustries, setCustomIndustries] = useState([]);
  const [customProjects, setCustomProjects] = useState([]);
  const [customLocations, setCustomLocations] = useState([]);
  const [customDeliverables, setCustomDeliverables] = useState([]);

  const logoRef = useRef();
  const overviewRef = useRef();

  /* ================= FETCH DROPDOWNS ================= */
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/add-new`);
        if (res.ok) {
          const jsonResponse = await res.json();
          const apiData = jsonResponse.data;

          setFilterOptions({
            clients: apiData.clients || [],
            industries: apiData.industries || [],          // ✅ use industries array directly
            projects: apiData.projects_master || [],
            deliverables: apiData.deliverables || [],
            locations: apiData.projects_master
              ? [...new Set(apiData.projects_master.map(p => p.location_name).filter(Boolean))]
              : [],
          });
        }
      } catch (err) {
        console.error("Failed to load dropdowns:", err);
      }
    };
    fetchMetadata();
  }, []);

  // All industries = API industries + custom added ones
  const allIndustries = [...filterOptions.industries, ...customIndustries];
  const allProjects = [...filterOptions.projects, ...customProjects.map(p => ({ project_name: p, location_name: "" }))];
  const allLocations = [...filterOptions.locations, ...customLocations];

  const handleAddNewIndustry = (newIndustry) => {
    if (!allIndustries.includes(newIndustry)) {
      setCustomIndustries(prev => [...prev, newIndustry]);
    }
  };

  const handleAddNewProject = (newProject) => {
    const exists = allProjects.some(p => (typeof p === "string" ? p : p.project_name) === newProject);
    if (!exists) setCustomProjects(prev => [...prev, newProject]);
  };

  const handleAddNewLocation = (newLocation) => {
    if (!allLocations.includes(newLocation)) setCustomLocations(prev => [...prev, newLocation]);
  };

  /* ================= RENDER CLIENT FIELD ================= */
  const renderClientField = () => (
    <div className="field">
      <div className="label-row">
        <label className={`field-label ${errors.client ? "error-label" : ""}`}>
          Client <span style={{ color: "white" }}>*</span>
        </label>

        <span
          className="add-new"
          onClick={() => {
            if (newClientData) {
              setNewClientData(null);
              setValues(prev => ({ ...prev, client: "" }));
              setErrors(prev => ({ ...prev, client: false }));
            } else {
              setErrors({});
              setShowClientCard(true);
            }
          }}
        >
          {newClientData ? "← Back" : "+ New"}
        </span>
      </div>

      <SearchableDropdown
        placeholder="Select Client"
        options={filterOptions.clients}
        value={values.client}
        disabled={newClientData !== null}
        onChange={(val) => {
          setValues(prev => ({ ...prev, client: val, industryname: "" }));
          setErrors(prev => ({ ...prev, client: false }));
        }}
        error={errors.client}
      />

    </div>
  );

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    const newErrors = {};
    const errorMessages = [];

    if (!values.client && !newClientData) { newErrors.client = true; errorMessages.push("Client is required"); }
    if (!values.industryname) { newErrors.industryname = true; errorMessages.push("Industry Name is required"); }
    if (!values.project) { newErrors.project = true; errorMessages.push("Project is required"); }
    if (!values.deliverable) { newErrors.deliverable = true; errorMessages.push("Deliverable is required"); }
    if (!values.location) { newErrors.location = true; errorMessages.push("Location is required"); }
    if (!values.locationurl) { newErrors.locationurl = true; errorMessages.push("Location URL is required"); }
    if (!logoFile) { newErrors.logo = true; errorMessages.push("Logo file is required"); }
    if (selectedFiles.length === 0) { newErrors.files = true; errorMessages.push("Project Overview file is required"); }

    if (errorMessages.length > 0) {
      setErrors(newErrors);
      alert("Please fix the following errors before submitting:\n\n" + errorMessages.map(msg => "• " + msg).join("\n"));
      return;
    }

    setErrors({});
    const formData = new FormData();

    // Always send client_name
    const clientName = newClientData ? newClientData.client_name : values.client;
    formData.append("client_name", clientName);

    // Only send email_id / password / role when creating a NEW client
    if (newClientData) {
      formData.append("email_id", newClientData.email || "");
      formData.append("password", newClientData.password || "");
      formData.append("role", (newClientData.role || "").toLowerCase());
    }

    formData.append("industry_name", values.industryname);
    formData.append("deliverable_name", values.deliverable);
    formData.append("project_name", values.project);
    formData.append("location_name", values.location);
    formData.append("location_url", values.locationurl);
    if (logoFile) formData.append("logo", logoFile);
    selectedFiles.forEach(file => formData.append("files", file));

    try {
      const res = await fetchWithAuth(`${BASE_URL}/add-new`, { method: "POST", body: formData });
      if (res.ok) {
       alert("✅ Upload Successful!");
window.location.reload();
      } else {
        let errorMsg = "Upload failed. Please try again.";
        try {
          const errorData = await res.json();
          // Show detailed backend error if available
          if (errorData.detail) {
            // FastAPI validation errors come as an array
            if (Array.isArray(errorData.detail)) {
              errorMsg = errorData.detail.map(e => `• ${e.loc?.join(" → ")} : ${e.msg}`).join("\n");
            } else {
              errorMsg = errorData.detail;
            }
          } else if (errorData.message) {
            errorMsg = errorData.message;
          } else if (errorData.error) {
            errorMsg = errorData.error;
          }
        } catch (_) { /* response not JSON */ }
        alert(`❌ Upload Failed (${res.status}):\n${errorMsg}`);
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Network error. Please try again.");
    }
  };

  return (
    <>
      <div className="upload-overlay">
        <div className="upload-container">
          <div className="upload-header-row">
            <h1 className="title">Welcome!</h1>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <p className="subtitle">Fill in the required information below:</p>

          <div className="form-grid">
            {renderClientField()}

            {/* Industry - uses flat industries array from API */}
            <SearchableDropdown
              label="Industry Name"
              placeholder="Select Industry"
              options={allIndustries}
              value={values.industryname}
              onChange={(val) => {
                setValues(prev => ({ ...prev, industryname: val }));
                setErrors(prev => ({ ...prev, industryname: false }));
              }}
              onAddNew={handleAddNewIndustry}
              error={errors.industryname}
            />

            {/* Project */}
            <SearchableDropdown
              label="Project"
              placeholder="Select Project"
              options={allProjects}
              value={values.project}
              displayKey="project_name"
              onChange={(val) => {
                const projectName = typeof val === "string" ? val : val.project_name;
                const selectedProj = filterOptions.projects.find(p => p.project_name === projectName);
                if (selectedProj) {
                  setValues(prev => ({
                    ...prev,
                    project: projectName,
                    location: selectedProj.location_name || prev.location,
                    locationurl: selectedProj.location_url || prev.locationurl,
                  }));
                } else {
                  setValues(prev => ({ ...prev, project: projectName }));
                }
                setErrors(prev => ({ ...prev, project: false }));
              }}
              onAddNew={handleAddNewProject}
              error={errors.project}
            />

            {/* Deliverable */}
            <SearchableDropdown
              label="Deliverable"
              placeholder="Select Deliverable"
              options={[...filterOptions.deliverables, ...customDeliverables]}
              value={values.deliverable}
              onChange={(val) => {
                setValues(prev => ({ ...prev, deliverable: val }));
                setErrors(prev => ({ ...prev, deliverable: false }));
              }}
              onAddNew={(newDeliverable) => {
                if (!customDeliverables.includes(newDeliverable)) {
                  setCustomDeliverables(prev => [...prev, newDeliverable]);
                }
              }}
              error={errors.deliverable}
            />

            {/* Location */}
            <SearchableDropdown
              label="Location"
              placeholder="Select Location"
              options={allLocations}
              value={values.location}
              onChange={(val) => {
                setValues(prev => ({ ...prev, location: val }));
                setErrors(prev => ({ ...prev, location: false }));
              }}
              onAddNew={handleAddNewLocation}
              error={errors.location}
            />

            {/* Location URL */}
            <div className="field">
              <label className={`field-label ${errors.locationurl ? "error-label" : ""}`}>Location URL *</label>
              <input
                className={`input-field ${errors.locationurl ? "error-input" : ""}`}
                placeholder="Enter Location URL"
                value={values.locationurl}
                onChange={(e) => {
                  setValues({ ...values, locationurl: e.target.value });
                  setErrors(p => ({ ...p, locationurl: false }));
                }}
              />
            </div>
          </div>

          <div className="upload-grid">
            <div className="upload-box">
              <label className={`field-label ${errors.logo ? "error-label" : ""}`}>Upload Logo *</label>
              <div className={`dropzone ${errors.logo ? "error-dropzone" : ""}`} onClick={() => logoRef.current.click()}>
                <p>{logoFile ? logoFile.name : "Upload Transparent Logo (JPG)"}</p>
                <span>Click to upload</span>
                <input
                  hidden
                  type="file"
                  accept=".jpg,.jpeg"
                  ref={logoRef}
                  onChange={(e) => {
                    setLogoFile(e.target.files[0]);
                    setErrors(prev => ({ ...prev, logo: false }));
                  }}
                />
              </div>
            </div>

            <div className="upload-box">
              <label className={`field-label ${errors.files ? "error-label" : ""}`}>Upload Project Overview *</label>
              <div className={`dropzone ${errors.files ? "error-dropzone" : ""}`} onClick={() => overviewRef.current.click()}>
                <p>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Upload Project Overview File"}</p>
                <span>Click to upload</span>
                <input
                  hidden
                  type="file"
                  multiple
                  ref={overviewRef}
                  onChange={(e) => {
                    setSelectedFiles(Array.from(e.target.files));
                    setErrors(prev => ({ ...prev, files: false }));
                  }}
                />
              </div>
            </div>
          </div>

          <button className="submit-btn" onClick={handleSubmit}
            style={{ backgroundColor: "#ffffff", color: "#000000", display: "block", marginTop: "30px", width: "100%", padding: "15px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", border: "1px solid #ddd" }}>
            Submit
          </button>
        </div>
      </div>

      {showClientCard && (
        <div className="modal-wrapper">
          <NewClientCard
            onSave={(data) => {
              setNewClientData(data);
              setValues(prev => ({ ...prev, client: data.client_name }));
              setShowClientCard(false);
            }}
            onClose={() => setShowClientCard(false)}
          />
        </div>
      )}
    </>
  );
}

function NewClientCard({ onClose, onSave }) {
  const [localErrors, setLocalErrors] = useState({});
  const [form, setForm] = useState({ client_name: "", email: "", role: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setForm({ client_name: "", email: "", role: "", password: "" });
    setLocalErrors({});
  }, []);

  const handleLocalSubmit = () => {
    const errs = {};
    const errorMessages = [];

    if (!form.client_name) { errs.client_name = true; errorMessages.push("Client Name is required"); }
    if (!form.role) { errs.role = true; errorMessages.push("Role is required"); }
    if (!form.email) { errs.email = true; errorMessages.push("Email ID is required"); }
    if (!form.password) { errs.password = true; errorMessages.push("Password is required"); }

    if (errorMessages.length > 0) {
      setLocalErrors(errs);
      alert("Please fix the following errors before submitting:\n\n" + errorMessages.map(msg => "• " + msg).join("\n"));
      return;
    }

    setLocalErrors({});
    onSave(form);
  };

  return (
    <div className="client-card-ui">
      <div className="card-header-row">
        <h3>New Client</h3>
        <button className="red-close-x" onClick={onClose}>✕</button>
      </div>
      <div className="card-body-ui">
        <div className="card-input-group">
          <label>Client Name <span>*</span></label>
          <input
            className={localErrors.client_name ? "error-input" : ""}
            placeholder="Enter client name"
            value={form.client_name}
            onChange={(e) => {
              const cleaned = allowOnlyLetters(e.target.value);
              setForm({ ...form, client_name: capitalizeFirst(cleaned) });
              setLocalErrors(prev => ({ ...prev, client_name: false }));
            }}
          />
        </div>

        <div className="card-input-group">
          <label>Role <span>*</span></label>
          <select
            className={localErrors.role ? "error-input" : ""}
            value={form.role}
            onChange={(e) => { setForm({ ...form, role: e.target.value }); setLocalErrors(prev => ({ ...prev, role: false })); }}
          >
            <option value="">Select Role</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
            <option value="Pilot">Pilot</option>
          </select>
        </div>

        <div className="card-input-group">
          <label>Email ID <span>*</span></label>
          <input
            className={localErrors.email ? "error-input" : ""}
            placeholder="Enter email address"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); setLocalErrors(prev => ({ ...prev, email: false })); }}
          />
        </div>

        <div className="card-input-group">
          <label>Password <span>*</span></label>
          <div className="password-input-container">
            <input
              className={localErrors.password ? "error-input" : ""}
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setLocalErrors(prev => ({ ...prev, password: false })); }}
            />
            <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
        </div>

        <button className="blue-submit-btn" onClick={handleLocalSubmit}>Submit</button>
      </div>
    </div>
  );
}