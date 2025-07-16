import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Row,
  Col,
  ListGroup,
  Modal,
  Badge,
  InputGroup,
} from "react-bootstrap";
import axiosInstance from "../../api/config";
import { FaPlus, FaQuestionCircle, FaStar, FaTrash } from "react-icons/fa";

const InterviewForm = ({ candidateId, onSubmitted }) => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [avgGrade, setAvgGrade] = useState(0);
  const [gradeUpdates, setGradeUpdates] = useState({});

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/hr/employees/${candidateId}/my-interview-questions/`
      );
      setQuestions(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch questions");
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      setLoading(true);
      await axiosInstance.post(`/hr/employees/${candidateId}/add-question/`, {
        text: newQuestion,
      });
      setNewQuestion("");
      fetchQuestions(); // Refresh the list
    } catch (err) {
      setError("Failed to add question");
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    try {
      setLoading(true);
      await axiosInstance.post(
        `/hr/employees/${candidateId}/delete-question/`,
        {
          question_id: questionId,
        }
      );
      fetchQuestions(); // Refresh the list
    } catch (err) {
      setError("Failed to delete question");
      setLoading(false);
    }
  };

  const updateQuestionGrade = async (questionId) => {
    const grade = gradeUpdates[questionId];
    if (grade === undefined || isNaN(grade)) return;

    try {
      setLoading(true);
      await axiosInstance.patch(
        `/hr/employees/${candidateId}/update-question-grade/`,
        {
          question_id: questionId,
          grade: parseFloat(grade),
        }
      );
      setGradeUpdates((prev) => {
        const newUpdates = { ...prev };
        delete newUpdates[questionId];
        return newUpdates;
      });
      fetchQuestions(); // Refresh the list
    } catch (err) {
      setError("Failed to update grade");
      setLoading(false);
    }
  };

  const handleGradeChange = (questionId, value) => {
    setGradeUpdates((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const calculateAverageGrade = () => {
    if (questions.length === 0) return 0;
    const sum = questions.reduce((total, q) => total + (q.grade || 0), 0);
    return (sum / questions.length).toFixed(2);
  };

  const prepareSubmitInterview = async () => {
    setAvgGrade(calculateAverageGrade());
    setShowSubmitModal(true);
  };

  const submitInterview = async () => {
    try {
      setLoading(true);
      // First submit the rating
      await axiosInstance.patch(
        `/hr/employees/${candidateId}/rate-interviewee/`,
        {
          rating: parseFloat(rating),
        }
      );

      // Then submit the interview
      await axiosInstance.patch(
        `/hr/employees/${candidateId}/submit-interview/`
      );

      setShowSubmitModal(false);
      onSubmitted(); // This will trigger the parent component to reload
    } catch (err) {
      setError("Failed to submit interview");
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-danger mb-3">
          {error}
          <button
            type="button"
            className="btn-close float-end"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      <Form.Group className="mb-4">
        <Form.Label className="fw-bold">Add New Question</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Enter your question"
          />
          <Button
            variant="primary"
            onClick={addQuestion}
            disabled={loading || !newQuestion.trim()}
          >
            Add
          </Button>
        </InputGroup>
      </Form.Group>

      <div className="mb-4">
        <h6 className="fw-bold mb-3">Interview Questions</h6>
        {loading && questions.length === 0 ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <p className="text-muted">No questions added yet</p>
        ) : (
          <ListGroup className="mb-4">
            {questions.map((question) => (
              <ListGroup.Item
                key={question.id}
                className="py-3 px-3 d-flex justify-content-between align-items-center"
              >
                <div className="me-3 flex-grow-1 fw-semibold text-break">
                  <FaQuestionCircle className="text-primary me-2" />
                  {question.text}
                </div>

                <div className="d-flex align-items-center gap-2">
                  {/* Grade Badge with Star Icon */}

                    {question.grade || 0}/100

                  {/* Grade Update Input Group */}
                  <InputGroup style={{ width: "160px" }}>
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Grade"
                      value={gradeUpdates[question.id] || ""}
                      onChange={(e) =>
                        handleGradeChange(question.id, e.target.value)
                      }
                      className="py-1"
                    />
                    <Button
                      variant="outline-primary"
                      onClick={() => updateQuestionGrade(question.id)}
                      disabled={
                        loading || gradeUpdates[question.id] === undefined
                      }
                      className="px-2 d-flex align-items-center"
                    >
                      <FaPlus size={14} />
                    </Button>
                  </InputGroup>

                  {/* Delete Button */}
                  <Button
                    variant="outline-danger"
                    onClick={() => deleteQuestion(question.id)}
                    disabled={loading}
                    className="px-2"
                    title="Delete question"
                  >
                    <FaTrash size={14} />
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>

      <div className="d-flex justify-content-end mt-4">
        <Button
          variant="success"
          onClick={prepareSubmitInterview}
          disabled={loading || questions.length === 0}
        >
          Submit Interview
        </Button>
      </div>

      {/* Submit Interview Modal */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Submit Interview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Average Question Grade</Form.Label>
            <Form.Control type="text" value={avgGrade} readOnly />
          </Form.Group>

          <Form.Group>
            <Form.Label>Final Rating (0-100)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max="100"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSubmitModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submitInterview}
            disabled={loading || !rating}
          >
            Confirm Submission
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InterviewForm;
