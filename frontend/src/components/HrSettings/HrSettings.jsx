import React, { useEffect, useState, useCallback } from "react";
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
  Modal,
  Alert,
} from "react-bootstrap";
import axiosInstance from "../../api/config";
import { updateRegionLocation, updateRegionLocationAdmin } from "../../api/locationApi";
import { getCurrentLocation } from "../../utils/geolocation";
import { useAuth } from "../../hooks/useAuth";
import SettingsFallback from "../DashboardFallBack/SettingsFallback";

export default function HrSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
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

  // Location management state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [locationSettings, setLocationSettings] = useState({
    latitude: "",
    longitude: "",
    allowed_radius_meters: 100,
  });
  const [locationLoading, setLocationLoading] = useState(false);

  /* ------------------------- HELPERS ---------------------------------- */
  const showToast = useCallback((message, variant = "success") => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const baseEndpoint = isAdmin ? "admin" : "hr";
      const [posRes, skillRes, regionRes, degreeRes, eduRes] =
        await Promise.all([
          axiosInstance.get(`${baseEndpoint}/positions/`),
          axiosInstance.get(`${baseEndpoint}/skills/`),
          axiosInstance.get(`${baseEndpoint}/regions/`),
          axiosInstance.get(`${baseEndpoint}/degrees/`),
          axiosInstance.get(`${baseEndpoint}/fields/`),
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
  }, [showToast, isAdmin]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ------------------------ GENERIC CRUD ------------------------------ */
  const createHandler = (endpoint, setter, valueSetter) => async (value) => {
    const name = value.trim();
    if (!name) return;
    try {
      let payload = { name };
      const baseEndpoint = isAdmin ? "admin" : "hr";
      const fullEndpoint = `${baseEndpoint}/${endpoint.split('/')[1]}/`;

      if (endpoint.includes("regions")) {
        const distance = parseFloat(newRegionDistance);
        if (isNaN(distance)) {
          showToast("Please enter valid distance", "danger");
          return;
        }
        payload.distance_to_work = distance;
      }

      const res = await axiosInstance.post(fullEndpoint, payload);
      setter((prev) => [...prev, res.data]);
      valueSetter("");
      if (endpoint.includes("regions")) setNewRegionDistance("");
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

  // Location management handlers
  const handleLocationSetup = (region) => {
    setSelectedRegion(region);
    setLocationSettings({
      latitude: region.latitude || "",
      longitude: region.longitude || "",
      allowed_radius_meters: region.allowed_radius_meters || 100,
    });
    setShowLocationModal(true);
  };

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      setLocationSettings(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      showToast("Current location acquired successfully");
    } catch (error) {
      showToast(error.message, "danger");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedRegion) return;
    
    setLocationLoading(true);
    try {
      const updateFunction = isAdmin ? updateRegionLocationAdmin : updateRegionLocation;
      const response = await updateFunction(selectedRegion.id, locationSettings);
      
      // Update the region in the local state
      setRegions(prev => 
        prev.map(region => 
          region.id === selectedRegion.id 
            ? { ...region, ...response.data }
            : region
        )
      );
      
      setShowLocationModal(false);
      showToast("Location settings updated successfully");
    } catch (error) {
      showToast(error.response?.data?.detail || "Failed to update location", "danger");
    } finally {
      setLocationLoading(false);
    }
  };  /* --------------------------- RENDER --------------------------------- */
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
    showLocationButton = false
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
            {title === "Manage Regions" && (
              <Form.Control
                type="number"
                step="0.1"
                placeholder="Distance to work"
                value={newRegionDistance}
                onChange={(e) => setNewRegionDistance(e.target.value)}
              />
            )}
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
                  <div>
                    <div>
                      {item.name}
                      {item.distance_to_work && (
                        <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                          {" "}({item.distance_to_work} km)
                        </span>
                      )}
                    </div>
                    {showLocationButton && (
                      <small className="text-muted">
                        {item.latitude && item.longitude
                          ? `Location: ${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)} (${item.allowed_radius_meters}m)`
                          : "No location set"
                        }
                      </small>
                    )}
                  </div>
                  {showLocationButton && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleLocationSetup(item)}
                    >
                      {item.latitude && item.longitude ? "Edit Location" : "Set Location"}
                    </Button>
                  )}
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
          {renderSection(
            "Manage Regions",
            regions,
            newRegion,
            setNewRegion,
            handleAddRegion,
            true // Show location button for regions
          )}
        </Row>

        {/* Location Setup Modal */}
        <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Set Location for {selectedRegion?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info">
              <small>
                Configure the geolocation for attendance validation. Employees will need to be within
                the specified radius to check in/out at this location.
              </small>
            </Alert>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Latitude</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    placeholder="e.g., 30.0444"
                    value={locationSettings.latitude}
                    onChange={(e) => setLocationSettings(prev => ({
                      ...prev,
                      latitude: e.target.value
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Longitude</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    placeholder="e.g., 31.2357"
                    value={locationSettings.longitude}
                    onChange={(e) => setLocationSettings(prev => ({
                      ...prev,
                      longitude: e.target.value
                    }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Allowed Radius (meters)</Form.Label>
                  <Form.Control
                    type="number"
                    min="10"
                    max="1000"
                    value={locationSettings.allowed_radius_meters}
                    onChange={(e) => setLocationSettings(prev => ({
                      ...prev,
                      allowed_radius_meters: parseInt(e.target.value) || 100
                    }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Button
                  variant="outline-primary"
                  onClick={handleGetCurrentLocation}
                  disabled={locationLoading}
                  className="mb-3"
                >
                  {locationLoading ? (
                    <>
                      <Spinner animation="border" size="sm" /> Getting Location...
                    </>
                  ) : (
                    "Use Current Location"
                  )}
                </Button>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowLocationModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveLocation}
              disabled={locationLoading || !locationSettings.latitude || !locationSettings.longitude}
            >
              {locationLoading ? (
                <>
                  <Spinner animation="border" size="sm" /> Saving...
                </>
              ) : (
                "Save Location"
              )}
            </Button>
          </Modal.Footer>
        </Modal>


      </Container>

      {/* Toast */}
      <ToastContainer
        position="bottom-end"
        className="p-3"
        bg={toast.variant}
        style={{
          position: "fixed",
          zIndex: 9999
        }}
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
