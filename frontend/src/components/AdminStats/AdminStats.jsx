import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import axiosInstance from "../../api/config";

const pieColors = [
  "rgb(13, 202, 240)", // Cyan
  "#A855F7", // Violet (purple-500)
  "#3B82F6", // Blue
  "#C084FC", // Light Purple (purple-400)
  "#60A5FA", // Sky Blue
  "#34D399", // Soft Green (emerald-400)
  "#93C5FD", // Light Blue
  "#6EE7B7", // Mint Green (emerald-300)
  "#38BDF8", // Vivid Blue
  "#D8B4FE", // Very Light Purple (purple-300)
];

export default function AdminStats() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/admin/company-statistics/latest/")
      .then((res) => {
        setSnapshot(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !snapshot)
    return (
      <div className="text-center justify-content-center align-items-center">
        <Spinner animation="border" />
      </div>
    );

  const positionStats = snapshot.position_stats || {};

  const processPieData = (key) => {
    const total = Object.values(positionStats).reduce(
      (sum, pos) => sum + (pos[key] ?? 0),
      0
    );
    return Object.entries(positionStats).map(([posName, stats]) => ({
      name: posName,
      value: +(stats[key] ?? 0),
      percentage: total ? ((stats[key] ?? 0) / total) * 100 : 0,
    }));
  };

  const barData = (snapshot.monthly_salary_totals || []).map(
    ({ year, month, total_paid }) => ({
      name: `${year}/${month}`,
      total_paid,
    })
  );

  const renderPieCard = (title, data, indexOffset = 0) => {
    const [mainTitle, subTitleRaw] = title.split("(");
    const subTitle = subTitleRaw?.replace(")", "");

    return (
      <Col lg={3} className="mb-4">
        <Card className="shadow-sm h-100">
          <Card.Body>
            <h6 className="mb-1">
              <strong>{mainTitle.trim()}</strong>
            </h6>
            {subTitle && (
              <div
                className="text-muted"
                style={{ fontSize: "0.7rem", marginTop: "-2px" }}
              >
                {subTitle.trim()}
              </div>
            )}
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={pieColors[(i + indexOffset) % pieColors.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="list-unstyled small mt-3">
              {data.map((d, i) => (
                <li key={i}>
                  <span
                    className="me-2"
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      backgroundColor:
                        pieColors[(i + indexOffset) % pieColors.length],
                    }}
                  ></span>
                  {d.name} – {d.value.toFixed(2)} ({d.percentage.toFixed(1)}%)
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <>
      <h3 className="mb-4">Your company stats</h3>
      <Row className="g-3 mb-4">
        {[
          {
            title: "Number of Employees",
            value: snapshot.total_employees,
            description: "Total employees in you company",
          },
          {
            title: "Number of HRs",
            value: snapshot.total_hrs,
            description: "Total HRs in you company",
          },
          {
            title: "Avg Task Rating",
            value: snapshot.overall_avg_task_rating,
            unit: "% per task",
            description: "Average task rating",
          },
          {
            title: "Avg Time Saved Before Task Deadline",
            value: snapshot.overall_avg_time_remaining,
            unit: "hrs per task",
            description: "Average time left at task submission",
          },
          {
            title: "Avg Overtime",
            value: snapshot.overall_avg_overtime,
            unit: "hrs per work day",
            description: "Average overtime hours",
          },
          {
            title: "Avg Lateness",
            value: snapshot.overall_avg_lateness,
            unit: "hrs per work day",
            description: "Average late hours",
          },
          {
            title: "Avg Absence",
            value: snapshot.overall_avg_absent_days,
            unit: "days per work day",
            description: "Average absence days",
          },
          {
            title: "Avg Salary",
            value: snapshot.overall_avg_salary,
            unit: "$",
            description: "Average employee salary",
          },
        ].map((metric, idx) => (
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

      <Row className="g-4">
        <Col lg={12}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6>
                <strong>Monthly Salary Totals</strong>
              </h6>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="total_paid" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {renderPieCard("Employee Count", processPieData("count"), 0)}
        {renderPieCard(
          "Avg Salary ($ / employee)",
          processPieData("avg_salary"),
          1
        )}
        {renderPieCard(
          "Avg Lateness (hrs / work day)",
          processPieData("avg_lateness"),
          2
        )}
        {renderPieCard(
          "Avg Overtime (hrs / work day)",
          processPieData("avg_overtime"),
          3
        )}
        {renderPieCard(
          "Avg Absence (days / workday)",
          processPieData("avg_absent_days"),
          4
        )}
        {renderPieCard(
          "Avg Task Submission Timing (hrs remaining)",
          processPieData("avg_time_remaining"),
          5
        )}
        {renderPieCard(
          "Avg Task Rating (% / task)",
          processPieData("avg_task_rating"),
          6
        )}
      </Row>
    </>
  );
}
