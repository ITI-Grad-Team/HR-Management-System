import { useState } from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import {
  FaPhone,
  FaUser,
  FaEnvelope,
  FaChartLine,
  FaClock,
  FaMoneyBillWave,
  FaUserClock,
  FaCalendarTimes,
  FaUserPlus,
  FaArrowUp, // ↑ (solid)
  FaArrowRight, // → (solid)
  FaArrowDown, // ↓ (solid)
} from "react-icons/fa";
import { GiProgression } from "react-icons/gi";

const HRDetailsCard = ({ candidate, loadingProp }) => {
  const { basicinfo, user, id: candidateId, ...stats } = candidate;
  const [loading, setLoading] = useState(false);
  // HR Performance Metrics
  const metrics = [
    {
      title: "Number Of Hires",
      value: stats.accepted_employees_count,
      icon: <FaUserPlus className="text-muted" />,
      unit: "",
      description: "Total employees accepted",
    },
    {
      title: "Avg Interview Rating",
      value: stats.accepted_employees_avg_interviewer_rating,
      icon: <FaChartLine className="text-muted" />,
      unit: "%",
      description: "Average interview rating",
    },
    {
      title: "Avg Task Rating",
      value: stats.accepted_employees_avg_task_rating,
      icon: <GiProgression className="text-muted" />,
      unit: "/5",
      description: "Average task rating of hires",
    },
    {
      title: "Avg Time Saved",
      value: stats.accepted_employees_avg_time_remaining,
      icon: <FaClock className="text-muted" />,
      unit: "hrs",
      description: "Avg time left at submissions",
    },
    {
      title: "Avg Salary",
      value: stats.accepted_employees_avg_salary,
      icon: <FaMoneyBillWave className="text-muted" />,
      unit: "$",
      description: "Average salary of hires",
    },
    {
      title: "Avg Lateness",
      value: stats.accepted_employees_avg_lateness_hrs,
      icon: <FaUserClock className="text-secondary" />,
      unit: "hrs",
      description: "Average late hours",
    },
    {
      title: "Avg Absence",
      value: stats.accepted_employees_avg_absence_days,
      icon: <FaCalendarTimes className="text-muted" />,
      unit: "days",
      description: "Average absence days",
    },
    {
      title: "Avg Overtime",
      value: stats.accepted_employees_avg_overtime,
      icon: <FaClock className="text-muted" />,
      unit: "hrs",
      description: "Average overtime hours",
    },
  ];

  // Correlation data
  const correlationData = [
    {
      name: "Task Rating",
      value: stats.interviewer_rating_to_task_rating_correlation,
    },
    {
      name: "Time Saved",
      value: stats.interviewer_rating_to_time_remaining_correlation,
    },
    {
      name: "Lateness",
      value: stats.interviewer_rating_to_lateness_hrs_correlation,
    },
    {
      name: "Absence",
      value: stats.interviewer_rating_to_absence_days_correlation,
    },
    {
      name: "Overtime",
      value: stats.interviewer_rating_to_avg_overtime_correlation,
    },
  ];

  const getCorrelationColor = (value) => {
    if (value > 0.5) return "#10B981"; // Strong positive (green)
    if (value > 0) return "#3B82F6"; // Weak positive (blue)
    if (value < -0.5) return "#ef44a8ff"; // Strong negative (pink)
    return "#c463f1ff"; // Weak negative (purple)
  };

  const getCorrelationLabel = (value) => {
    if (value > 0.5) return "Strong Positive";
    if (value > 0) return "Positive";
    if (value < -0.5) return "Strong Negative";
    return "Negative";
  };

  return (
    <>
      <Card
        className="p-4 border-0 shadow-sm rounded-4 mb-4"
        style={{ background: "linear-gradient(145deg, #ffffff, #f8f9fa)" }}
      >
        <Row className="g-4">
          {/* Avatar and Basic Info */}
          <Col
            md={4}
            className="text-center d-flex flex-column align-items-center"
          >
            <div className="position-relative mb-3">
              <img
                src={basicinfo?.profile_image}
                alt="avatar"
                className="rounded-circle shadow"
                style={{
                  width: "200px",
                  height: "200px",
                  objectFit: "cover",
                  border: "3px solid #fff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
              <Badge
                bg={basicinfo?.role === "hr" ? "primary" : "secondary"}
                className="position-absolute bottom-0 end-0 rounded-pill"
                style={{ transform: "translate(25%, 25%)" }}
              >
                {basicinfo?.role?.toUpperCase() || "N/A"}
              </Badge>
            </div>
            <h5 className="mb-0 fw-bold text-dark">{basicinfo?.username}</h5>
          </Col>

          <Col md={8}>
            {/* Personal Info */}
            <div
              className="mb-4 p-3 rounded-3"
              style={{ background: "rgba(248,249,250,0.8)" }}
            >
              <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                <FaUser className="me-2" /> Personal Info
              </h6>
              <Row>
                <Col sm={6} className="mb-2">
                  <div className="d-flex align-items-center">
                    <FaPhone className="me-2 text-muted" />
                    <div>
                      <small className="text-muted d-block">Phone</small>
                      <span className="fw-semibold">
                        {basicinfo?.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col sm={6} className="mb-2">
                  <div className="d-flex align-items-center">
                    <FaEnvelope className="me-2 text-muted" />
                    <div>
                      <small className="text-muted d-block">Email</small>
                      <span className="fw-semibold">
                        {user.username || "N/A"}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Performance Metrics */}
            <div
              className="mb-4 p-3 rounded-3"
              style={{ background: "rgba(248,249,250,0.8)" }}
            >
              <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                <FaChartLine className="me-2" /> Performance Metrics Based On
                Hires
              </h6>
              <Row className="g-3">
                {metrics.map((metric, idx) => (
                  <Col key={idx} xs={6} md={4} lg={3}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="p-2">
                        <div className="d-flex align-items-center mb-2">
                          {metric.icon}
                          <small className="text-muted ms-2">
                            {metric.title}
                          </small>
                        </div>
                        <h4 className="mb-0">
                          {metric.value?.toFixed(metric.unit === "$" ? 2 : 1) ??
                            "N/A"}
                          {metric.unit && (
                            <small className="text-muted ms-1">
                              {metric.unit}
                            </small>
                          )}
                        </h4>
                        <small
                          className="text-muted d-block mt-1"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {metric.description}
                        </small>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Correlation Analysis */}
            <div
              className="p-3 rounded-3"
              style={{ background: "rgba(248,249,250,0.8)" }}
            >
              <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                <FaChartLine className="me-2" /> Interview Rating Correlations
              </h6>
              <p className="text-muted small mb-3">
                How interview ratings correlate with employee performance
                metrics
              </p>

              <Row>
                {correlationData.map((item, idx) => {
                  const color = getCorrelationColor(item.value);
                  const label = getCorrelationLabel(item.value);

                  // Determine arrow component based on correlation value
                  const getArrowIcon = (value) => {
                    if (value > 0.5) return <FaArrowUp color={color} />;
                    if (value > 0)
                      return (
                        <div
                          style={{
                            display: "inline-block",
                            transform: "rotate(45deg)",
                          }}
                        >
                          <FaArrowUp color={color} />
                        </div>
                      );
                    if (value === 0) return <FaArrowRight color={color} />;
                    if (value > -0.5)
                      return (
                        <div
                          style={{
                            display: "inline-block",
                            transform: "rotate(-45deg)",
                          }}
                        >
                          <FaArrowDown color={color} />
                        </div>
                      );
                    return <FaArrowDown color={color} />;
                  };

                  return (
                    <Col key={idx} sm={6} md={4} lg={4} className="mb-3">
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">{item.name}</h6>
                            {item.value !== null && (
                              <span
                                className="fs-4"
                                title={label}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                }}
                              >
                                {getArrowIcon(item.value)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">Correlation:</small>
                            <h4 className="mb-0">
                              {item.value?.toFixed(3) ?? "N/A"}
                            </h4>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
              {stats.last_stats_calculation_time && (
                <div className="text-end mt-3">
                  <small className="text-muted">
                    Last updated:{" "}
                    {new Date(
                      stats.last_stats_calculation_time
                    ).toLocaleString()}
                  </small>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
};
export default HRDetailsCard;
