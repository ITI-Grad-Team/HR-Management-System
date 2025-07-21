import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/config.js";
import BioCard from "../../components/BioCard/BioCard.jsx";
import SectionBlock from "../../components/SectionBlock/SectionBlock.jsx";
import { toast } from "react-toastify";
import EmployeesFallBack from "../../components/DashboardFallBack/EmployeesFallBack.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import "./employees.css";
import { Button, Form } from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth.js";

const Employees = () => {
  const { user } = useAuth();
  const { role, employee } = user;
  const isCoordinator =
    role === "employee" && employee?.is_coordinator === true;

  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    regions: [],
    positions: [],
    application_links: [],
  });
  const [filters, setFilters] = useState({
    region: "",
    position: "",
    is_coordinator: "",
    application_link: "",
  });
  const [hrs, setHrs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // Enhanced pagination states
  const [hrsPagination, setHrsPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });

  const [employeesPagination, setEmployeesPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });

  const [candidatesPagination, setCandidatesPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });

  const [activeTab, setActiveTab] = useState("employees");

  useEffect(() => {
    if (activeTab === "employees") {
      document.title = "Employees | HERA";
    } else if (activeTab === "hrs") {
      document.title = "HRs | HERA";
    } else {
      document.title = "Candidates | HERA";
    }
  }, [activeTab]);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await axiosInstance.get("/filter-options/");
      setFilterOptions({
        regions: response.data.regions,
        positions: response.data.positions,
        application_links: response.data.application_links,
      });
    } catch (error) {
      toast.error("Failed to fetch filter options");
      console.error(error);
    }
  };

  // Enhanced fetch functions with proper pagination handling and filters
  const fetchHrs = async (page = 1) => {
    if (role !== "admin") return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/hrs/?page=${page}`);
      setHrs(response.data.results);
      setHrsPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
        totalPages: Math.ceil(response.data.count / 8),
      });
    } catch (error) {
      toast.error("Failed to fetch HRs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const buildQueryString = (filters) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        // For region, position, and application_link, we want to filter by ID
        if (
          key === "region" ||
          key === "position" ||
          key === "application_link"
        ) {
          params.append(`${key}`, value);
        } else {
          params.append(key, value);
        }
      }
    }
    return params.toString();
  };

  const fetchEmployees = async (page = 1) => {
    if (!(role === "admin" || role === "hr" || isCoordinator)) return;

    try {
      setLoading(true);
      let queryString = buildQueryString(filters);
      if (queryString) queryString = `&${queryString}`;

      const endpoint =
        role === "admin"
          ? `/admin/employees/?interview_state=accepted&page=${page}${queryString}`
          : role === "hr"
          ? `/hr/employees/?interview_state=accepted&page=${page}${queryString}`
          : `/coordinator/employees/?page=${page}`;

      console.log(endpoint);

      const response = await axiosInstance.get(endpoint);
      setEmployees(response.data.results);
      setEmployeesPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
        totalPages: Math.ceil(response.data.count / 8),
      });
    } catch (error) {
      toast.error("Failed to fetch employees");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (page = 1) => {
    if (!(role === "admin" || role === "hr")) return;

    try {
      setLoading(true);
      let queryString = buildQueryString(filters);
      if (queryString) queryString = `&${queryString}`;

      const endpoint =
        role === "admin"
          ? `/admin/employees/?interview_state_not=accepted&page=${page}${queryString}`
          : `/hr/employees/?interview_state_not=accepted&page=${page}${queryString}`;

      const response = await axiosInstance.get(endpoint);
      setCandidates(response.data.results);
      setCandidatesPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
        totalPages: Math.ceil(response.data.count / 8),
      });
    } catch (error) {
      toast.error("Failed to fetch candidates");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      region: "",
      position: "",
      is_coordinator: "",
      application_link: "",
    });
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (role === "admin") {
      fetchHrs();
      fetchEmployees();
      fetchCandidates();
    } else if (role === "hr") {
      fetchEmployees();
      fetchCandidates();
    } else if (isCoordinator) {
      fetchEmployees();
    }
  }, [role, isCoordinator]);

  // Reset page and refetch when filters change
  useEffect(() => {
    if (activeTab === "employees") {
      fetchEmployees(1);
    } else if (activeTab === "candidates") {
      fetchCandidates(1);
    }
  }, [filters]);

  const handlePageChange = (page, section) => {
    if (section === "hrs") {
      fetchHrs(page);
    } else if (section === "employees") {
      fetchEmployees(page);
    } else if (section === "candidates") {
      fetchCandidates(page);
    }
  };

  const renderFilters = () => {
    if (
      (role === "admin" || role === "hr") &&
      (activeTab === "employees" || activeTab === "candidates")
    ) {
      return (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Filters</h5>
            <div className="row">
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Region</Form.Label>
                  <Form.Select
                    name="region"
                    value={filters.region}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Regions</option>
                    {filterOptions.regions.map((region) => (
                      <option key={region[0]} value={region[0]}>
                        {region[1]}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Position</Form.Label>
                  <Form.Select
                    name="position"
                    value={filters.position}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Positions</option>
                    {filterOptions.positions.map((position) => (
                      <option key={position[0]} value={position[0]}>
                        {position[1]}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Coordinator</Form.Label>
                  <Form.Select
                    name="is_coordinator"
                    value={filters.is_coordinator}
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Application Link</Form.Label>
                  <Form.Select
                    name="application_link"
                    value={filters.application_link}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Applications</option>
                    {filterOptions.application_links.map((link) => (
                      <option key={link[0]} value={link[0]}>
                        {link[1]}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            <div className="mt-3">
              <Button variant="outline-secondary" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="employees-page">
      {/* Tabs for navigation between sections */}
      {(role === "admin" || role === "hr" || isCoordinator) && (
        <div className="mb-4">
          <ul className="nav nav-tabs">
            {role === "admin" && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "hrs" ? "active" : ""}`}
                  onClick={() => setActiveTab("hrs")}
                >
                  HRs
                </button>
              </li>
            )}
            {(role === "admin" || role === "hr" || isCoordinator) && (
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "employees" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("employees")}
                >
                  Employees
                </button>
              </li>
            )}
            {(role === "admin" || role === "hr") && (
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "candidates" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("candidates")}
                >
                  Candidates
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Render filters if applicable */}
      {renderFilters()}

      {/* HR Section (only for admin) */}
      {role === "admin" && activeTab === "hrs" && (
        <SectionBlock>
          {loading ? (
            <EmployeesFallBack />
          ) : hrs.length === 0 ? (
            <p>No HRs found</p>
          ) : (
            <>
              <div className="row">
                {hrs.map((hr) => (
                  <div key={hr.id} className="col-md-6 col-lg-3 mb-4">
                    <Link
                      to={`/dashboard/hrDetails/${hr.id}`}
                      className="text-decoration-none"
                      style={{ cursor: "pointer" }}
                    >
                      <BioCard
                        name={hr.basic_info?.username}
                        email={hr.user?.username}
                        phone={hr.basic_info?.phone}
                        avatar={
                          hr.basic_info?.profile_image_url || "/default.jpg"
                        }
                        role={hr.basic_info?.role}
                      />
                    </Link>
                  </div>
                ))}
              </div>
              <Pagination
                count={hrsPagination.count}
                next={hrsPagination.next}
                previous={hrsPagination.previous}
                currentPage={hrsPagination.currentPage}
                totalPages={hrsPagination.totalPages}
                onPageChange={(page) => handlePageChange(page, "hrs")}
              />
            </>
          )}
        </SectionBlock>
      )}

      {/* Employees Section */}
      {(role === "admin" || role === "hr" || isCoordinator) &&
        activeTab === "employees" && (
          <SectionBlock title="Employees">
            {loading ? (
              <EmployeesFallBack />
            ) : employees.length === 0 ? (
              <p>No employees found</p>
            ) : (
              <>
                <div className="row">
                  {employees.map((employee) => (
                    <div key={employee.id} className="col-md-6 col-lg-3 mb-4">
                      <Link
                        to={`/dashboard/employeeDetails/${employee.id}`}
                        className="text-decoration-none"
                        style={{ cursor: "pointer" }}
                      >
                        <BioCard
                          name={employee.basic_info?.username}
                          email={employee.user?.username}
                          phone={employee.basic_info?.phone}
                          avatar={
                            employee.basic_info?.profile_image_url ||
                            "/default.jpg"
                          }
                          department={employee.position}
                          location={employee.region}
                          education={employee.highest_education_field}
                          isCoordinator={employee.is_coordinator}
                          experience={employee.years_of_experience}
                          role={employee.basic_info?.role}
                          status={employee.interview_state}
                        />
                      </Link>
                    </div>
                  ))}
                </div>
                <Pagination
                  count={employeesPagination.count}
                  next={employeesPagination.next}
                  previous={employeesPagination.previous}
                  currentPage={employeesPagination.currentPage}
                  totalPages={employeesPagination.totalPages}
                  onPageChange={(page) => handlePageChange(page, "employees")}
                />
              </>
            )}
          </SectionBlock>
        )}

      {/* Candidates Section */}
      {(role === "admin" || role === "hr") && activeTab === "candidates" && (
        <SectionBlock title="Candidates">
          {loading ? (
            <EmployeesFallBack />
          ) : candidates.length === 0 ? (
            <p>No candidates found</p>
          ) : (
            <>
              <div className="row">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="col-md-6 col-lg-3 mb-4">
                    <Link
                      to={`/dashboard/employeeDetails/${candidate.id}`}
                      className="text-decoration-none"
                      style={{ cursor: "pointer" }}
                    >
                      <BioCard
                        name={candidate.basic_info?.username}
                        email={candidate.user?.username}
                        phone={candidate.basic_info?.phone}
                        avatar={
                          candidate.basic_info?.profile_image_url ||
                          "/default.jpg"
                        }
                        department={candidate.position}
                        location={candidate.region}
                        education={candidate.highest_education_field}
                        isCoordinator={candidate.is_coordinator}
                        experience={candidate.years_of_experience}
                        role={candidate.basic_info?.role}
                        status={candidate.interview_state}
                      />
                    </Link>
                  </div>
                ))}
              </div>
              <Pagination
                count={candidatesPagination.count}
                next={candidatesPagination.next}
                previous={candidatesPagination.previous}
                currentPage={candidatesPagination.currentPage}
                totalPages={candidatesPagination.totalPages}
                onPageChange={(page) => handlePageChange(page, "candidates")}
              />
            </>
          )}
        </SectionBlock>
      )}
    </div>
  );
};

export default Employees;
