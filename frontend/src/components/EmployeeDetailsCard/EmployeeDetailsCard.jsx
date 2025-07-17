import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  Button,
  Badge,
  Row,
  Col,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import {
  FaPhone,
  FaDownload,
  FaBriefcase,
  FaMapMarkerAlt,
  FaUserGraduate,
  FaEdit,
  FaUser,
  FaCode,
  FaFileAlt,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaUsers,
  FaEnvelope,
  FaExclamationTriangle,
  FaRegChartBar,
  FaRobot,
  FaInfo,
  FaMoneyBill,
  FaCalendar,
  FaCalendarPlus,
  FaTimesCircle,
  FaLaptopHouse,
  FaStar,
  FaClock,
  FaCalendarMinus,
} from "react-icons/fa";
import Select from "react-select";
import axiosInstance from "../../api/config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaClipboardCheck, FaCheckDouble } from "react-icons/fa";
export default function CandidateDetailsCard({
  candidate,
  loggedInHrId,
  onTake,
  onSchedule,
  loadingProp,
  onPredictUpdate,
}) {
  const navigate = useNavigate();
  const {
    basicinfo,
    position,
    region,
    highest_education_degree,
    highest_education_field,
    phone,
    cv,
    had_leadership_role,
    has_position_related_high_education,
    years_of_experience,
    percentage_of_matching_skills,
    skills,
    interview_state,
    interviewer,
    is_coordinator,
    last_prediction_date,
    user,
    id: candidateId,
  } = candidate;
  const [localState, setLocalState] = useState(interview_state);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    basic_salary: "",
    overtime_hour_salary: "",
    shorttime_hour_penalty: "",
    absence_penalty: "",
    expected_attend_time: "09:00",
    expected_leave_time: "17:00",
    weekdays: [],
    yeardays: [{ month: "", day: "" }],
  });
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);
  const [showCvEditModal, setShowCvEditModal] = useState(false);
  const [cvFormData, setCvFormData] = useState({
    years_of_experience: candidate.years_of_experience,
    had_leadership_role: candidate.had_leadership_role || false,
    has_position_related_high_education:candidate.has_position_related_high_education || false,
  });
  const [allSkills, setAllSkills] = useState([]);
  const [allRegions, setAllRegions] = useState([]);
  const [allDegrees, setAllDegrees] = useState([]);
  const [allEducationFields, setAllEducationFields] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [skillsRes, regionsRes, degreesRes, fieldsRes] =
          await Promise.all([
            axiosInstance.get(
              `${
                role === "hr" ? "hr" : role === "admin" ? "admin" : ""
              }/skills/`
            ),
            axiosInstance.get(
              `${
                role === "hr" ? "hr" : role === "admin" ? "admin" : ""
              }/regions/`
            ),
            axiosInstance.get(
              `${
                role === "hr" ? "hr" : role === "admin" ? "admin" : ""
              }/degrees/`
            ),
            axiosInstance.get(
              `${
                role === "hr" ? "hr" : role === "admin" ? "admin" : ""
              }/fields/`
            ),
          ]);

        setAllSkills(
          skillsRes.data.results.map((s) => ({ value: s.id, label: s.name }))
        );
        setAllRegions(
          regionsRes.data.results.map((r) => ({ value: r.id, label: r.name }))
        );
        setAllDegrees(
          degreesRes.data.results.map((d) => ({ value: d.id, label: d.name }))
        );
        setAllEducationFields(
          fieldsRes.data.results.map((f) => ({ value: f.id, label: f.name }))
        );
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
        toast.error("Failed to load dropdown options");
      }
    };

    if (showCvEditModal) {
      fetchDropdownData();
    }
  }, [showCvEditModal]);

  /* ---------------- Schedule ---------------- */
  const handleScheduleSubmit = async () => {
    try {
      setLoading(true); // Add this line
      await axiosInstance.patch(
        `/hr/employees/${candidateId}/schedule-interview/`,
        {
          interview_datetime: scheduleDate,
        }
      );
      setLocalState("scheduled");
      toast.success("Interview scheduled");
      setShowScheduleModal(false);
      onSchedule?.(); // Make sure this callback is properly passed from parent
    } catch (err) {
      toast.error("Failed to schedule interview");
      console.error(err);
    } finally {
      setLoading(false); // Add this line
    }
  };
  /* ---------------- Accept Employee ---------------- */
  const handleAcceptSubmit = async () => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/hr/accept-employee/${candidateId}/`, {
        ...formData,
        expected_attend_time: formData.expected_attend_time + ":00",
        expected_leave_time: formData.expected_leave_time + ":00",
      });
      toast.success("Candidate accepted successfully");
      setShowAcceptModal(false);
      setLocalState("accepted");
      // You might want to redirect or refresh data here
    } catch (err) {
      toast.error("Failed to accept candidate");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Reject Employee ---------------- */
  const handleRejectSubmit = async () => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/hr/reject-employee/${candidateId}/`);
      toast.success("Candidate rejected successfully");
      setShowRejectModal(false);
      navigate("/employees"); // Redirect to employees page
    } catch (err) {
      toast.error("Failed to reject candidate");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Form Handlers ---------------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWeekdayToggle = (day) => {
    setFormData((prev) => {
      const newWeekdays = prev.weekdays.includes(day)
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day];
      return { ...prev, weekdays: newWeekdays };
    });
  };

  const handleYeardayChange = (index, field, value) => {
    setFormData((prev) => {
      const newYeardays = [...prev.yeardays];
      newYeardays[index] = { ...newYeardays[index], [field]: value };
      return { ...prev, yeardays: newYeardays };
    });
  };

  const addYearday = () => {
    setFormData((prev) => ({
      ...prev,
      yeardays: [...prev.yeardays, { month: "", day: "" }],
    }));
  };

  const removeYearday = (index) => {
    setFormData((prev) => ({
      ...prev,
      yeardays: prev.yeardays.filter((_, i) => i !== index),
    }));
  };

  const weekdays = [
    { label: "Sunday", value: "Sunday" },
    { label: "Monday", value: "Monday" },
    { label: "Tuesday", value: "Tuesday" },
    { label: "Wednesday", value: "Wednesday" },
    { label: "Thursday", value: "Thursday" },
    { label: "Friday", value: "Friday" },
    { label: "Saturday", value: "Saturday" },
  ];

  /* ---------------- Render Buttons ---------------- */
  const renderInterviewActions = () => {
    if (localState === "done" && interviewer === loggedInHrId) {
      return (
        <div className="d-flex align-items-center gap-3">
          {/* Interview Rating Card */}
          <div className="bg-light p-3 rounded d-flex align-items-center gap-2">
            <div className="bg-info bg-opacity-10 p-2 rounded">
              <FaCheckDouble className="text-info" />
            </div>
            <div>
              <small className="text-muted d-block">Your Grade</small>
              <strong className="fs-5">
                {candidate.interviewer_rating || "N/A"}/100
              </strong>
            </div>
          </div>

          {/* Questions Average Grade Card */}
          <div className="bg-light p-3 rounded d-flex align-items-center gap-2">
            <div className="bg-info bg-opacity-10 p-2 rounded">
              <FaClipboardCheck className="text-info" />
            </div>
            <div>
              <small className="text-muted d-block">Questions Avg Grade</small>
              <strong className="fs-5">
                {candidate.interview_questions_avg_grade || "N/A"}/100
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2">
            <Button
              variant="success"
              onClick={() => setShowAcceptModal(true)}
              className="d-flex align-items-center gap-1"
            >
              <FaCheck /> Accept
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowRejectModal(true)}
              className="d-flex align-items-center gap-1"
            >
              <FaTimes /> Reject
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="d-flex gap-2">
        {(!candidate.scheduling_interviewer ||
          candidate.scheduling_interviewer === loggedInHrId) &&
          candidate.interview_state !== "done" && (
            <Button
              variant="outline-success"
              onClick={() => setShowScheduleModal(true)}
            >
              {candidate.scheduling_interviewer === loggedInHrId
                ? "Re-Schedule Interview"
                : "Schedule Interview"}
            </Button>
          )}
        {/* Take Interview Button - Only show if scheduled but no interviewer assigned */}
        {!candidate.interviewer && (
          <Button variant="success" onClick={onTake} disabled={loadingProp}>
            {loadingProp ? (
              <Spinner as="span" size="sm" animation="border" />
            ) : (
              "Take Interview"
            )}
          </Button>
        )}
        {/* Status Indicators */}
        {candidate.scheduling_interviewer && (
          <Badge bg="success" className="align-self-center">
            Scheduled
          </Badge>
        )}
        {candidate.interviewer && (
          <Badge bg="success" className="align-self-center">
            Taken
          </Badge>
        )}
        {candidate.interview_state == "done" && (
          <Badge bg="success" className="align-self-center">
            Awaiting decision
          </Badge>
        )}
      </div>
    );
  };
  /* ---------------- Prediction ---------------- */
  const handlePredictAndUpdate = async () => {
    try {
      setPredictLoading(true);
      setPredictError(null);

      const response = await axiosInstance.post(
        `/employees/${candidateId}/predict-and-update/`
      );

      toast.success("Predictions updated successfully");
      onPredictUpdate?.();
      // Refresh the candidate data or close/reopen modal to see updates
      setShowPredictionModal(false);
      setShowPredictionModal(true); // This is a quick way to refresh, but you might want a better solution
    } catch (err) {
      if (err.response?.data?.error) {
        setPredictError(err.response.data.error);
        if (err.response.data.missing_fields) {
          setPredictError(
            `${
              err.response.data.error
            }: ${err.response.data.missing_fields.join(", ")}`
          );
        }
      } else {
        setPredictError("Prediction failed. Please try again.");
      }
      toast.error("Failed to update predictions");
    } finally {
      setTimeout(() => setPredictLoading(false), 1500);
    }
  };

  const hasNullFields = () => {
    const requiredFields = {
      region: candidate.region,
      highest_education_degree: candidate.highest_education_degree,
      highest_education_field: candidate.highest_education_field,
      years_of_experience: candidate.years_of_experience,
      had_leadership_role: candidate.had_leadership_role,
      percentage_of_matching_skills: candidate.percentage_of_matching_skills,
      has_position_related_high_education:
        candidate.has_position_related_high_education,
    };

    return Object.values(requiredFields).some((value) => value === null);
  };

  // cv data edit handler
  const { role } = useAuth();

  const handleCvDataUpdate = async () => {
    try {
      const updateData = {
        ...cvFormData,
        skills: selectedSkills.map((skill) => skill.value),
      };

      const response = await axiosInstance.patch(
        `/${
          role === "hr" ? "hr" : role === "admin" ? "admin" : ""
        }/employees/${candidateId}/update-cv-data/`,
        updateData
      );
      toast.success("CV data updated successfully");
      setShowCvEditModal(false);
      onPredictUpdate?.(); // Refresh the parent data
    } catch (err) {
      toast.error("Failed to update CV data");
      console.error(err);
    }
  };
  return (
    <>
      <Card
        className="p-4 border-0 shadow-sm rounded-4 mb-5"
        style={{ background: "linear-gradient(145deg, #ffffff, #f8f9fa)" }}
      >
        <Row className="g-4">
          {/* Avatar and Basic Info */}
          <Col
            md={4}
            className="text-center d-flex flex-column align-items-center"
          >
            <div className="position-relative mb-3">
              <img
                src={basicinfo?.profile_image}
                alt="avatar"
                className="rounded-circle shadow"
                style={{
                  width: "200px",
                  height: "200px",
                  objectFit: "cover",
                  border: "3px solid #fff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
              {percentage_of_matching_skills > 70 && (
                <div
                  className="position-absolute top-0 end-0 bg-success rounded-circle p-1"
                  style={{ transform: "translate(10%, -10%)" }}
                >
                  <FaCheck className="text-white" size={12} />
                </div>
              )}
            </div>
            <h5 className="mb-0 fw-bold text-dark">{basicinfo?.username}</h5>
            <p className="text-muted mb-2">{position}</p>
            <div className="d-flex gap-2">
              {region && (
                <Badge pill bg="light" text="dark" className="border">
                  <FaMapMarkerAlt className="text-primary" /> {region}
                </Badge>
              )}
              {years_of_experience !== null && (
                <Badge pill bg="light" text="dark" className="border">
                  <FaBriefcase className="text-primary" /> {years_of_experience}{" "}
                  yrs
                </Badge>
              )}
              {is_coordinator && (
                <Badge pill bg="light" text="dark" className="border">
                  <FaUsers className="text-primary" /> coordinator
                </Badge>
              )}
            </div>
          </Col>

          <Col md={8}>
            {/* Personal Info */}
            <div
              className="mb-4 p-3 rounded-3"
              style={{ background: "rgba(248,249,250,0.8)" }}
            >
              <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                <FaUser className="me-2" /> Personal Info
              </h6>
              <Row>
                <Col sm={6} className="mb-2">
                  <div className="d-flex align-items-center">
                    <FaPhone className="me-2 text-muted" />
                    <div>
                      <small className="text-muted d-block">Phone</small>
                      <span className="fw-semibold">{phone || "N/A"}</span>
                    </div>
                  </div>
                </Col>
                <Col sm={6} className="mb-2">
                  <div className="d-flex align-items-center">
                    <FaEnvelope className="me-2 text-muted" />
                    <div>
                      <small className="text-muted d-block">Email</small>
                      <span className="fw-semibold">
                        {user.username || "N/A"}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Education */}
            <div
              className="mb-4 p-3 rounded-3"
              style={{ background: "rgba(248,249,250,0.8)" }}
            >
              <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                <FaUserGraduate className="me-2" />
                <span>Education</span>
                <span className="fw-semibold text-muted ms-auto">
                  Position Match{" "}
                  {has_position_related_high_education
                    ? "✓"
                    : has_position_related_high_education === false
                    ? "✗"
                    : "❔"}
                </span>
              </h6>
              <div>
                <small className="text-muted d-block">Highest Degree</small>
                <span className="fw-semibold">
                  {highest_education_degree}{" "}
                  {highest_education_field
                    ? `in ${highest_education_field}`
                    : ""}
                </span>
              </div>
            </div>
            {/* Skills */}
            <div
              className="mb-4 p-3 rounded-3"
              style={{ background: "rgba(248,249,250,0.8)" }}
            >
              <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                <FaCode className="me-2" />
                <span>Skills</span>
                <span className="fw-semibold text-muted ms-auto">
                  Required Match{" "}
                  {percentage_of_matching_skills !== null
                    ? ` ${Math.round(percentage_of_matching_skills)}%`
                    : "❔"}
                </span>
              </h6>

              <div className="d-flex flex-wrap gap-2">
                {had_leadership_role && (
                  <Badge
                    pill
                    bg="warning"
                    text="dark"
                    className="px-3 py-2"
                    style={{ opacity: 0.9 }}
                  >
                    Leadership Experience
                  </Badge>
                )}
                {skills?.length > 0 ? (
                  <>
                    {/* Regular skills */}
                    {skills.map((skill, index) => (
                      <Badge
                        key={index}
                        pill
                        bg="primary"
                        className="px-3 py-2"
                        style={{ opacity: 0.9 }}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </>
                ) : (
                  <span className="text-muted">
                    {!had_leadership_role && "No skills listed"}
                  </span>
                )}
              </div>
            </div>

            {/* CV */}
            <div
              className="mb-4 p-3 rounded-3"
              style={{ background: "rgba(248,249,250,0.8)" }}
            >
              <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                <FaFileAlt className="me-2" /> Resume
              </h6>
              <Row className="g-4">
                <Col md={4}>
                  <a
                    href={cv}
                    className="btn btn-outline-primary d-inline-flex align-items-center gap-2 rounded-pill px-4"
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <FaDownload /> Download CV
                  </a>
                </Col>

                <Col md={4}>
                  <button
                    className="btn btn-info d-inline-flex align-items-center gap-2 rounded-pill px-4"
                    onClick={() => setShowCvEditModal(true)}
                  >
                    <FaEdit /> Edit CV info.
                  </button>
                </Col>
                <Col md={4}>
                  <button
                    className="btn btn-warning d-inline-flex align-items-center gap-2 rounded-pill px-4"
                    onClick={() => setShowPredictionModal(true)}
                  >
                    <FaRobot /> View Predictions
                  </button>
                </Col>
              </Row>
            </div>

            {/* Interview Actions */}
            {candidate.interview_state !== "accepted" && role === "hr" && (
              <div
                className="p-3 rounded-3"
                style={{ background: "rgba(248,249,250,0.8)" }}
              >
                <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                  <FaCalendarAlt className="me-2" />
                  <span>Interview</span>
                  {candidate.interview_datetime && (
                    <span className="fw-semibold text-muted ms-auto">
                      {new Date(candidate.interview_datetime).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  )}
                </h6>
                <div className="d-flex gap-3 flex-wrap mb-3">
                  {renderInterviewActions()}
                </div>
              </div>
            )}

            {candidate.interview_state === "accepted" && (
              <div
                className="mb-4 p-3 rounded-3"
                style={{ background: "rgba(248,249,250,0.8)" }}
              >
                <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                  <FaInfo className="me-2" /> Employee Info.
                </h6>
                <Row className="g-4">
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <FaMoneyBill className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">Salary</small>
                        <span className="fw-semibold">
                          $ {candidate?.basic_salary || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaCalendar className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Date Joined
                        </small>
                        <span className="fw-semibold">
                          {candidate?.join_date || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaCalendarPlus className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">Over Time</small>
                        <span className="fw-semibold">
                          $ {candidate?.overtime_hour_salary || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaTimesCircle className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Short Time Penalty
                        </small>
                        <span className="fw-semibold">
                          $ {candidate?.shorttime_hour_penalty || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaTimesCircle className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Absence Penalty
                        </small>
                        <span className="fw-semibold">
                          $ {candidate?.absence_penalty || "N/A"}
                        </span>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <FaCalendar className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Attendance Time
                        </small>
                        <span className="fw-semibold">
                          {candidate?.expected_attend_time || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaCalendar className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">Leave Time</small>
                        <span className="fw-semibold">
                          {candidate?.expected_leave_time || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaLaptopHouse className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Online days
                        </small>
                        <span className="fw-semibold">
                          {candidate?.number_of_non_holiday_days_since_join ||
                            0}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaCheck className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Accepted Tasks
                        </small>
                        <span className="fw-semibold">
                          {candidate?.number_of_accepted_tasks || 0}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaStar className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Total Task rating
                        </small>
                        <span className="fw-semibold">
                          {candidate?.total_task_ratings || 0} hrs
                        </span>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <FaClock className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Total Lateness Hrs
                        </small>
                        <span className="fw-semibold">
                          {candidate?.total_lateness_hours || 0} hrs
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaClock className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Total Time To DeadLine
                        </small>
                        <span className="fw-semibold">
                          {candidate?.total_time_remaining_before_deadline || 0}{" "}
                          hrs
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaClock className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Total Over Time Hrs
                        </small>
                        <span className="fw-semibold">
                          {candidate?.total_overtime_hours || 0} hrs
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                      <FaCalendarMinus className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">
                          Total Absence Days
                        </small>
                        <span className="fw-semibold">
                          {candidate?.total_absent_days || 0} hrs
                        </span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Schedule Modal */}
      <Modal
        show={showScheduleModal}
        onHide={() => setShowScheduleModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Schedule Interview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold text-muted">
              Date & Time
            </Form.Label>
            <Form.Control
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="border-2 py-2"
            />
          </Form.Group>
          <div className="d-flex justify-content-end gap-3">
            <Button
              variant="outline-secondary"
              onClick={() => setShowScheduleModal(false)}
              className="rounded-pill px-4"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleScheduleSubmit}
              className="rounded-pill px-4"
              disabled={loading}
            >
              Confirm
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Accept Employee Modal */}
      <Modal
        show={showAcceptModal}
        onHide={() => setShowAcceptModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaCheck className="me-2 text-success" /> Accept Employee
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Basic Salary</Form.Label>
                  <Form.Control
                    type="number"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleInputChange}
                    placeholder="Enter basic salary"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Overtime Hour Salary</Form.Label>
                  <Form.Control
                    type="number"
                    name="overtime_hour_salary"
                    value={formData.overtime_hour_salary}
                    onChange={handleInputChange}
                    placeholder="Enter overtime rate"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Shorttime Hour Penalty</Form.Label>
                  <Form.Control
                    type="number"
                    name="shorttime_hour_penalty"
                    value={formData.shorttime_hour_penalty}
                    onChange={handleInputChange}
                    placeholder="Enter shorttime penalty"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Absence Penalty</Form.Label>
                  <Form.Control
                    type="number"
                    name="absence_penalty"
                    value={formData.absence_penalty}
                    onChange={handleInputChange}
                    placeholder="Enter absence penalty"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expected Attend Time</Form.Label>
                  <Form.Control
                    type="time"
                    name="expected_attend_time"
                    value={formData.expected_attend_time}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expected Leave Time</Form.Label>
                  <Form.Control
                    type="time"
                    name="expected_leave_time"
                    value={formData.expected_leave_time}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Working Days</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <Button
                    key={day.value}
                    variant={
                      formData.weekdays.includes(day.value)
                        ? "primary"
                        : "outline-secondary"
                    }
                    onClick={() => handleWeekdayToggle(day.value)}
                    size="sm"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Year Days Off</Form.Label>
              {formData.yeardays.map((yearday, index) => (
                <div
                  key={index}
                  className="d-flex align-items-center gap-2 mb-2"
                >
                  <Form.Control
                    type="number"
                    placeholder="Month (1-12)"
                    min="1"
                    max="12"
                    value={yearday.month}
                    onChange={(e) =>
                      handleYeardayChange(index, "month", e.target.value)
                    }
                    style={{ width: "120px" }}
                  />
                  <Form.Control
                    type="number"
                    placeholder="Day (1-31)"
                    min="1"
                    max="31"
                    value={yearday.day}
                    onChange={(e) =>
                      handleYeardayChange(index, "day", e.target.value)
                    }
                    style={{ width: "120px" }}
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeYearday(index)}
                    disabled={formData.yeardays.length <= 1}
                  >
                    <FaTimes />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={addYearday}
                className="mt-2"
              >
                Add Year Day Off
              </Button>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowAcceptModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleAcceptSubmit}
            disabled={loading}
          >
            {loading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Confirm Acceptance"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Employee Modal */}
      <Modal
        show={showRejectModal}
        onHide={() => setShowRejectModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaTimes className="me-2 text-danger" /> Reject Employee
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4 text-center">
          <h5 className="mb-4">
            Are you sure you want to reject this candidate?
          </h5>
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button
            variant="outline-secondary"
            onClick={() => setShowRejectModal(false)}
            className="px-4"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRejectSubmit}
            disabled={loading}
            className="px-4"
          >
            {loading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Confirm Rejection"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Prediction Modal */}

      <Modal
        show={showPredictionModal}
        onHide={() => {
          setShowPredictionModal(false);
          setPredictError(null);
        }}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-semibold d-flex align-items-center">
            <FaRegChartBar className="me-2 text-primary" /> Predictions
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-4">
          {predictError && (
            <div className="alert alert-danger mb-4">{predictError}</div>
          )}

          <Row className="g-4 text-center">
            <Col md={6}>
              <div className="border rounded p-2 shadow-sm h-100">
                <h6 className="mb-2">Avg Task Rating</h6>
                <p className="text-muted m-0">
                  {predictLoading ? (
                    <Spinner as="span" size="sm" animation="border" />
                  ) : candidate.predicted_avg_task_rating != null ? (
                    candidate.predicted_avg_task_rating
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded p-2 shadow-sm h-100">
                <h6 className="mb-2">Avg Time Before Deadline</h6>
                <p className="text-muted m-0">
                  {predictLoading ? (
                    <Spinner as="span" size="sm" animation="border" />
                  ) : candidate.predicted_avg_time_remaining_before_deadline !=
                    null ? (
                    candidate.predicted_avg_time_remaining_before_deadline
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded p-2 shadow-sm h-100">
                <h6 className="mb-2">Avg Lateness Hrs</h6>
                <p className="text-muted m-0">
                  {predictLoading ? (
                    <Spinner as="span" size="sm" animation="border" />
                  ) : candidate.predicted_avg_lateness_hours != null ? (
                    candidate.predicted_avg_lateness_hours
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded p-2 shadow-sm h-100">
                <h6 className="mb-2">Avg Absence Days</h6>
                <p className="text-muted m-0">
                  {predictLoading ? (
                    <Spinner as="span" size="sm" animation="border" />
                  ) : candidate.predicted_avg_absent_days != null ? (
                    candidate.predicted_avg_absent_days
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded p-2 shadow-sm h-100">
                <h6 className="mb-2">Avg Overtime Hrs</h6>
                <p className="text-muted m-0">
                  {predictLoading ? (
                    <Spinner as="span" size="sm" animation="border" />
                  ) : candidate.predicted_avg_overtime_hours != null ? (
                    candidate.predicted_avg_overtime_hours
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded p-2 shadow-sm h-100">
                <h6 className="mb-2">Predicted Salary</h6>
                <p className="text-muted m-0">
                  {predictLoading ? (
                    <Spinner as="span" size="sm" animation="border" />
                  ) : candidate.predicted_basic_salary != null ? (
                    candidate.predicted_basic_salary
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </Col>
          </Row>

          <div className="mt-4 text-muted small">
            Last predicted:{" "}
            {last_prediction_date
              ? new Date(last_prediction_date).toLocaleString()
              : "Never predicted"}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 d-flex flex-column">
          {hasNullFields() && (
            <div className="text-warning mb-2 text-center w-100">
              <FaExclamationTriangle className="me-2" />
              Please complete all CV data fields to enable predictions
            </div>
          )}
          <Button
            variant="primary"
            onClick={handlePredictAndUpdate}
            disabled={predictLoading || hasNullFields()}
            className="d-flex align-items-center gap-2"
          >
            {predictLoading ? (
              <>
                <Spinner as="span" size="sm" animation="border" />
                Predicting...
              </>
            ) : (
              <>
                <FaRobot /> Run Predictions
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* cv edit modal */}
      <Modal
        show={showCvEditModal}
        onHide={() => setShowCvEditModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaEdit className="me-2" /> Edit CV Data
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Region</Form.Label>
                  <Select
                    options={allRegions}
                    value={allRegions.find(
                      (r) => r.value === cvFormData.region
                    )}
                    onChange={(selected) =>
                      setCvFormData({
                        ...cvFormData,
                        region: selected?.value || null,
                      })
                    }
                    isClearable
                    placeholder="Select region"
                    className="basic-single"
                    classNamePrefix="select"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Highest Education Degree</Form.Label>
                  <Select
                    options={allDegrees}
                    value={allDegrees.find(
                      (d) => d.value === cvFormData.highest_education_degree
                    )}
                    onChange={(selected) =>
                      setCvFormData({
                        ...cvFormData,
                        highest_education_degree: selected?.value || null,
                      })
                    }
                    isClearable
                    placeholder="Select degree"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Education Field</Form.Label>
                  <Select
                    options={allEducationFields}
                    value={allEducationFields.find(
                      (f) => f.value === cvFormData.highest_education_field
                    )}
                    onChange={(selected) =>
                      setCvFormData({
                        ...cvFormData,
                        highest_education_field: selected?.value || null,
                      })
                    }
                    isClearable
                    placeholder="Select field"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Years of Experience</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={cvFormData.years_of_experience}
                    onChange={(e) =>
                      setCvFormData({
                        ...cvFormData,
                        years_of_experience: e.target.value || null,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Skills</Form.Label>
              <Select
                options={allSkills}
                value={selectedSkills}
                onChange={(selected) => setSelectedSkills(selected || [])}
                isMulti
                placeholder="Select skills"
                closeMenuOnSelect={false}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Had Leadership Role"
                    checked={cvFormData.had_leadership_role || false}
                    onChange={(e) =>
                      setCvFormData({
                        ...cvFormData,
                        had_leadership_role: e.target.checked,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Has Position-Related High Education"
                    checked={
                      cvFormData.has_position_related_high_education || false
                    }
                    onChange={(e) =>
                      setCvFormData({
                        ...cvFormData,
                        has_position_related_high_education: e.target.checked,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowCvEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCvDataUpdate}
            disabled={
              !cvFormData.region ||
              !cvFormData.highest_education_degree ||
              !cvFormData.highest_education_field ||
              cvFormData.years_of_experience === null ||
              cvFormData.percentage_of_matching_skills === null
            }
          >
            Update CV Data
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
