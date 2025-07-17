import React, { useState, useEffect } from "react";
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
  Pagination,
  Card,
  Dropdown,
  Modal,
} from "react-bootstrap";
import axiosInstance from "../../api/config";
import { useNavigate } from "react-router-dom";
import { FaEye, FaTrashAlt, FaPen } from "react-icons/fa";
import PayrollStats from "../../components/payroll/PayrollStats";

const Payroll = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const navigate = useNavigate();
  const recordsPerPage = 10;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/salary/calculate/");
      setRecords(
        Array.isArray(response.data.results) ? response.data.results : []
      );
      setError(null);
    } catch (err) {
      setError("Failed to fetch payroll records.");
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const filteredRecords = records
    .filter((record) => {
      const searchTermMatch =
        record.user.username
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        record.employee_position
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const monthMatch = filterMonth ? record.month == filterMonth : true;
      const yearMatch = filterYear ? record.year == filterYear : true;
      return searchTermMatch && monthMatch && yearMatch;
    });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Container fluid className="py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="h3 mb-0">Payroll Management</h1>
        </Col>
      </Row>

      <PayrollStats records={records} />

      <Card className="shadow-sm mt-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <InputGroup>
                <FormControl
                  placeholder="Search by employee or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Dropdown onSelect={(e) => setFilterMonth(e)}>
                <Dropdown.Toggle variant="outline-secondary" id="dropdown-month">
                  {filterMonth ? `Month: ${filterMonth}` : "Filter by Month"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {[...Array(12).keys()].map((i) => (
                    <Dropdown.Item key={i + 1} eventKey={i + 1}>
                      {i + 1}
                    </Dropdown.Item>
                  ))}
                  <Dropdown.Divider />
                  <Dropdown.Item eventKey="">All Months</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={2}>
              <Dropdown onSelect={(e) => setFilterYear(e)}>
                <Dropdown.Toggle variant="outline-secondary" id="dropdown-year">
                  {filterYear ? `Year: ${filterYear}` : "Filter by Year"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {[...Array(10).keys()].map((i) => (
                    <Dropdown.Item key={currentYear  - i} eventKey={currentYear  - i}>
                      {currentYear  - i}
                    </Dropdown.Item>
                  ))}
                  <Dropdown.Divider />
                  <Dropdown.Item eventKey="">All Years</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
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
              <Table hover responsive className="table-nowrap">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Position</th>
                    <th>Period</th>
                    <th>Base Salary</th>
                    <th>Bonus</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div>
                              <div className="fw-bold">{record.user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>{record.employee_position}</td>
                        <td>{`${record.month}/${record.year}`}</td>
                        <td>${record.base_salary.toFixed(2)}</td>
                        <td className="text-success">
                          + ${(record.details.total_overtime_salary || 0).toFixed(2)}
                        </td>
                        <td className="text-danger">
                          - $
                          {(
                            (record.details.total_absence_penalty || 0) +
                            (record.details.total_late_penalty || 0)
                          ).toFixed(2)}
                        </td>
                        <td className="fw-bold">${record.final_salary.toFixed(2)}</td>
                        <td className="text-end">
                          <Button
                            variant="link"
                            className="p-1 me-2"
                            onClick={() =>
                              navigate(`/dashboard/employeeDetails/${record.employee_id}`)
                            }
                          >
                            <FaEye />
                          </Button>
                          <Button variant="link" className="p-1 me-2 text-warning">
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <Pagination className="justify-content-center">
                  {[...Array(totalPages).keys()].map((number) => (
                    <Pagination.Item
                      key={number + 1}
                      active={number + 1 === currentPage}
                      onClick={() => handlePageChange(number + 1)}
                    >
                      {number + 1}
                    </Pagination.Item>
                  ))}
                </Pagination>
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
    </Container>
  );
};

export default Payroll; 