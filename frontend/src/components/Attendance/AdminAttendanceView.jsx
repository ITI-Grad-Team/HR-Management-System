import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Spinner, Alert, Table, Button, Form, Row, Col, Modal } from 'react-bootstrap';
import {
    getAllAttendance,
    getPendingOvertimeRequests,
    approveOvertimeRequest,
    rejectOvertimeRequest,
} from '../../api/attendanceApi';
import { toast } from 'react-toastify';
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
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [hrComment, setHrComment] = useState('');
    const recentRequestsRef = useRef();

    const fetchPendingRequests = useCallback(async () => {
        try {
            const res = await getPendingOvertimeRequests();
            setOvertimeRequests(res.data);
        } catch {
            toast.error("Failed to fetch pending requests.");
        }
    }, []);

    const fetchData = useCallback(async (page = 1, currentFilters = filters) => {
        try {
            setLoading(true);
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
            await approveOvertimeRequest(selectedRequest.id, { hr_comment: hrComment });
            toast.success('Overtime approved!');
            setShowApproveModal(false);
            setHrComment('');
            setSelectedRequest(null);
            fetchPendingRequests();
            if (recentRequestsRef.current) recentRequestsRef.current.fetchRecentRequests();
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
            await rejectOvertimeRequest(selectedRequest.id, { hr_comment: hrComment });
            toast.success('Overtime rejected.');
            setShowRejectModal(false);
            setHrComment('');
            setSelectedRequest(null);
            fetchPendingRequests();
            if (recentRequestsRef.current) recentRequestsRef.current.fetchRecentRequests();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Rejection failed.');
        }
    };

    const handleRevert = () => {
        fetchPendingRequests();
    }

    const renderStatus = (status) => {
        const variants = {
            present: 'success',
            late: 'warning',
            absent: 'danger',
        };
        return <span className={`badge bg-${variants[status]}`}>{status}</span>;
    };

    const totalPages = Math.ceil(attendance.count / 8); 

    if (loading && !attendance.results.length) return <AdminAttendanceFallback />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Row>
                <Col xl={7}>
                    <Card className="mb-4 attendance-card shadow-sm">
                        <Card.Header className="bg-light"><h5 className="mb-0">Pending Overtime Requests</h5></Card.Header>
                        <Card.Body>
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
                                                <Button variant="outline-success" size="sm" onClick={() => handleApprove(req)}>Approve</Button>
                                                <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => handleReject(req)}>Reject</Button>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan="4" className="text-center">No pending requests.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={5}>
                    <RecentOvertimeRequests ref={recentRequestsRef} onRevert={handleRevert}/>
                </Col>
            </Row>


            <Card className="attendance-card shadow-sm mt-4">
                <Card.Header  className="bg-light"><h5 className="mb-0">All Attendance Records</h5></Card.Header>
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
                    <Table responsive striped bordered hover>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Check-In</th>
                                <th>Check-Out</th>
                                <th>Status</th>
                                <th>Overtime (hrs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && attendance.results.length === 0 ? (
                                <tr><td colSpan="6" className="text-center"><Spinner /></td></tr>
                            ) : attendance.results.map(rec => (
                                <tr key={rec.id}>
                                    <td>{rec.user_email}</td>
                                    <td>{rec.date}</td>
                                    <td>{rec.check_in_time || 'N/A'}</td>
                                    <td>{rec.check_out_time || 'N/A'}</td>
                                    <td>{renderStatus(rec.status)}</td>
                                    <td>{rec.overtime_approved ? rec.overtime_hours : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <div className="d-flex justify-content-center">
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
        </>
    );
};

export default AdminAttendanceView; 