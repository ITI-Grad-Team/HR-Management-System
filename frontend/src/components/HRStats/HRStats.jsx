import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import axiosInstance from "../../api/config";

const HRStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/view-self")
      .then((res) => setStats(res.data.hr))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <Spinner animation="border" className="d-block mx-auto my-5" />;
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

  return (
    <div className="container-fluid py-4">
      <h3 className="mb-4">Your hires stats</h3>

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
                              ? "#EF4444" // Strong negative
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
