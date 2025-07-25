import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/config";
import EmployeeDetailsCard from "../../components/EmployeeDetailsCard/EmployeeDetailsCard";
import InterviewForm from "../../components/InterviewForm/InterviewForm";
import { toast } from "react-toastify";
import CandidatesFallBack from "../../components/DashboardFallBack/CandidatesFallback";
import { useAuth } from "../../hooks/useAuth";

export default function CandidateDetails() {
  const { id } = useParams();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const formRef = useRef(null);

  /* ---------- fetch candidate ---------- */
  const { user } = useAuth();
  const { role, employee } = user;
  const isSelfView = employee?.id === parseInt(id);
  const endpoint = isSelfView
    ? "/view-profile/"
    : role === "hr"
    ? `/hr/employees/${id}/`
    : employee?.is_coordinator === true
    ? `/coordinator/employees/${id}/`
    : `/admin/employees/${id}/`;
  const fetchCandidate = async () => {
    const res = await axiosInstance.get(endpoint);
    setCandidate(res.data);
    console.log(res.data, "ddd");

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
    } catch {
      toast.error("Failed to take interview");
    } finally {
      setLoadingForm(false);
    }
  };

  if (loading || !candidate) {
    return <CandidatesFallBack />;
  }
  const handlePromote = (updatedCandidate) => {
    setCandidate(updatedCandidate);
  };
  const isCurrentInterviewer = candidate.interviewer === user.hr?.id;

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col md={12}>
          <EmployeeDetailsCard
            candidate={candidate}
            loggedInHrId={user.hr?.id}
            onSchedule={fetchCandidate}
            onTake={handleTake}
            onPredictUpdate={handlePredictUpdate}
            loadingProp={loadingForm}
            onPromote={handlePromote}
            isSelfView={isSelfView}
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
                }}
              />
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}
