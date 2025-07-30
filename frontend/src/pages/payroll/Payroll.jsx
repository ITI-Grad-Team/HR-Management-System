import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Spinner,
  Alert,
  InputGroup,
  FormControl,
  Button,
  Card,
  Dropdown,
  Modal,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import axiosInstance from "../../api/config";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaTrashAlt,
  FaPen,
  FaFilter,
  FaUndo,
  FaPlus,
} from "react-icons/fa";
import PayrollStats from "../../components/payroll/PayrollStats";
import PayrollCharts from "../../components/payroll/PayrollCharts";
import GenerateSalaryRecord from "../../components/payroll/GenerateSalaryRecord";
import { fetchAllPages } from "../../api/pagination";
import PayrolFallback from "../../components/DashboardFallBack/PayrolFallback";
import Pagination from "../../components/Pagination/Pagination";

const Payroll = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [userFilter, setUserFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statsMonthFilter, setStatsMonthFilter] = useState("");
  const [statsYearFilter, setStatsYearFilter] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const navigate = useNavigate();
  const recordsPerPage = 10;
  const currentYear = new Date().getFullYear();

  // Helper functions for tooltips
  const getBonusTooltip = (details) => {
    const bonusItems = [];
    if (details.total_overtime_salary > 0) {
      bonusItems.push(`Overtime: $${details.total_overtime_salary.toFixed(2)}`);
    }
    if (details.bonus_amount > 0) {
      bonusItems.push(`Performance Bonus: $${details.bonus_amount.toFixed(2)}`);
    }
    if (details.attendance_bonus > 0) {
      bonusItems.push(`Attendance Bonus: $${details.attendance_bonus.toFixed(2)}`);
    }

    return bonusItems.length > 0
      ? bonusItems.join('\n')
      : 'No bonus components';
  };

  const getDeductionsTooltip = (details) => {
    const deductionItems = [];
    if (details.total_late_penalty > 0) {
      deductionItems.push(`Lateness Penalty: $${details.total_late_penalty.toFixed(2)}`);
    }
    if (details.total_absence_penalty > 0) {
      deductionItems.push(`Absence Penalty: $${details.total_absence_penalty.toFixed(2)}`);
    }
    if (details.tax_deduction > 0) {
      deductionItems.push(`Tax: $${details.tax_deduction.toFixed(2)}`);
    }
    if (details.insurance_deduction > 0) {
      deductionItems.push(`Insurance: $${details.insurance_deduction.toFixed(2)}`);
    }

    return deductionItems.length > 0
      ? deductionItems.join('\n')
      : 'No deductions applied';
  };

  useEffect(() => {
    document.title = "Payroll | HERA";
  }, []);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const allRecords = await fetchAllPages("/salary/calculate/");
      setRecords(allRecords);
      setError(null);
    } catch (err) {
      setError("Failed to fetch payroll records.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setRecordToEdit(record);
    setShowGenerateModal(true);
  };

  const handleModalClose = () => {
    setRecordToEdit(null);
    setShowGenerateModal(false);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await axiosInstance.delete(`/salary/calculate/${recordToDelete}/`);
      setShowDeleteModal(false);
      setRecordToDelete(null);
      fetchRecords(); // Refresh data
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const openDeleteModal = (id) => {
    setRecordToDelete(id);
    setShowDeleteModal(true);
  };

  const tableFilteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchTermMatch =
        record.user.username
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        record.employee_position
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const userMatch = userFilter ? record.user.username === userFilter : true;
      const monthMatch = monthFilter ? record.month == monthFilter : true;
      const yearMatch = yearFilter ? record.year == yearFilter : true;
      return searchTermMatch && userMatch && monthMatch && yearMatch;
    });
  }, [records, searchTerm, userFilter, monthFilter, yearFilter]);

  const statsFilteredRecords = useMemo(() => {
    return records.filter((record) => {
      const monthMatch = statsMonthFilter
        ? record.month == statsMonthFilter
        : true;
      const yearMatch = statsYearFilter ? record.year == statsYearFilter : true;
      return monthMatch && yearMatch;
    });
  }, [records, statsMonthFilter, statsYearFilter]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = tableFilteredRecords.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(tableFilteredRecords.length / recordsPerPage);

  const resetTableFilters = () => {
    setSearchTerm("");
    setUserFilter("");
    setMonthFilter("");
    setYearFilter("");
  };

  const resetStatsFilters = () => {
    setStatsMonthFilter("");
    setStatsYearFilter("");
  };

  if (loading) {
    return <PayrolFallback />
  }

  return (
    <Container fluid className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h1 className="h3 mb-0">Payroll Dashboard</h1>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            onClick={() => setShowGenerateModal(true)}
          >
            <FaPlus className="me-2" /> Generate Record
          </Button>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={3}>
              <h5>Company-Wide Stats</h5>
            </Col>
            <Col md={3}>
              <Dropdown onSelect={(e) => setStatsMonthFilter(e)}>
                <Dropdown.Toggle
                  variant="outline-primary"
                  id="dropdown-month-stats"
                  className="w-100"
                >
                  <FaFilter className="me-2" />
                  {statsMonthFilter
                    ? `Month: ${statsMonthFilter}`
                    : "Filter by Month"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {[...Array(12).keys()].map((i) => (
                    <Dropdown.Item key={i + 1} eventKey={i + 1}>
                      {i + 1}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={3}>
              <Dropdown onSelect={(e) => setStatsYearFilter(e)}>
                <Dropdown.Toggle
                  variant="outline-primary"
                  id="dropdown-year-stats"
                  className="w-100"
                >
                  <FaFilter className="me-2" />
                  {statsYearFilter
                    ? `Year: ${statsYearFilter}`
                    : "Filter by Year"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {[...Array(10).keys()].map((i) => (
                    <Dropdown.Item
                      key={currentYear - i}
                      eventKey={currentYear - i}
                    >
                      {currentYear - i}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={3}>
              <Button
                variant="outline-secondary"
                onClick={resetStatsFilters}
                className="w-100"
              >
                <FaUndo className="me-2" /> Reset Stats Filters
              </Button>
            </Col>
          </Row>
          <hr />
          <PayrollStats records={statsFilteredRecords} />
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <PayrollCharts 
            records={records} 
            selectedUser={userFilter} 
            statsMonthFilter={statsMonthFilter}
            statsYearFilter={statsYearFilter}
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          <Row className="align-items-center mb-3">
            <Col>
              <h5 className="mb-0">Payroll Records - Employee Salary Summary</h5>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <InputGroup>
                <FormControl
                  placeholder="Search by employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Dropdown onSelect={(e) => setUserFilter(e)}>
                <Dropdown.Toggle
                  variant="outline-primary"
                  id="dropdown-user"
                  className="w-100"
                >
                  {userFilter || "Filter by User"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {[...new Set(records.map((r) => r.user.username))].map(
                    (name) => (
                      <Dropdown.Item key={name} eventKey={name}>
                        {name}
                      </Dropdown.Item>
                    )
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={2}>
              <Dropdown onSelect={(e) => setMonthFilter(e)}>
                <Dropdown.Toggle
                  variant="outline-primary"
                  id="dropdown-primary"
                  className="w-100"
                >
                  {monthFilter ? `Month: ${monthFilter}` : "Month"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {[...Array(12).keys()].map((i) => (
                    <Dropdown.Item key={i + 1} eventKey={i + 1}>
                      {i + 1}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={2}>
              <Dropdown onSelect={(e) => setYearFilter(e)}>
                <Dropdown.Toggle
                  variant="outline-primary"
                  id="dropdown-year"
                  className="w-100"
                >
                  {yearFilter ? `Year: ${yearFilter}` : "Year"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {[...Array(10).keys()].map((i) => (
                    <Dropdown.Item
                      key={currentYear - i}
                      eventKey={currentYear - i}
                    >
                      {currentYear - i}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={3}>
              <Button
                variant="outline-secondary"
                onClick={resetTableFilters}
                className="w-100"
              >
                <FaUndo className="me-2" /> Reset Table Filters
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <>
              <Table hover responsive className="table-nowrap align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Position</th>
                    <th>Period</th>
                    <th className="text-end">Base Salary</th>
                    <th className="text-end">Bonus</th>
                    <th className="text-end">Deductions</th>
                    <th className="text-end">Net Salary</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="fw-bold">{record.user.username}</div>
                        </div>
                      </td>
                      <td>{record.employee_position}</td>
                      <td>{`${record.month}/${record.year}`}</td>
                      <td className="text-end">
                        ${record.base_salary.toFixed(2)}
                      </td>
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip>
                            <div style={{ whiteSpace: 'pre-line' }}>
                              {getBonusTooltip(record.details)}
                            </div>
                          </Tooltip>
                        }
                      >
                        <td className="text-end text-success" style={{ cursor: 'help' }}>
                          + $
                          {(record.details.total_overtime_salary || 0).toFixed(
                            2
                          )}
                        </td>
                      </OverlayTrigger>
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip>
                            <div style={{ whiteSpace: 'pre-line' }}>
                              {getDeductionsTooltip(record.details)}
                            </div>
                          </Tooltip>
                        }
                      >
                        <td className="text-end text-danger" style={{ cursor: 'help' }}>
                          - ${(record.details.total_deductions || 0).toFixed(2)}
                        </td>
                      </OverlayTrigger>
                      <td className="text-end fw-bold">
                        ${record.final_salary.toFixed(2)}
                      </td>
                      <td className="text-end">
                        <Button
                          variant="link"
                          className="p-1 me-2"
                          onClick={() =>
                            navigate(
                              `/dashboard/employeeDetails/${record.employee_id}`
                            )
                          }
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="link"
                          className="p-1 me-2 text-warning"
                          onClick={() => handleEdit(record)}
                        >
                          <FaPen />
                        </Button>
                        <Button
                          variant="link"
                          className="p-1 text-danger"
                          onClick={() => openDeleteModal(record.id)}
                        >
                          <FaTrashAlt />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this record?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <GenerateSalaryRecord
        show={showGenerateModal}
        onHide={handleModalClose}
        onRecordGenerated={fetchRecords}
        recordToEdit={recordToEdit}
      />
    </Container>
  );
};

export default Payroll; 