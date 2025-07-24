import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Col, Row, Spinner, Alert, Table, Modal, Form, OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap';
import {
    getMyAttendance,
    checkIn,
    checkOut,
    getCheckInStatus,
    createOvertimeRequest,
    getJoinDate,
} from '../../api/attendanceApi';
import { getCurrentLocation } from '../../utils/geolocation';
import { formatTime, formatHoursToTime } from '../../utils/formatters';
import { toast } from 'react-toastify';
import DailyOvertimeStatus from './DailyOvertimeStatus';
import EmployeeAttendanceFallback from '../DashboardFallBack/EmployeeAttendanceFallback';
import Pagination from '../Pagination/Pagination';

const EmployeeAttendanceView = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [todayRecord, setTodayRecord] = useState(null);
    const [checkInStatus, setCheckInStatus] = useState({ can_check_in: false, reason: '' });
    const [showOvertimeModal, setShowOvertimeModal] = useState(false);
    const [overtimeDetails, setOvertimeDetails] = useState({ attendance_record_id: null, requested_hours: '' });
    const [locationLoading, setLocationLoading] = useState(false);

    // Pagination and filtering state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [joinDate, setJoinDate] = useState(null);
    const [loadingFilters, setLoadingFilters] = useState(false);

    // Get current date for default filters
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Generate year options (from join year to current year + 1)
    const getYearOptions = () => {
        const years = [];
        const startYear = joinDate ? new Date(joinDate).getFullYear() : currentYear - 5;
        const endYear = currentYear + 1;

        for (let year = endYear; year >= startYear; year--) {
            years.push(year);
        }
        return years;
    };

    // Generate month options based on selected year and join date
    const getMonthOptions = () => {
        const months = [
            { value: 1, label: 'January' },
            { value: 2, label: 'February' },
            { value: 3, label: 'March' },
            { value: 4, label: 'April' },
            { value: 5, label: 'May' },
            { value: 6, label: 'June' },
            { value: 7, label: 'July' },
            { value: 8, label: 'August' },
            { value: 9, label: 'September' },
            { value: 10, label: 'October' },
            { value: 11, label: 'November' },
            { value: 12, label: 'December' }
        ];

        if (!joinDate || !selectedYear) return months;

        const joinDateObj = new Date(joinDate);
        const joinYear = joinDateObj.getFullYear();
        const joinMonth = joinDateObj.getMonth() + 1;

        // If selected year is the join year, filter out months before join month
        if (parseInt(selectedYear) === joinYear) {
            return months.filter(month => month.value >= joinMonth);
        }

        // If selected year is before join year, return empty (shouldn't happen due to year filtering)
        if (parseInt(selectedYear) < joinYear) {
            return [];
        }

        return months;
    };

    const fetchJoinDate = useCallback(async () => {
        try {
            const response = await getJoinDate();
            setJoinDate(response.data.join_date);
        } catch (error) {
            console.error('Failed to fetch join date:', error);
        }
    }, []);

    const fetchAttendanceData = useCallback(async (page = 1, month = '', year = '') => {
        try {
            setLoadingFilters(true);
            const params = { page };

            if (month) params.month = month;
            if (year) params.year = year;

            const [attRes, statusRes] = await Promise.all([
                getMyAttendance(params),
                getCheckInStatus(),
            ]);

            const today = new Date().toISOString().split('T')[0];
            const todayRec = attRes.data.results.find(rec => rec.date === today);

            setAttendance(attRes.data.results);
            setTodayRecord(todayRec);
            setCheckInStatus(statusRes.data);
            setCurrentPage(page);
            setTotalCount(attRes.data.count);
            setTotalPages(Math.ceil(attRes.data.count / 8)); // 8 items per page based on backend
        } catch {
            setError('Failed to fetch attendance data.');
            toast.error('Failed to fetch attendance data.');
        } finally {
            setLoadingFilters(false);
        }
    }, []);

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            await fetchAttendanceData(currentPage, selectedMonth, selectedYear);
        } catch {
            setError('Failed to fetch attendance data.');
            toast.error('Failed to fetch attendance data.');
        } finally {
            setLoading(false);
        }
    }, [fetchAttendanceData, currentPage, selectedMonth, selectedYear]);

    useEffect(() => {
        fetchJoinDate();
    }, [fetchJoinDate]);

    useEffect(() => {
        if (joinDate !== null) {
            fetchAllData();
        }
    }, [fetchAllData, joinDate]);

    const handleFilterChange = (month = selectedMonth, year = selectedYear) => {
        setSelectedMonth(month);
        setSelectedYear(year);
        setCurrentPage(1); // Reset to first page when filters change
        fetchAttendanceData(1, month, year);
    };

    const handlePageChange = (page) => {
        fetchAttendanceData(page, selectedMonth, selectedYear);
    };

    const handleClearFilters = () => {
        setSelectedMonth('');
        setSelectedYear('');
        setCurrentPage(1);
        fetchAttendanceData(1, '', '');
    };

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
                            <OverlayTrigger
                                overlay={<Tooltip>{!todayRecord ? 'You need to check in first' : 'Check out for today'}</Tooltip>}
                            >
                                <span>
                                    <Button
                                        variant="danger"
                                        onClick={handleCheckOut}
                                        disabled={!todayRecord || todayRecord.check_out_time || locationLoading}
                                        style={{ pointerEvents: !todayRecord || todayRecord.check_out_time ? 'none' : 'auto' }}
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
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h5 className="mb-0">My Attendance History</h5>
                            <small className="text-muted">
                                {totalCount} total records
                                {(selectedMonth || selectedYear) && (
                                    <span> • Filtered by {selectedMonth && getMonthOptions().find(m => m.value == selectedMonth)?.label} {selectedYear}</span>
                                )}
                            </small>
                        </Col>
                        <Col md={6}>
                            <Row className="g-2">
                                <Col md={4}>
                                    <Form.Select
                                        size="sm"
                                        value={selectedYear}
                                        onChange={(e) => handleFilterChange(selectedMonth, e.target.value)}
                                        disabled={loadingFilters}
                                    >
                                        <option value="">All Years</option>
                                        {getYearOptions().map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={4}>
                                    <Form.Select
                                        size="sm"
                                        value={selectedMonth}
                                        onChange={(e) => handleFilterChange(e.target.value, selectedYear)}
                                        disabled={loadingFilters}
                                    >
                                        <option value="">All Months</option>
                                        {getMonthOptions().map(month => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={4}>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        disabled={loadingFilters || (!selectedMonth && !selectedYear)}
                                        className="w-100"
                                    >
                                        Clear
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Card.Header>
                <Card.Body>
                    {loadingFilters ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                            <div className="mt-2">Loading attendance records...</div>
                        </div>
                    ) : (
                        <>
                            <Table responsive striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Check-In (HH:MM)</th>
                                        <th>Check-Out (HH:MM)</th>
                                        <th>Status</th>
                                        <th>Attendance Type</th>
                                        <th>Lateness (HH:MM)</th>
                                        <th>Overtime Approved (HH:MM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.length > 0 ? (
                                        attendance.map(rec => (
                                            <tr key={rec.id}>
                                                <td>{rec.date}</td>
                                                <td>{formatTime(rec.check_in_time)}</td>
                                                <td>{formatTime(rec.check_out_time)}</td>
                                                <td>{renderStatus(rec.status)}</td>
                                                <td>{rec.attendance_type}</td>
                                                <td>{formatHoursToTime(rec.lateness_hours)}</td>
                                                <td>{rec.overtime_approved ? formatHoursToTime(rec.overtime_hours || 0) : '--'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                {(selectedMonth || selectedYear) ?
                                                    'No attendance records found for the selected period.' :
                                                    'No attendance history found.'
                                                }
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>

                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-3">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </>
                    )}
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
