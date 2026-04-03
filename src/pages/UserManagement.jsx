import React, { useState, useMemo, useEffect } from "react";
import "./adminManagement.css";

// ICONS
const IconSearch = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
const IconPlus = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>;
const IconMore = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const IconX = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IconSort = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>;
const IconChevronLeft = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>;
const IconChevronRight = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>;

export default function UserManagement() {
  // STATE
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🔥 API INTEGRATION (FIXED FOR YOUR BACKEND)
  useEffect(() => {
    fetch("https://api-db-67gt.onrender.com/get-User_Management_data")
      .then((res) => res.json())
      .then((data) => {
        console.log("User API response:", data);

        if (Array.isArray(data.users)) {
          const normalized = data.users.map((u) => ({
            id: u.user_id,        // ✅ FIX
            name: u.username,     // ✅ FIX
            email: u.email,
            plan: u.plan,
            status: u.status,
            joined: u.joined,
          }));
          setUsers(normalized);
        } else {
          console.error("Invalid user data format", data);
          setUsers([]);
        }
      })
      .catch((err) => {
        console.error("User API error:", err);
        setUsers([]);
      });
  }, []);

  // FILTER + SORT
  const filteredUsers = useMemo(() => {
    let data = [...users];

    if (searchTerm) {
      data = data.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      data = data.filter((u) => u.status === statusFilter);
    }

    if (sortConfig.key) {
      data.sort((a, b) =>
        sortConfig.direction === "asc"
          ? a[sortConfig.key] > b[sortConfig.key] ? 1 : -1
          : a[sortConfig.key] < b[sortConfig.key] ? 1 : -1
      );
    }

    return data;
  }, [users, searchTerm, statusFilter, sortConfig]);

  // PAGINATION
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // RENDER
  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="title">User Management</h1>
          <p className="subtitle">Manage registered users and subscriptions</p>
        </div>
        <button className="btn-create">
          <IconPlus /> New User
        </button>
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <IconSearch />
            <input
              id="user-search"
              name="userSearch"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <table className="modern-table">
          <thead>
            <tr>
              <th>User</th>
              <th onClick={() => setSortConfig({ key: "plan", direction: "asc" })} className="sortable">
                Plan <IconSort />
              </th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                  No users found
                </td>
              </tr>
            )}

            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name}</strong>
                  <div className="email">{user.email}</div>
                </td>
                <td>{user.plan}</td>
                <td>{user.status}</td>
                <td>{user.joined}</td>
                <td>
                  <button className="btn-icon" onClick={() => setSelectedUser(user)}>
                    <IconMore />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="pagination-footer">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
          </span>

          <div className="pagination-btns">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
              <IconChevronLeft />
            </button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              <IconChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* SIMPLE DRAWER */}
      {selectedUser && (
        <div className="detail-drawer open">
          <button onClick={() => setSelectedUser(null)}>
            <IconX />
          </button>
          <h2>{selectedUser.name}</h2>
          <p>{selectedUser.email}</p>
          <p>Status: {selectedUser.status}</p>
          <p>Plan: {selectedUser.plan}</p>
        </div>
      )}
    </div>
  );
}
