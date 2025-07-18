import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/config";
import HRDetailsCard from "../../components/HRDetailsCard/HRDetailsCard";
import { useAuth } from "../../context/AuthContext";
import CandidatesFallBack from "../../components/DashboardFallBack/CandidatesFallback";

export default function HRDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [HR, setHR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);

  /* ---------- fetch HR ---------- */
  const endpoint = `/admin/hrs/${id}/`;
  const fetchHR = async () => {
    const res = await axiosInstance.get(endpoint);
    setHR(res.data);
  };

  useEffect(() => {
    fetchHR()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, user.hr?.id]);

  /* ---------- Take interview ---------- */

  if (loading) {
    return <CandidatesFallBack />;
  }

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col md={12}>
          <HRDetailsCard
            candidate={HR}
            loggedInHrId={user.hr?.id}
            onSchedule={fetchHR}
            loadingProp={loadingForm}
          />
        </Col>
      </Row>
    </Container>
  );
}
