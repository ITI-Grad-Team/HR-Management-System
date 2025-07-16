import { useAuth } from "../context/AuthContext";
import { Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
