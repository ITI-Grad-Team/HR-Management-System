import React, { useState } from 'react';
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
  FaUserCircle,
  FaSignOutAlt,
  FaUserTie,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";
import "./sidebar.css";
import { useAuth } from "../../context/AuthContext";


export default function Sidebar() {
  const { pathname } = useLocation();
  const { role, logout, user } = useAuth();
  const { employee, hr } = user;
  const [collapsed, setCollapsed] = useState(false); // mini sidebar

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : "open"}`}>
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
      </button>

      <h6>MAIN MENU</h6>

      {role === "admin" && (
        <>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/dashboard/home" className={pathname === "/dashboard/home" ? "active" : ""}>
              <FaHome /> <span>Dashboard</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/employees" className={pathname === "/dashboard/employees" ? "active" : ""}>
              <FaUserFriends /> <span>Employee Directory</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/attendance" className={pathname === "/dashboard/attendance" ? "active" : ""}>
              <FaCalendarCheck /> <span>Attendance & Leave</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/payroll" className={pathname === "/dashboard/payroll" ? "active" : ""}>
              <FaMoneyBillWave /> <span>Payroll</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/applications" className={pathname === "/dashboard/applications" ? "active" : ""}>
              <FaUserTie /> <span>Applications</span>
            </Nav.Link>
          </Nav>

          <div className="spacer" />

          <h6>OTHER</h6>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/dashboard/settings" className={pathname === "/dashboard/settings" ? "active" : ""}>
              <FaCog /> <span>Settings</span>
            </Nav.Link>
            <Nav.Link onClick={logout} className="text-danger mt-auto">
              <FaSignOutAlt /> <span>Logout</span>
            </Nav.Link>
          </Nav>
        </>
      )}

      {role === "hr" && (
        <>
          <Nav className="flex-column">
            <Nav.Link as={Link} to={`/dashboard/hrDetails/${hr?.id}`} className={pathname === `/dashboard/hrDetails/${hr?.id}` ? "active" : ""}>
              <FaUserCircle  /> <span>Profile</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/home" className={pathname === "/dashboard/home" ? "active" : ""}>
              <FaHome /> <span>Dashboard</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/employees" className={pathname === "/dashboard/employees" ? "active" : ""}>
              <FaUserFriends /> <span>Employee Directory</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/attendance" className={pathname === "/dashboard/attendance" ? "active" : ""}>
              <FaCalendarCheck /> <span>Attendance & Leave</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/payroll" className={pathname === "/dashboard/payroll" ? "active" : ""}>
              <FaMoneyBillWave /> <span>Payroll</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/applications" className={pathname === "/dashboard/applications" ? "active" : ""}>
              <FaUserTie /> <span>Applications</span>
            </Nav.Link>
          </Nav>

          <div className="spacer" />

          <h6>OTHER</h6>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/dashboard/settings" className={pathname === "/dashboard/settings" ? "active" : ""}>
              <FaCog /> <span>Settings</span>
            </Nav.Link>
            <Nav.Link onClick={logout} className="text-danger mt-auto">
              <FaSignOutAlt /> <span>Logout</span>
            </Nav.Link>
          </Nav>
        </>
      )}

      {role === "employee" && (
        <>
          <Nav className="flex-column">
            <Nav.Link as={Link} to={`/dashboard/employeeDetails/${employee?.id}`} className={pathname === `/dashboard/employeeDetails/${employee?.id}` ? "active" : ""}>
              <FaUserCircle  /> <span>Profile</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/home" className={pathname === "/dashboard/home" ? "active" : ""}>
              <FaHome /> <span>Dashboard</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/attendance" className={pathname.startsWith("/dashboard/attendance") ? "active" : ""}>
                <FaCalendarCheck /> <span>Attendance</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/dashboard/tasks" className={pathname.startsWith("/dashboard/tasks") ? "active" : ""}>
                <FaCalendarCheck /> <span>Tasks</span>
            </Nav.Link>
          </Nav>
          <div className="spacer" />
          <h6>OTHER</h6>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/dashboard/settings" className={pathname === "/dashboard/settings" ? "active" : ""}>
              <FaCog /> <span>Settings</span>
            </Nav.Link>
            <Nav.Link onClick={logout} className="text-danger mt-auto">
              <FaSignOutAlt /> <span>Logout</span>
            </Nav.Link>
          </Nav>
        </>
      )}
    </div>
  );
}

