import React from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import {
  FaChartLine,
  FaClock,
  FaBusinessTime,
  FaBed,
  FaStar,
  FaCrown,
  FaMoneyBillWave,
  FaRunning,
} from "react-icons/fa";
import "./EmployeeStats.css";

import { FiTrendingUp } from "react-icons/fi";

import { useAuth } from "../../hooks/useAuth";

const StatCard = ({ title, value, prediction, icon, color }) => {
  if (value === undefined) return null;

  return (
    <Col md={6} lg={4} className="mb-4">
      <Card className="h-100 border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-start">
            <div
              className={`icon-shape icon-shape-${color} rounded-circle me-3`}
            >
              {icon}
            </div>
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-1">{title}</h6>
              </div>

              <div className="d-flex align-items-baseline">
                <span className="fs-4 fw-bold me-2">
                  {typeof value === "number" ? value.toFixed(2) : value}
                </span>

                {prediction !== undefined && (
                  <small className="text-muted ms-2">
                    <FiTrendingUp className="me-1" />
                    {typeof prediction === "number"
                      ? prediction.toFixed(2)
                      : prediction}
                  </small>
                )}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
};

const EmployeeStats = () => {
  const { user } = useAuth();
  const { employee } = user;

  if (!employee) return null;

  const stats = [
    {
      title: "Avg Task Rating",
      value: `${employee.avg_task_ratings}/100`,
      prediction: `${employee.predicted_avg_task_rating}/100`,
      icon: <FaStar size={18} className="mt-3" />,
      color: "primary",
    },
    {
      title: "Avg Task Hours Saved",
      value: employee.avg_time_remaining_before_deadline,
      prediction: employee.predicted_avg_time_remaining_before_deadline,
      icon: <FaClock size={18} className="mt-3" />,
      color: "info",
    },
    {
      title: "Avg Lateness Hours",
      value: employee.avg_lateness_hours,
      prediction: employee.predicted_avg_lateness_hours,
      icon: <FaRunning size={18} className="mt-3" />,
      color: "warning",
    },
    {
      title: "Avg Absent Days",
      value: employee.avg_absent_days,
      prediction: employee.predicted_avg_absent_days,
      icon: <FaBed size={18} className="mt-3" />,
      color: "danger",
    },
    {
      title: "Overtime Hours",
      value: employee.avg_overtime_hours,
      prediction: employee.predicted_avg_overtime_hours,
      icon: <FaBusinessTime size={18} className="mt-3" />,
      color: "success",
    },
    {
      title: "Basic Salary",
      value: employee.basic_salary ? `$${employee.basic_salary}` : null,
      prediction: employee.predicted_basic_salary
        ? `$${employee.predicted_basic_salary}`
        : null,
      icon: <FaMoneyBillWave size={18} className="mt-3" />,
      color: "secondary",
    },
  ].filter((stat) => stat.value !== undefined); // Only show stats with values

  return (
    <div className="mb-4">
      {employee.rank &&
        !employee.is_coordinator && (
          <div className="rank-container position-relative d-flex justify-content-center align-items-center">
            {" "}
            <div
              className={`rank-badge ${
                employee.rank === 1
                  ? "rank-first"
                  : employee.rank === 2
                  ? "rank-second"
                  : employee.rank === 3
                  ? "rank-third"
                  : "rank-other"
              }`}
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title={
                employee.rank === 2 ||
                employee.rank === 1 ||
                employee.rank === 3
                  ? ""
                  : employee.rank === 4
                  ? "You rank 4th! Keep the great work!"
                  : employee.rank === 5
                  ? "You rank 5th! Keep pushing!"
                  : `You rank ${employee.rank}th`
              }
            >
              {employee.rank === 1 ? (
                <>
                  <FaCrown
                    className="crown-icon"
                    style={{ marginBottom: "2px" }}
                  />
                  <div>#{employee.rank}</div>
                </>
              ) : (
                `#${employee.rank}`
              )}
            </div>
            {/* Special hover effects for top 3 */}
            {employee.rank <= 3 && (
              <>
                <div
                  className={`rank-hover-message rank-message-${employee.rank}`}
                >
                  {employee.rank === 1
                    ? "You're our TOP Tasker!"
                    : employee.rank === 2
                    ? "TOP 2 Tasker performer!"
                    : "TOP 3 Tasker performer!"}
                </div>
                {/* Golden burst effect for #1 */}
                {employee.rank === 1 && (
                  <div className="gold-burst">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="burst-ray" style={{ "--i": i }} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      <h4 className="mb-4 d-flex align-items-center">
        <FaChartLine
          className="me-2 text-primary sub-icon"
          style={{ color: "#948979" }}
        />
        Performance Metrics
      </h4>
      <Row>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </Row>
    </div>
  );
};

export default EmployeeStats;
