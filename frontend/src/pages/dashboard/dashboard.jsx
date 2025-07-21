import React, { useEffect } from 'react';
import Sidebar from "../../components/sidebar/sidebar.jsx";
import HeaderBar from "../../components/headerBar/headerBar";
import { Outlet } from "react-router-dom";

import { Container } from "react-bootstrap";

export default function DashboardPage() {

  return (
    <div className="d-flex">
      <Sidebar />
      <div
        className="flex-grow-1 p-4"
        style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}
      >
        <HeaderBar />


        <Outlet />
      </div>
    </div>
    
  );
}
