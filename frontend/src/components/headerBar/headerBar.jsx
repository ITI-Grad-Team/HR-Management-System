import React from 'react';
import { Form, InputGroup, Button } from "react-bootstrap";
import { FaSearch, FaRegBell } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';

const pageTitles = {
  "/dashboard/home": "Dashboard",
  "/dashboard/employees": "Employees",
  "/dashboard/attendance": "Attendance",
  "/dashboard/payroll": "Payroll",
  "/dashboard/applications": "Applications",
  "/dashboard/settings": "Settings",
  "/dashboard/candidates/:id": "Candidate Details",
};

export default function HeaderBar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || "";

  const { searchQuery, setSearchQuery } = useSearch();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Log the searchQuery value right before navigation
    console.log("HeaderBar: Submitting search query:", searchQuery);

    if (searchQuery.trim()) {
      navigate(`/dashboard/search-results?query=${searchQuery.trim()}`);
    } else {
      // If search bar is cleared or empty, navigate back to the employees page
      navigate('/dashboard/employees');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-between mb-4">
      <h4 className="fw-bold mb-0 text-capitalize">{title}</h4>

      <div className="d-flex align-items-center gap-3">
        <Form onSubmit={handleSearchSubmit}>
          <InputGroup size="sm" style={{ width: "260px" }}>
            <Button variant="outline-secondary" onClick={handleSearchSubmit}>
              <FaSearch />
            </Button>
            <Form.Control
              placeholder="Search candidates, emp…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Form>

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
