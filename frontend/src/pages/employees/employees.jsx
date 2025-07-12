import React from "react";
import "./employees.css";
import { useEffect, useState } from "react";
import { positions } from "../../lib/Positions.js";
import { regions } from "../../lib/Regions.js";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/config.js";
import BioCard from "../../components/BioCard/BioCard.jsx";

const Directories = () => {
  const [employees, setEmployees] = useState([]);
  const [positionSelect, setPositionSelect] = useState("");
  const [regionSelect, setRegionSelect] = useState("");
  const [isCoordinatorValue, setIsCoordinatorValue] = useState(false);
  const { role } = useAuth();

  useEffect(() => {
    axiosInstance
      .get("/admin/employees/?interview_state=accepted")
      .then((res) => setEmployees(res.data.results))
      .catch((err) => console.error(err));
    console.log(employees);
  }, [employees]);

  const filteredEmployees = employees.filter((employee) => {
    const matchesPosition = positionSelect
      ? employee.position === positionSelect
      : true;
    const matchesRegion = regionSelect
      ? employee.region === regionSelect
      : true;
    const matchesCoordinator = isCoordinatorValue
      ? employee.isCoordinator === isCoordinatorValue
      : true;

    return matchesPosition && matchesRegion && matchesCoordinator;
  });

  return (
    <div className="directories d-flex">
      <div
        className="flex-grow-1"
        style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}
      >
        {/* HR Section */}
        {role === "admin" && (
          <div className="section">
            <div className="section-heading">
              <h2>HRs</h2>
            </div>
            <div className="card-grid">
              {/* HR cards go here */}
              <div className="card-placeholder">HR Card</div>
              <div className="card-placeholder">HR Card</div>
            </div>
          </div>
        )}

        {/* Employees Section */}
        <div className="section">
          <div className="section-heading filters">
            <h2>Employees</h2>

            <div className="filter-controls">
              <span>Filters : </span>

              <div className="position-select">
                <select onChange={(e) => setPositionSelect(e.target.value)}>
                  <option value="">Position</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.name}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="region-select">
                <select onChange={(e) => setRegionSelect(e.target.value)}>
                  <option value="">Region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="is-coordinator">
                <label htmlFor="">Is Coordinator</label>
                <input
                  type="checkbox"
                  checked={isCoordinatorValue}
                  onChange={() => setIsCoordinatorValue(!isCoordinatorValue)}
                />
              </div>
            </div>
          </div>

          <div className="card-grid">
            {/* Employee cards go here */}
            <div className="card-placeholder">Employee Card</div>
            <div className="card-placeholder">Employee Card</div>

            {filteredEmployees.map((employee) => (
              <div key={employee.id}>
                <BioCard
                  name={employee.basic_info.username}
                  role={employee.basic_info.role}
                  email={employee.basic_info.email}
                  phone={employee.basic_info.phone}
                  avatar={employee.basic_info.profile_image || ""}
                  department={employee.department}
                  location={employee.region}
                  bio={employee.bio}
                  status={employee.status}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Candidates Section */}
        {/* <div className="section">
          <div className="section-heading">
            <h2>Candidates</h2>
          </div>
          <div className="card-grid">
            <div className="card-placeholder">Candidate Card</div>
            <div className="card-placeholder">Candidate Card</div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Directories;
