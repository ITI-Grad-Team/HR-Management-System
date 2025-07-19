import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/config.js";
import BioCard from "../../components/BioCard/BioCard.jsx";
import SectionBlock from "../../components/SectionBlock/SectionBlock.jsx";
import { toast } from "react-toastify";
import EmployeesFallBack from "../../components/DashboardFallBack/EmployeesFallBack.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import "./employees.css";
import { FaUserPlus } from "react-icons/fa";
import { Button, Modal, Form, Spinner } from "react-bootstrap";

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

  const [showInviteHrModal, setShowInviteHrModal] = useState(false);
  const [email, setEmail] = useState("");
  const [loadingInviteHr, setLoadingInviteHr] = useState(false);
  const [loadingHrs, setLoadingHrs] = useState(true);
const [loadingEmployees, setLoadingEmployees] = useState(true);
const [loadingCandidates, setLoadingCandidates] = useState(true);




  useEffect(() => {
  const fetchHRs = async () => {
    setLoadingHrs(true);
    try {
      const res = await axiosInstance.get("/admin/hrs/", {
        params: { page: currentHrPage, page_size: hrsPerPage }
      });
      setHrs(res.data.results);
      setTotalHrCount(res.data.count);
    } catch (err) {
      toast.error("Failed to load HRs");
    } finally {
      setLoadingHrs(false);
    }
  };

  if (role === "admin") fetchHRs();
}, [currentHrPage, role]);


  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const endpoint =
          role === "admin"
            ? "/admin/employees/"
            : role === "hr"
            ? "/hr/employees/"
            : isCoordinator ? "/coordinator/employees/"
            : "";

        const res = await axiosInstance.get(endpoint, {
          params: {
                  page: currentEmployeePage, page_size: employeesPerPage,
                  interview_state: "accepted",
                },
        });

        const allRes = await axiosInstance.get(endpoint, {
          params: { interview_state: "accepted" },
        });

        setEmployees(res.data.results);
        setTotalEmployeeCount(res.data.count);
        setAllEmployeesForFilters(allRes.data.results);
      } catch (err) {
        toast.error("Failed to fetch employees");
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [role, currentEmployeePage]);

  useEffect(() => {
  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await axiosInstance.get(
        role === "admin" ? "/admin/employees/" : "/hr/employees/",
        {
          params: {
            page: currentCandidatePage,
            page_size: candidatesPerPage,
            interview_state_not: "accepted",
          },
        }
      );
      setCandidates(res.data.results);
      setTotalCandidateCount(res.data.count);
    } catch (err) {
      toast.error("Failed to load Candidates");
    } finally {
      setLoadingCandidates(false);
    }
  };

  if (role === "hr" || role === "admin") fetchCandidates();
}, [currentCandidatePage, role]);


  const filterPeople = (people, filters = {}) => {
    if (Object.keys(filters).length === 0) {
      return people;
    }

    return people.filter((person) => {
      const position = person.position?.toLowerCase() || "";
      const region = person.region?.toLowerCase() || "";

      return (
        (filters.region === "" ||
          region.includes(filters.region.toLowerCase())) &&
        (filters.position === "" ||
          position.includes(filters.position.toLowerCase())) &&
        // Only include coordinator filter if not coordinator view
        (!isCoordinator ||
          filters.is_coordinator === undefined ||
          filters.is_coordinator === "" ||
          String(person.is_coordinator) === filters.is_coordinator) &&
        (filters.application_link === "" ||
          person.application_link === filters.application_link)
      );
    });
  };

  const getUniqueValues = (people, key) => {
    const values = people.map((person) => person[key]);
    return [...new Set(values)].filter(
      (value) => value !== undefined && value !== null && value !== ""
    );
  };

  const renderFilterControls = (filters, setFilters, peopleForOptions, title, showCoordinatorFilter = true) => {
    const regions = getUniqueValues(peopleForOptions, "region");
    const positions = getUniqueValues(peopleForOptions, "position");
    const applicationLinks = getUniqueValues(peopleForOptions, "application_link");

     const isFilterActive = Object.values(filters).some(value => value !== "" && value !== undefined && value !== null);

     const handleReset = () => {
      setFilters({
        region: "",
        position: "",
        is_coordinator: "",
        application_link: "",
      });
    };

    return (
      <div className="filter-controls mb-4">
       {/*  <h5>{title} Filters</h5> */}
        <div className="row g-3 align-items-end">  
          <div className="col-md-3">
            <label className="form-label">Region</label>
            <select
              className="form-select"
              value={filters.region}
              onChange={(e) =>
                setFilters({ ...filters, region: e.target.value })
              }
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Position</label>
            <select
              className="form-select"
              value={filters.position}
              onChange={(e) =>
                setFilters({ ...filters, position: e.target.value })
              }
            >
              <option value="">All Positions</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          {showCoordinatorFilter && !isCoordinator && (
            <div className="col-md-3">
              <label className="form-label">Coordinator</label>
              <select
                className="form-select"
                value={filters.is_coordinator}
                onChange={(e) =>
                  setFilters({ ...filters, is_coordinator: e.target.value })
                }
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          )}
          <div className="col-md-3">
            <label className="form-label">Application Link</label>
            <select
              className="form-select"
              value={filters.application_link}
              onChange={(e) =>
                setFilters({ ...filters, application_link: e.target.value })
              }
            >
              <option value="">All Applications</option>
              {applicationLinks.map((link) => (
                <option key={link} value={link}>
                  {link}
                </option>
              ))}
            </select>
          </div>
           {isFilterActive && (
            <div className="col-md-3">  
              <button className="btn btn-outline-secondary w-100 mt-md-4" onClick={handleReset}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGrid = (data, getPath) => (
    <div className="row g-4">
      {data.map((person) => (
        <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={person.id}>
          <Link to={getPath(person)} className="text-decoration-none" style={{ cursor: "pointer" }}>
            <BioCard
              name={person.basicinfo?.username || person.basic_info?.username}
              email={person.user?.username}
              phone={person.basicinfo?.phone || person.basic_info?.phone}
              avatar={
                person.basicinfo?.profile_image ||
                person.basic_info?.profile_image ||
                "/default.jpg"
              }
              department={person.position}
              location={person.region}
              education={person.highest_education_field}
              isCoordinator={person.is_coordinator}
              experience={person.years_of_experience}
              role={person.basic_info?.role}
              status={person.interview_state}
            />
          </Link>
        </div>
      ))}
    </div>
  );

  const filteredHrs = filterPeople(hrs);
  const filteredEmployees = filterPeople(employees, employeeFilters);
  const filteredCandidates = filterPeople(candidates, candidateFilters);

  const totalHrPages = Math.ceil(totalHrCount / hrsPerPage);
  const totalEmployeePages = Math.ceil(totalEmployeeCount / employeesPerPage);
  const totalCandidatePages = Math.ceil(totalCandidateCount / candidatesPerPage);

  const handleHrPageChange = (pageNumber) => setCurrentHrPage(pageNumber);
  const handleEmployeePageChange = (pageNumber) => setCurrentEmployeePage(pageNumber);
  const handleCandidatePageChange = (pageNumber) => setCurrentCandidatePage(pageNumber);

  const handleInviteHr = () => setShowInviteHrModal(true);

  const handleInvitaionSubmit = async (e) => {
    e.preventDefault();
    setLoadingInviteHr(true);

    if (!email.trim()) {
  toast.error("Please enter an email address");
  setLoadingInviteHr(false);
  return;
}

    try{
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
    <div className="employees-page container py-4">
      {role === "admin" && (
        <SectionBlock title="HR Team"
        extraHeader={
          <div className="d-flex justify-content-end">
            <button className="btn btn-outline-primary d-flex align-items-center" onClick={handleInviteHr}>
            <FaUserPlus className="me-2"/> Invite HR
            </button>
          </div>
        }
        >
          { loadingHrs ? <EmployeesFallBack /> :
          filteredHrs.length > 0 ? (
            <>
              {renderGrid(
                filteredHrs,
                (hr) => `/dashboard/hrDetails/${hr.id}`
              )}
              <div className="d-flex justify-content-center mt-4">
                <Pagination
                  currentPage={currentHrPage}
                  totalPages={totalHrPages}
                  onPageChange={handleHrPageChange}
                />
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

      <SectionBlock title="Employees">
        {renderFilterControls(
          employeeFilters,
          setEmployeeFilters,
          allEmployeesForFilters,
          "Employees",
          true
        )}
        { loadingEmployees ? <EmployeesFallBack /> :
        filteredEmployees.length > 0 ? (
          <>
            {renderGrid(
              filteredEmployees,
              (emp) => `/dashboard/employeeDetails/${emp.id}`
            )}
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                currentPage={currentEmployeePage}
                totalPages={totalEmployeePages}
                onPageChange={handleEmployeePageChange}
              />
            </div>
          </>
        ) : (
          <div className="no-data">No employees match the filters</div>
        )}

      {/* Candidates Section */}
      {(role === "admin" || role === "hr") && activeTab === "candidates" && (
        <SectionBlock title="Candidates">
          {renderFilterControls(
            candidateFilters,
            setCandidateFilters,
            allCandidatesForFilters,  
            "Candidates",
            false 
        )}
        {loadingCandidates ? <EmployeesFallBack /> :
        filteredCandidates.length > 0 ? (
          <>
            {renderGrid(
              filteredCandidates,
              (cand) => `/dashboard/employeeDetails/${cand.id}`
            )}
            <div className="d-flex justify-content-center mt-4">
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
