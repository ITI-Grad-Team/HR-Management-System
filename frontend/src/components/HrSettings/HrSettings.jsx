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
import SettingsFallback from "../DashboardFallBack/SettingsFallback";

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
  const [newRegionDistance, setNewRegionDistance] = useState("");

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "success",
  });

  /* ------------------------- HELPERS ---------------------------------- */
  const showToast = (message, variant = "success") => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [posRes, skillRes, regionRes, degreeRes, eduRes] =
        await Promise.all([
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
      let payload = { name };

      if (endpoint === "hr/regions/") {
        const distance = parseFloat(newRegionDistance);
        if (isNaN(distance)) {
          showToast("Please enter valid distance", "danger");
          return;
        }
        payload.distance_to_work = distance;
      }

      const res = await axiosInstance.post(endpoint, payload);
      setter((prev) => [...prev, res.data]);
      valueSetter("");
      if (endpoint === "hr/regions/") setNewRegionDistance("");
      showToast("Added successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to add", "danger");
    }
  };


  /* --------------------------- HANDLERS ------------------------------- */
  const handleAddPosition = createHandler(
    "hr/positions/",
    setPositions,
    setNewPosition
  );
  const handleAddSkill = createHandler("hr/skills/", setSkills, setNewSkill);
  const handleAddRegion = createHandler(
    "hr/regions/",
    setRegions,
    setNewRegion
  );
  const handleAddDegree = createHandler(
    "hr/degrees/",
    setDegrees,
    setNewDegree
  );
  const handleAddEducation = createHandler(
    "hr/fields/",
    setEducations,
    setNewEducation
  );

  /* --------------------------- RENDER --------------------------------- */
  if (loading) {
    return (
      <SettingsFallback />
    );
  }

  const renderSection = (
    title,
    list,
    value,
    valueSetter,
    addHandler,
    removeHandler
  ) => (
    <Col xs={12} md={6} lg={4} className="mb-4">
      <Card className="shadow-sm h-100">
        <Card.Header className="fw-bold text-center">{title}</Card.Header>
        <Card.Body className="d-flex flex-column">
          <Form
            className="d-flex gap-2 mb-3"
            onSubmit={(e) => {
              e.preventDefault();
              addHandler(value);
            }}
          >
            <Form.Control
              type="text"
              placeholder={`Add new ${title.toLowerCase().split(" ")[1]}`}
              value={value}
              onChange={(e) => valueSetter(e.target.value)}
            />
            <Button variant="primary" type="submit">
              Add
            </Button>
          </Form>
          <div
            className="flex-grow-1 overflow-auto"
            style={{ maxHeight: "300px" }}
          >
            <ListGroup>
              {list.map((item) => (
                <ListGroup.Item
                  key={item.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  {item.name}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <>
    <Container fluid className="py-4">
      <Row className="g-4">
        {renderSection(
          "Manage Positions",
          positions,
          newPosition,
          setNewPosition,
          handleAddPosition,
        )}
        {renderSection(
          "Manage Skills",
          skills,
          newSkill,
          setNewSkill,
          handleAddSkill,
        )}
        {renderSection(
          "Manage Educations",
          educations,
          newEducation,
          setNewEducation,
          handleAddEducation,
        )}
        {renderSection(
          "Manage Degrees",
          degrees,
          newDegree,
          setNewDegree,
          handleAddDegree,
        )}
        <Col xs={12} md={6} lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="fw-bold text-center">
              Manage Regions
            </Card.Header>
            <Card.Body className="d-flex flex-column">
              <Form
                className="d-flex gap-2 mb-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddRegion(newRegion);
                }}
              >
                <Form.Control
                  type="text"
                  placeholder="Add new region"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                />
                <Form.Control
                  type="number"
                  step="0.1"
                  placeholder="Distance to work"
                  value={newRegionDistance}
                  onChange={(e) => setNewRegionDistance(e.target.value)}
                />
                <Button type="submit">Add</Button>
              </Form>

              <div
                className="flex-grow-1 overflow-auto"
                style={{ maxHeight: "300px" }}
              >
                <ListGroup>
                  {regions.map((region) => (
                    <ListGroup.Item
                      key={region.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        {region.name}{" "}
                        <span
                          className="text-muted"
                          style={{ fontSize: "0.85rem" }}
                        >
                          ({region.distance_to_work} km)
                        </span>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      
    </Container>

    {/* Toast */}
      <ToastContainer
        position="bottom-end"
        className="p-3"
        bg={toast.variant}
        style={{ 
          position: "fixed",
          zIndex: 9999 }}
      >
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          delay={3000}
          autohide
          bg={toast.variant}
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
      </>
  );
}
