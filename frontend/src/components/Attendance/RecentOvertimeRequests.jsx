import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getRecentOvertimeRequests, revertOvertimeRequest } from '../../api/attendanceApi';
import { toast } from 'react-toastify';
import { FaUndo, FaInfoCircle } from 'react-icons/fa';

const RecentOvertimeRequests = forwardRef((props, ref) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRecentRequests = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getRecentOvertimeRequests();
            setRequests(res.data);
        } catch {
            setError('Failed to fetch recent requests.');
            toast.error('Failed to fetch recent requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    useImperativeHandle(ref, () => ({
        fetchRecentRequests,
    }));

    useEffect(() => {
        fetchRecentRequests();
    }, [fetchRecentRequests]);

    const handleRevert = async (id) => {
        try {
            await revertOvertimeRequest(id);
            toast.success('Request reverted to pending.');
            fetchRecentRequests();
            props.onRevert(); // Notify parent to refresh pending list
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to revert request.');
        }
    };

    const renderStatusBadge = (status) => {
        const variant = status === 'approved' ? 'success' : 'danger';
        return <Badge bg={variant}>{status}</Badge>;
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        return new Date(dateTime).toLocaleString();
    };
    
    if (loading) return <Spinner animation="border" size="sm" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <Card className="attendance-card h-100 shadow-sm">
            <Card.Header className="bg-light">
                <h5 className="mb-0">Recent Overtime Decisions (24h)</h5>
            </Card.Header>
            <Card.Body>
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
                                                Requested: {req.requested_hours} hrs on {formatDateTime(req.requested_at)}<br/>
                                                Reviewed by: {req.reviewed_by_username || 'N/A'}<br/>
                                                Reviewed at: {formatDateTime(req.reviewed_at)}<br/>
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
            </Card.Body>
        </Card>
    );
});

export default RecentOvertimeRequests; 