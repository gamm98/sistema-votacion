import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, admin = false }) {
  const token = admin
    ? localStorage.getItem("adminToken") // 🔹 token especial para admin
    : localStorage.getItem("token");     // 🔹 token del votante

  if (!token) {
    // 🔹 Redirige al login correspondiente
    return <Navigate to={admin ? "/admin" : "/"} replace />;
  }

  return children;
}
