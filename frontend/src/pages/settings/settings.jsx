import React, { useEffect } from "react";
import AccountSettings from "../../components/AccountSettings/AccountSettings";
import AdminSettings from "../../components/AdminSettings/AdminSettings";
import HrSettings from "../../components/HrSettings/HrSettings";
import { useAuth } from "../../hooks/useAuth";

export default function Settings() {
  const { role } = useAuth();
  console.log("Current role from context:", role);

  useEffect(() => {
      document.title = "Settings | HERA";
    }, []);

  return (
    <div className="container mt-4">
      {role === "admin" && <AdminSettings />}
      {role === "hr" && <HrSettings />}
    </div>
  );
}
