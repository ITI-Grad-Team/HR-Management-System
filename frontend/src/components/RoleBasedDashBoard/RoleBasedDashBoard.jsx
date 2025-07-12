import { useAuth } from "../../context/AuthContext";
import AdminDashboard from "../AdminDashboard/AdminDashboard";
import HrDashboard from "../HrDashboard/HrDashboard";
// import EmployeeDashboard from "./EmployeeDashboard";

export default function RoleBasedDashboard() {
  const { role } = useAuth();

  if (role === "admin") return <AdminDashboard />;
  if (role === "hr") return <HrDashboard />;
  if (role === "employee") return <EmployeeDashboard />;

  return <p>Unauthorized</p>;
}
