import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { ChevronDown, Loader2, BarChart3, AlertCircle } from "lucide-react";
import { useLocation } from 'react-router-dom'; 
import { apiFetch } from "../utils/api"; 
import "./analytics.css"; 

export default function AnalyticsPage({ user }) {
  const location = useLocation();

  // --- 1. FILTER & UI STATES ---
  // Initialized with empty arrays so .map() never hits 'undefined'
  const [filterOptions, setFilterOptions] = useState({
    industries: [],
    projects: [],
    deliverables: [],
    versions: [1, 2, 3, 4, 5]
  });

  const [selections, setSelections] = useState({
    industry: "",
    project: "",
    deliverable: "",
    version: ""
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- 2. PERMISSION STATES ---
  const [adminAccess, setAdminAccess] = useState(localStorage.getItem('access_admin') === 'true');
  const [userAccess, setUserAccess] = useState(localStorage.getItem('access_user') === 'true');

  const role = user?.role?.toLowerCase() || "";
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  // --- 3. LOCK LOGIC ---
  let isViewLocked = true; 
  if (isSuperAdmin) {
    isViewLocked = false; 
  } else if (isAdmin) {
    if (adminAccess) isViewLocked = false; 
  } else if (isUser) {
    if (userAccess) isViewLocked = false; 
  }

  // --- 4. TOGGLE HANDLER ---
  const togglePermission = (roleKey) => {
    if (roleKey === 'admin') {
      const newState = !adminAccess;
      setAdminAccess(newState);
      localStorage.setItem('access_admin', newState ? 'true' : 'false');
    } else if (roleKey === 'user') {
      const newState = !userAccess;
      setUserAccess(newState);
      localStorage.setItem('access_user', newState ? 'true' : 'false');
    }
  };

  /* ================= 5. INITIAL LOAD: Industries ================= */
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

  /* ================= 5.1 DYNAMIC DISCOVERY: Projects/Deliverables/Versions ================= */
  // Fetch Projects when Industry changes
  useEffect(() => {
    if (!selections.industry) return;
    const fetchProjects = async () => {
      const res = await apiFetch(`/reports/?industry_id=${selections.industry}`);
      if (res.ok) {
        const data = await res.json();
        setFilterOptions(prev => ({ ...prev, projects: data.projects || [] }));
      }
    };
    fetchProjects();
  }, [selections.industry]);

  // Fetch Deliverables when Project changes
  useEffect(() => {
    if (!selections.project) return;
    const fetchDeliverables = async () => {
      const res = await apiFetch(`/reports/?industry_id=${selections.industry}&project_id=${selections.project}`);
      if (res.ok) {
        const data = await res.json();
        setFilterOptions(prev => ({ ...prev, deliverables: data.deliverables || [] }));
      }
    };
    fetchDeliverables();
  }, [selections.project, selections.industry]);

  // Fetch Versions when Deliverable changes
  useEffect(() => {
    if (!selections.deliverable) return;
    const fetchVersions = async () => {
      try {
        // We use the same discovery pattern as the Reports page
        const query = `industry_id=${selections.industry}&project_id=${selections.project}&deliverable_id=${selections.deliverable}`;
        const res = await apiFetch(`/reports/?${query}`);
        
        if (res.ok) {
          const data = await res.json();
          // Extract versions: backend might send data.versions or we map from reports
          const vList = data.versions || (data.reports?.map(r => r.version)) || [];
          const uniqueVersions = [...new Set(vList)].filter(v => v != null).sort((a, b) => a - b);
          
          setFilterOptions(prev => ({ 
            ...prev, 
            versions: uniqueVersions.length > 0 ? uniqueVersions : [1, 2, 3] 
          }));
        }
      } catch (err) {
        console.error("Version Discovery Error:", err);
      }
    };
    fetchVersions();
  }, [selections.deliverable]);
  // --- 6. URL PARAMETER SYNC (set industry/project only) ---
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const ind = queryParams.get('industry');
    const proj = queryParams.get('project');

    // Apply industry and project early; deliverable & version will be auto-selected
    if (ind) setSelections(prev => ({ ...prev, industry: ind }));
    if (proj) setSelections(prev => ({ ...prev, project: proj }));
  }, [location.search]);

  // Auto-select project when projects list loads (match by id or name)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const projParam = queryParams.get('project');
    if (!projParam || !filterOptions.projects?.length) return;
    if (selections.project) return; // already set

    const found = filterOptions.projects.find(p => {
      const cand = (p._id || p.id || p.project_id || "").toString();
      if (cand === projParam.toString()) return true;
      const name = (p.name || p.project_name || "").toString().toLowerCase();
      if (name === projParam.toString().toLowerCase()) return true;
      return false;
    });

    if (found) {
      const resolved = found._id || found.id || found.project_id;
      setSelections(prev => ({ ...prev, project: resolved }));
    }
  }, [filterOptions.projects, location.search, selections.project]);

  // Auto-select deliverable when deliverables list loads (match by id OR name), or pick the only one
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const delParam = queryParams.get('deliverable');
    if (!filterOptions.deliverables?.length) return;
    if (selections.deliverable) return;

    // Try id match first
    if (delParam) {
      const byId = filterOptions.deliverables.find(d => {
        const cand = (d._id || d.id || d.deliverable_id || "").toString();
        if (cand === delParam.toString()) return true;
        // allow URL containing deliverable name as fallback
        const name = (d.name || d.deliverable_name || "").toString().toLowerCase();
        if (name === delParam.toString().toLowerCase()) return true;
        return false;
      });
      if (byId) {
        const resolved = byId._id || byId.id || byId.deliverable_id;
        setSelections(prev => ({ ...prev, deliverable: resolved }));
        return;
      }
    }

    // If only one deliverable is available, select it
    if (filterOptions.deliverables.length === 1) {
      const only = filterOptions.deliverables[0];
      const resolved = only._id || only.id || only.deliverable_id;
      setSelections(prev => ({ ...prev, deliverable: resolved }));
    }
  }, [filterOptions.deliverables, location.search, selections.deliverable]);

  // Auto-select version when versions populate (match URL)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const verParam = queryParams.get('version');
    if (!verParam || !filterOptions.versions?.length) return;
    if (selections.version) return;

    const found = filterOptions.versions.find(v => v.toString() === verParam.toString());
    if (found) setSelections(prev => ({ ...prev, version: found }));
  }, [filterOptions.versions, location.search, selections.version]);

  // --- 7. ANALYTICS FETCH ---
  useEffect(() => {
    const { industry, project, deliverable, version } = selections;

    if (!isViewLocked && industry && project && deliverable && version) {
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

          const response = await apiFetch(`/analytics?${params}`);
          if (response.ok) {
            const jsonData = await response.json();
            setData(jsonData.graphs || null);
          } else {
            setData(null);
            setError("No data found for this selection.");
          }
        } catch (err) {
          setError("Connection failed.");
        } finally {
          setLoading(false);
        }
      };
      fetchAnalytics();
    }
  }, [selections, isViewLocked]);

  if (isViewLocked) {
    return (
      <div className="analytics-page centered-view">
        <div className="data-wait-card">
          <div className="pulse-ring">🚧</div>
          <h2 className="wait-title">Pipeline Processing</h2>
          <p className="wait-desc">
            The analytics data is currently locked.
            <br/>
            <strong>Waiting for authorization from {isAdmin ? "Super Admin" : "Admin"}.</strong>
          </p>
          <button className="btn-outline" onClick={() => window.location.reload()}>
            Check Status
          </button>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="analytics-page">
      {/* FILTER ROW WITH OPTIONAL CHAINING TO PREVENT CRASH */}
      <div className="filter-row-container">
        <div className="filter-box">
          <select value={selections.industry} onChange={(e) => setSelections({...selections, industry: e.target.value})}>
            <option value="">Industry</option>
            {filterOptions.industries?.map((ind, i) => (
              <option key={ind._id || i} value={ind._id || ind.id}>{ind.name}</option>
            ))}
          </select>
          <ChevronDown className="dropdown-icon" size={16} />
        </div>

        <div className="filter-box">
          <select value={selections.project} onChange={(e) => setSelections({...selections, project: e.target.value})}>
            <option value="">Project</option>
            {filterOptions.projects?.map((proj, i) => (
              <option key={proj._id || i} value={proj._id || proj.id}>{proj.name}</option>
            ))}
          </select>
          <ChevronDown className="dropdown-icon" size={16} />
        </div>

        <div className="filter-box">
          <select value={selections.deliverable} onChange={(e) => setSelections({...selections, deliverable: e.target.value})}>
            <option value="">Deliverable</option>
            {filterOptions.deliverables?.map((del, i) => (
              <option key={del._id || i} value={del._id || del.id}>{del.name}</option>
            ))}
          </select>
          <ChevronDown className="dropdown-icon" size={16} />
        </div>

        <div className="filter-box">
          <select value={selections.version} onChange={(e) => setSelections({...selections, version: e.target.value})}>
            <option value="">Version</option>
            {filterOptions.versions?.map(v => (
              <option key={v} value={v}>V{v}</option>
            ))}
          </select>
          <ChevronDown className="dropdown-icon" size={16} />
        </div>
      </div>

      <div className="analytics-header">
        <div className="header-left">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-desc">Viewing as: <strong style={{color: '#4f46e5', textTransform:'capitalize'}}>{role}</strong></p>
        </div>
        <div className="header-right">
          <div className="unlock-controls">
            {isSuperAdmin && (
              <button className={`btn-toggle ${adminAccess ? 'unlocked' : 'locked'}`} onClick={() => togglePermission('admin')}>
                {adminAccess ? "🔓 Unlock Admin (Active)" : "🔒 Lock Admin (Inactive)"}
              </button>
            )}
            {isAdmin && (
              <button className={`btn-toggle ${userAccess ? 'unlocked' : 'locked'}`} onClick={() => togglePermission('user')}>
                {userAccess ? "🔓 Unlock User (Active)" : "🔒 Lock User (Inactive)"}
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="status-loader">
          <Loader2 className="spinner" size={30} />
          <span>Synchronizing with Backend...</span>
        </div>
      )}

      {error && (
        <div className="error-notice">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {data && !loading ? (
        <div className="charts-grid-container">
          {/* Box 1: Bar Chart */}
          <div className="chart-card-light">
            <div className="chart-title">Hourly Summary (Bar)</div>
            <div className="chart-viz-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.barData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="label" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Box 2: Pie Chart */}
          <div className="chart-card-light">
            <div className="chart-title">Vehicle Split (Pie)</div>
            <div className="chart-viz-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.pieData || []} innerRadius="60%" outerRadius="80%" dataKey="value" nameKey="label" paddingAngle={5}>
                    {(data.pieData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Box 3: Area Chart */}
          <div className="chart-card-light">
            <div className="chart-title">Flow Intensity (Area)</div>
            <div className="chart-viz-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.areaData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="time" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Box 4: Line Chart */}
          <div className="chart-card-light">
            <div className="chart-title">Daily Summary Trends (Line)</div>
            <div className="chart-viz-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.lineData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="time" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="empty-notice">
          <BarChart3 size={60} style={{opacity: 0.1, marginBottom: '20px'}} />
          <h3>No Analysis Selected</h3>
          <p>Please select filters to load your dashboard.</p>
        </div>
      )}
    </div>
  );
}