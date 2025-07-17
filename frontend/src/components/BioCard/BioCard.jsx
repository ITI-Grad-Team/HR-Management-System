import React from "react";
import "./BioCard.css";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaBriefcase,
  FaUserTie,
  FaUsers, // Added team icon
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
}) {
  return (
    <div className="bio-card">
      {/* Coordinator badge - positioned absolutely */}
      {isCoordinator && (
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
          <p className="bio-card-role">
            {department || "Position Not Specified"}
          </p>
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
        <div className="bio-card-info-item">
          <FaMapMarkerAlt className="bio-card-info-icon" />
          <span className="bio-card-info-text">{location || "N/A"}</span>
        </div>
        <div className="bio-card-info-item">
          <FaGraduationCap className="bio-card-info-icon" />
          <span className="bio-card-info-text">{education || "N/A"}</span>
        </div>
        {experience !== undefined && (
          <div className="bio-card-info-item">
            <div className="bio-card-info-item">
              <FaBriefcase className="bio-card-info-icon" />
              <span className="bio-card-info-text">
                {experience
                  ? `${experience} ${experience === 1 ? "year" : "years"} exp.`
                  : "N/A"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
