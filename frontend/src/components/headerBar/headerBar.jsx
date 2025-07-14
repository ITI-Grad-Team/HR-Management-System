import React from 'react';
import { Form, InputGroup, Button } from "react-bootstrap";
import { FaSearch, FaRegBell } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/dashboard/home": "Dashboard",
  "/dashboard/employees": "Employees",
  "/dashboard/attendance": "Attendance",
  "/dashboard/payroll": "Payroll",
  "/dashboard/applications": "Applications",
  "/dashboard/settings": "Settings",
};

export default function HeaderBar() {
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
          src="https://i.pravatar.cc/32"
          alt="avatar"
          className="rounded-circle"
        />
      </div>
    </div>
  );
}
