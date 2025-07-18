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
import axiosInstance from "../src/api/config";

const pieColors = [
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#A855F7",
  "#38BDF8",
  "#10B981",
];

export default function Charts() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/admin/monthly-snapshots/")
      .then((res) => {
        setSnapshot(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !snapshot) return <Spinner animation="border" />;

  const positionStats = snapshot.position_stats || {};

  const processPieData = (key) => {
    const total = Object.values(positionStats).reduce(
      (sum, pos) => sum + (pos[key] || 0),
      0
    );
    return Object.entries(positionStats).map(([posName, stats]) => ({
      name: posName,
      value: +(stats[key] || 0),
      percentage: total ? ((stats[key] || 0) / total) * 100 : 0,
    }));
  };

  const barData = (snapshot.monthly_salary_totals || []).map(
    ({ year, month, total_paid }) => ({
      name: `${year}/${month}`,
      total_paid,
    })
  );

  const renderPieCard = (title, data, indexOffset = 0) => (
    <Col lg={6} className="mb-4">
      <Card className="shadow-sm h-100">
        <Card.Body>
          <h6>{title}</h6>
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
              <Legend verticalAlign="bottom" height={36} />
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

  return (
    <Row className="g-4">
      <Col lg={12}>
        <Card className="shadow-sm">
          <Card.Body>
            <h6>Monthly Salary Totals</h6>
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

      {renderPieCard("Employee Count per Position", processPieData("count"), 0)}
      {renderPieCard("Avg Lateness (hrs)", processPieData("avg_lateness"), 1)}
      {renderPieCard("Avg Overtime (hrs)", processPieData("avg_overtime"), 2)}
      {renderPieCard("Avg Absent Days", processPieData("avg_absent_days"), 3)}
    </Row>
  );
}
