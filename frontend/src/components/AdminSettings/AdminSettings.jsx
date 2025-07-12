
import React from "react";
import { useState } from "react";
import { Card, Form, Button, ListGroup } from "react-bootstrap";

export default function AdminSettings() {
  const [positions, setPositions] = useState(["Developer", "Designer"]);
  const [skills, setSkills] = useState(["React", "Django"]);
  const [newPosition, setNewPosition] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const handleAddPosition = () => {
    if (newPosition.trim()) {
      setPositions([...positions, newPosition.trim()]);
      setNewPosition("");
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  return (
    <>
      <Card className="mb-4 shadow-sm rounded">
        <Card.Header>Manage Positions</Card.Header>
        <Card.Body>
          <Form className="d-flex gap-2 mb-3">
            <Form.Control
              type="text"
              placeholder="Add new position"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
            />
            <Button onClick={handleAddPosition}>Add</Button>
          </Form>
          <ListGroup>
            {positions.map((pos, i) => (
              <ListGroup.Item key={i}>{pos}</ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm rounded">
        <Card.Header>Manage Skills</Card.Header>
        <Card.Body>
          <Form className="d-flex gap-2 mb-3">
            <Form.Control
              type="text"
              placeholder="Add new skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <Button onClick={handleAddSkill}>Add</Button>
          </Form>
          <ListGroup>
            {skills.map((skill, i) => (
              <ListGroup.Item key={i}>{skill}</ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </>
  );
}
