import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Spinner, Alert, Table, Button, Form, Row, Col, Modal, Dropdown } from 'react-bootstrap';
import {
    getAllAttendance,
    getPendingOvertimeRequests,
    approveOvertimeRequest,
    rejectOvertimeRequest,
    convertAttendanceToLeave,
} from '../../api/attendanceApi';
import { toast } from 'react-toastify';
import { formatTime, formatHoursToTime } from '../../utils/formatters';
import { FaCheck, FaTimes, FaExchangeAlt } from 'react-icons/fa';
import RecentOvertimeRequests from './RecentOvertimeRequests';
import Pagination from '../Pagination/Pagination';
import AdminAttendanceFallback from '../DashboardFallBack/AdminAttendanceFallback';

const AdminAttendanceView = () => {
    const [attendance, setAttendance] = useState({ results: [], count: 0 });
    const [overtimeRequests, setOvertimeRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        user: '',
        date: new Date().toISOString().split('T')[0],
        month: '',
        year: '',
        status: ''
    });
    const [searchInput, setSearchInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [hrComment, setHrComment] = useState('');
    const recentRequestsRef = useRef();

    // Get current date for default filters
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Generate year options (from 2020 to current year + 1)
    const getYearOptions = () => {
        const years = [];
        const startYear = 2020;
        const endYear = currentYear + 1;
        for (let year = endYear; year >= startYear; year--) {
            years.push(year);
        }
        return years;
    };

    // Generate month options (descending order)
    const getMonthOptions = () => {
        return [
            { value: 12, label: 'December' },
            { value: 11, label: 'November' },
            { value: 10, label: 'October' },
            { value: 9, label: 'September' },
            { value: 8, label: 'August' },
            { value: 7, label: 'July' },
            { value: 6, label: 'June' },
            { value: 5, label: 'May' },
            { value: 4, label: 'April' },
            { value: 3, label: 'March' },
            { value: 2, label: 'February' },
            { value: 1, label: 'January' }
        ];
    };

    // Status options for filtering
    const getStatusOptions = () => {
        return [
            { value: 'present', label: 'Present' },
            { value: 'late', label: 'Late' },
            { value: 'absent', label: 'Absent' }
        ];
    };

    const fetchPendingRequests = useCallback(async () => {
        try {
            const res = await getPendingOvertimeRequests();
            setOvertimeRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch pending requests:", err);
            toast.error("Failed to fetch pending requests.");
        }
    }, []);

    const fetchData = useCallback(async (page = 1, currentFilters = filters) => {
        try {
            const params = { page };

            // Only include non-empty filters in the request
            if (currentFilters.user) params.user = currentFilters.user;
            if (currentFilters.date) params.date = currentFilters.date;
            if (currentFilters.month) params.month = currentFilters.month;
            if (currentFilters.year) params.year = currentFilters.year;
            if (currentFilters.status) params.status = currentFilters.status;

            const [attRes] = await Promise.all([
                getAllAttendance(params),
            ]);
            setAttendance({ results: attRes.data.results, count: attRes.data.count });
        } catch {
            setError('Failed to fetch data.');
            toast.error('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchPendingRequests();
        fetchData(currentPage);
    }, [fetchData, currentPage, fetchPendingRequests]);

    const handleFilterChange = (e) => {
        setSearchInput(e.target.value);
    };

    const handleDateChange = (e) => {
        setFilters({ ...filters, date: e.target.value });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        const newFilters = { ...filters, user: searchInput };
        setFilters(newFilters);
        setCurrentPage(1);
        fetchData(1, newFilters);
    };

    const handleResetFilters = () => {
        const resetFilters = {
            user: '',
            date: new Date().toISOString().split('T')[0],
            month: '',
            year: '',
            status: ''
        };
        setFilters(resetFilters);
        setSearchInput('');
        setCurrentPage(1);
        fetchData(1, resetFilters);
    };

    const handleApprove = (request) => {
        setSelectedRequest(request);
        setShowApproveModal(true);
    };

    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRequest) return;
        try {
            const response = await approveOvertimeRequest(selectedRequest.id, { hr_comment: hrComment });

            // Update pending requests immediately - remove the approved request
            setOvertimeRequests(prev => prev.filter(req => req.id !== selectedRequest.id));

            // Update recent requests immediately - add the approved request to recent
            if (recentRequestsRef.current) {
                recentRequestsRef.current.addNewRecentRequest({
                    ...response.data,
                    status: 'approved'
                });
            }

            // Update attendance records to show the approved overtime
            setAttendance(prev => ({
                ...prev,
                results: prev.results.map(record =>
                    record.id === response.data.attendance_record ?
                        { ...record, overtime_approved: true, overtime_hours: response.data.final_overtime_hours || record.overtime_hours } :
                        record
                )
            }));

            toast.success('Overtime approved!');
            setShowApproveModal(false);
            setHrComment('');
            setSelectedRequest(null);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Approval failed.');
        }
    };

    const handleReject = (request) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRequest) return;
        try {
            const response = await rejectOvertimeRequest(selectedRequest.id, { hr_comment: hrComment });

            // Update pending requests immediately - remove the rejected request
            setOvertimeRequests(prev => prev.filter(req => req.id !== selectedRequest.id));

            // Update recent requests immediately - add the rejected request to recent
            if (recentRequestsRef.current) {
                recentRequestsRef.current.addNewRecentRequest({
                    ...response.data,
                    status: 'rejected'
                });
            }

            // Update attendance records to show the rejected overtime (remove overtime hours)
            setAttendance(prev => ({
                ...prev,
                results: prev.results.map(record =>
                    record.id === response.data.attendance_record ?
                        { ...record, overtime_approved: false, overtime_hours: 0 } :
                        record
                )
            }));

            toast.success('Overtime rejected.');
            setShowRejectModal(false);
            setHrComment('');
            setSelectedRequest(null);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Rejection failed.');
        }
    };

    const handleRevert = (revertedRequest) => {
        // Add the reverted request back to pending requests immediately
        setOvertimeRequests(prev => [...prev, revertedRequest]);
    }

    const handleConvertToLeave = (record) => {
        if (record.status !== 'absent') {
            toast.error('Only absent days can be converted to casual leave.');
            return;
        }
        setSelectedAttendance(record);
        setShowConvertModal(true);
    };

    const handleConvertSubmit = async () => {
        if (!selectedAttendance) return;

        try {
            await convertAttendanceToLeave(selectedAttendance.id);
            toast.success('Attendance record converted to casual leave successfully.');
            setShowConvertModal(false);
            setSelectedAttendance(null);
            fetchData(currentPage, filters); // Refresh data
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to convert attendance record.');
        }
    };

    const renderStatus = (record) => {
        const variants = {
            present: 'success',
            late: 'warning',
            absent: 'danger',
        };

        // Check if this is a converted attendance record (present status but no check-in/out times)
        const isConverted = record.status === 'present' && !record.check_in_time && !record.check_out_time;

        if (isConverted) {
            return (
                <span className="d-flex align-items-center">
                    <span className={`badge bg-${variants[record.status]} me-1`}>present</span>
                    <FaExchangeAlt className="text-info" title="Converted from absent to casual leave" size="12" />
                </span>
            );
        }

        return <span className={`badge bg-${variants[record.status]}`}>{record.status}</span>;
    };

    const totalPages = Math.ceil(attendance.count / 8);

    if (loading && !attendance.results.length) return <AdminAttendanceFallback />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Row>
                <Col xl={7}>
                    <Card className="attendance-card shadow-sm">
                        <Card.Header className="bg-light"><h5 className="mb-0">Pending Overtime Requests</h5></Card.Header>
                        <Card.Body>
                            <div style={{ maxHeight: '300px', minHeight: '200px', overflowY: 'auto' }}>
                                <Table responsive striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Date</th>
                                            <th>Requested (hrs)</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading && overtimeRequests.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center"><Spinner size="sm" /></td></tr>
                                        ) : overtimeRequests.length > 0 ? overtimeRequests.map(req => (
                                            <tr key={req.id}>
                                                <td>{req.user}</td>
                                                <td>{req.date}</td>
                                                <td>{req.requested_hours}</td>
                                                <td>
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => handleApprove(req)}
                                                        disabled={selectedRequest?.id === req.id}
                                                    >
                                                        {selectedRequest?.id === req.id ? <Spinner size="sm" animation="border" /> : '✅ Approve'}
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="ms-2"
                                                        onClick={() => handleReject(req)}
                                                        disabled={selectedRequest?.id === req.id}
                                                    >
                                                        {selectedRequest?.id === req.id ? <Spinner size="sm" animation="border" /> : '❌ Reject'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        )) : <tr><td colSpan="4" className="text-center">No pending requests.</td></tr>}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={5}>
                    <RecentOvertimeRequests ref={recentRequestsRef} onRevert={handleRevert} />
                </Col>
            </Row>


            <Card className="attendance-card shadow-sm mt-4">
                <Card.Header className="bg-light">
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h5 className="mb-0">All Attendance Records</h5>
                            <small className="text-muted">
                                {attendance.count} total records
                                {(filters.month || filters.year || filters.status) && (
                                    <span>
                                        {' • Filtered by '}
                                        {filters.month && getMonthOptions().find(m => m.value == filters.month)?.label}
                                        {filters.month && filters.year && ' '}
                                        {filters.year}
                                        {filters.status && `, Status: ${filters.status}`}
                                    </span>
                                )}
                            </small>
                        </Col>
                    </Row>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleFilterSubmit} className="mb-3">
                        <Row className="g-2 mb-2">
                            <Col md={3}>
                                <Form.Control
                                    type="text"
                                    name="user"
                                    value={searchInput}
                                    onChange={handleFilterChange}
                                    placeholder="Filter by Employee ID or Email"
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Control
                                    type="date"
                                    name="date"
                                    value={filters.date}
                                    onChange={handleDateChange}
                                />
                            </Col>
                            <Col md={3}>
                                <Dropdown onSelect={(year) => setFilters({ ...filters, year })} className="w-100">
                                    <Dropdown.Toggle
                                        variant="outline-primary"
                                        id="dropdown-year"
                                        className="w-100"
                                    >
                                        {filters.year ? `Year: ${filters.year}` : "Year"}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="w-100">
                                        <Dropdown.Item eventKey="">All</Dropdown.Item>
                                        {getYearOptions().map(year => (
                                            <Dropdown.Item key={year} eventKey={year}>
                                                {year}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Col>
                            <Col md={3}>
                                <Dropdown onSelect={(month) => setFilters({ ...filters, month })} className="w-100">
                                    <Dropdown.Toggle
                                        variant="outline-primary"
                                        id="dropdown-month"
                                        className="w-100"
                                    >
                                        {filters.month
                                            ? `Month: ${getMonthOptions().find(m => m.value == filters.month)?.label}`
                                            : "Month"}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="w-100">
                                        <Dropdown.Item eventKey="">All</Dropdown.Item>
                                        {getMonthOptions().map(month => (
                                            <Dropdown.Item key={month.value} eventKey={month.value}>
                                                {month.label}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Col>
                        </Row>
                        <Row className="g-2">
                            <Col md={3}>
                                <Dropdown onSelect={(status) => setFilters({ ...filters, status })} className="w-100">
                                    <Dropdown.Toggle
                                        variant="outline-primary"
                                        id="dropdown-status"
                                        className="w-100"
                                    >
                                        {filters.status ? `Status: ${filters.status}` : "Status"}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="w-100">
                                        <Dropdown.Item eventKey="">All</Dropdown.Item>
                                        {getStatusOptions().map(status => (
                                            <Dropdown.Item key={status.value} eventKey={status.value}>
                                                {status.label}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Col>
                            <Col md={9} className="d-flex">
                                <Button type="submit" className="me-2">Apply Filters</Button>
                                <Button variant="secondary" onClick={handleResetFilters}>Reset All</Button>
                            </Col>
                        </Row>
                    </Form>
                    <div style={{ maxHeight: '500px', minHeight: '200px', overflowY: 'auto' }}>
                        <Table responsive striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Date</th>
                                    <th>Check-In (HH:MM)</th>
                                    <th>Check-Out (HH:MM)</th>
                                    <th>Status</th>
                                    <th>Attendance Type</th>
                                    <th>Lateness (HH:MM)</th>
                                    <th>Overtime Hours (HH:MM)</th>
                                    <th>Overtime Approved</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && attendance.results.length === 0 ? (
                                    <tr><td colSpan="10" className="text-center"><Spinner /></td></tr>
                                ) : attendance.results.map(rec => (
                                    <tr key={rec.id}>
                                        <td>{rec.user_email}</td>
                                        <td width={"15%"}>{rec.date}</td>
                                        <td>{formatTime(rec.check_in_time)}</td>
                                        <td>{formatTime(rec.check_out_time)}</td>
                                        <td>{renderStatus(rec)}</td>
                                        <td>{rec.attendance_type}</td>
                                        <td>{rec.lateness_hours > 0 ? formatHoursToTime(rec.lateness_hours) : '--'}</td>
                                        <td>{rec.overtime_hours > 0 ? formatHoursToTime(rec.overtime_hours) : '--'}</td>
                                        <td className="text-center">
                                            {rec.overtime_hours > 0 ? (
                                                rec.overtime_approved ?
                                                    <FaCheck className="text-success" title="Approved" size="16" /> :
                                                    <FaTimes className="text-danger" title="Not Approved" size="16" />
                                            ) : '--'}
                                        </td>
                                        <td className="text-center">
                                            {rec.status === 'absent' && (
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    onClick={() => handleConvertToLeave(rec)}
                                                    title="Convert to Casual Leave"
                                                >
                                                    <FaExchangeAlt />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                    <div className="d-flex justify-content-center mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Approve Overtime Request</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleApproveSubmit}>
                    <Modal.Body>
                        <p>Approving request for <strong>{selectedRequest?.user}</strong> on {selectedRequest?.date}.</p>
                        <Form.Group>
                            <Form.Label>Comment (optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={hrComment}
                                onChange={(e) => setHrComment(e.target.value)}
                                placeholder="Enter comment"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowApproveModal(false)}>Cancel</Button>
                        <Button variant="success" type="submit">Confirm Approve</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Reject Overtime Request</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleRejectSubmit}>
                    <Modal.Body>
                        <p>Rejecting request for <strong>{selectedRequest?.user}</strong> on {selectedRequest?.date}.</p>
                        <Form.Group>
                            <Form.Label>Reason (optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={hrComment}
                                onChange={(e) => setHrComment(e.target.value)}
                                placeholder="Enter rejection reason"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                        <Button variant="danger" type="submit">Confirm Reject</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Convert to Leave Modal */}
            <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Convert to Casual Leave</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Convert the absent day on <strong>{selectedAttendance?.date}</strong> for{' '}
                        <strong>{selectedAttendance?.user_email}</strong> to casual leave?
                    </p>
                    <Alert variant="info">
                        This will:
                        <ul className="mb-0 mt-2">
                            <li>Create an approved casual leave record</li>
                            <li>Reduce the employee's remaining leave days</li>
                            <li>Update their salary calculation for this month</li>
                        </ul>
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConvertModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="warning" onClick={handleConvertSubmit}>
                        Convert to Leave
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default AdminAttendanceView; 