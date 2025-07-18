import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/config.js";
import BioCard from "../../components/BioCard/BioCard.jsx";
import SectionBlock from "../../components/SectionBlock/SectionBlock.jsx";
import { toast } from "react-toastify";
import EmployeesFallBack from "../../components/DashboardFallBack/EmployeesFallBack.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import "./employees.css";

const Employees = () => {
  const [hrs, setHrs] = useState([]);
  const [employees, setEmployees] = useState([]); // Stores current page's employees
  const [candidates, setCandidates] = useState([]); // Stores current page's candidates
  const [allEmployeesForFilters, setAllEmployeesForFilters] = useState([]); // Stores all employees for filter options
  const [allCandidatesForFilters, setAllCandidatesForFilters] = useState([]); // Stores all candidates for filter options
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const location = useLocation();
  // searchParam is no longer used for filtering on this page, it's handled by SearchResultsPage
  const searchParam = new URLSearchParams(location.search).get("search")?.toLowerCase() || "";


  // Pagination states for HR Team
  const [currentHrPage, setCurrentHrPage] = useState(1);
  const [hrsPerPage] = useState(8); // Backend page size
  const [totalHrCount, setTotalHrCount] = useState(0);

  // Pagination states for Employees
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [employeesPerPage] = useState(8); // Backend page size
  const [totalEmployeeCount, setTotalEmployeeCount] = useState(0);

  // Pagination states for Candidates
  const [currentCandidatePage, setCurrentCandidatePage] = useState(1);
  const [candidatesPerPage] = useState(8); // Backend page size
  const [totalCandidateCount, setTotalCandidateCount] = useState(0);

  const [employeeFilters, setEmployeeFilters] = useState({
    region: "",
    position: "",
    is_coordinator: "",
    application_link: "",
  });
  const [candidateFilters, setCandidateFilters] = useState({
    region: "",
    position: "",
    application_link: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const paginationParams = (page, pageSize) => ({
          page: page,
          page_size: pageSize,
        });

        if (role === "admin") {
          const [hrsRes, employeesRes, candidatesRes, allEmployeesRes, allCandidatesRes] = await Promise.all([
            axiosInstance.get("/admin/hrs/", { params: paginationParams(currentHrPage, hrsPerPage) }),
            axiosInstance.get("/admin/employees/", { params: { ...paginationParams(currentEmployeePage, employeesPerPage), interview_state: "accepted" } }),
            axiosInstance.get("/admin/employees/", { params: { ...paginationParams(currentCandidatePage, candidatesPerPage), interview_state_not: "accepted" } }),
            axiosInstance.get("/admin/employees/", { params: { interview_state: "accepted" } }), // Fetch all accepted employees for filters
            axiosInstance.get("/admin/employees/", { params: { interview_state_not: "accepted" } }), // Fetch all non-accepted candidates for filters
          ]);

          setHrs(hrsRes.data.results);
          setTotalHrCount(hrsRes.data.count);

          setEmployees(employeesRes.data.results);
          setTotalEmployeeCount(employeesRes.data.count);

          setCandidates(candidatesRes.data.results);
          setTotalCandidateCount(candidatesRes.data.count);

          setAllEmployeesForFilters(allEmployeesRes.data.results);
          setAllCandidatesForFilters(allCandidatesRes.data.results);

        } else if (role === "hr") {
          const [employeesRes, candidatesRes, allEmployeesRes, allCandidatesRes] = await Promise.all([
            axiosInstance.get("/hr/employees/", { params: { ...paginationParams(currentEmployeePage, employeesPerPage), interview_state: "accepted" } }),
            axiosInstance.get("/hr/employees/", { params: { ...paginationParams(currentCandidatePage, candidatesPerPage), interview_state_not: "accepted" } }),
            axiosInstance.get("/hr/employees/", { params: { interview_state: "accepted" } }), // Fetch all accepted employees for filters
            axiosInstance.get("/hr/employees/", { params: { interview_state_not: "accepted" } }), // Fetch all non-accepted candidates for filters
          ]);

          setEmployees(employeesRes.data.results);
          setTotalEmployeeCount(employeesRes.data.count);

          setCandidates(candidatesRes.data.results);
          setTotalCandidateCount(candidatesRes.data.count);

          setAllEmployeesForFilters(allEmployeesRes.data.results);
          setAllCandidatesForFilters(allCandidatesRes.data.results);
        }
      } catch (err) {
        toast.error("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, currentHrPage, currentEmployeePage, currentCandidatePage]);

  const filterPeople = (people, filters = {}) => {
    if (Object.keys(filters).length === 0) {
      return people;
    }

    return people.filter((person) => {
      const position = person.position?.toLowerCase() || "";
      const region = person.region?.toLowerCase() || "";

      return (
        (filters.region === "" || region.includes(filters.region.toLowerCase())) &&
        (filters.position === "" || position.includes(filters.position.toLowerCase())) &&
        (filters.is_coordinator === undefined || filters.is_coordinator === "" ||
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

    // Check if any filter is active
    const isFilterActive = Object.values(filters).some(value => value !== "" && value !== undefined && value !== null);

    // Define the reset function specific to this filter set
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
        <h5>{title} Filters</h5>
        <div className="row g-3 align-items-end"> {/* Use g-3 for smaller gutter, align-items-end for button alignment */}
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
          {showCoordinatorFilter && (
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
          {/* Conditionally render the Clear Filters button */}
          {isFilterActive && (
            <div className="col-md-3"> {/* Use a column for consistent spacing */}
              <button className="btn btn-outline-secondary w-100 mt-md-4" onClick={handleReset}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <EmployeesFallBack />;

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

  return (
    <div className="employees-page container py-4">
      {role === "admin" && (
        <SectionBlock title="HR Team">
          {filteredHrs.length > 0 ? (
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
            </>
          ) : (
            <div className="no-data">No HR members found</div>
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
        {filteredEmployees.length > 0 ? (
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
      </SectionBlock>

      <SectionBlock title="Candidates">
        {renderFilterControls(
          candidateFilters,
          setCandidateFilters,
          allCandidatesForFilters, // Use allCandidatesForFilters for options
          "Candidates",
          true // Changed to true to show Coordinator filter for candidates
        )}
        {filteredCandidates.length > 0 ? (
          <>
            {renderGrid(
              filteredCandidates,
              (cand) => `/dashboard/employeeDetails/${cand.id}`
            )}
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                currentPage={currentCandidatePage}
                totalPages={totalCandidatePages}
                onPageChange={handleCandidatePageChange}
              />
            </div>
          </>
        ) : (
          <div className="no-data">No candidates match the filters</div>
        )}
      </SectionBlock>
    </div>
  );
};

export default Employees;
