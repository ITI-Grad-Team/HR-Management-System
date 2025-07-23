import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, InputGroup } from "react-bootstrap";
import axiosInstance from "../../api/config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { FaMoneyBillWave } from "react-icons/fa";
const EmployeePayrollDashboard = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchEmployeeSalaries = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/my-salaries/?year=${year}`);
      setRecords(response.data);
    } catch (err) {
      console.error("Failed to fetch salary records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeSalaries();
  }, [year]);

  const handleYearChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setYear(value);
    }
  };

  const chartData = React.useMemo(() => {
    if (!records.length) return [];

    return records
      .map((record) => ({
        name: `${new Date(record.year, record.month - 1, 1).toLocaleString(
          "default",
          {
            month: "short",
          }
        )} ${record.year}`,
        baseSalary: record.base_salary,
        finalSalary: record.final_salary,
        totalDeductions: record.details.total_deductions || 0,
        totalBonus:
          (record.details.total_overtime_salary || 0) +
          (record.details.total_bonus || 0) +
          (record.details.attendance_bonus || 0),
        month: record.month,
        year: record.year,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  }, [records]);

  return (
    <div className="employee-payroll-dashboard">
      <h4 className="mb-4 d-flex align-items-center">
        <FaMoneyBillWave className="me-2 text-primary sub-icon" style={{color: "#948979" }}/>
        Salary Breakdown
      </h4>
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center mb-3">
            <Col md={4}>
              <h5 className="mb-0">Salary Breakdown</h5>
            </Col>
            <Col md={8}>
              <div className="float-end">
                <InputGroup style={{ width: "150px" }}>
                  <InputGroup.Text>Year</InputGroup.Text>
                  <Form.Control
                    type="number"
                    value={year}
                    onChange={handleYearChange}
                    min="2000"
                    max={new Date().getFullYear() + 1}
                  />
                </InputGroup>
              </div>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No payroll records found for {year}
            </div>
          ) : (
            <Row className="g-4">
              <Col lg={12}>
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          isAnimationActive={false} // Disables animation
                          itemStyle={{ padding: 0 }} // Removes padding for instant appearance
                          formatter={(value, name) => [
                            `$${value.toFixed(2)}`,
                            {
                              baseSalary: "Base Salary",
                              finalSalary: "Final Salary",
                              totalDeductions: "Total Deductions",
                              totalBonus: "Total Bonus",
                            }[name],
                          ]}
                          labelFormatter={(label) => `Period: ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="baseSalary"
                          name="Base Salary"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="finalSalary"
                          name="Final Salary"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalDeductions"
                          name="Total Deductions"
                          stroke="#EF4444"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalBonus"
                          name="Total Bonus"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default EmployeePayrollDashboard;
