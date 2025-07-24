import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Spinner, Alert, Button, Badge, Modal, Form, Row, Col, InputGroup, FormControl, Pagination } from 'react-bootstrap';
import { getAllLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from '../../api/leaveApi';
import { toast } from 'react-toastify';
import { formatText } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import AdminLeaveFallback from '../DashboardFallBack/AdminLeaveFallback';

const AdminLeaveView = () => {
    const [requests, setRequests] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        ordering: '-created_at'
    });
    const [searchInput, setSearchInput] = useState('');

    const debouncedSearch = useDebounce(searchInput, 500);
    const pageSize = 20;

    const fetchData = useCallback(async (page = 1, searchTerm = '', status = '', ordering = '-created_at') => {
        try {
            setLoading(true);

            // OPTIMIZED: Build cache key for request deduplication
            const cacheKey = `${page}-${searchTerm}-${status}-${ordering}`;

            const response = await getAllLeaveRequests(page, pageSize, {
                status,
                search: searchTerm,
                ordering
            });

            setRequests(response.data);
            setCurrentPage(page);
        } catch (err) {
            setError('Failed to fetch leave requests.');
            toast.error('Failed to fetch leave requests.');
            console.error('Error fetching leave requests:', err);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    // OPTIMIZED: Debounced search with better performance
    useEffect(() => {
        // Only trigger search if there's actual change
        if (debouncedSearch !== filters.search) {
            setFilters(prev => ({ ...prev, search: debouncedSearch }));
            fetchData(1, debouncedSearch, filters.status, filters.ordering);
        }
    }, [debouncedSearch, filters.status, filters.ordering]);

    // Initial fetch - only run once
    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id) => {
        try {
            await approveLeaveRequest(id);
            toast.success('Leave request approved.');

            // OPTIMIZED: Update state locally instead of full refetch
            setRequests(prev => ({
                ...prev,
                results: prev.results.map(req =>
                    req.id === id
                        ? { ...req, status: 'approved' }
                        : req
                )
            }));
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

            // OPTIMIZED: Update state locally instead of full refetch
            setRequests(prev => ({
                ...prev,
                results: prev.results.map(req =>
                    req.id === selectedRequest.id
                        ? { ...req, status: 'rejected', rejection_reason: rejectionReason }
                        : req
                )
            }));
        } catch {
            toast.error('Failed to reject request.');
        }
    };

    const handlePageChange = (page) => {
        fetchData(page, filters.search, filters.status, filters.ordering);
    };

    const handleStatusFilter = (status) => {
        setFilters(prev => ({ ...prev, status }));
        fetchData(1, filters.search, status, filters.ordering);
    };

    const handleSortChange = (ordering) => {
        setFilters(prev => ({ ...prev, ordering }));
        fetchData(1, filters.search, filters.status, ordering);
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            case 'pending': return 'warning';
            default: return 'secondary';
        }
    };

    const pendingRequests = requests.results?.filter(req => req.status === 'pending') || [];
    const totalPages = Math.ceil(requests.count / pageSize);

    if (loading && requests.results?.length === 0) return <AdminLeaveFallback />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            {/* Search and Filter Controls */}
            <Card className="mb-3 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <InputGroup>
                                <FormControl
                                    placeholder="Search by employee name, email, or reason..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={filters.status}
                                onChange={(e) => handleStatusFilter(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={filters.ordering}
                                onChange={(e) => handleSortChange(e.target.value)}
                            >
                                <option value="-created_at">Newest First</option>
                                <option value="created_at">Oldest First</option>
                                <option value="-start_date">Start Date (Latest)</option>
                                <option value="start_date">Start Date (Earliest)</option>
                                <option value="status">Status</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    setSearchInput('');
                                    setFilters({ status: '', search: '', ordering: '-created_at' });
                                    fetchData(1, '', '', '-created_at');
                                }}
                            >
                                Clear
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light">
                    <h5 className="mb-0">
                        Pending Leave Requests
                        {pendingRequests.length > 0 && (
                            <Badge bg="warning" className="ms-2">{pendingRequests.length}</Badge>
                        )}
                    </h5>
                </Card.Header>
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
                                    <td>
                                        <div>
                                            <strong>{req.employee_name || req.employee?.basic_info?.username}</strong>
                                            {(req.employee_position || req.employee?.position?.name) && (
                                                <small className="text-muted d-block">{req.employee_position || req.employee.position.name}</small>
                                            )}
                                        </div>
                                    </td>
                                    <td>{req.start_date} to {req.end_date}</td>
                                    <td>{req.duration} days</td>
                                    <td>{formatText(req.reason, 'No reason provided')}</td>
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
                <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">All Leave Requests</h5>
                        <small className="text-muted">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, requests.count)} of {requests.count} results
                        </small>
                    </div>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="text-center p-4">
                            <Spinner animation="border" />
                            <p className="mt-2 text-muted">Loading leave requests...</p>
                        </div>
                    ) : (
                        <>
                            <Table responsive striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Dates</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th>Reason</th>
                                        <th>Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.results?.map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <div>
                                                    <strong>{req.employee_name || req.employee?.basic_info?.username}</strong>
                                                    {(req.employee_position || req.employee?.position?.name) && (
                                                        <small className="text-muted d-block">{req.employee_position || req.employee.position.name}</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{req.start_date} to {req.end_date}</td>
                                            <td>
                                                <Badge bg="info">{req.duration} days</Badge>
                                            </td>
                                            <td>
                                                <Badge bg={getStatusVariant(req.status)}>{req.status}</Badge>
                                            </td>
                                            <td>
                                                <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {formatText(req.reason, 'No reason provided')}
                                                </div>
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </small>
                                            </td>
                                        </tr>
                                    )) || []}
                                    {requests.results?.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center text-muted p-4">
                                                No leave requests found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-3">
                                    <Pagination>
                                        <Pagination.First
                                            onClick={() => handlePageChange(1)}
                                            disabled={currentPage === 1}
                                        />
                                        <Pagination.Prev
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        />

                                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                                            const pageNumber = Math.max(1, currentPage - 2) + index;
                                            if (pageNumber <= totalPages) {
                                                return (
                                                    <Pagination.Item
                                                        key={pageNumber}
                                                        active={pageNumber === currentPage}
                                                        onClick={() => handlePageChange(pageNumber)}
                                                    >
                                                        {pageNumber}
                                                    </Pagination.Item>
                                                );
                                            }
                                            return null;
                                        })}

                                        <Pagination.Next
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        />
                                        <Pagination.Last
                                            onClick={() => handlePageChange(totalPages)}
                                            disabled={currentPage === totalPages}
                                        />
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
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