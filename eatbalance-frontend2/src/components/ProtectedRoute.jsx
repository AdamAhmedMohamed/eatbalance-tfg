// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // o spinner

  if (!token) {
    return (
      <Navigate
        to="/welcome"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return children;
}
