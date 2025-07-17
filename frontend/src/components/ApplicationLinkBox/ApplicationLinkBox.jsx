import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Row,
  Col,
  InputGroup,
  Toast,
  ToastContainer,
  Spinner,
  Card,
} from "react-bootstrap";
import { FaCopy, FaLink } from "react-icons/fa";
import Select from "react-select";
import axiosInstance from "../../api/config";
import ApplicationBoxFallback from "../DashboardFallBack/ApplicationBoxFallback";

export default function ApplicationLinkBox() {
  const [form, setForm] = useState({
    distinction_name: "",
    position: null,
    is_coordinator: false,
    number_remaining_applicants_to_limit: "",
    skills: [],
  });

  const [positions, setPositions] = useState([]);
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "success",
  });

  /* ────────────────────────────────────────────────────────────────────────── */
  /* Fetch dropdown data                                                       */
  /* ────────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const [positionsRes, skillsRes] = await Promise.all([
          axiosInstance.get("hr/positions/"),
          axiosInstance.get("hr/skills/"),
        ]);
        setPositions(
          (Array.isArray(positionsRes.data)
            ? positionsRes.data
            : positionsRes.data.results
          ).map((p) => ({ value: p.id, label: p.name }))
        );
        setSkillsOptions(
          (Array.isArray(skillsRes.data)
            ? skillsRes.data
            : skillsRes.data.results
          ).map((s) => ({
            value: s.id,
            label: s.name,
          }))
        );
      } catch (err) {
        console.error(err);
        triggerToast("Error loading dropdown options", "danger");
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, []);

  /* ────────────────────────────────────────────────────────────────────────── */
  /* Handlers                                                                  */
  /* ────────────────────────────────────────────────────────────────────────── */
  const handleChange = (field) => (e) => {
    if (field === "skills") {
      setForm({ ...form, skills: e });
    } else if (field === "position") {
      setForm({ ...form, position: e });
    } else {
      setForm({
        ...form,
        [field]:
          e.target.type === "checkbox" ? e.target.checked : e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedLink("");

    // Generate the URL automatically
    const generatedUrl = `${window.location.origin}/apply/${form.distinction_name}/`;

    try {
      const payload = {
        url: generatedUrl, // Use the auto-generated URL
        distinction_name: form.distinction_name,
        position: form.position?.value,
        is_coordinator: form.is_coordinator,
        number_remaining_applicants_to_limit: Number(
          form.number_remaining_applicants_to_limit
        ),
        skills: form.skills.map((s) => s.value),
      };

      const { data } = await axiosInstance.post(
        "hr/application-links/",
        payload
      );
      setGeneratedLink(generatedUrl); // Show the auto-generated URL
      triggerToast("Link generated successfully!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to generate link", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    triggerToast("Link copied to clipboard!", "info");
  };

  const triggerToast = (message, variant = "success") => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast({ show: false, message: "", variant }), 2500);
  };

  if (loadingOptions) {
    return (
      <ApplicationBoxFallback />
    );
  }

  /* ────────────────────────────────────────────────────────────────────────── */
  /* Component                                                                 */
  /* ────────────────────────────────────────────────────────────────────────── */
  return (
    <Card
      className="shadow-sm border-0 mt-4"
      style={{ maxWidth: 720, margin: "0 auto" }}
    >
      <Card.Body className="p-md-5 p-4">
        <h4 className="mb-4 fw-semibold d-flex align-items-center gap-2">
          <FaLink /> Application Link Generator
        </h4>

        {loadingOptions ? (
          <div className="py-5 text-center">
            <Spinner animation="border" />
          </div>
        ) : (
          <Form onSubmit={handleSubmit} className="gy-3">
            {/* Removed URL input field */}

            {/* Distinction */}
            <Form.Group className="mb-3">
              <Form.Label>Distinction Name</Form.Label>
              <Form.Control
                type="text"
                value={form.distinction_name}
                onChange={handleChange("distinction_name")}
                placeholder="e.g. fullstack-dev-2025"
                required
              />
            </Form.Group>

            {/* Position */}
            <Form.Group className="mb-3">
              <Form.Label>Position</Form.Label>
              <Select
                options={positions}
                value={form.position}
                onChange={handleChange("position")}
                placeholder="Select a position…"
                classNamePrefix="react-select"
              />
            </Form.Group>

            {/* Skills */}
            <Form.Group className="mb-3">
              <Form.Label>Skills</Form.Label>
              <Select
                options={skillsOptions}
                value={form.skills}
                isMulti
                onChange={handleChange("skills")}
                placeholder="Select skills…"
                classNamePrefix="react-select"
              />
            </Form.Group>

            {/* Remaining + Coordinator */}
            <Row className="mb-3 g-3 align-items-end">
              <Form.Group as={Col} md={6}>
                <Form.Label>Remaining Applicants</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={form.number_remaining_applicants_to_limit}
                  onChange={handleChange(
                    "number_remaining_applicants_to_limit"
                  )}
                  required
                />
              </Form.Group>

              <Form.Group as={Col} md={6} className="ps-md-4">
                <Form.Check
                  label="Is Coordinator"
                  checked={form.is_coordinator}
                  onChange={handleChange("is_coordinator")}
                />
              </Form.Group>
            </Row>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading}
            >
              {loading ? "Generating…" : "Generate Link"}
            </Button>
          </Form>
        )}

        {/* Generated Link */}
        {generatedLink && (
          <div className="mt-4">
            <Form.Label>Generated Link</Form.Label>
            <InputGroup>
              <Form.Control
                readOnly
                value={generatedLink}
                onClick={handleCopy}
                style={{ cursor: "pointer" }}
                title="Click to copy"
              />
              <Button variant="outline-success" onClick={handleCopy}>
                <FaCopy className="me-2" /> Copy
              </Button>
            </InputGroup>
          </div>
        )}
      </Card.Body>

      {/* Toast */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={toast.show}
          bg={toast.variant}
          onClose={() => setToast({ ...toast, show: false })}
        >
          <Toast.Body className="text-white small">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Card>
  );
}
