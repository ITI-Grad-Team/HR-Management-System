import React, { useState } from "react";
import { Container, Tab, Nav, Row, Col } from "react-bootstrap";
import EmployeePayrollDashboard from "../../components/EmployeePayrollDashboard/EmployeePayrollDashboard";
import EmployeeStats from "../../components/EmployeeStats/EmployeeStats";
import "./EmployeeDashboard.css";
const HrDashboard = () => {
  const [activeTab, setActiveTab] = useState("employee-view");
  return (
    <Container fluid className="py-4">
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <EmployeeStats />

        <Tab.Content>
          <Tab.Pane eventKey="employee-view">
            <EmployeePayrollDashboard />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default HrDashboard;
