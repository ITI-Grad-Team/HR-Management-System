import React from "react";
import "./BioCard.css";

const roleStyles = {
  HR: { color: "#2E86C1", icon: "👔" },
  Employee: { color: "#27AE60", icon: "💼" },
  Admin: { color: "#E74C3C", icon: "👑" },
  Candidate: { color: "#F39C12", icon: "🎯" },
};

// Map backend role values to display names
const roleDisplayMap = {
  hr: "HR",
  employee: "Employee",
  admin: "Admin",
  candidate: "Candidate",
};

export default function BioCard({
  name,
  role,
  email,
  phone,
  avatar,
  department,
  location,
  bio,
  status, // For Candidate
}) {
  // Map backend role to display role and get styles
  const displayRole = roleDisplayMap[role?.toLowerCase()] || role;
  const { icon } = roleStyles[displayRole] || roleStyles.Employee;

  return (
    <div className="bio-card" data-role={displayRole}>
      <div className="bio-card-header">
        <div className="bio-card-avatar">
          <img src={avatar || "/default-avatar.png"} alt={`${name}'s avatar`} />
        </div>
        <div className="bio-card-name-section">
          <h2 className="bio-card-name">
            {icon} {name}
          </h2>
          <p className="bio-card-role">{displayRole}</p>
        </div>
      </div>

      <div className="bio-card-content">
        <div className="bio-card-info-grid">
          <div className="bio-card-info-item">
            <span className="bio-card-info-icon">📧</span>
            <p className="bio-card-info-text">{email}</p>
          </div>
          {phone && (
            <div className="bio-card-info-item">
              <span className="bio-card-info-icon">📞</span>
              <p className="bio-card-info-text">{phone}</p>
            </div>
          )}
        </div>

        {(department || location) && (
          <div className="bio-card-info-grid">
            {department && (
              <div className="bio-card-department">
                <span>🏢</span> {department}
              </div>
            )}
            {location && (
              <div className="bio-card-location">
                <span>📍</span> {location}
              </div>
            )}
          </div>
        )}

        {status && <div className="bio-card-status">Status: {status}</div>}

        {bio && <div className="bio-card-bio">{bio}</div>}
      </div>
    </div>
  );
}
