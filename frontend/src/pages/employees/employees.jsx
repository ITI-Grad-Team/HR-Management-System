import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/config.js";
import BioCard from "../../components/BioCard/BioCard.jsx";
import SectionBlock from "../../components/SectionBlock/SectionBlock.jsx";
import { toast } from "react-toastify";
import EmployeesFallBack from "../../components/DashboardFallBack/EmployeesFallBack.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import "./employees.css";
import { Button, Form, Spinner, Modal } from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth.js";
import { FaUserPlus } from "react-icons/fa";

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
  const [showInviteHrModal, setShowInviteHrModal] = useState(false);
  const [email, setEmail] = useState("");
  const [loadingInviteHr, setLoadingInviteHr] = useState(false);
  const [myScheduled, setMyScheduled] = useState([]);
  const [myTaken, setMyTaken] = useState([]);
  const [tempFilters, setTempFilters] = useState({
    region: "",
    position: "",
    is_coordinator: "",
    application_link: "",
  });
  const [myScheduledPagination, setMyScheduledPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });
  const [myTakenPagination, setMyTakenPagination] = useState({
    count: 0,
    previous: null,
    next: null,
    currentPage: 1,
    totalPages: 1,
  });

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

  // useEffect(() => {
  //   if (activeTab === "employees") {
  //     document.title = "Employees | HERA";
  //   } else if (activeTab === "hrs") {
  //     document.title = "HRs | HERA";
  //   } else if (activeTab === "candidates") {
  //     document.title = "Candidates | HERA";
  //   } else if (activeTab === "my-scheduled") {
  //     document.title = "My Scheduled | HERA";
  //   } else if (activeTab === "my-taken") {
  //     document.title = "My Taken | HERA";
  //   }
  // }, [activeTab]);

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

  const fetchMyScheduled = async (page = 1) => {
    if (role !== "hr") return;

    try {
      setLoading(true);
      let queryString = buildQueryString(filters);
      if (queryString) queryString = `&${queryString}`;

      const response = await axiosInstance.get(
        `/hr/employees/my-scheduled/?page=${page}${queryString}`
      );
      setMyScheduled(response.data.results);
      setMyScheduledPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
        totalPages: Math.ceil(response.data.count / 8),
      });
    } catch (error) {
      toast.error("Failed to fetch scheduled employees");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTaken = async (page = 1) => {
    if (role !== "hr") return;

    try {
      setLoading(true);
      let queryString = buildQueryString(filters);
      if (queryString) queryString = `&${queryString}`;

      const response = await axiosInstance.get(
        `/hr/employees/my-taken/?page=${page}${queryString}`
      );
      setMyTaken(response.data.results);
      setMyTakenPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
        totalPages: Math.ceil(response.data.count / 8),
      });
    } catch (error) {
      toast.error("Failed to fetch taken employees");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    setFilters({ ...tempFilters }); // Spread to create new object
  };
  const resetFilters = () => {
    const emptyFilters = {
      region: "",
      position: "",
      is_coordinator: "",
      application_link: "",
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
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
      fetchMyScheduled();
      fetchMyTaken();
    } else if (isCoordinator) {
      fetchEmployees();
    }
  }, [role, isCoordinator]);

  // Reset page and refetch when filters change
  useEffect(() => {
    console.log("Filters changed:", filters);

    if (activeTab === "my-scheduled") {
      fetchMyScheduled(1);
    } else if (activeTab === "my-taken") {
      fetchMyTaken(1);
    } else if (activeTab === "employees") {
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
    } else if (section === "my-scheduled") {
      fetchMyScheduled(page);
    } else if (section === "my-taken") {
      fetchMyTaken(page);
    }
  };

  const renderFilters = () => {
    if (
      (role === "admin" || role === "hr") &&
      (activeTab === "employees" ||
        activeTab === "candidates" ||
        activeTab === "my-scheduled" ||
        activeTab === "my-taken")
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
                    value={tempFilters.region}
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
                    value={tempFilters.position}
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
                    value={tempFilters.is_coordinator}
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
                    value={tempFilters.application_link}
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
            <div className="mt-3 d-flex justify-content-between">
              <Button variant="outline-secondary" onClick={resetFilters}>
                Reset Filters
              </Button>
              <Button
                variant="primary"
                onClick={applyFilters}
                // Remove the disabled condition to always keep it enabled
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleInviteHr = () => setShowInviteHrModal(true);

  const handleInvitaionSubmit = async (e) => {
    e.preventDefault();
    setLoadingInviteHr(true);

    if (!email.trim()) {
      toast.error("Please enter an email address");
      setLoadingInviteHr(false);
      return;
    }

    try {
      await axiosInstance.post(`/admin/invite-hr/`, { email });
      toast.success("HR Invited Successfully");
      setShowInviteHrModal(false);
      setEmail("");
    } catch (err) {
      toast.error(err.response.data.error);
    } finally {
      setLoadingInviteHr(false);
    }
  };

  return (
    <>
      <div className="employees-page">
        {/* Tabs for navigation between sections */}
        {(role === "admin" || role === "hr" || isCoordinator) && (
          <div className="mb-4">
            <ul className="nav nav-tabs">
              {role === "admin" && (
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "hrs" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("hrs")}
                  >
                    HRs
                  </button>
                </li>
              )}
              {role === "hr" && (
                <>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "my-scheduled" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("my-scheduled")}
                    >
                      My Scheduled
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "my-taken" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("my-taken")}
                    >
                      My Taken
                    </button>
                  </li>
                </>
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
          <>
            <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={handleInviteHr}
              >
                <FaUserPlus className="me-2" /> Invite HR
              </button>
            </div>
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
          </>
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

      {role === "hr" && activeTab === "my-scheduled" && (
        <SectionBlock title="My Scheduled Interviews">
          {loading ? (
            <EmployeesFallBack />
          ) : myScheduled?.length === 0 ? (
            <p>No scheduled interviews found</p>
          ) : (
            <>
              <div className="row">
                {myScheduled.map((employee) => (
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
                        interview_datetime={employee.interview_datetime}
                        time_until_interview={employee.time_until_interview}
                      />
                    </Link>
                  </div>
                ))}
              </div>
              <Pagination
                count={myScheduledPagination.count}
                next={myScheduledPagination.next}
                previous={myScheduledPagination.previous}
                currentPage={myScheduledPagination.currentPage}
                totalPages={myScheduledPagination.totalPages}
                onPageChange={(page) => handlePageChange(page, "my-scheduled")}
              />
            </>
          )}
        </SectionBlock>
      )}

      {role === "hr" && activeTab === "my-taken" && (
        <SectionBlock title="My Taken Employees">
          {loading ? (
            <EmployeesFallBack />
          ) : myTaken.length === 0 ? (
            <p>No taken employees found</p>
          ) : (
            <>
              <div className="row">
                {myTaken.map((employee) => (
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
                count={myTakenPagination.count}
                next={myTakenPagination.next}
                previous={myTakenPagination.previous}
                currentPage={myTakenPagination.currentPage}
                totalPages={myTakenPagination.totalPages}
                onPageChange={(page) => handlePageChange(page, "my-taken")}
              />
            </>
          )}
        </SectionBlock>
      )}

      <Modal
        show={showInviteHrModal}
        onHide={() => setShowInviteHrModal(false)}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title className="w-100 text-center">Invite HR</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form onSubmit={handleInvitaionSubmit}>
            <Form.Group controlId="email" className="mb-3">
              <Form.Label className="fw-semibold">Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter HR email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="py-2 px-3 rounded-3 shadow-sm border-1"
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button
                variant="primary"
                type="submit"
                disabled={loadingInviteHr}
              >
                {loadingInviteHr ? (
                  <Spinner
                    as="span"
                    size="sm"
                    animation="border"
                    className="me-2"
                  />
                ) : null}
                Send Invitation
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Employees;
