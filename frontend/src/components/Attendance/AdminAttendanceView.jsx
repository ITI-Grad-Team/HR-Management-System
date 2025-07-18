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

const AdminAttendanceView = () => {
    const [attendance, setAttendance] = useState({ results: [], count: 0 });
    const [overtimeRequests, setOvertimeRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ user: '', date: new Date().toISOString().split('T')[0] });
    const [currentPage, setCurrentPage] = useState(1);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [hrComment, setHrComment] = useState('');
    const recentRequestsRef = useRef();

    const fetchData = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = { ...filters, page };
            const [attRes, otRes] = await Promise.all([
                getAllAttendance(params),
                getPendingOvertimeRequests(),
            ]);
            setAttendance({ results: attRes.data.results, count: attRes.data.count });
            setOvertimeRequests(otRes.data);
            if (recentRequestsRef.current) {
                recentRequestsRef.current.fetchRecentRequests();
            }
        } catch (err) {
            setError('Failed to fetch data.');
            toast.error('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData(currentPage);
    }, [fetchData, currentPage]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchData(1);
    };

    const handleResetFilters = () => {
        const resetFilters = { user: '', date: new Date().toISOString().split('T')[0] };
        setFilters(resetFilters);
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
            fetchData(currentPage);
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
            fetchData(currentPage);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Rejection failed.');
        }
    };

    const renderStatus = (status) => {
        const variants = {
            present: 'success',
            late: 'warning',
            absent: 'danger',
        };
        return <span className={`badge bg-${variants[status]}`}>{status}</span>;
    };

    const totalPages = Math.ceil(attendance.count / 8); 

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Row>
                <Col lg={8}>
                    <Card className="mb-4 attendance-card">
                        <Card.Header><h5 className="mb-0">Pending Overtime Requests</h5></Card.Header>
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
                                    {overtimeRequests.length > 0 ? overtimeRequests.map(req => (
                                        <tr key={req.id}>
                                            <td>{req.user}</td>
                                            <td>{req.date}</td>
                                            <td>{req.requested_hours}</td>
                                            <td>
                                                <Button variant="success" size="sm" onClick={() => handleApprove(req)}>Approve</Button>
                                                <Button variant="danger" size="sm" className="ms-2" onClick={() => handleReject(req)}>Reject</Button>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan="4" className="text-center">No pending requests.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <RecentOvertimeRequests ref={recentRequestsRef} />
                </Col>
            </Row>


            <Card className="attendance-card">
                <Card.Header><h5 className="mb-0">All Attendance Records</h5></Card.Header>
                <Card.Body>
                    <Form onSubmit={handleFilterSubmit} className="mb-3">
                        <Row>
                            <Col md={4}>
                                <Form.Control type="text" name="user" value={filters.user} onChange={handleFilterChange} placeholder="Employee ID or Email" />
                            </Col>
                            <Col md={4}>
                                <Form.Control type="date" name="date" value={filters.date} onChange={handleFilterChange} />
                            </Col>
                            <Col md={4}>
                                <Button type="submit">Filter</Button>
                                <Button variant="secondary" className="ms-2" onClick={handleResetFilters}>Reset</Button>
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
                            {attendance.results.map(rec => (
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
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
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