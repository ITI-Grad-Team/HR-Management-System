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
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const { role } = useAuth();
  const isEditMode = !!recordToEdit;

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300);

  // Fetch available periods for selected employee
  const fetchAvailablePeriods = async (employeeId) => {
    try {
      setPeriodsLoading(true);
      const response = await axiosInstance.get(`/salary/calculate/available-periods/${employeeId}/`);
      setAvailablePeriods(response.data.periods || []);
      setAvailableYears(response.data.years || []);

      // Reset year and month to the most recent available period
      if (response.data.periods && response.data.periods.length > 0) {
        const latestPeriod = response.data.periods[response.data.periods.length - 1];
        setYear(latestPeriod.year);
        setMonth(latestPeriod.month);
      }
    } catch (error) {
      console.error("Error fetching available periods:", error);
      setAvailablePeriods([]);
      setAvailableYears([]);
      toast.error("Failed to fetch available periods for this employee.");
    } finally {
      setPeriodsLoading(false);
    }
  };

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
        // Fetch periods for edit mode as well to show available options
        fetchAvailablePeriods(recordToEdit.user.id);
      } else {
        // Reset form for new record
        setSelectedEmployee("");
        setYear(new Date().getFullYear());
        setMonth(new Date().getMonth() + 1);
        setSearch("");
        setEmployees([]);
        setAvailablePeriods([]);
        setAvailableYears([]);
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

  const handleSelectEmployee = async (emp) => {
    setSelectedEmployee(emp.user.id);
    setSearch(emp.user.username);
    setShowDropdown(false);
    setEmployees([]);

    // Fetch available periods for the selected employee
    if (!isEditMode) {
      await fetchAvailablePeriods(emp.user.id);
    }
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
              {selectedEmployee && availablePeriods.length > 0 && (
                <div className="mt-2 text-info small">
                  <i className="bi bi-info-circle me-1"></i>
                  Available periods are from the employee's join date to current month.
                </div>
              )}
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formYear">
            <Form.Label column sm={3}>
              Year
            </Form.Label>
            <Col sm={9}>
              {selectedEmployee && availableYears.length > 0 ? (
                <Form.Select
                  value={year}
                  onChange={(e) => {
                    const selectedYear = parseInt(e.target.value);
                    setYear(selectedYear);
                    // Reset month to first available month for this year
                    const firstMonthForYear = availablePeriods.find(p => p.year === selectedYear)?.month;
                    if (firstMonthForYear) {
                      setMonth(firstMonthForYear);
                    }
                  }}
                  required
                  disabled={isEditMode || periodsLoading}
                >
                  <option value="">Select Year</option>
                  {availableYears.map((yearOption) => (
                    <option key={yearOption} value={yearOption}>
                      {yearOption}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Control
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  disabled={isEditMode || !selectedEmployee}
                  placeholder={selectedEmployee ? (periodsLoading ? "Loading..." : "Select an employee first") : "Select an employee first"}
                />
              )}
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formMonth">
            <Form.Label column sm={3}>
              Month
            </Form.Label>
            <Col sm={9}>
              {selectedEmployee && availablePeriods.length > 0 ? (
                <Form.Select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  required
                  disabled={isEditMode || periodsLoading || !year}
                >
                  <option value="">Select Month</option>
                  {availablePeriods
                    .filter(period => period.year === parseInt(year))
                    .map((period) => (
                      <option key={`${period.year}-${period.month}`} value={period.month}>
                        {new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long' })} {period.year}
                      </option>
                    ))}
                </Form.Select>
              ) : (
                <Form.Control
                  type="number"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  min="1"
                  max="12"
                  required
                  disabled={isEditMode || !selectedEmployee}
                  placeholder={selectedEmployee ? (periodsLoading ? "Loading..." : "Select a year first") : "Select an employee first"}
                />
              )}
            </Col>
          </Form.Group>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading || (!selectedEmployee || !year || !month)}>
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