import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/config";
import HRDetailsCard from "../../components/HRDetailsCard/HRDetailsCard";
import CandidatesFallBack from "../../components/DashboardFallBack/CandidatesFallback";
import { useAuth } from "../../hooks/useAuth";

export default function HRDetails() {
  const { id } = useParams();
  const { user } = useAuth(); // Always available for authenticated routes

  const [HR, setHR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------- fetch HR ---------- */
  const fetchHR = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine the correct endpoint based on whether user is viewing themselves
      const isSelfView = user.hr?.id === parseInt(id);
      const endpoint = isSelfView ? `/view-profile/` : `/admin/hrs/${id}/`;

      const res = await axiosInstance.get(endpoint);
      setHR(res.data);
    } catch (err) {
      setError(err);
      console.error("Error fetching HR data:", err);
      // Keep the previous HR data if available to prevent UI breakage
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // We know user exists (protected route), so we can fetch immediately
    fetchHR();
  }, [id]); // Only depend on id since user is constant

  if (loading && !HR) {
    return <CandidatesFallBack />;
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">
          Error loading HR data: {error.message}
          {HR && <div className="mt-2">Showing cached data due to error</div>}
        </div>
      </Container>
    );
  }

  if (!HR) {
    return (
      <Container className="py-4">
        <div className="alert alert-warning">No HR data found</div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col md={12}>
          <HRDetailsCard
            candidate={HR}
            loggedInHrId={user.hr?.id}
            onSchedule={fetchHR}
            loadingProp={loading}
          />
        </Col>
      </Row>
    </Container>
  );
}
