import { useEffect, useState } from "react";
import "./EmployeeDetails.css";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/config";
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
import { useAuth } from "../../hooks/useAuth";
import {
  FaPhone,
  FaDownload,
  FaBriefcase,
  FaMapMarkerAlt,
  FaUserGraduate,
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
  FaMinus,
  FaRemoveFormat,
  FaMoneyCheck,
  FaCalendarPlus,
  FaTimesCircle,
  FaLaptopHouse,
  FaHourglass,
  FaCalendarMinus,
  FaStarHalf,
  FaClock,
  FaStar,
} from "react-icons/fa";
import CandidatesFallback from "../../components/DashboardFallBack/CandidatesFallback"


const EmployeeDetails = () => {
  const { role } = useAuth();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    role === "admin"
      ? axiosInstance.get(`/admin/employees/${id}/`).then((response) => {
        setEmployee(response.data);
        setLoading(false);
        console.log(employee);
      })
      : role === "hr"
        ? axiosInstance.get(`/hr/employees/${id}/`).then((response) => {
          setEmployee(response.data);
          setLoading(false);
          console.log(employee);
        })
        : "";
  });

  if (loading) {
    return <CandidatesFallback />
  }

  return (
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
              src={employee?.basicinfo?.profile_image}
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
            {employee?.percentage_of_matching_skills > 70 && (
              <div
                className="position-absolute top-0 end-0 bg-success rounded-circle p-1"
                style={{ transform: "translate(10%, -10%)" }}
              >
                <FaCheck className="text-white" size={12} />
              </div>
            )}
          </div>
          <h5 className="mb-0 fw-bold text-dark">{employee?.basicinfo?.username}</h5>
          <p className="text-muted mb-2">{employee?.position}</p>
          <div className="d-flex gap-2">
            {employee?.region && (
              <Badge pill bg="light" text="dark" className="border">
                <FaMapMarkerAlt className="text-primary" /> {employee?.region}
              </Badge>
            )}
            {employee?.years_of_experience !== null && (
              <Badge pill bg="light" text="dark" className="border">
                <FaBriefcase className="text-primary" /> {employee?.years_of_experience}{" "}
                yrs
              </Badge>
            )}
            {employee?.is_coordinator && (
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
                    <span className="fw-semibold">{employee?.phone || "N/A"}</span>
                  </div>
                </div>
              </Col>
              <Col sm={6} className="mb-2">
                <div className="d-flex align-items-center">
                  <FaEnvelope className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Email</small>
                    <span className="fw-semibold">
                      {employee?.user.username || "N/A"}
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
                {employee?.has_position_related_high_education
                  ? "✓"
                  : employee?.has_position_related_high_education === false
                    ? "✗"
                    : "❔"}
              </span>
            </h6>
            <div>
              <small className="text-muted d-block">Highest Degree</small>
              <span className="fw-semibold">
                {employee?.highest_education_degree}{" "}
                {employee?.highest_education_field
                  ? `in ${employee?.highest_education_field}`
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
                {employee?.percentage_of_matching_skills !== null
                  ? ` ${Math.round(employee?.percentage_of_matching_skills)}%`
                  : "❔"}
              </span>
            </h6>

            <div className="d-flex flex-wrap gap-2">
              {employee?.skills?.length > 0 ? (
                <>
                  {/* Leadership badge - shown first if had_leadership_role is true */}
                  {employee?.had_leadership_role && (
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

                  {/* Regular skills */}
                  {employee?.skills.map((skill, index) => (
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
                <span className="text-muted">No skills listed</span>
              )}
            </div>
          </div>

          {/* Interview Actions */}
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
                      $ {employee?.basic_salary || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaCalendar className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Date Joined</small>
                    <span className="fw-semibold">
                      {employee?.join_date || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaCalendarPlus className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Over Time</small>
                    <span className="fw-semibold">
                      $ {employee?.overtime_hour_salary || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaTimesCircle className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Short Time Penalty</small>
                    <span className="fw-semibold">
                      $ {employee?.shorttime_hour_penalty || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaTimesCircle className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Absence Penalty</small>
                    <span className="fw-semibold">
                      $ {employee?.absence_penalty || "N/A"}
                    </span>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="d-flex align-items-center">
                  <FaCalendar className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Attendance Time</small>
                    <span className="fw-semibold">
                      {employee?.expected_attend_time || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaCalendar className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Leave Time</small>
                    <span className="fw-semibold">
                      {employee?.expected_leave_time || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaLaptopHouse className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Online days</small>
                    <span className="fw-semibold">
                      {employee?.number_of_non_holiday_days_since_join || 0}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaCheck className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Accepted Tasks</small>
                    <span className="fw-semibold">
                      {employee?.number_of_accepted_tasks || 0}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaStar className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Total Task rating</small>
                    <span className="fw-semibold">
                      {employee?.total_task_ratings || 0} hrs
                    </span>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="d-flex align-items-center">
                  <FaClock className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Total Lateness Hrs</small>
                    <span className="fw-semibold">
                      {employee?.total_lateness_hours || 0} hrs
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaClock className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Total Time To DeadLine</small>
                    <span className="fw-semibold">
                      {employee?.total_time_remaining_before_deadline || 0} hrs
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaClock className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Total Over Time Hrs</small>
                    <span className="fw-semibold">
                      {employee?.total_overtime_hours || 0} hrs
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center mt-2">
                  <FaCalendarMinus className="me-2 text-muted" />
                  <div>
                    <small className="text-muted d-block">Total Absence Days</small>
                    <span className="fw-semibold">
                      {employee?.total_absent_days || 0} hrs
                    </span>
                  </div>
                </div>

              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default EmployeeDetails;
