import React, { useState, useEffect, useCallback } from 'react';
import { Card, Spinner, Alert, Table, Button, Form, Row, Col, Modal } from 'react-bootstrap';
import {
    getAllAttendance,
    getPendingOvertimeRequests,
    approveOvertimeRequest,
    rejectOvertimeRequest,
} from '../../api/attendanceApi';
import { toast } from 'react-toastify';

const AdminAttendanceView = () => {
    const [attendance, setAttendance] = useState([]);
    const [overtimeRequests, setOvertimeRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ user: '', date: '' });
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [hrComment, setHrComment] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [attRes, otRes] = await Promise.all([
                getAllAttendance(filters),
                getPendingOvertimeRequests(),
            ]);
            console.log('Attendance response:', attRes.data);
            setAttendance(attRes?.data?.data ?? []);

            setOvertimeRequests(otRes.data);
        } catch (err) {
            setError('Failed to fetch data.');
            toast.error('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchData();
    };

    const handleApprove = async (id) => {
        try {
            await approveOvertimeRequest(id, {});
            toast.success('Overtime approved!');
            fetchData();
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
            fetchData();
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

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
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
                                        <Button variant="success" size="sm" onClick={() => handleApprove(req.id)}>Approve</Button>
                                        <Button variant="danger" size="sm" className="ms-2" onClick={() => handleReject(req)}>Reject</Button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="4" className="text-center">No pending requests.</td></tr>}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

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
                            {attendance.map(rec => (
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
                </Card.Body>
            </Card>
            
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