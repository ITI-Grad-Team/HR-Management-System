import { Card, Table, Badge } from "react-bootstrap";

const rows = [
  { name: "John Smith", vacancies: 8, responses: 283, hired: "8 / 10", score: 80 },
  { name: "Helga Miller", vacancies: 3, responses: 280, hired: "2 / 4", score: 50 },
];

export default function RecruitersTable() {
  return (
    <Card className="shadow-sm mt-4">
      <Card.Body>
        <h6>Recruiters rating</h6>
        <Table hover>
          <thead>
            <tr>
              <th>Recruiter</th>
              <th>Active vacancies</th>
              <th>Responses</th>
              <th>Employees hired</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.name}</td>
                <td>{r.vacancies}</td>
                <td>
                  {r.responses}{" "}
                  <Badge bg="success" pill>
                    +{Math.floor(Math.random() * 40)}
                  </Badge>
                </td>
                <td>{r.hired}</td>
                <td>
                  <Badge bg={r.score > 70 ? "primary" : "secondary"}>
                    {r.score}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
