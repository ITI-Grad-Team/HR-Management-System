import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F97316", "#8B5CF6", "#EF4444"];

const PayrollStats = ({ records }) => {
  if (!records || records.length === 0) {
    return null;
  }

  const totalSalary = records.reduce((sum, r) => sum + r.final_salary, 0);
  const highestSalary = Math.max(...records.map((r) => r.final_salary));
  const avgSalary = totalSalary / records.length;
  const totalDeductions = records.reduce(
    (sum, r) =>
      sum +
      (r.details.total_absence_penalty || 0) +
      (r.details.total_late_penalty || 0),
    0
  );

  const positionData = records.reduce((acc, record) => {
    const pos = record.employee_position || "N/A";
    if (!acc[pos]) {
      acc[pos] = { name: pos, value: 0 };
    }
    acc[pos].value += record.final_salary;
    return acc;
  }, {});

  const pieData = Object.values(positionData);

  const stats = [
    { title: "Total Paid", value: `$${totalSalary.toFixed(2)}` },
    { title: "Highest Salary", value: `$${highestSalary.toFixed(2)}` },
    { title: "Average Salary", value: `$${avgSalary.toFixed(2)}` },
    { title: "Total Deductions", value: `$${totalDeductions.toFixed(2)}` },
  ];

  return (
    <>
      <Row className="g-4 mb-4">
        {stats.map((stat, i) => (
          <Col key={i} md={3}>
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <h6 className="text-muted">{stat.title}</h6>
                <h3 className="mb-0" style={{ color: COLORS[i % COLORS.length] }}>
                  {stat.value}
                </h3>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Salary Distribution by Position</h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PayrollStats; 