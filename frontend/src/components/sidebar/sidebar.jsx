import React from 'react';
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUserFriends,
  FaCalendarCheck,
  FaSuitcase,
  FaMoneyBillWave,
  FaChartBar,
  FaCog,
  FaQuestionCircle,
  FaSignOutAlt,
  FaUserTie,
} from "react-icons/fa";
import "./sidebar.css";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { role, logout } = useAuth();

  return (
    <div className="sidebar">
      <h6>MAIN MENU</h6>

      {role === "admin" && (
        <>
          <Nav className="flex-column">
            <Nav.Link
              as={Link}
              to="/dashboard/home"
              className={pathname === "/dashboard/home" ? "active" : ""}
            >
              <FaHome /> Dashboard
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/dashboard/employees"
              className={pathname === "/dashboard/employees" ? "active" : ""}
            >
              <FaUserFriends /> Employee Directory
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/dashboard/attendance"
              className={pathname === "/dashboard/attendance" ? "active" : ""}
            >
              <FaCalendarCheck /> Attendance & Leave
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/dashboard/recruitment"
              className={pathname === "/dashboard/recruitment" ? "active" : ""}
            >
              <FaSuitcase /> Recruitment
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/dashboard/payroll"
              className={pathname === "/dashboard/payroll" ? "active" : ""}
            >
              <FaMoneyBillWave /> Payroll
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/dashboard/applications"
              className={pathname === "/dashboard/applications" ? "active" : ""}
            >
              <FaUserTie /> Applications
            </Nav.Link>
          </Nav>

          <div className="spacer" />

          <h6>OTHER</h6>

          <Nav className="flex-column">
            <Nav.Link
              as={Link}
              to="/dashboard/settings"
              className={pathname === "/dashboard/settings" ? "active" : ""}
            >
              <FaCog /> Settings
            </Nav.Link>
            <Nav.Link onClick={logout} className="text-danger mt-auto">
              <FaSignOutAlt /> Logout
            </Nav.Link>
          </Nav>
        </>
      )}

      {role === "hr" && (
        <>
          <Nav className="flex-column">
            <Nav.Link
              as={Link}
              to="/dashboard/home"
              className={pathname === "/dashboard/home" ? "active" : ""}
            >
              <FaHome /> Dashboard
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard/employees"
              className={pathname === "/dashboard/employees" ? "active" : ""}
            >
              <FaUserFriends /> Employee Directory
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard/attendance"
              className={pathname === "/dashboard/attendance" ? "active" : ""}
            >
              <FaCalendarCheck /> Attendance & Leave
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard/payroll"
              className={pathname === "/dashboard/payroll" ? "active" : ""}
            >
              <FaMoneyBillWave /> Payroll
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard/applications"
              className={pathname === "/dashboard/applications" ? "active" : ""}
            >
              <FaUserTie /> Applications
            </Nav.Link>
          </Nav>

          <div className="spacer" />

          <h6>OTHER</h6>

          <Nav className="flex-column">
            <Nav.Link
              as={Link}
              to="/dashboard/settings"
              className={pathname === "/dashboard/settings" ? "active" : ""}
            >
              <FaCog /> Settings
            </Nav.Link>
            <Nav.Link onClick={logout} className="text-danger mt-auto">
              <FaSignOutAlt /> Logout
            </Nav.Link>
          </Nav>
        </>
      )}
    </div>
  );
}
