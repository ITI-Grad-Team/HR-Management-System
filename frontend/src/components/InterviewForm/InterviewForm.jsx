import React, { useState, useEffect, useCallback } from "react";
import { Form, Button, Spinner, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import axiosInstance from "../../api/config";
import { FaPlus, FaQuestionCircle, FaStar, FaTrash } from "react-icons/fa";

export default function InterviewForm({ candidateId, onSubmitted }) {
  // State
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [rating, setRating] = useState("");
  const [errors, setErrors] = useState({ questions: [], rating: "" });

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/hr/employees/${candidateId}/my-interview-questions/`);
        console.log("Fetched questions:", response.data); // Debug
        const fetchedQuestions = response.data.map((q) => ({
          id: q.id,
          text: q.text || "",
          grade: q.grade !== null && q.grade !== undefined ? Number(q.grade) : null,
        }));
        setQuestions(fetchedQuestions);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        toast.error("Failed to load interview questions");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [candidateId]);

  // Validate single question
  const validateQuestion = useCallback((question, index) => {
    const errs = [];
    if (!question.text.trim()) {
      errs.push(`Question ${index + 1}: Text is required`);
    }
    if (question.grade !== null && (isNaN(question.grade) || question.grade < 0 || question.grade > 100)) {
      errs.push(`Question ${index + 1}: Grade must be between 0 and 100`);
    }
    return errs;
  }, []);

  // Validate all questions
  const validateQuestions = useCallback(() => {
    const questionErrors = questions.map((q, i) => validateQuestion(q, i)).flat();
    setErrors((prev) => ({ ...prev, questions: questionErrors }));
    return questionErrors.length === 0;
  }, [questions, validateQuestion]);

  // Validate rating
  const validateRating = useCallback(() => {
    const n = Number(rating);
    if (rating === "" || isNaN(n) || n < 0 || n > 100) {
      setErrors((prev) => ({ ...prev, rating: "Rating must be between 0 and 100" }));
      return false;
    }
    setErrors((prev) => ({ ...prev, rating: "" }));
    return true;
  }, [rating]);

  // Add new question
  const addQuestion = () => {
    setQuestions([...questions, { id: null, text: "", grade: null }]);
  };

  // Remove question
  const removeQuestion = async (index) => {
    const question = questions[index];
    if (question.id) {
      setIsLoading(true);
      try {
        await axiosInstance.delete(`/hr/employees/${candidateId}/delete-question/${question.id}/`);
        toast.success("Question deleted successfully");
      } catch (err) {
        console.error("Failed to delete question:", err);
        toast.error("Failed to delete question");
        setIsLoading(false);
        return;
      }
    }
    setQuestions(questions.filter((_, i) => i !== index));
    setIsLoading(false);
    validateQuestions();
  };

  // Update question or grade
  const updateQuestion = (index, field, value) => {
    const newQuestions = questions.map((q, i) =>
      i === index ? { ...q, [field]: field === "grade" ? (value === "" ? null : Number(value)) : value } : q
    );
    setQuestions(newQuestions);
    console.log("Updated questions:", questions); // Debug
    validateQuestions();
  };

  // Submit questions and grades
  const handleSubmitQuestions = async () => {
    if (!validateQuestions()) {
      toast.error("Please fix the errors in the questions");
      return;
    }

    setIsLoading(true);
    const updatedQuestions = [];
    try {
      for (const q of questions) {
        let id = q.id;
        try {
          // Create or update question
          if (!id) {
            const response = await axiosInstance.post(`/hr/employees/${candidateId}/add-question/`, {
              text: q.text,
            });
            id = response.data.id;
            console.log("Created question ID:", id); // Debug
          } else {
            await axiosInstance.patch(`/hr/employees/${candidateId}/edit-question/${id}/`, {
              text: q.text,
            });
            console.log("Updated question ID:", id); // Debug
          }

          // Update grade if provided
          if (q.grade !== null) {
            console.log("Submitting grade:", q.grade, "for question ID:", id); // Debug
            const gradeResponse = await axiosInstance.patch(
              `/hr/employees/${candidateId}/update-question-grade/`,
              { question_id: id, grade: q.grade }
            );
            console.log("Grade update response:", gradeResponse.data); // Debug
            updatedQuestions.push({
              ...q,
              id,
              grade: gradeResponse.data.grade !== undefined ? Number(gradeResponse.data.grade) : q.grade,
            });
          } else {
            updatedQuestions.push({ ...q, id });
          }
        } catch (err) {
          console.error("Error processing question:", err);
          toast.error(`Failed to save question: ${q.text.substring(0, 20)}...`);
        }
      }

      setQuestions(updatedQuestions);
      setIsRatingModalOpen(true);
      toast.success("Questions saved successfully – please provide a final rating");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to submit questions");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit final rating
  const handleSubmitRating = async () => {
    if (!validateRating()) {
      toast.error(errors.rating);
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.patch(`/hr/employees/${candidateId}/rate-interviewee/`, {
        rating: Number(rating),
      });
      await axiosInstance.patch(`/hr/employees/${candidateId}/submit-interview/`);
      toast.success("Interview submitted successfully");
      setIsRatingModalOpen(false);
      setRating("");
      onSubmitted();
    } catch (err) {
      console.error("Rating submission error:", err);
      toast.error("Failed to submit interview rating");
    } finally {
      setIsLoading(false);
    }
  };

  // Render
  return (
    <div
      className="mt-4 p-4 rounded-3"
      style={{ backgroundColor: "#f8f9fa", border: "1px solid rgba(0,0,0,0.05)" }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h6 className="fw-bold mb-0 text-primary">
          <FaQuestionCircle className="me-2" /> Interview Questions
        </h6>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={addQuestion}
          className="rounded-pill"
          disabled={isLoading}
        >
          <FaPlus className="me-1" /> Add Question
        </Button>
      </div>

      {/* Questions List */}
      {isLoading && questions.length === 0 ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
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
                  onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                  className="border-2 mb-2"
                  style={{ borderRadius: "8px" }}
                  isInvalid={errors.questions.some((err) => err.includes(`Question ${idx + 1}`))}
                  disabled={isLoading}
                />
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Grade:</span>
                  <Form.Control
                    type="number"
                    placeholder="0–100"
                    value={q.grade ?? ""}
                    onChange={(e) => updateQuestion(idx, "grade", e.target.value)}
                    min="0"
                    max="100"
                    step="1"
                    className="border-2"
                    style={{ width: "100px", borderRadius: "8px" }}
                    isInvalid={errors.questions.some((err) => err.includes(`Question ${idx + 1}: Grade`))}
                    disabled={isLoading}
                  />
                </div>
                {errors.questions
                  .filter((err) => err.includes(`Question ${idx + 1}`))
                  .map((err, i) => (
                    <Form.Text key={i} className="text-danger">
                      {err}
                    </Form.Text>
                  ))}
              </div>
              {questions.length > 1 && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeQuestion(idx)}
                  className="rounded-circle p-2"
                  style={{ width: "36px", height: "36px" }}
                  disabled={isLoading}
                >
                  <FaTrash size={12} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
        <small className="text-muted">
          {questions.length} question{questions.length !== 1 ? "s" : ""} added
        </small>
        <Button
          onClick={handleSubmitQuestions}
          disabled={isLoading || questions.length === 0}
          variant="primary"
          className="rounded-pill px-4"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Submitting...
            </>
          ) : (
            "Submit Questions"
          )}
        </Button>
      </div>

      {/* Rating Modal */}
      <Modal show={isRatingModalOpen} onHide={() => setIsRatingModalOpen(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaStar className="me-2 text-warning" /> Rate Interview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold text-muted">Final Interview Rating (0–100)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={100}
              value={rating}
              onChange={(e) => {
                setRating(e.target.value);
                validateRating();
              }}
              className="border-2 py-2"
              isInvalid={!!errors.rating}
              disabled={isLoading}
            />
            {errors.rating && <Form.Text className="text-danger">{errors.rating}</Form.Text>}
          </Form.Group>
          <div className="d-flex justify-content-end gap-3">
            <Button
              variant="outline-secondary"
              onClick={() => setIsRatingModalOpen(false)}
              className="rounded-pill px-4"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitRating}
              disabled={isLoading || !!errors.rating}
              className="rounded-pill px-4"
            >
              {isLoading ? (
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