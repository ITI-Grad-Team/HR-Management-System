import React, { useState, useEffect } from "react";
import styles from "./tasksAccordionStyle.module.css";
import {
  Accordion,
  Card,
  Button,
  Badge,
  Row,
  Col,
  Form,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaClock,
  FaStar,
  FaExclamationCircle,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaHourglassStart,
  FaThumbsUp,
  FaThumbsDown,
  FaPhone,
  FaEnvelope,
  FaPaperclip,
  FaUserTie,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/config";
import { toast } from "react-toastify";

const CoordinatorTaskAccordion = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingInputs, setRatingInputs] = useState({});
  const [refuseReasons, setRefuseReasons] = useState({});
  const [pagination, setPagination] = useState({
    next: null,
    previous: null,
    count: 0,
  });

  useEffect(() => {
    fetchMyCreatedTasks();
  }, []);

  const fetchMyCreatedTasks = async (url = "/tasks/my_created_tasks/") => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(url);
      setTasks(response.data.results);
      setPagination({
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count,
      });
    } catch (error) {
      toast.error(
        <div>
          <FaExclamationCircle className="me-2" />
          Failed to fetch tasks
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const PaginationControls = ({ pagination, fetchMyCreatedTasks }) => {
    if (!pagination) return null;

    const { next, previous, count } = pagination;
    const pageSize = 10;

    // Determine current page
    const getPageNumber = (url) => {
      if (!url) return null;
      try {
        const params = new URL(url, window.location.origin).searchParams;
        return parseInt(params.get("page")) || 1;
      } catch {
        return 1;
      }
    };

    const currentPage = next
      ? getPageNumber(next) - 1
      : previous
      ? getPageNumber(previous) + 1
      : 1;

    const totalPages = Math.ceil(count / pageSize);

    // Generate first and last page URLs
    const getFirstPageUrl = () => {
      if (!previous) return "/tasks/my_created_tasks/";
      const baseUrl = previous.split("?")[0];
      return `${baseUrl}?page=1`;
    };

    const getLastPageUrl = () => {
      if (!next) return `/tasks/my_created_tasks/?page=${totalPages}`;
      const baseUrl = next.split("?")[0];
      return `${baseUrl}?page=${totalPages}`;
    };

    return (
      <div className="d-flex justify-content-center align-items-center flex-wrap gap-2 mt-4">
        {/* First Page Button */}
        <button
          className="btn btn-outline-primary"
          onClick={() => fetchMyCreatedTasks(getFirstPageUrl())}
          disabled={!previous || currentPage === 1}
          aria-label="Go to first page"
        >
          First
        </button>

        {/* Previous Page Button */}
        <button
          className="btn btn-outline-primary"
          onClick={() => fetchMyCreatedTasks(previous)}
          disabled={!previous}
          aria-label="Go to previous page"
        >
          Previous
        </button>

        {/* Page Info */}
        <span className="fw-semibold mx-2">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next Page Button */}
        <button
          className="btn btn-outline-primary"
          onClick={() => fetchMyCreatedTasks(next)}
          disabled={!next}
          aria-label="Go to next page"
        >
          Next
        </button>

        {/* Last Page Button */}
        <button
          className="btn btn-outline-primary"
          onClick={() => fetchMyCreatedTasks(getLastPageUrl())}
          disabled={!next || currentPage === totalPages}
          aria-label="Go to last page"
        >
          Last
        </button>
      </div>
    );
  };

  const handleAcceptTask = async (taskId) => {
    const rating = ratingInputs[taskId];
    if (!rating || rating < 0 || rating > 100) {
      toast.warning(
        <div>
          <FaStar className="me-2" />
          Please enter a valid rating between 0 and 100
        </div>
      );
      return;
    }

    try {
      const response = await axiosInstance.post(`/tasks/${taskId}/accept/`, {
        rating,
      });
      toast.success(
        <div>
          <FaThumbsUp className="me-2" />
          Task accepted successfully with rating {rating}/100
        </div>,
        { className: "bg-primary text-white" }
      );

      // Update the specific task in state instead of refetching
      setTasks(
        tasks.map((task) => (task.id === taskId ? response.data.task : task))
      );
    } catch (error) {
      toast.error(
        <div>
          <FaTimesCircle className="me-2" />
          Failed to accept task
        </div>
      );
    }
  };

  const handleRefuseTask = async (taskId) => {
    const reason = refuseReasons[taskId];
    if (!reason || reason.trim() === "") {
      toast.warning(
        <div>
          <FaExclamationCircle className="me-2" />
          Please enter a reason for refusing the task
        </div>
      );
      return;
    }

    try {
      const response = await axiosInstance.post(`/tasks/${taskId}/refuse/`, {
        reason,
      });
      toast.success(
        <div>
          <FaThumbsDown className="me-2" />
          Task refused successfully
        </div>
      );

      // Update the specific task in state instead of refetching
      setTasks(
        tasks.map((task) => (task.id === taskId ? response.data.task : task))
      );
    } catch (error) {
      toast.error(
        <div>
          <FaTimesCircle className="me-2" />
          Failed to refuse task
        </div>
      );
    }
  };

  const getTaskStatus = (task) => {
    if (!task.is_submitted) {
      if (task.is_refused) {
        return (
          <>
            <Badge className={`${styles["status-badge"]} ${styles["refused"]}`}>
              <FaTimesCircle className="me-1" />
              Awaiting Resubmission
            </Badge>
          </>
        );
      }
      return (
        <Badge
          className={`${styles["status-badge"]} ${styles["awaiting-submission"]}`}
        >
          <FaHourglassStart className="me-1" />
          Awaiting Submission
        </Badge>
      );
    }
    if (task.is_accepted) {
      return (
        <Badge className={`${styles["status-badge"]} ${styles["accepted"]}`}>
          <FaCheckCircle className="me-1" />
          Accepted
        </Badge>
      );
    }
    if (task.is_refused) {
      return (
        <Badge className={`${styles["status-badge"]} ${styles["refused"]}`}>
          <FaTimesCircle className="me-1" />
          Refused
        </Badge>
      );
    }
    return (
      <Badge
        className={`${styles["status-badge"]} ${styles["awaiting-review"]}`}
      >
        <FaClipboardList className="me-1" />
        Awaiting Review
      </Badge>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const renderAssignedTo = (employee) => (
    <OverlayTrigger
      placement="top"
      overlay={
        <Tooltip
          id={`employee-tooltip-${employee.id}`}
          className={styles.employeeTooltip} // Add this className
        >
          <div className="text-start">
            <div className="d-flex align-items-center mb-1">
              <FaUserTie className="me-2 text-light" />
              <strong>{employee.username}</strong>
            </div>
            <div className="d-flex align-items-center mb-1">
              <FaPhone className="me-2 text-light" />
              <small>{employee.phone || "Not provided"}</small>
            </div>
            <div className="d-flex align-items-center mb-1">
              <FaEnvelope className="me-2 text-light" />
              <small>{employee.email}</small>
            </div>
          </div>
        </Tooltip>
      }
    >
      <Link
        to={`/dashboard/employeeDetails/${employee.id}`}
        className="text-decoration-none"
        style={{ cursor: "pointer" }}
      >
        <div className="d-flex align-items-center gap-2">
          {employee.profile_image ? (
            <img
              src={employee.profile_image}
              alt={employee.username}
              className="rounded-circle"
              style={{
                width: "28px",
                height: "28px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              className="bg-light rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: "#e9ecef",
              }}
            >
              <FaUser className="text-secondary" size={14} />
            </div>
          )}
          <div className="text-truncate" style={{ maxWidth: "150px" }}>
            <span className="fw-bold">{employee.username}</span>
          </div>
          <FaExternalLinkAlt className="text-muted" size={12} />
        </div>
      </Link>
    </OverlayTrigger>
  );

  const renderFiles = (files) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="mt-3">
        <h6>
          <FaPaperclip className="me-2" />
          Attached Files:
        </h6>
        <ul className="list-unstyled">
          {files.map((file) => (
            <li key={file.id}>
              <a href={file.file} target="_blank" rel="noopener noreferrer">
                {file.file.split("/").pop()}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const handleRatingChange = (taskId, value) => {
    setRatingInputs({
      ...ratingInputs,
      [taskId]: value,
    });
  };

  const handleReasonChange = (taskId, value) => {
    setRefuseReasons({
      ...refuseReasons,
      [taskId]: value,
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-primary">Loading your tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="border-primary">
        <Card.Body className="text-center py-5">
          <FaClipboardList className="text-primary mb-3" size={48} />
          <h4>No Tasks Created Yet</h4>
          <p className="text-muted">
            You haven't created any tasks yet. When you do, they'll appear here.
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="coordinator-tasks">
      <Card className="border-primary mb-4">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">
            <FaClipboardList className="me-2" />
            My Created Tasks
          </h4>
        </Card.Header>
        <Card.Body>
          <Accordion flush>
            {tasks.map((task, index) => (
              <Accordion.Item eventKey={index.toString()} key={task.id}>
                <Accordion.Header>
                  <Row className="w-100 align-items-center">
                    <Col xs={7} className="d-flex align-items-center">
                      <FaFileAlt className="text-primary me-2" />
                      <span className="fw-bold">{task.title}</span>
                    </Col>
                    <Col xs={5} className="text-end">
                      <div className="d-flex justify-content-end">
                        {getTaskStatus(task)}
                      </div>
                    </Col>
                  </Row>
                </Accordion.Header>
                <Accordion.Body className="bg-light">
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <h6>
                          <FaInfoCircle className="text-primary me-2" />
                          Description
                        </h6>
                        <p>{task.description}</p>
                      </div>

                      <div className="mb-3">
                        <h6>
                          <FaUserTie className="text-primary me-2" />
                          Assigned To
                        </h6>
                        <div className="assigned-employee-container">
                          <div className={styles.assignedEmployeeContainer}>
                            {renderAssignedTo(task.assigned_to)}
                          </div>
                        </div>
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="mb-3">
                        <h6>
                          <FaClock className="text-primary me-2" />
                          Timeline
                        </h6>
                        <p>
                          <strong>Deadline:</strong>{" "}
                          {formatDateTime(task.deadline)}
                        </p>
                        {task.submission_time && (
                          <p>
                            <strong>Submitted:</strong>{" "}
                            {formatDateTime(task.submission_time)}
                          </p>
                        )}
                      </div>

                      {task.is_submitted &&
                        task.time_remaining_before_deadline_when_accepted && (
                          <div className="mb-3">
                            <p>
                              <strong>Time Saved:</strong>{" "}
                              {task.time_remaining_before_deadline_when_accepted.toFixed(
                                2
                              )}
                              hours
                            </p>
                          </div>
                        )}
                    </Col>
                  </Row>

                  {renderFiles(task.files)}

                  {/* Task Status and Actions */}
                  <div className="mt-4">
                    {task.is_submitted && task.is_accepted && (
                      <div className="alert alert-primary">
                        <div className="d-flex align-items-center">
                          <FaCheckCircle className="me-2" size={20} />
                          <div>
                            <strong>Accepted</strong> - rating: {task.rating}
                            /100
                          </div>
                        </div>
                      </div>
                    )}

                    {task.is_refused && (
                      <div className="alert alert-danger">
                        <div className="d-flex align-items-center">
                          <FaTimesCircle className="me-2" size={20} />
                          <div>
                            <strong>Refused</strong> - Reason:{" "}
                            {task.refuse_reason}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons - show based on exact conditions */}
                    {task.is_submitted && !task.is_accepted && (
                      <Card className="border-primary mt-3">
                        <Card.Header className="bg-primary text-white py-2">
                          <FaClipboardList className="me-2" />
                          Review Submission{" "}
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            {/* Accept option - show for all submitted but not accepted tasks */}
                            <Col md={6} className="mb-3 mb-md-0">
                              <Form.Group>
                                <Form.Label>
                                  <FaStar className="text-warning me-2" />
                                  Rating (0-100)
                                </Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={ratingInputs[task.id] || ""}
                                  onChange={(e) =>
                                    handleRatingChange(task.id, e.target.value)
                                  }
                                  className="border-primary"
                                />
                              </Form.Group>
                              <Button
                                variant="primary"
                                className="mt-2 w-100"
                                onClick={() => handleAcceptTask(task.id)}
                              >
                                <FaThumbsUp className="me-2" />
                                Accept Task
                              </Button>
                            </Col>

                            {/* Refuse option - only show if not refused */}
                            {!task.is_refused && (
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label>
                                    <FaExclamationCircle className="text-warning me-2" />
                                    Refusal Reason
                                  </Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={refuseReasons[task.id] || ""}
                                    onChange={(e) =>
                                      handleReasonChange(
                                        task.id,
                                        e.target.value
                                      )
                                    }
                                    className="border-primary"
                                  />
                                </Form.Group>
                                <Button
                                  variant="outline-danger"
                                  className="mt-2 w-100"
                                  onClick={() => handleRefuseTask(task.id)}
                                >
                                  <FaThumbsDown className="me-2" />
                                  Refuse Task
                                </Button>
                              </Col>
                            )}
                          </Row>
                        </Card.Body>
                      </Card>
                    )}

                    {task.is_refused && (
                      <Card className="border-primary mt-3">
                        <Card.Header className="bg-primary text-white py-2">
                          <FaClipboardList className="me-2" />
                          Review Submission{" "}
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            {/* Accept option - show for all submitted but not accepted tasks */}
                            <Col md={6} className="mb-3 mb-md-0">
                              <Form.Group>
                                <Form.Label>
                                  <FaStar className="text-warning me-2" />
                                  Rating (0-100)
                                </Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={ratingInputs[task.id] || ""}
                                  onChange={(e) =>
                                    handleRatingChange(task.id, e.target.value)
                                  }
                                  className="border-primary"
                                />
                              </Form.Group>
                              <Button
                                variant="primary"
                                className="mt-2 w-100"
                                onClick={() => handleAcceptTask(task.id)}
                              >
                                <FaThumbsUp className="me-2" />
                                Accept Task (Revoke Task Refusal)
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    )}
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Card.Body>
      </Card>
      <PaginationControls
        pagination={pagination}
        fetchMyCreatedTasks={fetchMyCreatedTasks}
      />
    </div>
  );
};

export default CoordinatorTaskAccordion;
