import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Spinner,
  ToastContainer,
  Toast,
} from "react-bootstrap";
import axiosInstance from "../../api/config";

export default function HrSettings() {
  /* ----------------------------- STATE -------------------------------- */
  const [positions, setPositions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [regions, setRegions] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [educations, setEducations] = useState([]);

  const [newPosition, setNewPosition] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newDegree, setNewDegree] = useState("");
  const [newEducation, setNewEducation] = useState("");

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  /* ------------------------- HELPERS ---------------------------------- */
  const showToast = (message, variant = "success") => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [posRes, skillRes, regionRes, degreeRes, eduRes] = await Promise.all([
        axiosInstance.get("hr/positions/"),
        axiosInstance.get("hr/skills/"),
        axiosInstance.get("hr/regions/"),
        axiosInstance.get("hr/degrees/"),
        axiosInstance.get("hr/fields/"),
      ]);
      setPositions(posRes.data.results);
      setSkills(skillRes.data.results);
      setRegions(regionRes.data.results);
      setDegrees(degreeRes.data.results);
      setEducations(eduRes.data.results);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch data", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ------------------------ GENERIC CRUD ------------------------------ */
  const createHandler = (endpoint, setter, valueSetter) => async (value) => {
    const name = value.trim();
    if (!name) return;
    try {
      const res = await axiosInstance.post(endpoint, { name });
      setter((prev) => [...prev, res.data]);
      valueSetter("");
      showToast("Added successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to add", "danger");
    }
  };

  const deleteHandler = (endpoint, setter) => async (id) => {
    try {
      await axiosInstance.delete(`${endpoint}/${id}/`);
      setter((prev) => prev.filter((item) => item.id !== id));
      showToast("Deleted successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete", "danger");
    }
  };

  /* --------------------------- HANDLERS ------------------------------- */
  const handleAddPosition = createHandler("hr/positions/", setPositions, setNewPosition);
  const handleAddSkill = createHandler("hr/skills/", setSkills, setNewSkill);
  const handleAddRegion = createHandler("hr/regions/", setRegions, setNewRegion);
  const handleAddDegree = createHandler("hr/degrees/", setDegrees, setNewDegree);
  const handleAddEducation = createHandler("hr/fields/", setEducations, setNewEducation);

  const handleRemovePosition = deleteHandler("hr/positions", setPositions);
  const handleRemoveSkill = deleteHandler("hr/skills", setSkills);
  const handleRemoveRegion = deleteHandler("hr/regions", setRegions);
  const handleRemoveDegree = deleteHandler("hr/degrees", setDegrees);
  const handleRemoveEducation = deleteHandler("hr/fields", setEducations);

  /* --------------------------- RENDER --------------------------------- */
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const renderSection = (title, list, value, valueSetter, addHandler, removeHandler) => (
    <Col xs={12} md={6} lg={4} className="mb-4">
      <Card className="shadow-sm h-100">
        <Card.Header className="fw-bold text-center">{title}</Card.Header>
        <Card.Body className="d-flex flex-column">
          <Form className="d-flex gap-2 mb-3">
            <Form.Control
              type="text"
              placeholder={`Add new ${title.toLowerCase().split(" ")[1]}`}
              value={value}
              onChange={(e) => valueSetter(e.target.value)}
            />
            <Button variant="primary" onClick={() => addHandler(value)}>
              Add
            </Button>
          </Form>
          <div className="flex-grow-1 overflow-auto" style={{ maxHeight: "300px" }}>
            <ListGroup>
              {list.map((item) => (
                <ListGroup.Item
                  key={item.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  {item.name}
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => removeHandler(item.id)}
                  >
                    &times;
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        {renderSection("Manage Positions", positions, newPosition, setNewPosition, handleAddPosition, handleRemovePosition)}
        {renderSection("Manage Skills", skills, newSkill, setNewSkill, handleAddSkill, handleRemoveSkill)}
        {renderSection("Manage Regions", regions, newRegion, setNewRegion, handleAddRegion, handleRemoveRegion)}
        {renderSection("Manage Educations", educations, newEducation, setNewEducation, handleAddEducation, handleRemoveEducation)}
        {renderSection("Manage Degrees", degrees, newDegree, setNewDegree, handleAddDegree, handleRemoveDegree)}
      </Row>

      {/* Toast */}
      <ToastContainer position="bottom-end" className="p-3" bg={toast.variant} style={{ zIndex: 9999 }}>
        <Toast onClose={() => setToast({ ...toast, show: false })} show={toast.show} delay={3000} autohide bg={toast.variant}>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}