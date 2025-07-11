import { Card, Row, Col } from "react-bootstrap";

const stats = [
  { title: "Total responses", value: 2436, diff: "+15%", variant: "success" },
  { title: "Responses today", value: 98, diff: "-10%", variant: "danger" },
  { title: "Total vacancies", value: 49, diff: "-10%", variant: "danger" },
  { title: "Closed vacancies", value: "18 / 49", bar: 0.37 },
  { title: "Recruitment plan", value: "20 / 61", bar: 0.33 },
];

export default function StatCards() {
  return (
    <Row className="g-3 mb-4">
      {stats.map((s, i) => (
        <Col key={i} lg={2} md={4} sm={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <small className="text-muted">{s.title}</small>
              <h4 className="my-1">{s.value}</h4>

              
              {s.diff && (
                <span
                  className={
                    "badge bg-" + (s.variant === "danger" ? "danger" : "success")
                  }
                >
                  {s.diff}
                </span>
              )}

              {s.bar != null && (
                <div className="progress mt-2" style={{ height: "4px" }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${s.bar * 100}%` }}
                  ></div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
