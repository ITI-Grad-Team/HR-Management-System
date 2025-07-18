import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
  InputGroup,
  FormControl,
  ListGroup,
} from "react-bootstrap";
import axiosInstance from "../../api/config";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { fetchAllPages } from "../../api/pagination";

const GenerateSalaryRecord = ({
  show,
  onHide,
  onRecordGenerated,
  recordToEdit,
}) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { role } = useAuth();
  const isEditMode = !!recordToEdit;

  useEffect(() => {
    if (show) {
      const endpoint =
        role === "admin" ? "/admin/employees/" : "/hr/employees/";
      fetchAllPages(endpoint)
        .then((allEmployees) => {
          setEmployees(allEmployees);
        })
        .catch(() => {
          setError("Could not fetch employees.");
        });

      if (isEditMode) {
        setSelectedEmployee(recordToEdit.user.id);
        setYear(recordToEdit.year);
        setMonth(recordToEdit.month);
        setSearch(recordToEdit.user.username);
      } else {
        // Reset form for new record
        setSelectedEmployee("");
        setYear(new Date().getFullYear());
        setMonth(new Date().getMonth() + 1);
        setSearch("");
      }
    }
  }, [show, role, recordToEdit, isEditMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      user: selectedEmployee,
      year: year,
      month: month,
    };

    const request = isEditMode
      ? axiosInstance.post(`/salary/calculate/`, payload) // Recalculate
      : axiosInstance.post("/salary/calculate/", payload);

    request
      .then(() => {
        toast.success(
          `Salary record ${
            isEditMode ? "updated" : "generated"
          } successfully!`
        );
        onRecordGenerated();
        onHide();
      })
      .catch((err) => {
        setError(
          err.response?.data?.detail || "Failed to process salary record."
        );
        toast.error("Failed to process salary record.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp.user.id);
    setSearch(emp.user.username);
    setShowDropdown(false);
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? "Edit Salary Record" : "Generate New Salary Record"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group as={Row} className="mb-3" controlId="formEmployee">
            <Form.Label column sm={3}>
              Employee
            </Form.Label>
            <Col sm={9}>
              <InputGroup>
                <FormControl
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Search for employee..."
                  disabled={isEditMode}
                />
              </InputGroup>
              {showDropdown && filteredEmployees.length > 0 && (
                <ListGroup style={{ position: "absolute", zIndex: 1000 }}>
                  {filteredEmployees.map((emp) => (
                    <ListGroup.Item
                      key={emp.user.id}
                      action
                      onClick={() => handleSelectEmployee(emp)}
                    >
                      {emp.user.username}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formYear">
            <Form.Label column sm={3}>
              Year
            </Form.Label>
            <Col sm={9}>
              <Form.Control
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                disabled={isEditMode}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formMonth">
            <Form.Label column sm={3}>
              Month
            </Form.Label>
            <Col sm={9}>
              <Form.Control
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                min="1"
                max="12"
                required
                disabled={isEditMode}
              />
            </Col>
          </Form.Group>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : isEditMode ? (
                "Update"
              ) : (
                "Generate"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default GenerateSalaryRecord; 