import React from "react";
import "./employees.css";
import { useAuth } from "../../context/AuthContext";

const Directories = () => {

  const { role } = useAuth();

  return (
    <div className="directories d-flex">

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
        <div className="section-heading">
          <h2>Employees</h2>
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
