import React, { useEffect, useState } from "react";
import {
  Card,
  Badge,
  Button,
  Form,
  Modal,
  Spinner,
  Accordion,
  Alert,
} from "react-bootstrap";
import axiosInstance from "../../api/config";

const getCorrelationColor = (value) => {
  if (value > 0.5) return "#10B981"; // Strong positive (green)
  if (value > 0) return "#3B82F6"; // Weak positive (blue)
  if (value < -0.5) return "#ef44a8ff"; // Strong negative (pink/red)
  if (value < 0) return "#6366F1"; // Weak negative (indigo)
  return "#6B7280"; // Neutral gray
};

const formatHeader = (str) => {
  return str
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatValue = (value, col) => {
  if (value === null || value === undefined) return "N/A";

  if (typeof value === "number") {
    if (col === "rank") {
      return `#${Math.round(value)}`; // Display rank as #1, #2, etc.
    }
    const rounded = Number(value).toFixed(2);
    return rounded;
  }
  return value;
};

// Default weights for each type
const DEFAULT_WEIGHTS = {
  employees: {
    avg_task_rating: 1.0,
    avg_time_remaining: 0.5,
    avg_overtime: -0.3,
    avg_lateness: -0.5,
    avg_absent: -0.7,
  },
  hrs: {
    accepted_employees_avg_task_rating: 1.0,
    accepted_employees_avg_time_remaining: 0.5,
    accepted_employees_avg_lateness_hrs: -0.5,
    accepted_employees_avg_absence_days: -0.7,
    accepted_employees_avg_salary: -0.3,
    accepted_employees_avg_overtime: -0.2,
    accepted_employees_avg_interviewer_rating: 0.8,
    interviewer_rating_to_task_rating_correlation: 0.3,
    interviewer_rating_to_time_remaining_correlation: 0.3,
    interviewer_rating_to_lateness_hrs_correlation: -0.3,
    interviewer_rating_to_absence_days_correlation: -0.3,
    interviewer_rating_to_avg_overtime_correlation: -0.3,
  },
};

export default function AdminTopTable() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [type, setType] = useState("employees");
  const [showModal, setShowModal] = useState(false);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS.employees);
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    const url =
      type === "employees"
        ? "/admin/top/top-employees/"
        : "/admin/top/top-hrs/";

    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(url);
      if (res.data.length > 0) {
        setData(res.data);
        setColumns(
          Object.keys(res.data[0]).filter(
            (col) => col !== "rank" && col !== "username"
          )
        );
      } else {
        setData([]);
        setColumns([]);
      }
    } catch (err) {
      console.error("Error fetching top data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  useEffect(() => {
    // Reset weights when type changes
    setWeights(DEFAULT_WEIGHTS[type]);
  }, [type]);

  const handleRank = async () => {
    setRanking(true);
    setError(null);
    const url =
      type === "employees"
        ? "/admin/rank/rank-employees/"
        : "/admin/rank/rank-hrs/";

    try {
      // Ensure all weights are numbers
      const numericWeights = Object.fromEntries(
        Object.entries(weights).map(([key, value]) => [key, Number(value)])
      );

      await axiosInstance.post(url, { weights: numericWeights });
      setShowModal(false);
      await fetchData(); // Refresh data after ranking
    } catch (err) {
      console.error("Ranking error:", err);
      setError(
        err.response?.data?.message ||
          "Ranking failed. Please check your weights and try again."
      );
    } finally {
      setRanking(false);
    }
  };

  const handleWeightChange = (field, value) => {
    const numValue = value === "" ? "" : parseFloat(value);
    setWeights((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const weightableFields = {
    employees: [
      "avg_task_rating",
      "avg_time_remaining",
      "avg_overtime",
      "avg_lateness",
      "avg_absent",
    ],
    hrs: [
      "accepted_employees_avg_task_rating",
      "accepted_employees_avg_time_remaining",
      "accepted_employees_avg_lateness_hrs",
      "accepted_employees_avg_absence_days",
      "accepted_employees_avg_salary",
      "accepted_employees_avg_overtime",
      "accepted_employees_avg_interviewer_rating",
      "interviewer_rating_to_task_rating_correlation",
      "interviewer_rating_to_time_remaining_correlation",
      "interviewer_rating_to_lateness_hrs_correlation",
      "interviewer_rating_to_absence_days_correlation",
      "interviewer_rating_to_avg_overtime_correlation",
    ],
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h5>{type === "employees" ? "Top Employees" : "Top HRs"}</h5>
        <div className="d-flex gap-2 align-items-center">
          <Form.Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="me-2 w-auto"
            disabled={loading}
          >
            <option value="employees">Employees</option>
            <option value="hrs">HRs</option>
          </Form.Select>
          <Button
            variant="outline-primary"
            onClick={() => setShowModal(true)}
            disabled={loading}
          >
            {loading ? (
              <Spinner size="sm" animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              `Re-Rank ${type === "employees" ? "Employees" : "HRs"}`
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">
            Loading {type === "employees" ? "employees" : "HRs"} data...
          </p>
        </div>
      ) : data.length === 0 ? (
        <Card className="mt-3">
          <Card.Body className="text-center py-5">
            No {type === "employees" ? "employees" : "HRs"} data available
          </Card.Body>
        </Card>
      ) : (
        <Accordion className="mt-3">
          {data.map((item, index) => (
            <Accordion.Item eventKey={index.toString()} key={index}>
              <Accordion.Header>
                <div className="d-flex align-items-center w-100">
                  <span className="me-2 fw-bold">
                    {" "}
                    {/* Added fw-bold here */}#{item.rank} - {item.username}
                  </span>
                  {item.score !== undefined && (
                    <Badge bg="info" className="ms-auto">
                      Score: {item.score?.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className="row g-2">
                  {" "}
                  {/* Added g-2 for consistent gutter spacing */}
                  {columns.map((col) => (
                    <div className="col-md-6" key={col}>
                      <div className="d-flex justify-content-between p-2 bg-light rounded">
                        {" "}
                        {/* Added cell styling */}
                        <span className="text-muted">{formatHeader(col)}</span>
                        <span className="fw-medium">
                          {" "}
                          {/* Added medium font weight */}
                          {col.includes("correlation") ? (
                            <Badge
                              bg=""
                              style={{
                                backgroundColor: getCorrelationColor(item[col]),
                                color: "#fff",
                              }}
                            >
                              {formatValue(item[col], col)}
                            </Badge>
                          ) : (
                            formatValue(item[col], col)
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Set Weights for {type === "employees" ? "Employee" : "HR"} Ranking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {weightableFields[type].map((field) => (
              <Form.Group key={field} className="mb-3">
                <Form.Label>{formatHeader(field)}</Form.Label>
                <Form.Control
                  type="number"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={weights[field] ?? ""}
                  onChange={(e) => handleWeightChange(field, e.target.value)}
                  disabled={ranking}
                />
              </Form.Group>
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            disabled={ranking}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRank} disabled={ranking}>
            {ranking ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Ranking...
              </>
            ) : (
              "Rank Now"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
