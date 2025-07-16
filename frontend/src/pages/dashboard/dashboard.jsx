import React, { useState } from 'react';
import Sidebar from "../../components/sidebar/sidebar.jsx";
import HeaderBar from "../../components/headerBar/headerBar";
import { Outlet } from "react-router-dom";

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="d-flex">
      {/* السايدبار بياخد isOpen و toggleSidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* محتوى الصفحة */}
      <div
        className="flex-grow-1"
        style={{
          backgroundColor: "#F8FAFC",
          minHeight: "100vh",
          marginLeft: isSidebarOpen ? 0 : 0, // مفيش margin لأن sidebar جوه flex
          transition: "margin 0.3s ease",
          padding: "24px"
        }}
      >
        <HeaderBar />
        <Outlet />
      </div>
    </div>
  );
}
