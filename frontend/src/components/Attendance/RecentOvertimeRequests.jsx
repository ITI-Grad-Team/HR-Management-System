import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getRecentOvertimeRequests, revertOvertimeRequest } from '../../api/attendanceApi';
import { toast } from 'react-toastify';
import { FaUndo, FaInfoCircle } from 'react-icons/fa';
import { formatText } from '../../utils/formatters';

const RecentOvertimeRequests = forwardRef((props, ref) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRecentRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError(null); // Clear any previous errors
            const res = await getRecentOvertimeRequests();
            setRequests(res.data);
        } catch (err) {
            setError('Failed to fetch recent requests.');
            console.error('Recent requests fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useImperativeHandle(ref, () => ({
        fetchRecentRequests,
        addNewRecentRequest: (newRequest) => {
            setRequests(prev => [newRequest, ...prev]);
        }
    }));

    useEffect(() => {
        fetchRecentRequests();
    }, [fetchRecentRequests]);

    const handleRevert = async (id) => {
        try {
            await revertOvertimeRequest(id);

            // Find the reverted request in current state
            const revertedRequest = requests.find(req => req.id === id);

            // Remove from recent requests immediately
            setRequests(prev => prev.filter(req => req.id !== id));

            // Notify parent to add back to pending with updated status
            if (revertedRequest && props.onRevert) {
                props.onRevert({
                    ...revertedRequest,
                    status: 'pending',
                    reviewed_at: null,
                    reviewed_by: null,
                    hr_comment: ''
                });
            }

            toast.success('Request reverted to pending.');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to revert request.');
        }
    };

    const renderStatusBadge = (status) => {
        const variant = status === 'approved' ? 'success' : 'danger';
        return <Badge bg={variant}>{status}</Badge>;
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return formatText(null, 'Not available');
        return new Date(dateTime).toLocaleString();
    };

    if (loading && requests.length === 0) return (
        <Card className="attendance-card h-100 shadow-sm">
            <Card.Header className="bg-light">
                <h5 className="mb-0">Recent Overtime Decisions (24h)</h5>
            </Card.Header>
            <Card.Body className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner animation="border" size="sm" />
            </Card.Body>
        </Card>
    );

    if (error) return (
        <Card className="attendance-card h-100 shadow-sm">
            <Card.Header className="bg-light">
                <h5 className="mb-0">Recent Overtime Decisions (24h)</h5>
            </Card.Header>
            <Card.Body>
                <Alert variant="danger">{error}</Alert>
            </Card.Body>
        </Card>
    );

    return (
        <Card className="attendance-card h-100 shadow-sm">
            <Card.Header className="bg-light">
                <h5 className="mb-0">Recent Overtime Decisions (24h)</h5>
            </Card.Header>
            <Card.Body>
                <div style={{ maxHeight: '300px', minHeight: '200px', overflowY: 'auto' }}>
                    <Table responsive hover striped>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Status</th>
                                <th>Info</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length > 0 ? requests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.user}</td>
                                    <td>{renderStatusBadge(req.status)}</td>
                                    <td>
                                        <OverlayTrigger
                                            placement="left"
                                            overlay={
                                                <Tooltip id={`tooltip-${req.id}`}>
                                                    Requested: {req.requested_hours} hrs on {formatDateTime(req.requested_at)}<br />
                                                    Reviewed by: {formatText(req.reviewed_by_username, 'System')}<br />
                                                    Reviewed at: {formatDateTime(req.reviewed_at)}<br />
                                                    Comment: {req.hr_comment || 'None'}
                                                </Tooltip>
                                            }
                                        >
                                            <Button variant="link" className="p-0"><FaInfoCircle /></Button>
                                        </OverlayTrigger>
                                    </td>
                                    <td>
                                        <OverlayTrigger overlay={<Tooltip>Revert to Pending</Tooltip>}>
                                            <Button variant="outline-warning" size="sm" onClick={() => handleRevert(req.id)}>
                                                <FaUndo />
                                            </Button>
                                        </OverlayTrigger>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center">No recent decisions.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
});

export default RecentOvertimeRequests; 