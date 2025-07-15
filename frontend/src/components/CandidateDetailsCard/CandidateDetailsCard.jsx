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
  FaUser,
  FaCode,
  FaFileAlt,
  FaCalendarAlt,
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
       <Card className="p-4 border-0 shadow-sm rounded-4 mb-5" style={{ background: 'linear-gradient(145deg, #ffffff, #f8f9fa)' }}>
  <Row className="g-4">
    {/* Avatar and Basic Info */}
    <Col md={4} className="text-center d-flex flex-column align-items-center">
      <div className="position-relative mb-3">
        <img
          src={basicinfo?.profile_image}
          alt="avatar"
          className="rounded-circle shadow"
          style={{ 
            width: "200px", 
            height: "200px", 
            objectFit: "cover",
            border: '3px solid #fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        />
        {percentage_of_matching_skills > 70 && (
          <div className="position-absolute top-0 end-0 bg-success rounded-circle p-1" 
               style={{ transform: 'translate(10%, -10%)' }}>
            <FaCheck className="text-white" size={12} />
          </div>
        )}
      </div>
      <h5 className="mb-0 fw-bold text-dark">{basicinfo?.username}</h5>
      <p className="text-muted mb-2">{position}</p>
      <div className="d-flex gap-2">
        <Badge pill bg="light" text="dark" className="border">
          <FaMapMarkerAlt className="text-primary" /> {region}
        </Badge>
        <Badge pill bg="light" text="dark" className="border">
          <FaBriefcase className="text-primary" /> {years_of_experience} yrs
        </Badge>
      </div>
    </Col>

    <Col md={8}>
      {/* Personal Info */}
      <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(248,249,250,0.8)' }}>
        <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
          <FaUser className="me-2" /> Personal Info
        </h6>
        <Row>
          <Col sm={6} className="mb-2">
            <div className="d-flex align-items-center">
              <FaPhone className="me-2 text-muted" />
              <div>
                <small className="text-muted d-block">Phone</small>
                <span className="fw-semibold">{phone || "N/A"}</span>
              </div>
            </div>
          </Col>
          <Col sm={6} className="mb-2">
            <div className="d-flex align-items-center">
              <FaLaptopCode className="me-2 text-muted" />
              <div>
                <small className="text-muted d-block">Match</small>
                <span className="fw-semibold">{Math.round(percentage_of_matching_skills)}%</span>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Education */}
      <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(248,249,250,0.8)' }}>
        <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
          <FaUserGraduate className="me-2" /> Education
        </h6>
        <div>
          <small className="text-muted d-block">Highest Degree</small>
          <span className="fw-semibold">{highest_education_degree} in {highest_education_field}</span>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(248,249,250,0.8)' }}>
        <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
          <FaCode className="me-2" /> Skills
        </h6>
        <div className="d-flex flex-wrap gap-2">
          {skills?.length > 0 ? (
            skills.map((skill, index) => (
              <Badge key={index} pill bg="primary" className="px-3 py-2" style={{ opacity: 0.9 }}>
                {skill}
              </Badge>
            ))
          ) : (
            <span className="text-muted">No skills listed</span>
          )}
        </div>
      </div>

      {/* CV */}
      <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(248,249,250,0.8)' }}>
        <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
          <FaFileAlt className="me-2" /> Resume
        </h6>
        <a
          href={cv}
          className="btn btn-outline-primary d-inline-flex align-items-center gap-2 rounded-pill px-4"
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          <FaDownload /> Download CV
        </a>
      </div>

      {/* Interview Actions */}
      <div className="p-3 rounded-3" style={{ background: 'rgba(248,249,250,0.8)' }}>
        <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
          <FaCalendarAlt className="me-2" /> Interview
        </h6>
        <div className="d-flex gap-3 flex-wrap mb-3">
          {renderInterviewActions()}
        </div>

        <div className="d-flex align-items-center gap-3">
          <p className="mb-0 fw-semibold text-muted">Status:</p>
          {interview_state || "Not scheduled"}
          
        </div>
      </div>
    </Col>
  </Row>
</Card>

{/* Schedule Modal */}
<Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} centered>
  <Modal.Header closeButton className="border-0 pb-0">
    <Modal.Title className="fw-bold">Schedule Interview</Modal.Title>
  </Modal.Header>
  <Modal.Body className="pt-0">
    <Form.Group className="mb-4">
      <Form.Label className="fw-semibold text-muted">Date & Time</Form.Label>
      <Form.Control 
        type="datetime-local" 
        value={scheduleDate} 
        onChange={(e) => setScheduleDate(e.target.value)}
        className="border-2 py-2"
      />
    </Form.Group>
    <div className="d-flex justify-content-end gap-3">
      <Button 
        variant="outline-secondary" 
        onClick={() => setShowScheduleModal(false)}
        className="rounded-pill px-4"
      >
        Cancel
      </Button>
      <Button 
        variant="primary" 
        onClick={handleScheduleSubmit}
        className="rounded-pill px-4"
      >
        Confirm
      </Button>
    </div>
  </Modal.Body>
</Modal>
    </>
  );
}