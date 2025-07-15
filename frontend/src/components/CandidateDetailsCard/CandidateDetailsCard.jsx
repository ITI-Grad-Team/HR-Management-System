import React, { useState } from "react";
import {
  Card,
  Button,
  Badge,
  Row,
  Col,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import {
  FaPhone,
  FaDownload,
  FaBriefcase,
  FaMapMarkerAlt,
  FaUserGraduate,
  FaLaptopCode,
} from "react-icons/fa";
import axiosInstance from "../../api/config";
import { toast } from "react-toastify";

export default function CandidateDetailsCard({ candidate, loggedInHrId, onTake, onSchedule }) {
  const {
    basicinfo,
    position,
    region,
    highest_education_degree,
    highest_education_field,
    phone,
    cv,
    years_of_experience,
    percentage_of_matching_skills,
    skills,
    interview_state,
    interviewer,
    id: candidateId,
  } = candidate;

  const [localState, setLocalState] = useState(interview_state);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- Schedule ---------------- */
  const handleScheduleSubmit = async () => {
    try {
      await axiosInstance.patch(`/hr/employees/${candidateId}/schedule-interview/`, {
        interview_datetime: scheduleDate,
      });
      setLocalState("scheduled");
      toast.success("Interview scheduled");
      setShowScheduleModal(false);
      onSchedule?.();
    } catch (err) {
      toast.error("Failed to schedule interview");
      console.error(err);
    }
  };

  /* ---------------- Render Buttons ---------------- */
  const renderInterviewActions = () => {
    if (localState === "done" && interviewer === loggedInHrId) {
      return (
        <>
          <Button variant="success" onClick={{}}>Accept</Button>
          <Button variant="danger" onClick={{}}>Reject</Button>
        </>
      );
    } else if (localState === "done" && interviewer !== loggedInHrId) {
      return <span className="text-muted">Interview Completed</span>;
    }

    if (localState === "pending" || !localState) {
      return (
        <>
          <Button variant="outline-success" onClick={() => setShowScheduleModal(true)}>Schedule Interview</Button>
          <Button variant="success" onClick={onTake} disabled={loading}>Take Interview</Button>
        </>
      );
    }

    if (localState === "scheduled" && interviewer !== loggedInHrId) {
      return <Button variant="success" onClick={onTake}>Take Interview</Button>;
    }

    if (localState === "taken") {
      return interviewer === loggedInHrId ? (
        <span className="text-muted">You are conducting this interview.</span>
      ) : (
        <span className="text-muted">Interview in progress.</span>
      );
    }

    return <span className="text-muted">Interview {localState}</span>;
  };

  const badgeVariant = {
    pending: "warning",
    scheduled: "primary",
    taken: "info",
    done: "secondary",
  }[localState] || "secondary";

  return (
    <>
       <Card className="p-4 border-0 shadow-sm rounded-4 mb-5">
      <Row className="g-4">
        {/* Avatar and Basic Info */}
        <Col md={4} className="text-center">
          <img
            src={basicinfo?.profile_image}
            alt="avatar"
            className="rounded-circle shadow mb-3"
            style={{ width: "130px", height: "130px", objectFit: "cover" }}
          />
          <h5 className="mb-0 fw-bold">{basicinfo?.username}</h5>
          <p className="text-muted">{position}</p>
        </Col>

        <Col md={8}>
          {/* Personal Info */}
          <h6 className="text-uppercase text-muted fw-bold mb-2">Personal Info</h6>
          <Row className="mb-3">
            <Col sm={6}><FaMapMarkerAlt className="me-2" /><strong>Region:</strong> {region}</Col>
            <Col sm={6}><FaPhone className="me-2" /><strong>Phone:</strong> {phone || "N/A"}</Col>
          </Row>
          <Row className="mb-3">
            <Col sm={6}><FaBriefcase className="me-2" /><strong>Experience:</strong> {years_of_experience} years</Col>
            <Col sm={6}><FaLaptopCode className="me-2" /><strong>Matching Skills:</strong> {Math.round(percentage_of_matching_skills)}%</Col>
          </Row>

          {/* Education */}
          <h6 className="text-uppercase text-muted fw-bold mt-4 mb-2">Education</h6>
          <p><FaUserGraduate className="me-2" />{highest_education_degree} in {highest_education_field}</p>

          {/* Skills */}
          <h6 className="text-uppercase text-muted fw-bold mt-4 mb-2">Skills</h6>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {skills?.length > 0 ? (
              skills.map((skill, index) => (
                <Badge key={index} pill bg="primary">{skill}</Badge>
              ))
            ) : (
              <span className="text-muted">No skills listed</span>
            )}
          </div>

          {/* CV */}
          <h6 className="text-uppercase text-muted fw-bold mt-4 mb-2">Resume</h6>
          <a
            href={cv}
            className="btn btn-outline-dark d-inline-flex align-items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            <FaDownload /> Download CV
          </a>

          {/* Interview Actions */}
          <div className="mt-4">
            <h6 className="text-uppercase text-muted fw-bold mb-2">Interview</h6>
            <div className="d-flex gap-3 flex-wrap">{renderInterviewActions()}</div>

            <div className="mt-3">
              <p className="mb-1 fw-semibold text-muted">Interview Status:</p>
              <Badge
                bg={
                  interview_state === "pending"
                    ? "warning"
                    : interview_state === "accepted"
                    ? "success"
                    : interview_state === "rejected"
                    ? "danger"
                    : interview_state === "taken"
                    ? "info"
                    : "secondary"
                }
                className="px-3 py-2 text-uppercase"
              >
                {interview_state || "Not scheduled"}
              </Badge>
            </div>
          </div>
        </Col>
      </Row>
    </Card>

      {/* Schedule Modal */}
      <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Schedule Interview</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Date & Time</Form.Label>
            <Form.Control type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleScheduleSubmit}>Confirm</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}