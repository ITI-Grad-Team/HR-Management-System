import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Form,
  Button,
  Container,
  Alert,
  Spinner,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import { FaUpload, FaCheck } from "react-icons/fa";
import axiosInstance from "../../api/config";
const ApplicationPage = () => {
  const { distinction_name } = useParams();

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    cv: null,
    distinction_name: distinction_name,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [filePreview, setFilePreview] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "cv" && files && files[0]) {
      // Validate file size (5MB max)
      if (files[0].size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(files[0].type)) {
        setError("Please upload a PDF document");
        return;
      }

      setFilePreview(files[0].name);
      setFormData({
        ...formData,
        [name]: files[0],
      });
      setError(null); // Clear any previous errors
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("cv", formData.cv);
      formDataToSend.append("distinction_name", formData.distinction_name);

      // Use your axiosInstance but override Content-Type for file upload
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          // Remove Authorization header if this is a public endpoint
          ...(!localStorage.getItem("access_token") && {
            Authorization: undefined,
          }),
        },
      };

      await axiosInstance.post("/apply/", formDataToSend, config);

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Application submission failed. Please try again."
      );
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <Card className="text-center p-4 shadow" style={{ maxWidth: "500px" }}>
          <Card.Body>
            <div className="mb-4">
              <FaCheck size={48} className="text-success mb-3" />
              <h3>Application Submitted!</h3>
              <p className="text-muted">
                Thank you for your application. We'll review your information
                and get back to you soon.
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ maxWidth: "800px" }}>
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <h2 className="mb-4 text-center">Job Application</h2>
              <p className="text-muted text-center mb-4">
                Applying for:{" "}
                <span className="fw-bold text-capitalize">
                  {distinction_name.replace(/-/g, " ")}
                </span>
              </p>

              {error && (
                <Alert
                  variant="danger"
                  className="mb-4"
                  dismissible
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+1234567890"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Form.Group className="mb-4">
                      <Form.Label>CV/Resume</Form.Label>
                      <div className="d-flex align-items-center gap-3">
                        <Form.Control
                          type="file"
                          name="cv"
                          onChange={handleChange}
                          accept=".pdf"
                          required
                          className="d-none"
                          id="cv-upload"
                        />
                        <label
                          htmlFor="cv-upload"
                          className="btn btn-outline-secondary mb-0"
                        >
                          <FaUpload className="me-2" />
                          Choose File
                        </label>
                        <span
                          className={`small ${
                            filePreview ? "text-dark" : "text-muted"
                          }`}
                        >
                          {filePreview || "No file chosen"}
                        </span>
                      </div>
                      <Form.Text className="text-muted">
                        Max file size: 5MB. Accepted format: PDF only
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col xs={12} className="mt-2">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading || !formData.cv}
                      className="w-100 py-3"
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ApplicationPage;
