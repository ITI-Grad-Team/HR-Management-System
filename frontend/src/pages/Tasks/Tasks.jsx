import { Container, Card } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import CoordinatorTasksAccordion from "../../components/Tasks/CoordinatorTasksAccordion";
import EmployeeTasksAccordion from "../../components/Tasks/EmployeeTasksAccordion";

const Tasks = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  const isCoordinator = isEmployee && user?.employee?.is_coordinator === true;

  return (
    <Container className="py-4">
      <h2 className="mb-4">Tasks Management</h2>

      {isCoordinator ? (
        <CoordinatorTasksAccordion />
      ) : isEmployee ? (
        <EmployeeTasksAccordion />
      ) : (
        <Card className="border-warning">
          <Card.Body className="text-center py-5">
            <FaExclamationTriangle className="text-warning mb-3" size={48} />
            <h4>Access Restricted</h4>
            <p className="text-muted">
              {isEmployee
                ? "Coordinator permissions required for this view"
                : "Employee login required to access tasks"}
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Tasks;
