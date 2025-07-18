import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getRecentOvertimeRequests, revertOvertimeRequest } from '../../api/attendanceApi';
import { toast } from 'react-toastify';
import { FaUndo } from 'react-icons/fa';

const RecentOvertimeRequests = () => {
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

    useEffect(() => {
        fetchRecentRequests();
    }, [fetchRecentRequests]);

    const handleRevert = async (id) => {
        try {
            await revertOvertimeRequest(id);
            toast.success('Request reverted to pending.');
            fetchRecentRequests();
            // Note: We might need a way to trigger a refresh in the parent AdminAttendanceView
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
        <Card className="attendance-card h-100">
            <Card.Header>
                <h5 className="mb-0">Recent Overtime Decisions (24h)</h5>
            </Card.Header>
            <Card.Body>
                <Table responsive hover>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Status</th>
                            <th>Reviewed</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length > 0 ? requests.map(req => (
                            <tr key={req.id}>
                                <td>{req.user}</td>
                                <td>{renderStatusBadge(req.status)}</td>
                                <OverlayTrigger overlay={<Tooltip>By: {req.reviewed_by_username}<br/>At: {formatDateTime(req.reviewed_at)}<br/>Comment: {req.hr_comment || 'None'}</Tooltip>}>
                                    <td>{formatDateTime(req.reviewed_at)}</td>
                                </OverlayTrigger>
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
};

export default RecentOvertimeRequests; 