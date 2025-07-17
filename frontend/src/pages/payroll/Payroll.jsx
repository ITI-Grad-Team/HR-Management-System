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
} from "react-bootstrap";
import axiosInstance from "../../api/config";

const Payroll = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        
        setLoading(true);
        const response = await axiosInstance.get("/salary/calculate/");
        console.log("API response structure:", response.data); // for Debugging
        setRecords(Array.isArray(response.data.results) ? response.data.results : []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch payroll records.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(
    (record) =>
      record.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = Array.isArray(filteredRecords) ? filteredRecords.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  ) : [];
  const totalPages = Array.isArray(filteredRecords) ? Math.ceil(filteredRecords.length / recordsPerPage) : 0;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    let items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    return <Pagination className="justify-content-center">{items}</Pagination>;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="h3">Payroll Management</h1>
        </Col>
      </Row>

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
      </Row>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive className="shadow-sm">
            <thead className="table-primary">
              <tr>
                <th>Employee Name</th>
                <th>Position</th>
                <th>Month/Year</th>
                <th>Base Salary</th>
                <th>Overtime Bonus</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.user.username}</td>
                    <td>{record.employee_position}</td>
                    <td>{`${record.month}/${record.year}`}</td>
                    <td>${record.base_salary.toFixed(2)}</td>
                    <td>
                      ${(record.details.total_overtime_salary || 0).toFixed(2)}
                    </td>
                    <td>
                      $
                      {(
                        (record.details.total_absence_penalty || 0) +
                        (record.details.total_late_penalty || 0)
                      ).toFixed(2)}
                    </td>
                    <td>${record.final_salary.toFixed(2)}</td>
                    <td>
                      <Button variant="outline-primary" size="sm">
                        View
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
          {renderPagination()}
        </>
      )}
    </Container>
  );
};

export default Payroll; 