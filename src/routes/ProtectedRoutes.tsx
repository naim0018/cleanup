import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoutes() {
  const hasPat = localStorage.getItem("github_pat");
  const hasAppAuth = localStorage.getItem("github_app_auth");

  const isAuthenticated = !!(hasPat || hasAppAuth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
