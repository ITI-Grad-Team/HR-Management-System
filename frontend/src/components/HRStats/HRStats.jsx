import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Button } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./HRStats.css";
import axiosInstance from "../../api/config";
import HrAdminUpperFallback from "../DashboardFallBack/HrAdminUpperFallback";
import { FaCrown } from "react-icons/fa";
const HRStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/view-self")
      .then((res) => setStats(res.data.hr))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const recalculateStats = () => {
    setRecalculating(true);
    axiosInstance
      .post("/hr/statistics/calculate-my-stats/")
      .then(() => {
        // Refresh data after recalculation
        axiosInstance
          .get("/view-self")
          .then((res) => setStats(res.data.hr))
          .catch((err) => console.error(err));
      })
      .catch((err) => console.error(err))
      .finally(() => setRecalculating(false));
  };

  if (loading) return <HrAdminUpperFallback />;
  if (!stats)
    return <div className="text-center my-5">No HR statistics available</div>;

  // HR Performance Metrics
  const metrics = [
    {
      title: "Number Of Hires",
      value: stats.accepted_employees_count,
      unit: "",
      description: "Total employees you've accepted",
    },
    {
      title: "Avg Interview Rating",
      value: stats.accepted_employees_avg_interviewer_rating,
      unit: "%",
      description: "Your average interview rating",
    },
    {
      title: "Avg Task Rating",
      value: stats.accepted_employees_avg_task_rating,
      unit: "% per task",
      description: "Average task rating of your hires",
    },
    {
      title: "Avg Time Saved Before Task Deadline",
      value: stats.accepted_employees_avg_time_remaining,
      unit: "hrs per task",
      description: "Average time left at your hires' submissions",
    },
    {
      title: "Avg Salary",
      value: stats.accepted_employees_avg_salary,
      unit: "$",
      description: "Average salary of your hires",
    },
    {
      title: "Avg Lateness",
      value: stats.accepted_employees_avg_lateness_hrs,
      unit: "hrs per work day",
      description: "Average late hours of your hires",
    },
    {
      title: "Avg Absence",
      value: stats.accepted_employees_avg_absence_days,
      unit: "days per work day",
      description: "Average absence days of your hires",
    },
    {
      title: "Avg Overtime",
      value: stats.accepted_employees_avg_overtime,
      unit: "hrs per work day",
      description: "Average overtime hours of your hires",
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

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Your hires stats</h3>
        {stats.rank && (
          <div className="rank-container position-relative">
            <div
              className={`rank-badge ${
                stats.rank === 1
                  ? "rank-first"
                  : stats.rank === 2
                  ? "rank-second"
                  : stats.rank === 3
                  ? "rank-third"
                  : "rank-other"
              }`}
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title={getGlobalRankTooltip(stats.rank)}
            >
              {stats.rank === 1 ? (
                <>
                  <FaCrown
                    className="crown-icon"
                    style={{ marginBottom: "2px" }}
                  />
                  <div>#{stats.rank}</div>
                </>
              ) : (
                `#${stats.rank}`
              )}
            </div>

            {/* Hover message for all ranks */}
            <div
              className={`rank-hover-message ${
                stats.rank <= 3
                  ? `rank-message-${stats.rank}`
                  : "rank-message-other"
              }`}
            >
              {getGlobalRankMessage(stats.rank)}
            </div>

            {/* Special effects for top 3 */}
            {stats.rank <= 3 && (
              <>
                {stats.rank === 1 && (
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
        <div className="text-end">
          <Button
            variant="primary"
            onClick={recalculateStats}
            disabled={recalculating}
            className="mb-2"
          >
            {recalculating ? "Recalculating..." : "Recalculate My Stats"}
          </Button>
          {stats.last_stats_calculation_time && (
            <div className="text-muted small">
              Last at:{" "}
              {new Date(stats.last_stats_calculation_time).toLocaleString()}
            </div>
          )}
        </div>
      </div>
      {/* Key Metrics Row */}
      <Row className="g-4 mb-4">
        {metrics.map((metric, idx) => (
          <Col key={idx} md={6} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="text-muted mb-1">{metric.title}</h6>
                    <h3 className="mb-0">
                      {metric.value?.toFixed(metric.unit === "$" ? 2 : 1) ??
                        "N/A"}
                      {metric.unit && (
                        <small className="text-muted ms-1">{metric.unit}</small>
                      )}
                    </h3>
                  </div>
                </div>
                <p className="text-muted small mt-2 mb-0">
                  {metric.description}
                </p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {/* Correlation Analysis Section */}
      <Row className="g-4">
        <Col lg={12}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Interview Rating Correlations</h5>
              <p className="text-muted small mb-3">
                How your interview ratings correlate with employee performance
                metrics
              </p>

              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={correlationData}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[-1, 1]} />
                    <Tooltip
                      formatter={(value) => [value.toFixed(3), "Correlation"]}
                      labelFormatter={(label) => `Metric: ${label}`}
                    />
                    <Bar dataKey="value" name="Correlation">
                      {correlationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.value > 0.5
                              ? "#10B981" // Strong positive
                              : entry.value > 0
                              ? "#3B82F6" // Weak positive
                              : entry.value < -0.5
                              ? "#ef44a8ff" // Strong negative
                              : "#6366F1" // Weak negative
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HRStats;
