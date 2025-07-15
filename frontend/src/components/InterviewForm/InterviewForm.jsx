import React, { useState, useEffect } from "react";
import { Form, Button, Spinner, Modal, Row, Col, InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import axiosInstance from "../../api/config";
import { FaPlus, FaTrash } from "react-icons/fa";

export default function InterviewForm({ candidateId, onSubmitted }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [avgGrade, setAvgGrade] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axiosInstance.get(`/hr/employees/${candidateId}/interview-questions/`);
        setQuestions(res.data);
      } catch (err) {
        console.error("Failed to load interview questions", err);
        toast.error("Failed to load interview questions");
      }
    };

    fetchQuestions();
  }, [candidateId]);

  const addQuestionField = () => {
    setQuestions([...questions, { id: null, text: "", grade: "" }]);
  };

  const removeQuestionField = async (idx) => {
    const questionToRemove = questions[idx];
    if (questionToRemove.id) {
      try {
        await axiosInstance.delete(`/hr/employees/${candidateId}/delete-question/${questionToRemove.id}/`);
      } catch (err) {
        toast.error("Failed to delete question");
      }
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateField = (idx, field, value) => {
    setQuestions(questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

 const handleSubmitQuestions = async () => {
  try {
    setLoading(true);
    let total = 0;
    let count = 0;
    const updatedQuestions = [];

    for (const q of questions) {
      if (q.text.trim()) {
        let questionRes;

        // First create/update the question text
        if (!q.id) {
          questionRes = await axiosInstance.post(`/hr/employees/${candidateId}/add-question/`, {
            text: q.text,
          });
        } else {
          questionRes = { data: { id: q.id } };
          await axiosInstance.patch(`/hr/employees/${candidateId}/edit-question/${q.id}/`, {
            text: q.text,
          });
        }

        // Then update the grade with the correct question_id
        if (questionRes.data.id) {
          await axiosInstance.patch(
            `/hr/employees/${candidateId}/update-question-grade/`,
            {
              question_id: questionRes.data.id,
              grade: parseFloat(q.grade) || 0,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );

          updatedQuestions.push({ ...q, id: questionRes.data.id });
          total += parseFloat(q.grade) || 0;
          count++;
        }
      }
    }

    setQuestions(updatedQuestions);
    const average = count ? (total / count).toFixed(1) : 0;
    setAvgGrade(average);
    setShowRatingModal(true);
    toast.success("Questions submitted. Please rate interview");
  } catch (err) {
    console.error("Failed to submit questions", err);
    if (err.response) {
      console.error("Response data:", err.response.data);
      console.error("Response status:", err.response.status);
    }
    toast.error("Failed to submit questions");
  } finally {
    setLoading(false);
  }
};

  const handleSubmitRating = async () => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/hr/employees/${candidateId}/rate-interviewee/`, {
        rating: parseFloat(rating),
      });

      await axiosInstance.patch(`/hr/employees/${candidateId}/submit-interview/`);
      toast.success("Interview submitted successfully");
      setShowRatingModal(false);
      onSubmitted();
    } catch (err) {
      console.error("Failed to submit interview", err);
      toast.error("Failed to submit interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h6 className="fw-bold mb-3">Interview Questions</h6>
      {questions.map((q, idx) => (
        <Row key={idx} className="align-items-center g-2 mb-2">
          <Col md={8}>
            <Form.Control
              placeholder="Question text"
              value={q.text}
              onChange={(e) => updateField(idx, "text", e.target.value)}
            />
          </Col>
          <Col md={3}>
            <InputGroup>
              <Form.Control
                type="number"
                placeholder="Grade"
                value={q.grade}
                onChange={(e) => updateField(idx, "grade", e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={1} className="text-end">
            {questions.length > 1 && (
              <Button variant="outline-danger" size="sm" onClick={() => removeQuestionField(idx)}>
                <FaTrash />
              </Button>
            )}
          </Col>
        </Row>
      ))}
      <Button variant="outline-secondary" size="sm" onClick={addQuestionField} className="mb-3">
        <FaPlus className="me-1" /> Add Question
      </Button>

      <div className="text-end">
        <Button onClick={handleSubmitQuestions} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Submit Questions"}
        </Button>
      </div>

      <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rate Interview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Average Questions Grade: <strong>{avgGrade}</strong></p>
          <Form.Group>
            <Form.Label>Interview Rating (0-100)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={100}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRatingModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmitRating} disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : "Submit Rating"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
