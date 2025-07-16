import React from 'react';
import { Form, InputGroup, Button } from "react-bootstrap";
import { FaSearch, FaRegBell } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';



const pageTitles = {
  "/dashboard/home": "Dashboard",
  "/dashboard/employees": "Employees",
  "/dashboard/attendance": "Attendance",
  "/dashboard/payroll": "Payroll",
  "/dashboard/applications": "Applications",
  "/dashboard/settings": "Settings",
};

export default function HeaderBar() {
  const { user } = useAuth();
  console.log("Context user:", user);

  const location = useLocation();
  const title = pageTitles[location.pathname] || "Dashboard";
  return (
    <div className="d-flex align-items-center justify-content-between mb-4">
      
      <h4 className="fw-bold mb-0 text-capitalize">{title}</h4>

      
      <div className="d-flex align-items-center gap-3">
        <InputGroup size="sm" style={{ width: "260px" }}>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control placeholder="Search candidates, jobs…" />
        </InputGroup>

        <Button variant="outline-secondary" size="sm">
          <FaRegBell />
        </Button>

        <img
  src={
    user?.basicinfo?.profile_image
      ? `${import.meta.env.VITE_IMAGES_BASE_URL}${user.basicinfo.profile_image}`
      : "https://i.pravatar.cc/36"
  }
  alt="avatar"
  className="rounded-circle"
  style={{ width: "36px", height: "36px", objectFit: "cover" }}
/>

      </div>
    </div>
  );
}
