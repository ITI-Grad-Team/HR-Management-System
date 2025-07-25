import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Spinner, Alert, Table, Button, Form, Row, Col, Modal } from 'react-bootstrap';
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
    const [filters, setFilters] = useState({ user: '', date: new Date().toISOString().split('T')[0] });
    const [searchInput, setSearchInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [hrComment, setHrComment] = useState('');
    const recentRequestsRef = useRef();

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
            const params = { ...currentFilters, page };
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
        setFilters({ ...filters, user: searchInput });
        setCurrentPage(1);
        fetchData(1, { ...filters, user: searchInput });
    };

    const handleResetFilters = () => {
        const resetFilters = { user: '', date: new Date().toISOString().split('T')[0] };
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
                <Card.Header className="bg-light"><h5 className="mb-0">All Attendance Records</h5></Card.Header>
                <Card.Body>
                    <Form onSubmit={handleFilterSubmit} className="mb-3">
                        <Row className="g-2">
                            <Col md={5}>
                                <Form.Control type="text" name="user" value={searchInput} onChange={handleFilterChange} placeholder="Filter by Employee ID or Email" />
                            </Col>
                            <Col md={5}>
                                <Form.Control type="date" name="date" value={filters.date} onChange={handleDateChange} />
                            </Col>
                            <Col md={2} className="d-flex">
                                <Button type="submit" className="flex-grow-1">Filter</Button>
                                <Button variant="secondary" className="ms-2 flex-grow-1" onClick={handleResetFilters}>Reset</Button>
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