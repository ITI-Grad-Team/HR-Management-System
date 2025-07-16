import React from "react";
import "./BioCard.css";

export default function BioCard({
  name,
  role,
  email,
  phone,
  avatar,
  department,
  location,
  bio,
  status,
}) {
  return (
    <div className="bio-card" onClick={() => console.log('Clicked')}>
      <div className="bio-card-image">
        <img src={avatar || "https://via.placeholder.com/180x180?text=No+Image"} alt={name} />
      </div>

      <div className="bio-card-content">
        <h3>{name}</h3>
        <p className="role">{role}</p>

        <div className="info">
          {email && (
            <p className="email">
              <span>{email}</span>
            </p>
          )}
          {phone && (
            <p className="phone">
              <span>{phone}</span>
            </p>
          )}
          {department && (
            <p className="department">
              <span>{department}</span>
            </p>
          )}
          {location && (
            <p className="location">
              <span>{location}</span>
            </p>
          )}
          {status && (
            <p className="status">
              <span>{status}</span>
            </p>
          )}
        </div>

        {bio && <p className="bio">{bio}</p>}
      </div>
    </div>
  );
}