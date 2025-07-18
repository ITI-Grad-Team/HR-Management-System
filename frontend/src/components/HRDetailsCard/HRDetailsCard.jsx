import React, { useState } from "react";
import { Card, Row, Col } from "react-bootstrap";
import { FaPhone, FaUser, FaEnvelope } from "react-icons/fa";
export default function HRDetailsCard({ candidate, loadingProp }) {
  const { basicinfo, user, id: candidateId } = candidate;
  const [loading, setLoading] = useState(false);

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
            </div>
            <h5 className="mb-0 fw-bold text-dark">{basicinfo?.username}</h5>
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
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
}
