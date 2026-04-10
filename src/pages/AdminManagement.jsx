import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, MoreVertical, X, Clock,
  Eye, EyeOff, CheckCircle, AlertTriangle, XCircle
} from "lucide-react";
import "./adminManagement.css";

const BASE_URL = "https://api-db-67gt.onrender.com";

export default function AdminManagement() {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [dynamicProjects, setDynamicProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [addNewMenuOpen, setAddNewMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    client_name: "",
    user_name: "",
    pilot_name: "",
    email_id: "",
    password: "",
    contact_number: "",
    drone_category: "",
    small_license_id: "",
    medium_license_id: "",
    license_number: "",
    client_code: "",
    role: "user"
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const capitalizeFirst = (value) => {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const getStatusMeta = (status) => {
    const normalized = status?.toLowerCase() || "active";

    const statusMap = {
      active: { icon: CheckCircle, color: "#22c55e", label: "Active" },
      inactive: { icon: XCircle, color: "#ef4444", label: "Inactive" },
      pending: { icon: Clock, color: "#f59e0b", label: "Pending" },
      suspended: { icon: AlertTriangle, color: "#f97316", label: "Suspended" }
    };

    return statusMap[normalized] || {
      icon: AlertTriangle,
      color: "#60a5fa",
      label: status || "Unknown"
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/");
          return;
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        };

        const [adminRes, projectRes] = await Promise.all([
          fetch(`${BASE_URL}/admins/`, { headers }),
          fetch(`${BASE_URL}/projects/`, { headers })
        ]);

        if (adminRes.status === 401) {
          navigate("/");
          return;
        }

        const adminData = await adminRes.json();
        const projectData = await projectRes.json();

        const normalizedAdmins = adminData.map((item) => ({
          id: item.client_code || item._id,
          name: item.client_name || "Unknown",
          email: item.email_id || "N/A",
          role: item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : "User",
          status: item.status || "Active",
          created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"
        }));

        const normalizedProjects = projectData.map((p) => ({
          id: p.project_code || p._id || p.id,
          name: p.project_name || p.name
        }));

        setAdmins(normalizedAdmins);
        setDynamicProjects(normalizedProjects);
        setLoading(false);
      } catch (err) {
        console.error("API Error:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleAddNewClick = () => {
    setAddNewMenuOpen((prev) => !prev);
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFormData({
      client_name: "",
      pilot_name: "",
      email_id: "",
      password: "",
      contact_number: "",
      license_number: "",
      client_code: "",
      drone_category: "",
      small_license_id: "",
      medium_license_id: "",
      role: role === "Admin" ? "admin" : role === "Pilot" ? "pilot" : "user"
    });
    setSelectedProjects([]);
    setShowPassword(false);
    setShowModal(true);
    setAddNewMenuOpen(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRole(null);
    setShowPassword(false);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("access_token");
      let endpoint = "";
      let payload = {};
      let successMessage = "";

      if (selectedRole === "Admin") {
        endpoint = `${BASE_URL}/admins/register`;
        payload = {
          name: formData.client_name,
          email: formData.email_id,
          password: formData.password,
          contact_number: formData.contact_number,
          role: "admin"
        };
        successMessage = "Admin registered successfully";
      } else if (selectedRole === "User") {
        endpoint = `${BASE_URL}/users/register`;
        payload = {
          client_name: formData.client_name,
          user_name: formData.user_name,
          email: formData.email_id,
          password: formData.password,
          contact_number: formData.contact_number,
          role: "user"
        };
        successMessage = "User registered successfully";
      } else if (selectedRole === "Pilot") {
        endpoint = `${BASE_URL}/register-pilot`;
        payload = {
          client_name: formData.client_name,
          pilot_name: formData.pilot_name,
          email_id: formData.email_id,
          password: formData.password,
          contact_number: formData.contact_number,
          drone_category: formData.drone_category,
          license_number: formData.license_number,
        };

        if (formData.drone_category === "Small") {
          payload.small_license_id = formData.small_license_id;
        } else if (formData.drone_category === "Medium") {
          payload.medium_license_id = formData.medium_license_id;
        } else if (formData.drone_category === "Hybrid") {
          payload.small_license_id = formData.small_license_id;
          payload.medium_license_id = formData.medium_license_id;
        }
        successMessage = "Pilot registered successfully";
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          alert(successMessage);
          setShowModal(false);
          setShowPassword(false);
          setFormData({
            client_name: "",
            user_name: "",
            pilot_name: "",
            email_id: "",
            password: "",
            contact_number: "",
            drone_category: "",
            small_license_id: "",
            medium_license_id: "",
            license_number: "",
            client_code: "",
            role: "user"
          });

          const adminRes = await fetch(`${BASE_URL}/admins/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            const normalizedAdmins = adminData.map((item) => ({
              id: item.client_code || item._id,
              name: item.client_name || "Unknown",
              email: item.email_id || "N/A",
              role: item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : "User",
              status: item.status || "Active",
              created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"
            }));
            setAdmins(normalizedAdmins);
          }
        } else {
          try {
            const errorData = await response.json();
            alert(errorData.message || `Failed to register ${selectedRole}. Please try again.`);
          } catch {
            alert(`Failed to register ${selectedRole}. Please try again.`);
          }
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert(`Error registering ${selectedRole}. Please try again.`);
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProjects((prev) =>
      prev.find((p) => p.id === project.id)
        ? prev.filter((p) => p.id !== project.id)
        : [...prev, project]
    );
  };

  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "All" || a.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [admins, searchTerm, roleFilter]);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="status-loader">Fetching Database Records...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {toast && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <div>
          <h1 className="title">Admin Management</h1>
        </div>
        <div className="header-actions">
          <button className="btn-create" onClick={handleAddNewClick}>
            <Plus size={18} /> Add New
          </button>
          {addNewMenuOpen && (
            <div className="add-new-menu">
              <button type="button" onClick={() => handleRoleSelect("Admin")}>Admin</button>
              <button type="button" onClick={() => handleRoleSelect("User")}>User</button>
              <button type="button" onClick={() => handleRoleSelect("Pilot")}>Pilot</button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="role-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="All">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="User">User</option>
          <option value="Pilot">Pilot</option>
        </select>
      </div>

      <div className="content-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>CLIENT CODE</th>
              <th>EMAIL</th>
              <th>SYSTEM ROLE</th>
              <th>STATUS</th>
              <th>CREATED ON</th>
              <th style={{ textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => {
              const statusMeta = getStatusMeta(admin.status);
              const StatusIcon = statusMeta.icon;

              return (
                <tr key={admin.id}>
                  <td>{admin.name}</td>
                  <td>{admin.id}</td>
                  <td>{admin.email}</td>
                  <td><span className={`role-badge ${admin.role.toLowerCase()}`}>{admin.role}</span></td>
                  <td>
                    <div className="status-container" style={{ gap: "8px" }}>
                      <StatusIcon size={14} color={statusMeta.color} />
                      {statusMeta.label}
                    </div>
                  </td>
                  <td>
                    <div className="login-time" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={14} color="#3b82f6" /> {admin.created_at}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn-icon" onClick={() => setSelectedAdmin(admin)}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content admin-card-modal" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-x" onClick={handleCloseModal}>
              <X size={20} />
            </button>

            <h2>REGISTER NEW {selectedRole ? selectedRole.toUpperCase() : "USER"}</h2>

            <form className="modal-form" onSubmit={handleSubmitForm}>
              {selectedRole === "Admin" && (
                <>
                  <div className="form-row">
                    <label>Client Name <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter client name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: capitalizeFirst(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Contact Number <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter contact number"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              {selectedRole === "User" && (
                <>
                  <div className="form-row">
                    <label>Client Name <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter client name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: capitalizeFirst(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>User Name <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter user name"
                      value={formData.user_name}
                      onChange={(e) => setFormData({ ...formData, user_name: capitalizeFirst(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Contact Number <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter contact number"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              {selectedRole === "Pilot" && (
                <>
                  <div className="form-row">
                    <label>Client Name <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter client name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: capitalizeFirst(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Pilot Name <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter pilot name"
                      value={formData.pilot_name}
                      onChange={(e) => setFormData({ ...formData, pilot_name: capitalizeFirst(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Drone Category <span className="required">*</span></label>
                    <select
                      value={formData.drone_category}
                      onChange={(e) => setFormData({ ...formData, drone_category: e.target.value, small_license_id: "", medium_license_id: "" })}
                      required
                    >
                      <option value="">Select Drone Category</option>
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  {formData.drone_category === "Small" && (
                    <div className="form-row">
                      <label>Enter Small License ID <span className="required">*</span></label>
                      <input
                        type="text"
                        placeholder="Enter small license ID"
                        value={formData.small_license_id}
                        onChange={(e) => setFormData({ ...formData, small_license_id: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  {formData.drone_category === "Medium" && (
                    <div className="form-row">
                      <label>Enter Medium License ID <span className="required">*</span></label>
                      <input
                        type="text"
                        placeholder="Enter medium license ID"
                        value={formData.medium_license_id}
                        onChange={(e) => setFormData({ ...formData, medium_license_id: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  {formData.drone_category === "Hybrid" && (
                    <>
                      <div className="form-row">
                        <label>Enter Small License ID <span className="required">*</span></label>
                        <input
                          type="text"
                          placeholder="Enter small license ID"
                          value={formData.small_license_id}
                          onChange={(e) => setFormData({ ...formData, small_license_id: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-row">
                        <label>Enter Medium License ID <span className="required">*</span></label>
                        <input
                          type="text"
                          placeholder="Enter medium license ID"
                          value={formData.medium_license_id}
                          onChange={(e) => setFormData({ ...formData, medium_license_id: e.target.value })}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="form-row">
                    <label>License Number <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter license number"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label>Contact Number <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter contact number"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-row">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email_id}
                  onChange={(e) => setFormData({ ...formData, email_id: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <label>Password <span className="required">*</span></label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <span className="eye-toggle" onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
              </div>

              <button type="submit" className="btn-confirm-blue">SUBMIT</button>
            </form>
          </div>
        </div>
      )}

      {selectedAdmin && (
        <div className="detail-drawer open">
          <div className="drawer-header">
            <h2>USER DETAILS</h2>
            <button onClick={() => setSelectedAdmin(null)} className="btn-close-modal"><X /></button>
          </div>
          <div className="drawer-body">
            <div className="profile-avatar">{selectedAdmin.name.charAt(0)}</div>
            <h3>{selectedAdmin.name}</h3>
            <p style={{ color: "#a1a1aa" }}>{selectedAdmin.email}</p>
            <div className="drawer-divider" />
            <div className="drawer-item"><span>Role: </span><strong>{selectedAdmin.role}</strong></div>
            <div className="drawer-item"><span>Code: </span><strong>{selectedAdmin.id}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
