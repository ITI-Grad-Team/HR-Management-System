import React from "react";
import "./BioCard.css";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaBriefcase,
  FaUsers,
} from "react-icons/fa";

export default function BioCard({
  name,
  email,
  phone,
  avatar,
  department,
  location,
  education,
  experience,
  isCoordinator,
  role,
  status, // Added status in case you want to show candidate status
}) {
  const isEmployee = role === "employee";

  return (
    <div className="bio-card">
      {/* Only show coordinator badge for employees */}
      {isEmployee && isCoordinator && (
        <div className="coordinator-floating-badge">
          <span>Coordinator</span> <FaUsers className="coordinator-icon" />
        </div>
      )}

      <div className="bio-card-header">
        <div className="bio-card-avatar">
          <img
            src={avatar || "/default.jpg"}
            alt="avatar"
            onError={(e) => {
              e.target.src = "/default.jpg";
              e.target.alt = "Default Avatar";
            }}
          />
        </div>
        <div className="bio-card-name-section">
          <h2 className="bio-card-name" title={name}>
            {name || "No Name Provided"}
          </h2>
          {/* Show department/position only for employees */}
          {isEmployee && (
            <p className="bio-card-role">
              {department || "Position Not Specified"}
            </p>
          )}
          {/* Optionally show status for candidates */}
          {!isEmployee && status && (
            <p className="bio-card-status">Status: {status}</p>
          )}
        </div>
      </div>

      <div className="bio-card-info-item">
        <FaEnvelope className="bio-card-info-icon" />
        <span className="bio-card-email-text">{email || "N/A"}</span>
      </div>

      <div className="bio-card-info-grid">
        <div className="bio-card-info-item">
          <FaPhone className="bio-card-info-icon" />
          <span className="bio-card-info-text">{phone || "N/A"}</span>
        </div>

        {/* Show location only for employees */}
        {isEmployee && (
          <div className="bio-card-info-item">
            <FaMapMarkerAlt className="bio-card-info-icon" />
            <span className="bio-card-info-text">{location || "N/A"}</span>
          </div>
        )}

        {/* Show education only for employees */}
        {isEmployee && (
          <div className="bio-card-info-item">
            <FaGraduationCap className="bio-card-info-icon" />
            <span className="bio-card-info-text">{education || "N/A"}</span>
          </div>
        )}

        {/* Show experience only for employees */}
        {isEmployee && experience !== undefined && (
          <div className="bio-card-info-item">
            <FaBriefcase className="bio-card-info-icon" />
            <span className="bio-card-info-text">
              {experience
                ? `${experience} ${experience === 1 ? "year" : "years"} exp.`
                : "N/A"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
