import React from "react";
import { Navigate } from "react-router-dom";

const landingByRole = {
  superadmin: "/superadmin-dashboard",
  admin: "/admin-dashboard",
  user: "/user-dashboard",
  pilot: "/pilot-dashboard",
  annotator: "/user-dashboard",
};

export default function ProtectedRoute({ user, requiredRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to={landingByRole[user.role] || "/login"} replace />;
  }

  return children;
}
