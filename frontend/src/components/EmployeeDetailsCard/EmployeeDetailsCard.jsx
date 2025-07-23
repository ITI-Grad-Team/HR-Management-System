import React, { useState, useEffect } from "react";
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
  FaStarHalfAlt,
  FaDownload,
  FaInfoCircle,
  FaChartLine,
  FaBriefcase,
  FaLaptop,
  FaMapMarkerAlt,
  FaUserTie,
  FaUserGraduate,
  FaCalendarTimes,
  FaEdit,
  FaMoneyBillWave,
  FaUser,
  FaCode,
  FaFileAlt,
  FaCalendarDay,
  FaCalendarAlt,
  FaUserClock,
  FaCheck,
  FaTimes,
  FaBed,
  FaUmbrellaBeach,
  FaUsers,
  FaRunning,
  FaBusinessTime,
  FaEnvelope,
  FaExclamationTriangle,
  FaRegChartBar,
  FaRobot,
  FaInfo,
  FaMoneyBill,
  FaStar,
  FaClock,
} from "react-icons/fa";
import { MdOutlineLockReset } from "react-icons/md";
import "./EmployeeDetailsCard.css";
import { Tooltip } from "react-bootstrap";
import { OverlayTrigger } from "react-bootstrap";
import Select from "react-select";
import axiosInstance from "../../api/config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaClipboardCheck, FaCheckDouble } from "react-icons/fa";
import { FiTrendingUp } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
export default function CandidateDetailsCard({
  candidate,
  loggedInHrId,
  onTake,
  onSchedule,
  loadingProp,
  onPredictUpdate,
  onPromote,
  isSelfView,
}) {
  const navigate = useNavigate();
  const {
    basicinfo,
    position,
    region,
    highest_education_degree,
    highest_education_field,
    cv_url,
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
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    deadline: "",
  });
  const [assignTaskLoading, setAssignTaskLoading] = useState(false);
  const [formData, setFormData] = useState({
    basic_salary: "",
    overtime_hour_salary: "",
    shorttime_hour_penalty: "",
    absence_penalty: "",
    expected_attend_time: "09:00",
    expected_leave_time: "17:00",
    holiday_weekdays: [],
    holiday_yeardays: [],
    online_weekdays: [],
    online_yeardays: [],
  });
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);
  const [showCvEditModal, setShowCvEditModal] = useState(false);
  const [cvFormData, setCvFormData] = useState({
    years_of_experience: candidate.years_of_experience,
    had_leadership_role: candidate.had_leadership_role || false,
    has_position_related_high_education:
      candidate.has_position_related_high_education || false,
  });
  const [allSkills, setAllSkills] = useState([]);
  const [allRegions, setAllRegions] = useState([]);
  const [allDegrees, setAllDegrees] = useState([]);
  const [allEducationFields, setAllEducationFields] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);
  const [basicInfoFormData, setBasicInfoFormData] = useState({
    profile_image: null,
    username: "",
    phone: "",
  });

  useEffect(() => {
    document.title = `${candidate.basicinfo.username} | HERA`;
  });

  useEffect(() => {
    if (showBasicInfoModal && basicinfo) {
      setBasicInfoFormData({
        profile_image: null, // Will handle file separately
        username: basicinfo.username || "",
        phone: basicinfo.phone || "",
      });
    }
  }, [showBasicInfoModal, basicinfo]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [skillsRes, regionsRes, degreesRes, fieldsRes] =
          await Promise.all([
            axiosInstance.get(
              `/${
                role === "hr" ? "hr" : role === "admin" ? "admin" : ""
              }/skills/`
            ),
            axiosInstance.get(
              `/${
                role === "hr" ? "hr" : role === "admin" ? "admin" : ""
              }/regions/`
            ),
            axiosInstance.get(
              `/${
                role === "hr" ? "hr" : role === "admin" ? "admin" : ""
              }/degrees/`
            ),
            axiosInstance.get(
              `/${
                role === "hr" ? "hr" : role === "admin" ? "admin" : ""
              }/fields/`
            ),
          ]);

        const skillsOptions = skillsRes.data.results.map((s) => ({
          value: s.id,
          label: s.name,
        }));
        const regionsOptions = regionsRes.data.results.map((r) => ({
          value: r.id,
          label: r.name,
        }));
        const degreesOptions = degreesRes.data.results.map((d) => ({
          value: d.id,
          label: d.name,
        }));
        const fieldsOptions = fieldsRes.data.results.map((f) => ({
          value: f.id,
          label: f.name,
        }));

        setAllSkills(skillsOptions);
        setAllRegions(regionsOptions);
        setAllDegrees(degreesOptions);
        setAllEducationFields(fieldsOptions);

        // Set initial values for the form
        if (candidate) {
          // Set region
          const selectedRegion = regionsOptions.find(
            (r) => r.label === candidate.region
          );
          if (selectedRegion) {
            setCvFormData((prev) => ({
              ...prev,
              region: selectedRegion.value,
            }));
          }

          // Set degree
          const selectedDegree = degreesOptions.find(
            (d) => d.label === candidate.highest_education_degree
          );
          if (selectedDegree) {
            setCvFormData((prev) => ({
              ...prev,
              highest_education_degree: selectedDegree.value,
            }));
          }

          // Set field
          const selectedField = fieldsOptions.find(
            (f) => f.label === candidate.highest_education_field
          );
          if (selectedField) {
            setCvFormData((prev) => ({
              ...prev,
              highest_education_field: selectedField.value,
            }));
          }

          // Set skills
          if (candidate.skills && candidate.skills.length > 0) {
            const selectedSkills = skillsOptions.filter((s) =>
              candidate.skills.includes(s.label)
            );
            setSelectedSkills(selectedSkills);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
        toast.error("Failed to load dropdown options");
      }
    };

    if (showCvEditModal) {
      fetchDropdownData();
    }
  }, [showCvEditModal, candidate]);

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
      console.log(formData);
      setLoading(true);
      await axiosInstance.patch(`/hr/accept-employee/${candidateId}/`, {
        ...formData,
        expected_attend_time: formData.expected_attend_time + ":00",
        expected_leave_time: formData.expected_leave_time + ":00",
      });
      toast.success("Candidate accepted successfully");
      setShowAcceptModal(false);
      setShowUpdateModal(false);
      setLocalState("accepted");
      onSchedule?.();
      // You might want to redirect or refresh data here
    } catch (err) {
      toast.error("Failed to accept candidate");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Update Compensation and Work Schedule ---------------- */
  const handleUpdateCompensation = async () => {
    try {
      console.log(formData);
      setLoading(true);

      // Determine endpoint based on user role
      const endpoint =
        role === "admin"
          ? `/admin/employees/${candidateId}/update-compensation/`
          : `/hr/accept-employee/${candidateId}/update-compensation/`;

      await axiosInstance.patch(endpoint, {
        ...formData,
        expected_attend_time: formData.expected_attend_time + ":00",
        expected_leave_time: formData.expected_leave_time + ":00",
      });

      toast.success("Compensation and work schedule updated successfully");
      setShowUpdateModal(false);
      onSchedule?.(); // Refresh the parent data
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          "Failed to update compensation and work schedule"
      );
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

  const handleHolidayWeekdayToggle = (day) => {
    setFormData((prev) => {
      const newWeekdays = prev.holiday_weekdays.includes(day)
        ? prev.holiday_weekdays.filter((d) => d !== day)
        : [...prev.holiday_weekdays, day];
      return { ...prev, holiday_weekdays: newWeekdays };
    });
  };

  const handleHolidayYeardayChange = (index, field, value) => {
    setFormData((prev) => {
      const newYeardays = [...prev.holiday_yeardays];
      newYeardays[index] = { ...newYeardays[index], [field]: value };
      return { ...prev, holiday_yeardays: newYeardays };
    });
  };

  const addHolidayYearday = () => {
    setFormData((prev) => ({
      ...prev,
      holiday_yeardays: [...prev.holiday_yeardays, { month: "", day: "" }],
    }));
  };

  const removeHolidayYearday = (index) => {
    setFormData((prev) => ({
      ...prev,
      holiday_yeardays: prev.holiday_yeardays.filter((_, i) => i !== index),
    }));
  };

  const handleOnlineWeekdayToggle = (day) => {
    setFormData((prev) => {
      const newOnlineWeekdays = prev.online_weekdays.includes(day)
        ? prev.online_weekdays.filter((d) => d !== day)
        : [...prev.online_weekdays, day];
      return { ...prev, online_weekdays: newOnlineWeekdays };
    });
  };

  const handleOnlineYeardayChange = (index, field, value) => {
    setFormData((prev) => {
      const newOnlineYeardays = [...prev.online_yeardays];
      newOnlineYeardays[index] = {
        ...newOnlineYeardays[index],
        [field]: value,
      };
      return { ...prev, online_yeardays: newOnlineYeardays };
    });
  };

  const addOnlineYearday = () => {
    setFormData((prev) => ({
      ...prev,
      online_yeardays: [...prev.online_yeardays, { month: "", day: "" }],
    }));
  };

  const removeOnlineYearday = (index) => {
    setFormData((prev) => ({
      ...prev,
      online_yeardays: prev.online_yeardays.filter((_, i) => i !== index),
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
    if (candidate.interview_state === "done" && interviewer === loggedInHrId) {
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

  ///
  const handleBasicInfoUpdate = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      if (basicInfoFormData.profile_image) {
        formData.append("profile_image", basicInfoFormData.profile_image);
      }
      if (basicInfoFormData.username !== basicinfo.username) {
        formData.append("username", basicInfoFormData.username);
      }
      if (basicInfoFormData.phone !== basicinfo.phone) {
        formData.append("phone", basicInfoFormData.phone);
      }

      const response = await axiosInstance.patch("/basic-info/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Profile updated successfully");
      setShowBasicInfoModal(false);
      onPredictUpdate?.();
      // You'll need to refresh the user data here or update the parent state
    } catch (error) {
      toast.error(
        error.response?.data?.username?.[0] || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteEmployee = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(
        `/admin/promote-employee/${candidateId}/promote/`
      );
      toast.success("Employee promoted successfully");

      // Call the parent's onPromote with the updated data
      onPromote?.({
        ...candidate,
        is_coordinator: true, // Update the coordinator status
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to promote employee");
    } finally {
      setLoading(false);
    }
  };

  const renderPromoteEmployeeButton = () => {
    if (role === "admin" && !is_coordinator) {
      return (
        <div className="d-flex align-items-center gap-2 mt-4">
          <Button
            onClick={handlePromoteEmployee}
            disabled={loading}
            className="Promote"
          >
            {loading ? (
              <Spinner
                as="span"
                size="sm"
                animation="border"
                className="me-2"
              />
            ) : null}
            <FiTrendingUp className="me-2" /> Promote Employee
          </Button>
        </div>
      );
    }
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

  // handle assign task
  const handleAssignTask = async () => {
    try {
      setAssignTaskLoading(true);

      const response = await axiosInstance.post("/tasks/", {
        assigned_to: candidateId,
        title: taskFormData.title,
        description: taskFormData.description,
        deadline: taskFormData.deadline,
      });

      toast.success("Task assigned successfully");
      setShowAssignTaskModal(false);
      setTaskFormData({
        title: "",
        description: "",
        deadline: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to assign task");
      console.error(err);
    } finally {
      setAssignTaskLoading(false);
    }
  };

  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderAssignTaskButton = () => {
    const { user } = useAuth();
    const isCoordinator =
      user.role === "employee" && user.employee?.is_coordinator === true;
    if (isCoordinator && candidate.interview_state === "accepted") {
      return (
        <div className="d-flex align-items-center gap-2 mt-4">
          <Button
            variant="primary"
            onClick={() => setShowAssignTaskModal(true)}
          >
            <FaClipboardCheck className="me-2" /> Assign Task
          </Button>
        </div>
      );
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
              <div className="position-relative mb-3">
                <img
                  src={basicinfo?.profile_image_url || "/default.jpg"}
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
                {isSelfView && (
                  <button
                    onClick={() => setShowBasicInfoModal(true)}
                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 border-0"
                    style={{
                      transform: "translate(-10%, -10%)",
                      width: "40px",
                      height: "40px",
                    }}
                  >
                    <FaEdit />
                  </button>
                )}
              </div>
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
            {renderPromoteEmployeeButton()}
            {renderAssignTaskButton()}
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
                      <span className="fw-semibold">
                        {basicinfo?.phone || "N/A"}
                      </span>
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
              {isSelfView && (
                <button
                  onClick={() => navigate("/dashboard/change-password/")}
                  className="btn btn-outline-dark mt-3 password-btn"
                >
                  <MdOutlineLockReset className="me-2" size={24} /> Change
                  Password
                </button>
              )}
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
                        className="px-3 py-2 bg-dark"
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
              <div className="g-4 d-flex gap-3">
                <div md={3}>
                  <a
                    href={cv_url}
                    className="btn btn-outline-primary d-inline-flex align-items-center gap-2 rounded-pill px-4"
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <FaDownload /> Download CV
                  </a>
                </div>
                <div md={4}>
                  <button
                    className="btn btn-warning d-inline-flex align-items-center gap-2 rounded-pill px-4"
                    onClick={() => setShowPredictionModal(true)}
                  >
                    <FaRobot /> View Predictions
                  </button>
                </div>
                {role !== "employee" ? (
                  <div md={5}>
                    <button
                      className="btn btn-info d-inline-flex align-items-center gap-2 rounded-pill px-4"
                      onClick={() => setShowCvEditModal(true)}
                    >
                      <FaEdit /> Update CV Extracted Info.
                    </button>
                  </div>
                ) : (
                  <div md={5}>
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id="cv-tooltip">
                          <small>
                            <div>• Information is auto-extracted </div>
                            <div>• Only HR/Admin can update it</div>
                            <div
                              style={{
                                fontStyle: "italic",
                                color: "#b3b3b3d7",
                              }}
                            >
                              (Affects only AI predictions)
                            </div>
                          </small>
                        </Tooltip>
                      }
                    >
                      <span className="d-inline-block">
                        {" "}
                        {/* Wrapper for disabled button tooltip */}
                        <button
                          className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 rounded-pill px-4"
                          disabled
                          style={{ cursor: "not-allowed", opacity: 0.7 }}
                        >
                          <FaInfoCircle /> Update CV Extracted Info.
                        </button>
                      </span>
                    </OverlayTrigger>
                  </div>
                )}
              </div>
            </div>

            {/* Interview Actions */}
            {candidate.interview_state !== "accepted" &&
              localState !== "accepted" &&
              role === "hr" && (
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

            {localState === "accepted" && (
              <div
                className="mb-4 p-3 rounded-3"
                style={{ background: "rgba(248,249,250,0.8)" }}
              >
                <h6 className="text-uppercase text-primary fw-bold mb-3 d-flex align-items-center">
                  <FaInfo className="me-2" /> Employee Info.
                </h6>

                {/* First Row - 2 columns */}
                <Row className="g-4 mb-4">
                  <Row className="g-4 mb-0 mt-0">
                    <Col md={8}>
                      {(role === "admin" ||
                        (role === "hr" && interviewer === loggedInHrId)) && (
                        <Button
                          variant="info"
                          onClick={() => setShowUpdateModal(true)}
                          className="btn btn-info d-inline-flex align-items-center gap-2 rounded-pill px-4"
                        >
                          <FaEdit className="fs-6 align-baseline" />
                          Update Compensation And Work Schedule
                        </Button>
                      )}
                    </Col>
                  </Row>
                  {/* Column 1 - Compensation */}
                  <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="text-primary mb-3 d-flex align-items-center">
                          <FaMoneyBill className="me-2" /> Compensation
                        </h6>
                        <div className="d-flex align-items-center mb-2">
                          <FaMoneyBillWave className="me-2 text-muted" />
                          <div>
                            <small className="text-muted">Basic Salary</small>
                            <div className="fw-semibold">
                              $
                              {candidate?.basic_salary?.toLocaleString() ||
                                "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <FaClock className="me-2 text-muted" />
                          <div>
                            <small className="text-muted">Overtime Rate</small>
                            <div className="fw-semibold">
                              ${candidate?.overtime_hour_salary || "N/A"}/hr
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <FaExclamationTriangle className="me-2 text-muted" />
                          <div>
                            <small className="text-muted">
                              Short Time Penalty
                            </small>
                            <div className="fw-semibold">
                              ${candidate?.shorttime_hour_penalty || "N/A"}/hr
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <FaCalendarTimes className="me-2 text-muted" />
                          <div>
                            <small className="text-muted">
                              Absence Penalty
                            </small>
                            <div className="fw-semibold">
                              ${candidate?.absence_penalty || "N/A"}/day
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  {/* Column 2 - Task Performance */}
                  <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="text-primary mb-3 d-flex align-items-center">
                          <FaChartLine className="me-2" /> Task Performance
                        </h6>
                        <div className="text-center mb-3 p-2 bg-light rounded">
                          <FaClipboardCheck
                            className="text-primary mb-1"
                            size={24}
                          />
                          <div className="fw-bold fs-4">
                            {candidate?.number_of_accepted_tasks || 0}
                          </div>
                          <small className="text-muted">
                            Total Tasks Completed
                          </small>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <FaStar className="text-muted me-2" />
                            <small className="text-muted">Task Ratings</small>
                          </div>
                          <div className="d-flex justify-content-between">
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.avg_task_ratings?.toFixed(1) || 0}
                                /100
                              </div>
                              <small className="text-muted small">
                                Average
                              </small>
                            </div>
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.total_task_ratings?.toFixed(1) || 0}
                              </div>
                              <small className="text-muted small">Total</small>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="d-flex align-items-center mb-2">
                            <FaClock className="text-muted me-2" />
                            <small className="text-muted">
                              Time Before Deadline
                            </small>
                          </div>
                          <div className="d-flex justify-content-between">
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.avg_time_remaining_before_deadline?.toFixed(
                                  1
                                ) || 0}
                                h
                              </div>
                              <small className="text-muted small">
                                Average
                              </small>
                            </div>
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.total_time_remaining_before_deadline?.toFixed(
                                  1
                                ) || 0}
                                h
                              </div>
                              <small className="text-muted small">Total</small>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="text-primary mb-3 d-flex align-items-center">
                          <FaUserClock className="me-2" /> Attendance
                        </h6>
                        <div className="text-center mb-3 p-2 bg-light rounded">
                          <FaCalendarDay
                            className="text-primary mb-1"
                            size={24}
                          />
                          <div className="fw-bold fs-4">
                            {candidate?.number_of_non_holiday_days_since_join ||
                              0}
                          </div>
                          <small className="text-muted">Working Days</small>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <FaRunning className="text-muted me-2" />
                            <small className="text-muted">Lateness</small>
                          </div>
                          <div className="d-flex justify-content-between">
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.avg_lateness_hours?.toFixed(1) || 0}
                                h
                              </div>
                              <small className="text-muted small">
                                Average
                              </small>
                            </div>
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.total_lateness_hours?.toFixed(1) ||
                                  0}
                                h
                              </div>
                              <small className="text-muted small">Total</small>
                            </div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <FaBusinessTime className="text-muted me-2" />
                            <small className="text-muted">Overtime</small>
                          </div>
                          <div className="d-flex justify-content-between">
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.avg_overtime_hours?.toFixed(1) || 0}
                                h
                              </div>
                              <small className="text-muted small">
                                Average
                              </small>
                            </div>
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.total_overtime_hours?.toFixed(1) ||
                                  0}
                                h
                              </div>
                              <small className="text-muted small">Total</small>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="d-flex align-items-center mb-2">
                            <FaBed className="text-secondary me-2" />
                            <small className="text-muted">Absence</small>
                          </div>
                          <div className="d-flex justify-content-between">
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.avg_absent_days?.toFixed(1) || 0}d
                              </div>
                              <small className="text-muted small">
                                Average
                              </small>
                            </div>
                            <div className="text-center flex-grow-1">
                              <div className="fw-semibold">
                                {candidate?.total_absent_days || 0}d
                              </div>
                              <small className="text-muted small">Total</small>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row className="g-4">
                  <Col md={12}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="text-primary mb-3 d-flex align-items-center">
                          <FaCalendarAlt className="me-2" /> Work Schedule &
                          Holidays
                        </h6>
                        <div className="d-flex align-items-center mb-3">
                          <FaClock className="me-2 text-muted" />
                          <div>
                            <small className="text-muted">Work Hours</small>
                            <div className="fw-semibold">
                              {candidate?.expected_attend_time?.substring(
                                0,
                                5
                              ) || "N/A"}{" "}
                              -{" "}
                              {candidate?.expected_leave_time?.substring(
                                0,
                                5
                              ) || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <small className="text-muted d-block mb-2">
                            Weekly Schedule
                          </small>
                          <div className="d-flex justify-content-between">
                            {[
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                            ].map((day) => {
                              const shortDay = day.substring(0, 3);
                              const isOnline =
                                candidate?.weekly_online_days?.includes(day);
                              const isHoliday =
                                candidate?.weekly_holidays?.includes(day);
                              return (
                                <div key={day} className="text-center">
                                  <div
                                    className={`rounded-circle p-2 ${
                                      isHoliday
                                        ? "bg-warning text-white"
                                        : isOnline
                                        ? "bg-info text-white"
                                        : "bg-light"
                                    }`}
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      lineHeight: "16px",
                                    }}
                                  >
                                    {shortDay[0]}
                                  </div>
                                  <small className="d-block mt-1">
                                    {shortDay}
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                          <div className="d-flex justify-content-center gap-3 mt-2">
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle bg-warning me-1"
                                style={{ width: "12px", height: "12px" }}
                              ></div>
                              <small>Holiday</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle bg-info me-1"
                                style={{ width: "12px", height: "12px" }}
                              ></div>
                              <small>Remote</small>
                            </div>
                          </div>
                        </div>
                        <div>
                          <small className="text-muted d-block mb-2">
                            Yearly Special Days
                          </small>
                          <div className="row g-2">
                            {candidate?.yearly_holidays?.length > 0 ? (
                              candidate.yearly_holidays.map(
                                (holiday, index) => (
                                  <div key={index} className="col-2">
                                    <div className="d-flex align-items-center p-2 bg-light rounded">
                                      <FaUmbrellaBeach className="text-muted me-2" />
                                      <div>
                                        <div className="fw-semibold">
                                          {new Date(
                                            2000,
                                            holiday.month - 1,
                                            holiday.day
                                          ).toLocaleString("default", {
                                            month: "short",
                                          })}{" "}
                                          {holiday.day}
                                        </div>
                                        <small className="text-muted">
                                          Holiday
                                        </small>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )
                            ) : (
                              <div className="col-12">
                                <div className="text-center p-2 text-muted small">
                                  No yearly holidays
                                </div>
                              </div>
                            )}
                            {candidate?.yearly_online_days?.length > 0 ? (
                              candidate.yearly_online_days.map((day, index) => (
                                <div key={index} className="col-2">
                                  <div className="d-flex align-items-center p-2 bg-light rounded">
                                    <FaLaptop className="text-muted me-2" />
                                    <div>
                                      <div className="fw-semibold">
                                        {new Date(
                                          2000,
                                          day.month - 1,
                                          day.day
                                        ).toLocaleString("default", {
                                          month: "short",
                                        })}{" "}
                                        {day.day}
                                      </div>
                                      <small className="text-muted">
                                        Remote
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-12">
                                <div className="text-center p-2 text-muted small">
                                  No yearly online days
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
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
              <Form.Label>Days Off</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <Button
                    key={day.value}
                    variant={
                      formData.holiday_weekdays.includes(day.value)
                        ? "primary"
                        : "outline-secondary"
                    }
                    onClick={() => handleHolidayWeekdayToggle(day.value)}
                    size="sm"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Year Days Off</Form.Label>
              {formData.holiday_yeardays.map((yearday, index) => (
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
                      handleHolidayYeardayChange(index, "month", e.target.value)
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
                      handleHolidayYeardayChange(index, "day", e.target.value)
                    }
                    style={{ width: "120px" }}
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeHolidayYearday(index)}
                  >
                    <FaTimes />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={addHolidayYearday}
                className="mt-2"
              >
                Add Year Day Off
              </Button>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Online Days</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <Button
                    key={day.value}
                    variant={
                      formData.online_weekdays.includes(day.value)
                        ? "primary"
                        : "outline-secondary"
                    }
                    onClick={() => handleOnlineWeekdayToggle(day.value)}
                    size="sm"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Online Year Days</Form.Label>
              {formData.online_yeardays.map((yearday, index) => (
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
                      handleOnlineYeardayChange(index, "month", e.target.value)
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
                      handleOnlineYeardayChange(index, "day", e.target.value)
                    }
                    style={{ width: "120px" }}
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeOnlineYearday(index)}
                  >
                    <FaTimes />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={addOnlineYearday}
                className="mt-2"
              >
                Add Online Year Day
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
            disabled={
              loading ||
              !formData.basic_salary ||
              !formData.overtime_hour_salary ||
              !formData.shorttime_hour_penalty ||
              !formData.absence_penalty
            }
          >
            {loading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Confirm Acceptance"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Compensation and working days Modal */}
      <Modal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaCheck className="me-2 text-success" /> Update Employee
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
              <Form.Label>Days Off</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <Button
                    key={day.value}
                    variant={
                      formData.holiday_weekdays.includes(day.value)
                        ? "primary"
                        : "outline-secondary"
                    }
                    onClick={() => handleHolidayWeekdayToggle(day.value)}
                    size="sm"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Year Days Off</Form.Label>
              {formData.holiday_yeardays.map((yearday, index) => (
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
                      handleHolidayYeardayChange(index, "month", e.target.value)
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
                      handleHolidayYeardayChange(index, "day", e.target.value)
                    }
                    style={{ width: "120px" }}
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeHolidayYearday(index)}
                  >
                    <FaTimes />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={addHolidayYearday}
                className="mt-2"
              >
                Add Year Day Off
              </Button>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Online Days</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <Button
                    key={day.value}
                    variant={
                      formData.online_weekdays.includes(day.value)
                        ? "primary"
                        : "outline-secondary"
                    }
                    onClick={() => handleOnlineWeekdayToggle(day.value)}
                    size="sm"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Online Year Days</Form.Label>
              {formData.online_yeardays.map((yearday, index) => (
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
                      handleOnlineYeardayChange(index, "month", e.target.value)
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
                      handleOnlineYeardayChange(index, "day", e.target.value)
                    }
                    style={{ width: "120px" }}
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeOnlineYearday(index)}
                  >
                    <FaTimes />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={addOnlineYearday}
                className="mt-2"
              >
                Add Online Year Day
              </Button>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowUpdateModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleUpdateCompensation}
            disabled={
              loading ||
              !formData.basic_salary ||
              !formData.overtime_hour_salary ||
              !formData.shorttime_hour_penalty ||
              !formData.absence_penalty
            }
          >
            {loading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Confirm Update"
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
      {/* Assign Task Modal */}
      <Modal
        show={showAssignTaskModal}
        onHide={() => setShowAssignTaskModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaClipboardCheck className="me-2" /> Assign New Task
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={taskFormData.title}
                onChange={handleTaskInputChange}
                placeholder="Enter task title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={taskFormData.description}
                onChange={handleTaskInputChange}
                placeholder="Enter task description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Deadline</Form.Label>
              <Form.Control
                type="datetime-local"
                name="deadline"
                value={taskFormData.deadline}
                onChange={handleTaskInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowAssignTaskModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAssignTask}
            disabled={
              assignTaskLoading || !taskFormData.title || !taskFormData.deadline
            }
          >
            {assignTaskLoading ? (
              <Spinner as="span" size="sm" animation="border" />
            ) : (
              "Assign Task"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showBasicInfoModal}
        onHide={() => setShowBasicInfoModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Profile Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setBasicInfoFormData({
                    ...basicInfoFormData,
                    profile_image: e.target.files[0],
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={basicInfoFormData.username}
                onChange={(e) =>
                  setBasicInfoFormData({
                    ...basicInfoFormData,
                    username: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="tel"
                value={basicInfoFormData.phone}
                onChange={(e) =>
                  setBasicInfoFormData({
                    ...basicInfoFormData,
                    phone: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowBasicInfoModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleBasicInfoUpdate}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
