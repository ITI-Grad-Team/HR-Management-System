import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Col, Row, Spinner, Alert, Table, Modal, Form } from 'react-bootstrap';
import { getMyAttendance, checkIn, checkOut, canRequestOvertime, createOvertimeRequest } from '../../api/attendanceApi';
import { toast } from 'react-toastify';

const EmployeeAttendanceView = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [todayRecord, setTodayRecord] = useState(null);
    const [overtimeStatus, setOvertimeStatus] = useState({ can_request: false, reason: '', has_existing_request: false });
    const [showOvertimeModal, setShowOvertimeModal] = useState(false);
    const [overtimeHours, setOvertimeHours] = useState('');

    const fetchAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getMyAttendance();
            setAttendance(res.data);
            const today = new Date().toISOString().split('T')[0];
            const todayRec = res.data.find(rec => rec.date === today);
            setTodayRecord(todayRec);
        } catch (err) {
            setError('Failed to fetch attendance records.');
            toast.error('Failed to fetch attendance records.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOvertimeStatus = useCallback(async () => {
        try {
            const res = await canRequestOvertime();
            setOvertimeStatus(res.data);
        } catch (err) {
            // This can fail if there's no attendance record for today, which is fine.
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
        fetchOvertimeStatus();
    }, [fetchAttendance, fetchOvertimeStatus]);

    const handleCheckIn = async () => {
        try {
            // For simplicity, MAC address is null. In a real scenario, you might get this from the device.
            await checkIn(null);
            toast.success('Checked in successfully!');
            fetchAttendance();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Check-in failed.');
        }
    };

    const handleCheckOut = async () => {
        try {
            await checkOut();
            toast.success('Checked out successfully!');
            fetchAttendance();
            fetchOvertimeStatus(); // Re-check overtime status after checkout
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Check-out failed.');
        }
    };

    const handleOvertimeRequest = async (e) => {
        e.preventDefault();
        try {
            await createOvertimeRequest({ requested_hours: overtimeHours });
            toast.success('Overtime request submitted!');
            setShowOvertimeModal(false);
            setOvertimeHours('');
            fetchOvertimeStatus();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit overtime request.');
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

    const renderOvertimeButton = () => {
        if (overtimeStatus.has_existing_request) {
            return <Button variant="secondary" size="sm" disabled>Overtime Requested</Button>;
        }
        if (overtimeStatus.can_request) {
            return <Button variant="info" size="sm" onClick={() => setShowOvertimeModal(true)}>Request Overtime</Button>;
        }
        return <Button variant="secondary" size="sm" disabled title={overtimeStatus.reason}>Request Overtime</Button>;
    };

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Row className="mb-4">
                <Col>
                    <Card className="attendance-card">
                        <Card.Body className="d-flex justify-content-around">
                            <Button variant="success" onClick={handleCheckIn} disabled={!!todayRecord}>
                                Check-In
                            </Button>
                            <Button variant="danger" onClick={handleCheckOut} disabled={!todayRecord || !!todayRecord.check_out_time}>
                                Check-Out
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="attendance-card">
                <Card.Header>
                    <h5 className="mb-0">My Attendance History</h5>
                </Card.Header>
                <Card.Body>
                    <Table responsive striped bordered hover>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Check-In</th>
                                <th>Check-Out</th>
                                <th>Status</th>
                                <th>Overtime (hrs)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map(rec => (
                                <tr key={rec.id}>
                                    <td>{rec.date}</td>
                                    <td>{rec.check_in_time || 'N/A'}</td>
                                    <td>{rec.check_out_time || 'N/A'}</td>
                                    <td>{renderStatus(rec.status)}</td>
                                    <td>{rec.overtime_approved ? rec.overtime_hours : 'N/A'}</td>
                                    <td>
                                        {rec.date === new Date().toISOString().split('T')[0] && rec.check_out_time && renderOvertimeButton()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showOvertimeModal} onHide={() => setShowOvertimeModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Request Overtime</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleOvertimeRequest}>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Overtime Hours</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.1"
                                value={overtimeHours}
                                onChange={(e) => setOvertimeHours(e.target.value)}
                                required
                                placeholder="Enter hours"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowOvertimeModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Submit Request
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default EmployeeAttendanceView; 