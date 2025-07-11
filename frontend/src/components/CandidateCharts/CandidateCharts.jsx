import { Card, Row, Col } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const barData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  received: Math.floor(Math.random() * 18),
  hired: Math.floor(Math.random() * 4),
}));

const pieData = [
  { name: "HH.ru", value: 685 },
  { name: "Getmatch", value: 294 },
  { name: "Habr Career", value: 168 },
  { name: "LinkedIn", value: 88 },
  { name: "Telegram", value: 105 },
];
const pieColors = ["#3B82F6", "#60A5FA", "#93C5FD", "#A855F7", "#38BDF8"];

export default function CandidateCharts() {
  return (
    <Row className="g-4">
      <Col lg={8}>
        <Card className="shadow-sm h-100">
          <Card.Body>
            <h6>Candidate statistics</h6>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="received" stackId="a" fill="#93C5FD" />
                <Bar dataKey="hired" stackId="a" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={4}>
        <Card className="shadow-sm h-100">
          <Card.Body>
            <h6>Candidate Source</h6>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="list-unstyled small">
              {pieData.map((d, i) => (
                <li key={i}>
                  <span
                    className="me-2"
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      backgroundColor: pieColors[i],
                    }}
                  ></span>
                  {d.name} – {d.value}
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
