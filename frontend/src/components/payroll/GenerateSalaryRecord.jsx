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
import { searchEmployees } from "../../api/employeeApi";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";

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
  const [searchLoading, setSearchLoading] = useState(false);
  const { role } = useAuth();
  const isEditMode = !!recordToEdit;

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300);

  // Fetch employees based on search term
  useEffect(() => {
    if (show && debouncedSearch.trim() && !isEditMode) {
      const fetchEmployees = async () => {
        try {
          setSearchLoading(true);
          const response = await searchEmployees(debouncedSearch, 1, 20, role);
          setEmployees(response.data.results || []);
        } catch (error) {
          console.error("Error searching employees:", error);
          setEmployees([]);
        } finally {
          setSearchLoading(false);
        }
      };

      fetchEmployees();
    } else if (!debouncedSearch.trim()) {
      setEmployees([]);
    }
  }, [debouncedSearch, show, role, isEditMode]);

  useEffect(() => {
    if (show) {
      if (isEditMode) {
        setSelectedEmployee(recordToEdit.user.id);
        setYear(recordToEdit.year);
        setMonth(recordToEdit.month);
        setSearch(recordToEdit.user.username);
        setEmployees([]);
      } else {
        // Reset form for new record
        setSelectedEmployee("");
        setYear(new Date().getFullYear());
        setMonth(new Date().getMonth() + 1);
        setSearch("");
        setEmployees([]);
      }
    }
  }, [show, recordToEdit, isEditMode]);

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
          `Salary record ${isEditMode ? "updated" : "generated"
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
    setEmployees([]);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim()) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setEmployees([]);
    }
  };

  const handleSearchFocus = () => {
    if (search.trim() && employees.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding dropdown to allow for selection
    setTimeout(() => setShowDropdown(false), 200);
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
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  placeholder={isEditMode ? recordToEdit.user.username : "Type to search for employee..."}
                  disabled={isEditMode}
                />
                {searchLoading && (
                  <InputGroup.Text>
                    <Spinner as="span" size="sm" animation="border" />
                  </InputGroup.Text>
                )}
              </InputGroup>
              {showDropdown && filteredEmployees.length > 0 && !isEditMode && (
                <ListGroup
                  style={{
                    position: "absolute",
                    zIndex: 1000,
                    maxHeight: "200px",
                    overflowY: "auto",
                    width: "100%",
                    marginTop: "2px"
                  }}
                >
                  {filteredEmployees.slice(0, 10).map((emp) => (
                    <ListGroup.Item
                      key={emp.user.id}
                      action
                      onClick={() => handleSelectEmployee(emp)}
                      style={{ cursor: "pointer" }}
                    >
                      <div>
                        <strong>{emp.user.username}</strong>
                        {emp.user.email && (
                          <small className="text-muted d-block">{emp.user.email}</small>
                        )}
                        {emp.position && (
                          <small className="text-muted d-block">{emp.position.name}</small>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                  {employees.length > 10 && (
                    <ListGroup.Item disabled className="text-center text-muted">
                      <small>Showing first 10 results. Type more to narrow down...</small>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              )}
              {search.trim() && !searchLoading && filteredEmployees.length === 0 && debouncedSearch.trim() && !isEditMode && (
                <div className="mt-2 text-muted small">
                  No employees found matching "{search}"
                </div>
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