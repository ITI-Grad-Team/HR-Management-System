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
  FaUpload,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/config";
import { toast } from "react-toastify";

const EmployeeTasksAccordion = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    fetchMyAssignedTasks();
  }, []);

  const fetchMyAssignedTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/tasks/my_assigned_tasks/");
      setTasks(response.data);
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

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmitTask = async (taskId) => {
    if (files.length === 0) {
      toast.warning(
        <div>
          <FaExclamationCircle className="me-2" />
          Please attach at least one file
        </div>
      );
      return;
    }

    try {
      setSubmitting({ ...submitting, [taskId]: true });

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      await axiosInstance.post(`/tasks/${taskId}/submit/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        <div>
          <FaUpload className="me-2" />
          Task submitted successfully
        </div>
      );
      fetchMyAssignedTasks();
      setFiles([]);
    } catch (error) {
      toast.error(
        <div>
          <FaTimesCircle className="me-2" />
          Failed to submit task
        </div>
      );
    } finally {
      setSubmitting({ ...submitting, [taskId]: false });
    }
  };

  // Reuse the same helper functions from CoordinatorTaskAccordion
  const getTaskStatus = (task) => {
    if (!task.is_submitted) {
      if (task.is_refused) {
        return (
          <Badge className={`${styles["status-badge"]} ${styles["refused"]}`}>
            <FaTimesCircle className="me-1" />
            Awaiting Resubmission
          </Badge>
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
        <Tooltip className={styles.employeeTooltip}>
          <div className="text-start">
            <div className="d-flex align-items-center mb-1">
              <FaUserTie className="me-2" style={{ color: "#fff" }} />
              <strong style={{ color: "#fff" }}>{employee.username}</strong>
            </div>
            <div className="d-flex align-items-center mb-1">
              <FaPhone className="me-2" style={{ color: "#fff" }} />
              <small style={{ color: "#eee" }}>
                {employee.phone || "Not provided"}
              </small>
            </div>
            <div className="d-flex align-items-center">
              <FaEnvelope className="me-2" style={{ color: "#fff" }} />
              <small style={{ color: "#eee" }}>
                {employee.email || "No email"}
              </small>
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
          <h4>No Tasks Assigned Yet</h4>
          <p className="text-muted">
            You don't have any assigned tasks yet. When you do, they'll appear
            here.
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="employee-tasks">
      <Card className="border-primary mb-4">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">
            <FaClipboardList className="me-2" />
            My Assigned Tasks
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
                          Assigned By
                        </h6>
                        <div className={styles.assignedEmployeeContainer}>
                          {renderAssignedTo(task.created_by)}
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

                    {task.is_submitted && task.is_refused && (
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

                    {!task.is_accepted && (
                      <Card className="border-primary mt-3">
                        <Card.Header className="bg-primary text-white py-2">
                          <FaUpload className="me-2" />
                          {task.is_refused ? "Resubmit Task" : "Submit Task"}
                        </Card.Header>
                        <Card.Body>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaPaperclip className="me-2" />
                              Attach Files
                            </Form.Label>
                            <Form.Control
                              type="file"
                              multiple
                              onChange={handleFileChange}
                              className="border-primary"
                            />
                          </Form.Group>
                          <Button
                            variant="primary"
                            className="w-100"
                            onClick={() => handleSubmitTask(task.id)}
                            disabled={submitting[task.id]}
                          >
                            {submitting[task.id] ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-2"
                                />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <FaUpload className="me-2" />
                                {task.is_refused
                                  ? "Resubmit"
                                  : "Submit"} Task{" "}
                                {task.is_submitted ? "(Append)" : ""}
                              </>
                            )}
                          </Button>
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
    </div>
  );
};

export default EmployeeTasksAccordion;
