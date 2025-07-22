import AdminDashboard from "../AdminDashboard/AdminDashboard";
import HrDashboard from "../HrDashboard/HrDashboard";
import EmployeeDashboard from "../EmployeeDashboard/EmployeeDashboard";
import { useAuth } from "../../hooks/useAuth";
import { useEffect } from "react";
import ChatWidget from "../../components/ChatWidget/ChatWidget.jsx";

export default function RoleBasedDashboard() {
  const { role } = useAuth(); // Make sure user data is available

  useEffect(() => {
    document.title = "HERA";
  }, []);

  const renderDashboard = () => {
    switch (role) {
      case "admin":
        return <AdminDashboard />;
      case "hr":
        return <HrDashboard />;
      case "employee":
        return <EmployeeDashboard />;
      default:
        return <p>Unauthorized</p>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Main Dashboard Content */}
      {renderDashboard()}

      {/* Chat Widget (shown for all authorized roles) */}
      {["admin", "hr", "employee"].includes(role) && <ChatWidget />}
    </div>
  );
}
