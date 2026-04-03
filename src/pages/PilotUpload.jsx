import React, { useState, useRef, useEffect } from "react";
import { User, Target, UploadCloud, MessageCircle, Mail, Phone, Calendar } from "lucide-react";
import { apiFetch } from "../utils/api";
import "./PilotUpload.css";

export default function PilotUpload() {
  const [form, setForm] = useState({
    pilotName: "",
    licenseNumber: "",
    email: "",
    contact: "",
    industry: "",
    project: "",
    deliverable: "",
    missionDate: "",
    duration: "",
    weather: "",
    comments: "",
  });
  const [files, setFiles] = useState([]);

  const capitalizeFirst = (value) => {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "pilotName" ? capitalizeFirst(value) : value;

    if (name === "industry") {
      setForm((prev) => ({ ...prev, industry: nextValue, project: "", deliverable: "" }));
      loadProjectsForIndustry(nextValue);
      return;
    }

    if (name === "project") {
      setForm((prev) => ({ ...prev, project: nextValue, deliverable: "" }));
      loadDeliverablesForProject(form.industry, nextValue);
      return;
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const [reportIndustries, setReportIndustries] = useState([]);
  const [reportProjects, setReportProjects] = useState([]);
  const [reportDeliverables, setReportDeliverables] = useState([]);

  const stripVersion = (obj) => {
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const { version, ...rest } = obj;
      return rest;
    }
    return obj;
  };

  const stripVersionList = (items) => Array.isArray(items) ? items.map(stripVersion) : [];

  const fetchReports = async () => {
    try {
      const res = await apiFetch("/reports/");
      if (!res.ok) return;
      const data = await res.json();
      setReportIndustries(stripVersionList(data.industries || []));
    } catch (err) {
      console.error("PilotUpload reports fetch error:", err);
    }
  };

  const loadProjectsForIndustry = async (industryId) => {
    setReportProjects([]);
    setReportDeliverables([]);

    if (!industryId) return;

    try {
      const res = await apiFetch(`/reports/?industry_id=${industryId}`);
      if (!res.ok) return;
      const data = await res.json();
      setReportProjects(stripVersionList(data.projects || []));
    } catch (err) {
      console.error("PilotUpload projects fetch error:", err);
    }
  };

  const loadDeliverablesForProject = async (industryId, projectId) => {
    setReportDeliverables([]);

    if (!industryId || !projectId) return;

    try {
      const res = await apiFetch(`/reports/?industry_id=${industryId}&project_id=${projectId}`);
      if (!res.ok) return;
      const data = await res.json();
      setReportDeliverables(stripVersionList(data.deliverables || []));
    } catch (err) {
      console.error("PilotUpload deliverables fetch error:", err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const missionDateRef = useRef(null);

  const handleClear = () => {
    setForm({
      pilotName: "",
      licenseNumber: "",
      email: "",
      contact: "",
      industry: "",
      project: "",
      deliverable: "",
      missionDate: "",
      duration: "",
      weather: "",
      comments: "",
    });
    setFiles([]);
  };

  const openDatePicker = () => {
    if (missionDateRef.current) {
      if (typeof missionDateRef.current.showPicker === "function") {
        missionDateRef.current.showPicker();
      } else {
        missionDateRef.current.focus();
      }
    }
  };

  const handleSubmit = async () => {
  if (!form.pilotName || !form.licenseNumber || !form.email || !form.contact) {
    alert("Please complete all pilot information fields.");
    return;
  }

  if (!form.industry || !form.project || !form.deliverable || !form.missionDate) {
    alert("Please complete all mission details.");
    return;
  }

  if (files.length === 0) {
    alert("Please upload at least one file.");
    return;
  }

  try {
    const formData = new FormData();

    // 🔹 TEXT DATA
    formData.append("pilot_name", form.pilotName);
    formData.append("license_number", form.licenseNumber);
    formData.append("email", form.email);
    formData.append("contact_number", form.contact);
    formData.append("industry_id", form.industry);
    formData.append("project_id", form.project);
    formData.append("deliverable_id", form.deliverable);
    formData.append("mission_date", form.missionDate);
    formData.append("flight_duration", form.duration);
    formData.append("weather_conditions", form.weather);
    formData.append("comments", form.comments);

    // 🔹 FILES
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch("https://api-db-67gt.onrender.com/pilot-data", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    alert("Pilot data submitted successfully.");
    handleClear();

  } catch (error) {
    console.error("Upload error:", error);
    alert("Failed to submit pilot data.");
  }
};
  return (
    <div className="pilot-page-wrapper">
      <div className="pilot-page-header">
        <div>
          <h1>Pilot Data Upload</h1>
          <p>Upload mission data and reports from field operations</p>
        </div>
      </div>

      <section className="pilot-section">
        <div className="section-heading">
          <div className="section-icon">
            <User size={20} />
          </div>
          <div>
            <h2>Pilot Information</h2>
            <p>Provide the pilot’s identity details for mission logging.</p>
          </div>
        </div>

        <div className="pilot-grid pilot-grid--two">
          <div className="field-item">
            <label>
              Pilot Name <span className="required">*</span>
            </label>
            <input
              name="pilotName"
              value={form.pilotName}
              onChange={handleChange}
              placeholder="Enter pilot name"
            />
          </div>

          <div className="field-item">
            <label>
              License Number <span className="required">*</span>
            </label>
            <input
              name="licenseNumber"
              value={form.licenseNumber}
              onChange={handleChange}
              placeholder="e.g., FAA-123456"
            />
          </div>

          <div className="field-item">
            <label>
              Email <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="pilot@example.com"
              />
            </div>
          </div>

          <div className="field-item">
            <label>
              Contact Number <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <Phone size={16} />
              <input
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pilot-section">
        <div className="section-heading">
          <div className="section-icon section-icon--green">
            <Target size={20} />
          </div>
          <div>
            <h2>Mission Details</h2>
            <p>Capture the mission and environmental details for the flight.</p>
          </div>
        </div>

        <div className="pilot-grid pilot-grid--three">
          <div className="field-item">
            <label>
              Industry <span className="required">*</span>
            </label>
            <select name="industry" value={form.industry} onChange={handleChange}>
              <option value="">Select Industry</option>
              {reportIndustries.map((industry) => {
                const id = industry.id || industry._id || industry.name;
                const label = industry.name || industry.industry_name || industry.title || industry.id || industry._id;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="field-item">
            <label>
              Project <span className="required">*</span>
            </label>
            <select name="project" value={form.project} onChange={handleChange}>
              <option value="">Select Project</option>
              {reportProjects.map((project) => {
                const id = project.id || project._id || project.project_code || project.code || project.name;
                const label = project.project_name || project.name || project.title || project.project_code || project.code;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="field-item">
            <label>
              Deliverable <span className="required">*</span>
            </label>
            <select
              name="deliverable"
              value={form.deliverable}
              onChange={handleChange}
            >
              <option value="">Select Deliverable</option>
              {reportDeliverables.map((deliverable) => {
                const id = deliverable.id || deliverable._id || deliverable.deliverable_code || deliverable.code || deliverable.name;
                const label = deliverable.deliverable_name || deliverable.name || deliverable.title || deliverable.deliverable_code || deliverable.code;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="field-item">
            <label>Mission Date</label>
            <div className="date-field">
              <input
                type="date"
                name="missionDate"
                value={form.missionDate}
                onChange={handleChange}
                ref={missionDateRef}
              />
              <button type="button" className="icon-button" onClick={openDatePicker} aria-label="Open calendar">
                <Calendar size={18} />
              </button>
            </div>
          </div>

          <div className="field-item">
            <label>Flight Duration (minutes)</label>
            <input
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="e.g., 45"
            />
          </div>

          <div className="field-item">
            <label>Weather Conditions</label>
            <select name="weather" value={form.weather} onChange={handleChange}>
              <option value="">Select Conditions</option>
              <option value="Clear">Clear</option>
              <option value="Partly Cloudy"> Partly Cloudy</option>
              <option value="Overcast">Overcast</option>
              <option value="Cloudy">Cloudy</option>
               <option value="Sunny">Sunny</option>
              <option value="Rainy">Rainy</option>
              <option value="Foggy">Foggy</option>
              <option value="Snowy">Snowy</option>
              <option value="Windy">Windy</option>
            </select>
          </div>
        </div>
      </section>

      <section className="pilot-section">
        <div className="section-heading">
          <div className="section-icon section-icon--purple">
            <UploadCloud size={20} />
          </div>
          <div>
            <h2>Upload Files</h2>
            <p>Attach mission assets such as photos, videos, and documents.</p>
          </div>
        </div>

        <label className="file-dropzone">
          <input type="file" multiple onChange={handleFileChange} />
          <div className="dropzone-content">
            <UploadCloud size={40} />
            <p>Click to upload or drag and drop</p>
            <span>Images, Videos, PDFs, or Documents (Max 100MB per file)</span>
          </div>
        </label>
        {files.length > 0 && (
          <div className="file-list">
            <strong>Selected files:</strong>
            <ul>
              {files.map((file) => (
                <li key={file.name}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="pilot-section">
        <div className="section-heading">
          <div className="section-icon section-icon--orange">
            <MessageCircle size={20} />
          </div>
          <div>
            <h2>Additional Comments</h2>
            <p>Add any additional notes, observations, or issues encountered during the mission.</p>
          </div>
        </div>

        <textarea
          name="comments"
          value={form.comments}
          onChange={handleChange}
          placeholder="Add any additional notes, observations, or issues encountered during the mission..."
        />
      </section>

      <div className="pilot-actions">
        <button type="button" className="btn btn-secondary" onClick={handleClear}>
          Clear Form
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          Submit Pilot Data
        </button>
      </div>
    </div>
  );
}
