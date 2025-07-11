import { Form, InputGroup, Button } from "react-bootstrap";
import { FaSearch, FaRegBell } from "react-icons/fa";

export default function HeaderBar() {
  return (
    <div className="d-flex align-items-center justify-content-between mb-4">
      {/* Left controls */}
      <div className="d-flex gap-3">
        <Form.Select size="sm" style={{ width: "160px" }}>
          <option>September 2025</option>
        </Form.Select>
        <Form.Select size="sm" style={{ width: "160px" }}>
          <option>All Companies</option>
        </Form.Select>
      </div>

      {/* Search + icons */}
      <div className="d-flex align-items-center gap-3">
        <InputGroup size="sm" style={{ width: "260px" }}>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control placeholder="Search candidates, jobs…" />
        </InputGroup>

        <Button variant="outline-secondary" size="sm">
          <FaRegBell />
        </Button>

        <img
          src="https://i.pravatar.cc/32"
          alt="avatar"
          className="rounded-circle"
        />
      </div>
    </div>
  );
}
