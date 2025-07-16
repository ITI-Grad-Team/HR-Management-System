import React from 'react';
import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet, replace } from "react-router-dom";

export default function PrivateRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
