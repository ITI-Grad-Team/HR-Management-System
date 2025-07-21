import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Col, Row, Spinner, Alert, Table, Modal, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
    getMyAttendance,
    checkIn,
    checkOut,
    getCheckInStatus,
    createOvertimeRequest,
} from '../../api/attendanceApi';
import { getCurrentLocation } from '../../utils/geolocation';
import { toast } from 'react-toastify';
import DailyOvertimeStatus from './DailyOvertimeStatus';
import EmployeeAttendanceFallback from '../DashboardFallBack/EmployeeAttendanceFallback';

const EmployeeAttendanceView = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [todayRecord, setTodayRecord] = useState(null);
    const [checkInStatus, setCheckInStatus] = useState({ can_check_in: false, reason: '' });
    const [showOvertimeModal, setShowOvertimeModal] = useState(false);
    const [overtimeDetails, setOvertimeDetails] = useState({ attendance_record_id: null, requested_hours: '' });
    const [locationLoading, setLocationLoading] = useState(false);

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            const [attRes, statusRes] = await Promise.all([
                getMyAttendance(),
                getCheckInStatus(),
            ]);

            const today = new Date().toISOString().split('T')[0];
            const todayRec = attRes.data.results.find(rec => rec.date === today);

            setAttendance(attRes.data.results);
            setTodayRecord(todayRec);
            setCheckInStatus(statusRes.data);
        } catch {
            setError('Failed to fetch attendance data.');
            toast.error('Failed to fetch attendance data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleCheckIn = async () => {
        setLocationLoading(true);
        try {
            let latitude = null;
            let longitude = null;

            try {
                const location = await getCurrentLocation();
                latitude = location.latitude;
                longitude = location.longitude;
                toast.info(`Location acquired: ${location.accuracy}m accuracy`);
            } catch (locationError) {
                toast.warning(locationError.message);
                // Continue without location - backend will handle validation
            }

            const res = await checkIn(null, latitude, longitude);
            toast.success('Checked in successfully!');
            if (res.data.status === 'late') {
                toast.warning("You are marked as late.");
            }
            if (res.data.location_message) {
                toast.info(res.data.location_message);
            }
            fetchAllData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Check-in failed.');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLocationLoading(true);
        try {
            let latitude = null;
            let longitude = null;

            try {
                const location = await getCurrentLocation();
                latitude = location.latitude;
                longitude = location.longitude;
            } catch (locationError) {
                toast.warning(locationError.message);
                // Continue without location - backend will handle validation
            }

            const res = await checkOut(latitude, longitude);
            if (res.status === 202) { // Overtime eligible
                setOvertimeDetails({ ...overtimeDetails, attendance_record_id: res.data.attendance_record_id });
                setShowOvertimeModal(true);
            } else {
                toast.success('Checked out successfully!');
                if (res.data.location_message) {
                    toast.info(res.data.location_message);
                }
                fetchAllData();
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Check-out failed.');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleOvertimeRequest = async (e) => {
        e.preventDefault();
        try {
            await createOvertimeRequest({
                attendance_record: overtimeDetails.attendance_record_id,
                requested_hours: overtimeDetails.requested_hours
            });
            toast.success('Overtime request submitted successfully.');
            setShowOvertimeModal(false);
            fetchAllData();
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

    if (loading) return <EmployeeAttendanceFallback />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    const dailyOvertimeRequest = todayRecord?.overtime_request;

    return (
        <>
            <Row className="mb-4 align-items-center">
                <Col md={6}>
                    <Card className="attendance-card shadow-sm">
                        <Card.Body className="d-flex justify-content-around p-4">
                            <OverlayTrigger overlay={<Tooltip>{checkInStatus.reason}</Tooltip>}>
                                <span>
                                    <Button
                                        variant="success"
                                        onClick={handleCheckIn}
                                        disabled={!checkInStatus.can_check_in || !!todayRecord || locationLoading}
                                        style={{ pointerEvents: !checkInStatus.can_check_in || !!todayRecord ? 'none' : 'auto' }}
                                    >
                                        {locationLoading ? <Spinner animation="border" size="sm" /> : 'Check-In'}
                                    </Button>
                                </span>
                            </OverlayTrigger>
                            <OverlayTrigger overlay={<Tooltip>
                                {!todayRecord ? "You must check in first." : (todayRecord.check_out_time ? "You have already checked out." : "Click to check out.")}
                            </Tooltip>}>
                                <span>
                                    <Button
                                        variant="danger"
                                        onClick={handleCheckOut}
                                        disabled={!todayRecord || !todayRecord.check_in_time || !!todayRecord.check_out_time || locationLoading}
                                        style={{ pointerEvents: !todayRecord || !todayRecord.check_in_time || !!todayRecord.check_out_time ? 'none' : 'auto' }}
                                    >
                                        {locationLoading ? <Spinner animation="border" size="sm" /> : 'Check-Out'}
                                    </Button>
                                </span>
                            </OverlayTrigger>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    {dailyOvertimeRequest && <DailyOvertimeStatus overtimeRequest={dailyOvertimeRequest} />}
                </Col>
            </Row>

            <Card className="attendance-card shadow-sm">
                <Card.Header className="bg-light">
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
                                <th>Attendance Type</th>
                                <th>Lateness (hrs)</th>
                                <th>Overtime (hrs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.length > 0 ? (
                                attendance.map(rec => (
                                    <tr key={rec.id}>
                                        <td>{rec.date}</td>
                                        <td>{rec.check_in_time || 'N/A'}</td>
                                        <td>{rec.check_out_time || 'N/A'}</td>
                                        <td>{renderStatus(rec.status)}</td>
                                        <td>{rec.attendance_type}</td>
                                        <td>{rec.lateness_hours > 0 ? rec.lateness_hours.toFixed(2) : 'N/A'}</td>
                                        <td>{rec.overtime_approved ? rec.overtime_hours.toFixed(2) : 'N/A'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">No attendance history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showOvertimeModal} onHide={() => setShowOvertimeModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Request Overtime</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleOvertimeRequest}>
                    <Modal.Body>
                        <p>You are eligible to request overtime for today.</p>
                        <Form.Group>
                            <Form.Label>Hours to Request:</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.1"
                                value={overtimeDetails.requested_hours}
                                onChange={(e) => setOvertimeDetails({ ...overtimeDetails, requested_hours: e.target.value })}
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