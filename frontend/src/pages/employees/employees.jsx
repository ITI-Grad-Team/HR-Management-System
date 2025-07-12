import { useState } from "react";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import HeaderBar from "../../components/headerBar/headerBar.jsx";
import "./admin.css";
import { positions } from "../../lib/Positions.js";
import { regions } from "../../lib/Regions.js";
import "./employees.css";
import { useAuth } from "../../context/AuthContext";

const Directories = () => {
  const [positionSelect, setPositionSelect] = useState("");
  const [regionSelect, setRegionSelect] = useState("");
  const [isCoordinatorValue, setIsCoordinatorValue] = useState(false);
  const { role } = useAuth();

  console.log("Selected Position:", positionSelect);
  console.log("Selected Region:", regionSelect);
  console.log("Selected IsCoordinatorValue:", isCoordinatorValue);

  return (
    <div className="directories d-flex">
      <Sidebar />

      <div
        className="flex-grow-1 p-4"
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
          </div>
        </div>

        {/* Candidates Section */}
        <div className="section">
          <div className="section-heading">
            <h2>Candidates</h2>
          </div>
          <div className="card-grid">
            {/* Candidate cards go here */}
            <div className="card-placeholder">Candidate Card</div>
            <div className="card-placeholder">Candidate Card</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Directories;
