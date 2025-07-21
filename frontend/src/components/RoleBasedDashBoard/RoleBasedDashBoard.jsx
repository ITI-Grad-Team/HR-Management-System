import AdminDashboard from "../AdminDashboard/AdminDashboard";
import HrDashboard from "../HrDashboard/HrDashboard";
import EmployeeDashboard from "../EmployeeDashboard/EmployeeDashboard";
import { useAuth } from "../../hooks/useAuth";
import { useEffect } from "react";

export default function RoleBasedDashboard() {
  const { role } = useAuth();

  useEffect(() => {
    document.title = "HERA"
  }, []);

  if (role === "admin") return <AdminDashboard />;
  if (role === "hr") return <HrDashboard />;
  if (role === "employee") return <EmployeeDashboard />;

  return <p>Unauthorized</p>;
}
