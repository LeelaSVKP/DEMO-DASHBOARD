import React, { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Info,
  Eye,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./alerts.css";

const BASE_URL = "https://api-db-67gt.onrender.com";

const severityConfig = {
  critical: { icon: AlertTriangle, bg: "sev-critical" },
  warning: { icon: AlertTriangle, bg: "sev-warning" },
  info: { icon: Info, bg: "sev-info" }
};

const statusConfig = {
  active: { dot: "status-dot-active", label: "Active" },
  acknowledged: { dot: "status-dot-acknowledged", label: "Acknowledged" },
  resolved: { dot: "status-dot-resolved", label: "Resolved" }
};

export default function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch(`${BASE_URL}/alerts/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          localStorage.clear();
          navigate("/");
          return;
        }

        const data = await response.json();

        const formatted = data.map((alert) => ({
          id: alert.alert_code,
          description: alert.alert_details,
          dateTime: alert.issued_datetime
            ? new Date(alert.issued_datetime).toLocaleString()
            : "N/A",
          project: alert.project_name,
          assignedTo: alert.assigned_to,
          status: alert.status?.toLowerCase(),
          severity: alert.severity?.toLowerCase()
        }));

        setAlerts(formatted);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [navigate]);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || alert.status === statusFilter;

    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  if (loading) return <div style={{ padding: 40 }}>Loading Alerts...</div>;

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1 className="page-title">System Alerts</h1>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            className="search-input"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3 className="table-title">
            Alerts List ({filteredAlerts.length})
          </h3>
        </div>

        <table className="alerts-table">
          <thead>
            <tr>
              <th>Alert Code</th>
              <th>Details</th>
              <th>Date & Time</th>
              <th>Project</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Severity</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => {
                const sInfo = severityConfig[alert.severity] || severityConfig.info;
                const stInfo = statusConfig[alert.status] || statusConfig.active;
                const SIcon = sInfo.icon;

                return (
                  <tr key={alert.id}>
                    <td>{alert.id}</td>
                    <td>{alert.description}</td>
                    <td>
                      <div className="flex-center">
                        <Clock size={18} color="#3b82f6" /> {alert.dateTime}
                      </div>
                    </td>
                    <td>{alert.project}</td>
                    <td>{alert.assignedTo}</td>
                    <td>
                      <span className="alert-status-inline">
                        <span className={`alert-status-dot ${stInfo.dot}`}></span>
                        <span>{stInfo.label}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`severity-badge ${sInfo.bg}`}>
                        <SIcon size={12} />
                        <span>{alert.severity}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: "right", position: "relative" }}>
                      <button className="btn-icon" onClick={(e) => toggleMenu(e, alert.id)}>
                        <MoreHorizontal size={16} />
                      </button>

                      {openMenuId === alert.id && (
                        <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                          <button className="menu-item">
                            <Eye size={14} /> View Details
                          </button>
                          <button className="menu-item">
                            <CheckCircle size={14} /> Acknowledge
                          </button>
                          <button className="menu-item">
                            <X size={14} /> Resolve
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="empty-row">
                  No alerts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
