import React, { useEffect, useState, useRef  } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/config";
import CandidateDetailsCard from "../../components/CandidateDetailsCard/CandidateDetailsCard";
import InterviewForm from "../../components/InterviewForm/InterviewForm";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import CandidatesFallBack from "../../components/DashboardFallBack/CandidatesFallback";

export default function CandidateDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const formRef = useRef(null);


  /* ---------- fetch candidate ---------- */


  const fetchCandidate = async () => {
    const res = await axiosInstance.get(`/hr/employees/${id}/`);
    setCandidate(res.data);

    if (
      res.data.interviewer === user.hr?.id &&
      (res.data.interview_state == "scheduled" ||
        res.data.interview_state == "pending")
    ) {
      setShowForm(true);
    }

  };
    const handlePredictUpdate = async () => {
      try {
        await fetchCandidate(); 
      } catch (err) {
        console.error("Failed to refresh predictions:", err);
      }
    };

  useEffect(() => {
    fetchCandidate()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, user.hr?.id]);

  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [showForm]);



  /* ---------- Take interview ---------- */
  const handleTake = async () => {
    try {
      setLoadingForm(true);
      await axiosInstance.patch(`/hr/employees/${id}/take-interviewee/`);
      await fetchCandidate();
      setShowForm(true);
      setTimeout(() => {
  formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}, 300);
      toast.success("Interview Responsibility Taken");
    } catch (err) {
      toast.error("Failed to take interview");
    } finally {
      setLoadingForm(false);
    }
  };

  if (loading || !candidate) {
    return (
      <CandidatesFallBack />
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
            onSchedule={fetchCandidate}
            onTake={handleTake}
            onPredictUpdate={handlePredictUpdate}
            loadingProp={loadingForm}
          />
        </Col>

        {showForm && isCurrentInterviewer && (
          <Col md={12} ref={formRef}>
            <Card
              className="p-4 shadow-sm mt-4 border border-primary-subtle"
              style={{
                backgroundColor: "#fefefe",
                animation: "fadeInUp 0.5s ease-in-out",
              }}
            >
              <h5 className="mb-4 fw-bold text-primary">Interview Form</h5>
              <InterviewForm
                candidateId={candidate.id}
                onSubmitted={(updatedCandidate) => {
                  setShowForm(false);
                  setCandidate(updatedCandidate);
                  window.location.reload();
                }}
              />
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}