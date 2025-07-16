import React from "react";
import "./BioCard.css";
import {
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaThumbtack,
} from "react-icons/fa";

export default function BioCard({
  name,
  role,
  email,
  phone,
  avatar,
  department,
  location,
  education,
  status,
  experience,
}) {
  return (
    <div className="bio-card">
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
          <p className="bio-card-role">{department || "Position Not Specified"}</p>
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
        {status && (
          <div className="bio-card-info-item">
            <FaThumbtack className="bio-card-info-icon" />
            <span className="bio-card-info-text">{status}</span>
          </div>
        )}
      </div>

      <div className="bio-card-footer">
        <strong>Years of Experience:</strong> {experience}
      </div>
    </div>
  );
}