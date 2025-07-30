import React, { useState, useMemo } from "react";
import { Card, Row, Col, Dropdown } from "react-bootstrap";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PayrollCharts = ({ records, selectedUser, statsMonthFilter, statsYearFilter }) => {
  const [barChartYear, setBarChartYear] = useState(new Date().getFullYear());

  const monthlyTotals = useMemo(() => {
    // Start with the base records and apply Company-Wide Stats filters
    let filteredRecords = records;
    
    // Apply year filter from Company-Wide Stats if present, otherwise use barChartYear
    const targetYear = statsYearFilter || barChartYear;
    filteredRecords = filteredRecords.filter((r) => r.year == targetYear);
    
    // Apply month filter from Company-Wide Stats if present
    if (statsMonthFilter) {
      filteredRecords = filteredRecords.filter((r) => r.month == statsMonthFilter);
    }

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const totals = monthNames.map((monthName, index) => {
      const monthRecords = filteredRecords.filter((r) => r.month === index + 1);
      const total = monthRecords.reduce((sum, r) => sum + r.final_salary, 0);
      return { name: monthName, total };
    });

    return totals;
  }, [records, barChartYear, statsMonthFilter, statsYearFilter]);

  const salaryTrend = useMemo(() => {
    const dataSet = selectedUser
      ? records.filter((r) => r.user.username === selectedUser)
      : records;

    if (dataSet.length === 0) return [];

    const trend = dataSet.reduce((acc, r) => {
      const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = {
          salaries: [],
          name: `${new Date(r.year, r.month - 1, 1).toLocaleString("default", {
            month: "short",
          })}-${r.year}`,
        };
      }
      acc[key].salaries.push(r.final_salary);
      return acc;
    }, {});

    return Object.values(trend)
      .map((d) => ({
        ...d,
        salary:
          d.salaries.reduce((a, b) => a + b, 0) /
          (d.salaries.length || 1),
      }))
      .sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [records, selectedUser]);

  return (
    <Row className="g-4">
      <Col lg={6}>
        <Card className="shadow-sm h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                Monthly Salary Totals
                {(statsMonthFilter || statsYearFilter) && (
                  <small className="text-muted ms-2">
                    (Filtered{statsYearFilter ? ` - ${statsYearFilter}` : ''}{statsMonthFilter ? ` - Month ${statsMonthFilter}` : ''})
                  </small>
                )}
              </h5>
              {!statsYearFilter && (
                <Dropdown onSelect={(e) => setBarChartYear(e)}>
                  <Dropdown.Toggle variant="outline-primary" size="sm">
                    Year: {barChartYear}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {[...Array(5).keys()].map((i) => (
                      <Dropdown.Item
                        key={new Date().getFullYear() - i}
                        eventKey={new Date().getFullYear() - i}
                      >
                        {new Date().getFullYear() - i}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTotals} barSize={20}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="total" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={6}>
        <Card className="shadow-sm h-100">
          <Card.Body>
            <h5 className="mb-3">
              Salary Trend:{" "}
              <span className="text-primary">
                {selectedUser || "Average"}
              </span>
            </h5>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salaryTrend}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="salary"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={selectedUser ? "Salary" : "Average Salary"}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default PayrollCharts; 