// src/pages/Settings.jsx
import { useAuth } from "../../context/AuthContext";
import AccountSettings from "../../components/AccountSettings/AccountSettings";
import AdminSettings from "../../components/AdminSettings/AdminSettings";

export default function Settings() {
  const { role } = useAuth();
  console.log("Current role from context:", role);


  return (
    <div className="container mt-4">
      <h2 className="mb-4">Settings</h2>

      <AccountSettings />

      {role === "admin" || role === "hr" && <AdminSettings />}
    </div>
  );
}



