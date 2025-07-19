import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Modal, Form, Table, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { getMyLeaveRequests, getMyLeaveBalance, createLeaveRequest } from '../../api/leaveApi';
import { toast } from 'react-toastify';

const EmployeeLeaveView = () => {
    const [requests, setRequests] = useState([]);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ start_date: '', end_date: '', reason: '' });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [reqRes, balRes] = await Promise.all([
                getMyLeaveRequests(),
                getMyLeaveBalance(),
            ]);
            setRequests(reqRes.data);
            setBalance(balRes.data);
        } catch {
            setError('Failed to fetch leave data.');
            toast.error('Failed to fetch leave data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleShow = () => setShowModal(true);
    const handleClose = () => setShowModal(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createLeaveRequest(formData);
            toast.success('Leave request submitted successfully!');
            setShowModal(false);
            setFormData({ start_date: '', end_date: '', reason: '' });
            fetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to submit request.';
            toast.error(errorMsg);
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

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Row className="mb-4">
                <Col md={8}>
                    <Button variant="primary" onClick={handleShow} className="shadow-sm">
                        Request New Leave
                    </Button>
                </Col>
                <Col md={4}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <h5 className="card-title">Leave Balance</h5>
                            {balance && (
                                <p className="card-text fs-4 fw-bold">
                                    {balance.remaining_days} / {balance.yearly_quota}
                                    <span className="d-block fs-6 fw-normal text-muted">Remaining Days</span>
                                </p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-sm">
                <Card.Header className="bg-light">
                    <h5 className="mb-0">My Leave History</h5>
                </Card.Header>
                <Card.Body>
                    <Table responsive striped bordered hover>
                        <thead>
                            <tr>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Duration</th>
                                <th>Reason</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.start_date}</td>
                                    <td>{req.end_date}</td>
                                    <td>{req.duration} days</td>
                                    <td>{req.reason || 'N/A'}</td>
                                    <td><Badge bg={getStatusVariant(req.status)}>{req.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>New Leave Request</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control type="date" name="start_date" onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control type="date" name="end_date" onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Reason (optional)</Form.Label>
                            <Form.Control as="textarea" rows={3} name="reason" onChange={handleChange} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                        <Button variant="primary" type="submit">Submit Request</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default EmployeeLeaveView;