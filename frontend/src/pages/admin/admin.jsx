import Sidebar from "../../components/sidebar/sidebar.jsx";
import HeaderBar from "../../components/headerBar/headerBar.jsx";
import "./admin.css";
import { positions } from "../../lib/Positions.js";
import { regions } from "../../lib/Regions.js";

const Directories = () => {
  return (
    <div className="directories d-flex">
      <Sidebar />

      <div
        className="flex-grow-1 p-4"
        style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}
      >
        <HeaderBar />
        {/* HR Section */}
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

        {/* Employees Section */}
        <div className="section">
          <div className="section-heading filters">
            <h2>Employees</h2>

            <div className="filter-controls">
              <div className="position-select">
                <select>
                  {positions.map((position) => (
                    <option key={position.id} value={position.name}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="region-select">
                <select>
                  {regions.map((region) => (
                    <option key={region.id} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="is-coordinator">
                <label htmlFor="">Is Coordinator</label>
                <input type="checkbox" />
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
