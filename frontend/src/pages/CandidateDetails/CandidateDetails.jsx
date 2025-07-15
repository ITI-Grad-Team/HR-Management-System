import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/config";
import CandidateDetailsCard from "../../components/CandidateDetailsCard/CandidateDetailsCard";
import InterviewForm from "../../components/InterviewForm/InterviewForm";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function CandidateDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  /* ---------- fetch candidate ---------- */
  const fetchCandidate = () =>
    axiosInstance.get(`/hr/employees/${id}/`).then((res) => setCandidate(res.data));

  useEffect(() => {
  const fetchCandidate = async () => {
    const res = await axiosInstance.get(`/hr/employees/${id}/`);
    setCandidate(res.data);

    if (
      res.data.interviewer === user.hr?.id &&
      res.data.interview_state === "taken"
    ) {
      setShowForm(true);
    }
  };

  fetchCandidate().catch(console.error).finally(() => setLoading(false));
}, [id, user.hr?.id]);


  /* ---------- Take interview ---------- */
  const handleTake = async () => {
    try {
      await axiosInstance.patch(`/hr/employees/${id}/take-interviewee/`);
      await fetchCandidate();
      setShowForm(true);
      toast.success("Interview started");
    } catch (err) {
      toast.error("Failed to take interview");
    }
  };

  if (loading || !candidate) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" />
      </div>
    );
  }

  const isCurrentInterviewer = candidate.interviewer === user.hr?.id;

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col md={12}>
          <CandidateDetailsCard
            candidate={candidate}
            loggedInHrId={user.hr?.id}
            onTake={handleTake}
          />
        </Col>

        {showForm && isCurrentInterviewer && (
          <Col md={12}>
            <Card className="p-4 shadow-sm mt-4">
              <InterviewForm
                candidateId={candidate.id}
                onSubmitted={() => {
                  setShowForm(false);
                  fetchCandidate();
                }}
              />
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}