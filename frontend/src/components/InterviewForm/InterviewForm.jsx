import React, { useState, useEffect } from "react";
import { Form, Button, Spinner, Modal, Row, Col, InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import axiosInstance from "../../api/config";
import { FaPlus, FaQuestionCircle, FaStar, FaTrash } from "react-icons/fa";

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
    <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid rgba(0,0,0,0.05)' }}>
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

  <div className="mb-4">
    {questions.map((q, idx) => (
      <div 
        key={idx} 
        className="d-flex align-items-center gap-3 mb-3 p-3 rounded-3" 
        style={{ 
          backgroundColor: '#fff', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease'
        }}
      >
        <div className="flex-grow-1">
          <Form.Control
            placeholder="Enter question text..."
            value={q.text}
            onChange={(e) => updateField(idx, "text", e.target.value)}
            className="border-2 mb-2"
            style={{ borderRadius: '8px' }}
          />
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Grade:</span>
            <Form.Control
              type="number"
              placeholder="0-100"
              value={q.grade}
              onChange={(e) => updateField(idx, "grade", e.target.value)}
              min="0"
              max="100"
              className="border-2"
              style={{ width: '100px', borderRadius: '8px' }}
            />
          </div>
        </div>
        {questions.length > 1 && (
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={() => removeQuestionField(idx)}
            className="rounded-circle p-2"
            style={{ width: '36px', height: '36px' }}
          >
            <FaTrash size={12} />
          </Button>
        )}
      </div>
    ))}
  </div>

  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
    <small className="text-muted">
      {questions.length} question{questions.length !== 1 ? 's' : ''} added
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

  {/* Rating Modal */}
  <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
    <Modal.Header closeButton className="border-0 pb-0">
      <Modal.Title className="fw-bold">
        <FaStar className="me-2 text-warning" /> Rate Interview
      </Modal.Title>
    </Modal.Header>
    <Modal.Body className="pt-0">
      <div className="alert alert-light mb-4">
        <div className="d-flex justify-content-between">
          <span>Average Questions Grade:</span>
          <strong className={avgGrade > 70 ? 'text-success' : avgGrade > 50 ? 'text-warning' : 'text-danger'}>
            {avgGrade}
          </strong>
        </div>
      </div>
      
      <Form.Group className="mb-4">
        <Form.Label className="fw-semibold text-muted">Final Interview Rating (0-100)</Form.Label>
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
