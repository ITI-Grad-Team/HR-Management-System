import React, { useState, useEffect } from "react";
import { Form, Button, Spinner, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import axiosInstance from "../../api/config";
import { FaPlus, FaQuestionCircle, FaStar, FaTrash } from "react-icons/fa";

export default function InterviewForm({ candidateId, onSubmitted }) {
  // QUESTIONS --------------------------------------------------------------
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // RATING -----------------------------------------------------------------
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState("");

  // FETCH ------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(
          `/hr/employees/${candidateId}/interview-questions/`
        );

        // keep **null** if no grade yet – fixes “grades come back as 0”
        const questionsWithGrades = res.data.map((q) => ({
          ...q,
          grade: q.grade !== null ? Number(q.grade) : null,
        }));
        setQuestions(questionsWithGrades);
      } catch (err) {
        console.error("Failed to load interview questions", err);
        toast.error("Failed to load interview questions");
      }
    })();
  }, [candidateId]);

  // HELPERS ----------------------------------------------------------------
  const addQuestionField = () => {
    setQuestions([...questions, { id: null, text: "", grade: null }]);
  };

  const removeQuestionField = async (idx) => {
    const q = questions[idx];
    if (q.id) {
      try {
        await axiosInstance.delete(
          `/hr/employees/${candidateId}/delete-question/${q.id}/`
        );
        toast.success("Question deleted successfully");
      } catch (err) {
        toast.error("Failed to delete question");
        return;
      }
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const clamp = (n) => Math.max(0, Math.min(100, n));

  const updateField = (idx, field, value) => {
    setQuestions(
      questions.map((q, i) =>
        i === idx
          ? {
              ...q,
              [field]:
                field === "grade"
                  ? value === "" // allow empty input
                    ? null
                    : clamp(Number(value) || 0)
                  : value,
            }
          : q
      )
    );
  };

  const validateQuestions = () => {
    const errors = [];
    questions.forEach((q, i) => {
      if (!q.text.trim()) errors.push(`Question ${i + 1} is empty`);
      if (q.grade !== null && (isNaN(q.grade) || q.grade < 0 || q.grade > 100)) {
        errors.push(`Question ${i + 1} has invalid grade`);
      }
    });
    return errors;
  };

  // SUBMIT QUESTIONS -------------------------------------------------------
  const handleSubmitQuestions = async () => {
    const errs = validateQuestions();
    if (errs.length) {
      toast.error(`Please fix: ${errs.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const updated = [];

      for (const q of questions) {
        let id = q.id;
        try {
          // create / update question text
          if (!id) {
            const res = await axiosInstance.post(
              `/hr/employees/${candidateId}/add-question/`,
              { text: q.text }
            );
            id = res.data.id;
          } else {
            await axiosInstance.patch(
              `/hr/employees/${candidateId}/edit-question/${id}/`,
              { text: q.text }
            );
          }

          // update grade IF the interviewer actually entered one
          if (q.grade !== null) {
            const gr = await axiosInstance.patch(
              `/hr/employees/${candidateId}/update-question-grade/`,
              { question_id: id, grade: q.grade }
            );
            updated.push({ ...q, id, grade: gr.data.grade ?? q.grade });
          } else {
            updated.push({ ...q, id });
          }
        } catch (err) {
          console.error("Error processing question", err);
          toast.error(`Failed to save question: ${q.text.substring(0, 20)}...`);
        }
      }

      setQuestions(updated);
      setShowRatingModal(true);
      toast.success("Questions saved successfully – now rate the interview");
    } catch (err) {
      console.error("Submission error", err);
      toast.error("Failed to submit questions");
    } finally {
      setLoading(false);
    }
  };

  // SUBMIT RATING ----------------------------------------------------------
  const handleSubmitRating = async () => {
    const n = Number(rating);
    if (isNaN(n) || n < 0 || n > 100) {
      toast.error("Rating must be between 0‑100");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.patch(`/hr/employees/${candidateId}/rate-interviewee/`, {
        rating: n,
      });
      await axiosInstance.patch(`/hr/employees/${candidateId}/submit-interview/`);

      toast.success("Interview submitted successfully");
      setShowRatingModal(false);
      onSubmitted();
    } catch (err) {
      console.error("Rating submission error", err);
      toast.error("Failed to submit interview rating");
    } finally {
      setLoading(false);
    }
  };

  // RENDER -----------------------------------------------------------------
  return (
    <div
      className="mt-4 p-4 rounded-3"
      style={{ backgroundColor: "#f8f9fa", border: "1px solid rgba(0,0,0,0.05)" }}
    >
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h6 className="fw-bold mb-0 text-primary">
          <FaQuestionCircle className="me-2" /> Interview Questions
        </h6>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={addQuestionField}
          className="rounded-pill"
        >
          <FaPlus className="me-1" /> Add Question
        </Button>
      </div>

      {/* QUESTIONS LIST */}
      <div className="mb-4">
        {questions.map((q, idx) => (
          <div
            key={idx}
            className="d-flex align-items-center gap-3 mb-3 p-3 rounded-3"
            style={{ backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          >
            <div className="flex-grow-1">
              <Form.Control
                placeholder="Enter question text..."
                value={q.text}
                onChange={(e) => updateField(idx, "text", e.target.value)}
                className="border-2 mb-2"
                style={{ borderRadius: "8px" }}
              />
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Grade:</span>
                <Form.Control
                  type="number"
                  placeholder="0‑100"
                  value={q.grade ?? ""}
                  onChange={(e) => updateField(idx, "grade", e.target.value)}
                  min="0"
                  max="100"
                  step="1"
                  className="border-2"
                  style={{ width: "100px", borderRadius: "8px" }}
                  onBlur={(e) => {
                    const val = e.target.value === "" ? null : clamp(Number(e.target.value));
                    updateField(idx, "grade", val);
                  }}
                />
              </div>
            </div>
            {questions.length > 1 && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => removeQuestionField(idx)}
                className="rounded-circle p-2"
                style={{ width: "36px", height: "36px" }}
              >
                <FaTrash size={12} />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* SUBMIT BUTTON */}
      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
        <small className="text-muted">
          {questions.length} question{questions.length !== 1 ? "s" : ""} added
        </small>
        <Button
          onClick={handleSubmitQuestions}
          disabled={loading}
          variant="primary"
          className="rounded-pill px-4"
        >
          {loading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Submitting...
            </>
          ) : (
            "Submit Questions"
          )}
        </Button>
      </div>

      {/* RATING MODAL (no avg grade) */}
      <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaStar className="me-2 text-warning" /> Rate Interview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold text-muted">Final Interview Rating (0‑100)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={100}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="border-2 py-2"
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-3">
            <Button
              variant="outline-secondary"
              onClick={() => setShowRatingModal(false)}
              className="rounded-pill px-4"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitRating}
              disabled={loading}
              className="rounded-pill px-4"
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Submitting
                </>
              ) : (
                "Submit Rating"
              )}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
