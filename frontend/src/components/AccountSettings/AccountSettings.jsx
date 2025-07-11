
// src/components/settings/AccountSettings.jsx
import { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";

export default function AccountSettings() {
  const [name, setName] = useState("Ahmed Elsabbagh");
  const [email, setEmail] = useState("ahmed@example.com");

  const handleUpdate = () => {
    // TODO: call update API
    alert("Account info updated!");
  };

  return (
    <Card className="mb-4 shadow-sm rounded">
      <Card.Header>Account Information</Card.Header>
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <Button variant="dark" onClick={handleUpdate}>
            Update
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}