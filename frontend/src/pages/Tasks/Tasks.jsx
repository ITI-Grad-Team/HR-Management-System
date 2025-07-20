
import { Container, Card } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import CoordinatorTasksAccordion from "../../components/Tasks/CoordinatorTasksAccordion";

const Tasks = () => {
  const { user } = useAuth();
  const isCoordinator =
    user?.role === "employee" && user?.employee?.is_coordinator === true;

  return (
    <Container className="py-4">
      <h2 className="mb-4">Tasks Management</h2>

      {isCoordinator ? (
        <CoordinatorTasksAccordion />
      ) : (
        <Card className="border-warning">
          <Card.Body className="text-center py-5">
            <FaExclamationTriangle className="text-warning mb-3" size={48} />
            <h4>Access Restricted</h4>
            <p className="text-muted">
              Coordinator permissions required to view this page.
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Tasks;