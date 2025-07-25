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
                  {console.log(value)}
                  {value === null
                    ? "--"
                    : typeof value === "number"
                    ? value.toFixed(2)
                    : value}
                </span>
                {prediction !== null && (
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

  const getGlobalRankMessage = (rank) => {
    if (rank === 1) return "You're our TOP Tasker!";
    if (rank === 2) return "TOP 2 Tasker!";
    if (rank === 3) return "TOP 3 Tasker!";
    if (rank === 4) return "Great Tasker!";
    if (rank === 5) return "Excellent Tasker!";
    return `Rank #${rank} in the company`;
  };

  const getPositionRankMessage = (rank, position) => {
    if (rank === 1) return `You're our TOP ${position}!`;
    if (rank === 2) return `TOP 2 ${position}!`;
    if (rank === 3) return `TOP 3 ${position}!`;
    if (rank === 4) return `Great ${position}!`;
    if (rank === 5) return `Excellent ${position}!`;
    return `Ranked #${rank} among ${position}s!`;
  };

  const getGlobalRankTooltip = (rank) => {
    if ([1, 2, 3].includes(rank)) return "";
    if (rank === 4) return "You rank 4th in the company! Keep the great work!";
    if (rank === 5) return "You rank 5th in the company! Keep pushing!";
    return `You rank ${rank}th in the company`;
  };

  const getPositionRankTooltip = (rank, position) => {
    if ([1, 2, 3].includes(rank)) return "";
    if (rank === 4)
      return `You rank 4th in ${position} position! Keep the great work!`;
    if (rank === 5)
      return `You rank 5th in ${position} position! Keep pushing!`;
    return `You rank ${rank}th in ${position} position`;
  };
  const stats = [
    {
      title: "Avg Task Rating",
      value: employee.avg_task_ratings,
      prediction: employee.predicted_avg_task_rating,
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
      {!employee.is_coordinator &&
        (employee.rank || employee.position_rank) && (
          <div className="d-flex gap-5 justify-content-center align-items-center ">
            {/* Global Rank Badge */}
            {employee.rank && (
              <div className="rank-container position-relative me-4">
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
                  title={getGlobalRankTooltip(employee.rank)}
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

                {/* Hover message for all ranks */}
                <div
                  className={`rank-hover-message ${
                    employee.rank <= 3
                      ? `rank-message-${employee.rank}`
                      : "rank-message-other"
                  }`}
                >
                  {getGlobalRankMessage(employee.rank)}
                </div>

                {/* Special effects for top 3 */}
                {employee.rank <= 3 && (
                  <>
                    {employee.rank === 1 && (
                      <div className="gold-burst">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={`global-ray-${i}`}
                            className="burst-ray"
                            style={{ "--i": i }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Position Rank Badge */}
            {employee.position_rank && (
              <div className="rank-container  gap-5 position-relative">
                <div
                  className={`rank-badge ${
                    employee.position_rank === 1
                      ? "rank-first"
                      : employee.position_rank === 2
                      ? "rank-second"
                      : employee.position_rank === 3
                      ? "rank-third"
                      : "rank-other"
                  }`}
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title={getPositionRankTooltip(
                    employee.position_rank,
                    employee.position
                  )}
                >
                  {employee.position_rank === 1 ? (
                    <>
                      <FaCrown
                        className="crown-icon"
                        style={{ marginBottom: "2px" }}
                      />
                      <div>#{employee.position_rank}</div>
                    </>
                  ) : (
                    `#${employee.position_rank}`
                  )}
                </div>

                {/* Hover message for all ranks */}
                <div
                  className={`rank-hover-message ${
                    employee.position_rank <= 3
                      ? `rank-message-${employee.position_rank}`
                      : "rank-message-other"
                  }`}
                >
                  {getPositionRankMessage(
                    employee.position_rank,
                    employee.position
                  )}
                </div>

                {/* Special effects for top 3 */}
                {employee.position_rank <= 3 && (
                  <>
                    {employee.position_rank === 1 && (
                      <div className="gold-burst">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={`position-ray-${i}`}
                            className="burst-ray"
                            style={{ "--i": i }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
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
