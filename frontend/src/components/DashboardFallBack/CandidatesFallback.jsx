import React from "react";
import { Card, Col, Row } from "react-bootstrap";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const CandidatesFallBack = () => {
  return (
    <Card className="p-4 border-0 shadow-sm rounded-4 mb-5">
      <Row className="g-4">
        <Col md={4} className="text-center d-flex flex-column align-items-center">
          <div className="position-relative mb-3">
            <Skeleton circle height={200} width={200} />
          </div>
          <Skeleton width={120} height={20} className="mb-2" />
          <Skeleton width={100} height={16} />
          <div className="d-flex gap-2 mt-2">
            <Skeleton width={80} height={30} />
            <Skeleton width={80} height={30} />
          </div>
        </Col>

        <Col md={8}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="mb-4 p-3 rounded-3"
              style={{ background: "rgba(248,249,250,0.8)" }}
            >
              <Skeleton width={150} height={20} className="mb-3" />
              <Skeleton count={2} />
            </div>
          ))}

          <div className="p-3 rounded-3" style={{ background: "rgba(248,249,250,0.8)" }}>
            <Skeleton width={150} height={20} className="mb-3" />
            <div className="d-flex gap-3 flex-wrap">
              <Skeleton width={120} height={40} />
              <Skeleton width={160} height={40} />
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default CandidatesFallBack;