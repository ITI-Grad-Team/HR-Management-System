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
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const location = useLocation();
  const searchParam = new URLSearchParams(location.search).get("search")?.toLowerCase() || "";

  const [currentHrPage, setCurrentHrPage] = useState(1);
  const [hrsPerPage] = useState(4);

  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [employeesPerPage] = useState(4);

  const [currentCandidatePage, setCurrentCandidatePage] = useState(1);
  const [candidatesPerPage] = useState(4);

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

        if (role === "admin") {
          const [hrsRes, employeesRes, candidatesRes] = await Promise.all([
            axiosInstance.get("/admin/hrs/"),
            axiosInstance.get("/admin/employees/?interview_state=accepted"),
            axiosInstance.get("/admin/employees/?interview_state_not=accepted"),
          ]);
          setHrs(hrsRes.data.results);
          setEmployees(employeesRes.data.results);
          setCandidates(candidatesRes.data.results);
        } else if (role === "hr") {
          const [employeesRes, candidatesRes] = await Promise.all([
            axiosInstance.get("/hr/employees/?interview_state=accepted"),
            axiosInstance.get("/hr/employees/?interview_state_not=accepted"),
          ]);
          setEmployees(employeesRes.data.results);
          setCandidates(candidatesRes.data.results);
        }
      } catch (err) {
        toast.error("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

  const filterPeople = (people, filters = {}) => {
    return people.filter((person) => {
      const name = person.basicinfo?.username?.toLowerCase() || person.basic_info?.username?.toLowerCase() || "";
      const position = person.position?.toLowerCase() || "";
      const region = person.region?.toLowerCase() || "";

      const matchesSearch = name.includes(searchParam) || position.includes(searchParam) || region.includes(searchParam);

      if (Object.keys(filters).length === 0) {
        return matchesSearch;
      }

      return (
        (filters.region === "" || region.includes(filters.region.toLowerCase())) &&
        (filters.position === "" || position.includes(filters.position.toLowerCase())) &&
        (filters.is_coordinator === undefined || filters.is_coordinator === "" ||
          String(person.is_coordinator) === filters.is_coordinator) &&
        (filters.application_link === "" ||
          person.application_link === filters.application_link) &&
        matchesSearch
      );
    });
  };

  const getUniqueValues = (people, key) => {
    const values = people.map((person) => person[key]);
    return [...new Set(values)].filter(
      (value) => value !== undefined && value !== null && value !== ""
    );
  };

  const renderFilterControls = (filters, setFilters, people, title, showCoordinatorFilter = true) => {
    const regions = getUniqueValues(people, "region");
    const positions = getUniqueValues(people, "position");
    const applicationLinks = getUniqueValues(people, "application_link");

    return (
      <div className="filter-controls mb-4">
        {/*<h5>{title} Filters</h5>*/}
        <div className="row">
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

  const indexOfLastHr = currentHrPage * hrsPerPage;
  const indexOfFirstHr = indexOfLastHr - hrsPerPage;
  const currentHrs = filteredHrs.slice(indexOfFirstHr, indexOfLastHr);
  const totalHrPages = Math.ceil(filteredHrs.length / hrsPerPage);

  const indexOfLastEmployee = currentEmployeePage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalEmployeePages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const indexOfLastCandidate = currentCandidatePage * candidatesPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
  const currentCandidates = filteredCandidates.slice(indexOfFirstCandidate, indexOfLastCandidate);
  const totalCandidatePages = Math.ceil(filteredCandidates.length / candidatesPerPage);

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
                currentHrs,
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
            <div className="no-data">No HR members match the search</div>
          )}
        </SectionBlock>
      )}

      <SectionBlock title="Employees">
        {renderFilterControls(
          employeeFilters,
          setEmployeeFilters,
          employees,
          "Employees",
          true
        )}
        {filteredEmployees.length > 0 ? (
          <>
            {renderGrid(
              currentEmployees,
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
          candidates,
          "Candidates",
          false
        )}
        {filteredCandidates.length > 0 ? (
          <>
            {renderGrid(
              currentCandidates,
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
