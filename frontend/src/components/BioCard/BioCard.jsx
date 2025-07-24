import React from "react";
import "./BioCard.css";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaBriefcase,
  FaCheckCircle,
  FaQuestionCircle,
  FaUsers,
  FaRegClock,
  FaClock,
  FaUserTimes,
  FaRegTimesCircle,
} from "react-icons/fa";
// Add these utilities (or use date-fns/luxon)
function formatInterviewTiming(timeUntilStr) {
  const isPast = timeUntilStr.startsWith("-");

  if (!isPast) {
    // Future time: return as-is but clean up
    return (
      timeUntilStr
        .replace(" days, ", "d ")
        .replace(" day, ", "d ")
        .replace(/:\d+\.\d+$/, "") // Remove seconds and microseconds
        .replace(":", "h ") + "m"
    ); // Convert first : to h and add m
  } else {
    // Past time: calculate absolute time
    const [, daysStr, timeStr] = timeUntilStr.match(
      /-(\d+) days?, (\d+:\d+):\d+/
    );
    let days = Math.abs(parseInt(daysStr));
    let [hours, mins] = timeStr.split(":").map(Number);

    // Subtract time components from days
    if (hours >= 24) {
      days -= Math.floor(hours / 24);
      hours = hours % 24;
    }
    days = Math.max(0, days - 1); // Subtract full day

    // Calculate remaining hours (24 - hours)
    const remainingHours = 24 - hours - 1;
    const remainingMins = 60 - mins;

    // Build components
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    if (remainingMins > 0) parts.push(`${remainingMins}m`);

    return parts.join(" ") + " ago";
  }
}

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
  interview_datetime, // Optional
  time_until_interview, // Optional
  isScheduled,
  isTaken,
}) {
  const isEmployee = role === "employee";

  return (
    <div className="bio-card" style={{ cursor: "pointer" }}>
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
      {interview_datetime && time_until_interview && (
        <div className="interview-timing">
          <div className="interview-datetime">
            {new Date(interview_datetime).toLocaleString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div
            className={`time-remaining ${
              time_until_interview.startsWith("-") ? "past" : "upcoming"
            }`}
          >
            {time_until_interview.startsWith("-") ? (
              <>
                <FaClock /> Time passed{" "}
                {formatInterviewTiming(time_until_interview)}
              </>
            ) : (
              <>
                <FaClock /> Time comes in{" "}
                {formatInterviewTiming(time_until_interview)}
              </>
            )}
          </div>
        </div>
      )}
      {status && (
        <div className="interview-timing">
          <div className="interview-status">
            {status === "accepted" ? (
              <span className="status-badge joined">
                <FaCheckCircle className="status-icon" /> Joined
              </span>
            ) : status === "pending" || status === "scheduled" ? (
              <span className="status-badge awaiting">
                <FaRegClock className="status-icon" /> Awaiting
                {status === "scheduled" && (
                  <span className="scheduled-badge">
                    <FaClock /> Scheduled
                  </span>
                )}
              </span>
            ) : (
              <span className="status-badge decision-pending">
                <FaQuestionCircle className="status-icon" /> Awaiting decision
              </span>
            )}
          </div>
        </div>
      )}{" "}
      {(isScheduled === false || isTaken === false) && (
        <div className="interview-timing">
          <div className="interview-status">
            {isScheduled === false && (
              <span className="status-badge decision-pending me-1">
                <FaRegTimesCircle className="status-icon" /> No Schedule
              </span>
            )}
            {isTaken === false && (
              <span className="status-badge decision-pending">
                <FaUserTimes className="status-icon" /> No Responsible
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
