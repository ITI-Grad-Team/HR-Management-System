import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Spinner, Alert, Button, Badge, Modal, Form } from 'react-bootstrap';
import { getAllLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from '../../api/leaveApi';
import { toast } from 'react-toastify';

const AdminLeaveView = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAllLeaveRequests();
            setRequests(res.data);
        } catch {
            setError('Failed to fetch leave requests.');
            toast.error('Failed to fetch leave requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async (id) => {
        try {
            await approveLeaveRequest(id);
            toast.success('Leave request approved.');
            fetchData();
        } catch {
            toast.error('Failed to approve request.');
        }
    };

    const handleShowRejectModal = (request) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
    };

    const handleReject = async (e) => {
        e.preventDefault();
        try {
            await rejectLeaveRequest(selectedRequest.id, { rejection_reason: rejectionReason });
            toast.success('Leave request rejected.');
            setShowRejectModal(false);
            setRejectionReason('');
            fetchData();
        } catch {
            toast.error('Failed to reject request.');
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            case 'pending': return 'warning';
            default: return 'secondary';
        }
    };
    console.log("Requests.results:", requests.results);

    const pendingRequests = requests.results?.filter(req => req.status === 'pending') || [];
    const otherRequests = requests.results?.filter(req => req.status !== 'pending') || [];
    

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light"><h5 className="mb-0">Pending Leave Requests</h5></Card.Header>
                <Card.Body>
                    <Table responsive striped bordered hover>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Dates</th>
                                <th>Duration</th>
                                <th>Reason</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingRequests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.employee.basic_info.username}</td>
                                    <td>{req.start_date} to {req.end_date}</td>
                                    <td>{req.duration} days</td>
                                    <td>{req.reason || 'N/A'}</td>
                                    <td>
                                        <Button variant="outline-success" size="sm" onClick={() => handleApprove(req.id)}>Approve</Button>
                                        <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => handleShowRejectModal(req)}>Reject</Button>
                                    </td>
                                </tr>
                            ))}
                            {pendingRequests.length === 0 && <tr><td colSpan="5" className="text-center">No pending requests.</td></tr>}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Header className="bg-light"><h5 className="mb-0">All Leave Requests</h5></Card.Header>
                <Card.Body>
                    <Table responsive striped bordered hover>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Dates</th>
                                <th>Duration</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {otherRequests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.employee.basic_info.username}</td>
                                    <td>{req.start_date} to {req.end_date}</td>
                                    <td>{req.duration} days</td>
                                    <td><Badge bg={getStatusVariant(req.status)}>{req.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Reject Leave Request</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleReject}>
                    <Modal.Body>
                        <p>You are rejecting the leave for <strong>{selectedRequest?.employee.basic_info.username}</strong>.</p>
                        <Form.Group>
                            <Form.Label>Rejection Reason</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                        <Button variant="danger" type="submit">Confirm Rejection</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default AdminLeaveView; 